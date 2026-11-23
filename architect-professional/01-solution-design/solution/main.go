// Solution: pick the simplest pattern that fits each kind of request, instead
// of sending everything to one general-purpose agent.
//
//	go run ./architect-professional/01-solution-design/solution
//	go run ./architect-professional/01-solution-design/solution -only M3
//
// The pipeline is input -> classify -> route -> handler -> reply, plus a
// feedback log that module 04's evals and module 06's reviews can read.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"claudecertstudy/architect-professional/01-solution-design/disputes"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var only = flag.String("only", "", "run a single message by ID (M1-M5)")

// ---------- metering: every design decision is a cost/latency decision ----------

type meter struct {
	mu            sync.Mutex
	calls         int
	input, output int64
}

func (m *meter) add(u anthropic.Usage) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.calls++
	m.input += u.InputTokens + u.CacheReadInputTokens + u.CacheCreationInputTokens
	m.output += u.OutputTokens
}

func ask(ctx context.Context, client anthropic.Client, m *meter, p anthropic.MessageNewParams) (string, error) {
	if p.Model == "" {
		p.Model = claude.Model
	}
	if p.MaxTokens == 0 {
		p.MaxTokens = 16000
	}
	resp, err := client.Messages.New(ctx, p)
	if err != nil {
		return "", err
	}
	m.add(resp.Usage)
	if resp.StopReason == anthropic.StopReasonRefusal {
		return "", fmt.Errorf("refused")
	}
	return claude.Text(resp), nil
}

func user(text string) []anthropic.MessageParam {
	return []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(text))}
}

// ---------- 1. Classify: one cheap, schema-constrained call ----------

// The classifier only labels the request and pulls out hints. It decides
// nothing about money. Low effort is enough for labelling; whether a smaller
// model would also do is a question for an eval (module 04), not a guess.
var classifySchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"route": map[string]any{"type": "string", "enum": []string{
			"case_status", "billing_error", "unrecognized_charges", "general_question", "other"}},
		"case_id": map[string]any{"type": []string{"string", "null"}, "description": "D-#### if the customer gives one"},
		"charges": map[string]any{
			"type":        "array",
			"description": "Each charge the customer mentions",
			"items": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"merchant":   map[string]any{"type": "string"},
					"amount_usd": map[string]any{"type": []string{"number", "null"}},
				},
				"required":             []string{"merchant", "amount_usd"},
				"additionalProperties": false,
			},
		},
	},
	"required":             []string{"route", "case_id", "charges"},
	"additionalProperties": false,
}

type charge struct {
	Merchant string   `json:"merchant"`
	Amount   *float64 `json:"amount_usd"`
}

type classification struct {
	Route   string   `json:"route"`
	CaseID  *string  `json:"case_id"`
	Charges []charge `json:"charges"`
	raw     string   // the original message, kept for the reply step
}

func classify(ctx context.Context, client anthropic.Client, m *meter, text string) (classification, error) {
	out, err := ask(ctx, client, m, anthropic.MessageNewParams{
		System: []anthropic.TextBlockParam{{Text: "Label a card customer's message for routing.\n" +
			"- case_status: asks about an existing dispute case.\n" +
			"- billing_error: a charge they made but that is wrong (duplicate, wrong amount, cancelled service).\n" +
			"- unrecognized_charges: charges they say they did not make.\n" +
			"- general_question: a product or policy question.\n" +
			"- other: anything else."}},
		OutputConfig: anthropic.OutputConfigParam{
			Effort: anthropic.OutputConfigEffortLow,
			Format: anthropic.JSONOutputFormatParam{Schema: classifySchema},
		},
		Messages: user(text),
	})
	var c classification
	if err == nil {
		err = json.Unmarshal([]byte(out), &c)
	}
	return c, err
}

// ---------- 2. Code matches charges to transactions. No model needed ----------

func match(hints []charge) []disputes.Transaction {
	var out []disputes.Transaction
	seen := map[string]bool{}
	for _, h := range hints {
		for _, t := range disputes.Transactions {
			if seen[t.ID] || !strings.Contains(strings.ToLower(t.Merchant), firstWord(h.Merchant)) {
				continue
			}
			if h.Amount != nil && *h.Amount != t.Amount {
				continue
			}
			seen[t.ID] = true
			out = append(out, t)
		}
	}
	return out
}

func firstWord(s string) string {
	f := strings.Fields(strings.ToLower(s))
	if len(f) == 0 {
		return "\x00"
	}
	return f[0]
}

// ---------- 3. Handlers: one pattern per route ----------

type outcome struct {
	Pattern string
	Reply   string
	Actions []string // what the system did in code
}

const voice = "You write replies for Larkspur Bank's card servicing team. Be brief and specific. " +
	"Use only the facts given. Never promise an outcome the facts don't state."

// Augmented LLM: code retrieves the record, the model writes one reply.
func handleStatus(ctx context.Context, client anthropic.Client, m *meter, c classification) (outcome, error) {
	o := outcome{Pattern: "augmented LLM (code retrieves the case, one call writes the reply)"}
	if c.CaseID == nil {
		o.Reply = "Could you share your dispute case number? It starts with D- and is in your confirmation email."
		return o, nil
	}
	cs, ok := disputes.Cases[*c.CaseID]
	if !ok {
		o.Reply = "I couldn't find case " + *c.CaseID + ". Please check the number in your confirmation email."
		return o, nil
	}
	rec, _ := json.Marshal(cs)
	reply, err := ask(ctx, client, m, anthropic.MessageNewParams{
		System:   []anthropic.TextBlockParam{{Text: voice}},
		Messages: user("<case_record>" + string(rec) + "</case_record>\n\nWrite the status update for the customer."),
	})
	o.Reply = reply
	return o, err
}

// Prompt chain with a code gate: match -> rules in code -> model drafts the letter.
func handleBilling(ctx context.Context, client anthropic.Client, m *meter, c classification) (outcome, error) {
	o := outcome{Pattern: "workflow: prompt chain with a code gate"}
	txns := match(c.Charges)
	if len(txns) == 0 {
		o.Actions = append(o.Actions, "no matching transaction: sent to the human queue")
		o.Reply = "Thanks. I couldn't match that charge to your account, so a specialist will follow up within one business day."
		return o, nil
	}
	// A duplicate claim names one merchant but matches two identical charges:
	// dispute the later one.
	t := txns[len(txns)-1]
	e := disputes.Check(t, false)
	if e.Eligible {
		o.Actions = append(o.Actions, "opened dispute on "+t.ID)
		if e.ProvisionalCredit {
			o.Actions = append(o.Actions, fmt.Sprintf("provisional credit $%.2f", t.Amount))
		}
	} else {
		o.Actions = append(o.Actions, "not eligible ("+e.Reason+"): offered a specialist review")
	}
	facts, _ := json.Marshal(map[string]any{"transaction": t, "eligibility": e,
		"provisional_credit_business_days": disputes.ProvisionalCreditBizDay})
	reply, err := ask(ctx, client, m, anthropic.MessageNewParams{
		System: []anthropic.TextBlockParam{{Text: voice + " If the dispute is not eligible, explain why in one sentence " +
			"and offer a review by a specialist; don't suggest the customer can still dispute it."}},
		Messages: user("<facts>" + string(facts) + "</facts>\n\nCustomer message: " + c.raw),
	})
	o.Reply = reply
	return o, err
}

// Parallelization (sectioning): each charge is reviewed independently and at
// the same time, then one call writes the reply. Code still makes the money
// and security decisions.
var noteSchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"pattern_notes":         map[string]any{"type": "string", "description": "One sentence for the fraud analyst"},
		"similar_prior_charges": map[string]any{"type": "integer"},
	},
	"required":             []string{"pattern_notes", "similar_prior_charges"},
	"additionalProperties": false,
}

func handleFraud(ctx context.Context, client anthropic.Client, m *meter, c classification) (outcome, error) {
	o := outcome{Pattern: "workflow: parallel fan-out per charge, then synthesis"}
	txns := match(c.Charges)
	o.Actions = append(o.Actions, "card 4471 locked; replacement ordered") // done first, in code, every time
	notes := make([]string, len(txns))
	errs := make([]error, len(txns))
	var wg sync.WaitGroup
	for i, t := range txns {
		wg.Add(1)
		go func(i int, t disputes.Transaction) {
			defer wg.Done()
			b, _ := json.Marshal(t)
			notes[i], errs[i] = ask(ctx, client, m, anthropic.MessageNewParams{
				System: []anthropic.TextBlockParam{{Text: "You annotate one disputed card charge for a fraud analyst. " +
					"Compare it with the account history. Don't decide liability."}},
				OutputConfig: anthropic.OutputConfigParam{
					Effort: anthropic.OutputConfigEffortLow,
					Format: anthropic.JSONOutputFormatParam{Schema: noteSchema},
				},
				Messages: user("<charge>" + string(b) + "</charge>\n<history>" + disputes.TransactionsJSON() + "</history>"),
			})
		}(i, t)
	}
	wg.Wait()
	var claims []map[string]any
	for i, t := range txns {
		e := disputes.Check(t, true)
		o.Actions = append(o.Actions, fmt.Sprintf("fraud claim on %s ($%.2f), provisional credit: %v", t.ID, t.Amount, e.ProvisionalCredit))
		note := notes[i]
		if errs[i] != nil {
			note = "annotation failed: " + errs[i].Error() // reported, not hidden
		}
		claims = append(claims, map[string]any{"transaction": t, "eligibility": e, "analyst_note": json.RawMessage(quoteIfNeeded(note))})
	}
	facts, _ := json.Marshal(map[string]any{"claims": claims, "card_locked": true, "replacement_card_days": 5})
	reply, err := ask(ctx, client, m, anthropic.MessageNewParams{
		System:   []anthropic.TextBlockParam{{Text: voice + " Analyst notes are internal: don't quote them to the customer."}},
		Messages: user("<facts>" + string(facts) + "</facts>\n\nCustomer message: " + c.raw),
	})
	o.Reply = reply
	return o, err
}

func quoteIfNeeded(s string) string {
	if json.Valid([]byte(s)) {
		return s
	}
	b, _ := json.Marshal(s)
	return string(b)
}

// Augmented LLM with retrieval: the FAQ stands in for a search index (module 03).
func handleGeneral(ctx context.Context, client anthropic.Client, m *meter, c classification) (outcome, error) {
	o := outcome{Pattern: "augmented LLM (retrieved FAQ in context)"}
	reply, err := ask(ctx, client, m, anthropic.MessageNewParams{
		System:       []anthropic.TextBlockParam{{Text: voice + " Answer only from the FAQ. If it doesn't cover the question, say a specialist will follow up."}},
		OutputConfig: anthropic.OutputConfigParam{Effort: anthropic.OutputConfigEffortLow},
		Messages:     user("<faq>\n" + disputes.FAQ + "\n</faq>\n\n" + c.raw),
	})
	o.Reply = reply
	return o, err
}

// ---------- 4. Feedback loop: log every decision for evals and reviews ----------

type decision struct {
	At         string   `json:"at"`
	MessageID  string   `json:"message_id"`
	Route      string   `json:"route"`
	Pattern    string   `json:"pattern"`
	Actions    []string `json:"actions"`
	ModelCalls int      `json:"model_calls"`
	InputTok   int64    `json:"input_tokens"`
	OutputTok  int64    `json:"output_tokens"`
	LatencyMS  int64    `json:"latency_ms"`
	// Filled in later by a reviewer or by the customer's next message:
	// resolved, reopened, escalated. That label is what turns the log into an eval set.
	Outcome *string `json:"outcome"`
}

func main() {
	flag.Parse()
	ctx := context.Background()
	client := claude.NewClient()
	logPath := filepath.Join(os.TempDir(), "larkspur-decisions.jsonl")
	f, err := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	handlers := map[string]func(context.Context, anthropic.Client, *meter, classification) (outcome, error){
		"case_status":          handleStatus,
		"billing_error":        handleBilling,
		"unrecognized_charges": handleFraud,
		"general_question":     handleGeneral,
	}

	for _, msg := range disputes.Messages {
		if *only != "" && msg.ID != *only {
			continue
		}
		claude.Banner(msg.ID + ": " + msg.Text)
		start := time.Now()
		m := &meter{}
		c, err := classify(ctx, client, m, msg.Text)
		if err != nil {
			log.Fatal(err)
		}
		c.raw = msg.Text
		var o outcome
		if h, ok := handlers[c.Route]; ok {
			o, err = h(ctx, client, m, c)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			o = outcome{Pattern: "human queue", Reply: "Thanks, a specialist will reply within one business day.",
				Actions: []string{"sent to the human queue"}}
		}
		d := decision{At: time.Now().UTC().Format(time.RFC3339), MessageID: msg.ID, Route: c.Route, Pattern: o.Pattern,
			Actions: o.Actions, ModelCalls: m.calls, InputTok: m.input, OutputTok: m.output, LatencyMS: time.Since(start).Milliseconds()}
		line, _ := json.Marshal(d)
		fmt.Fprintln(f, string(line))

		fmt.Printf("route:   %s\npattern: %s\n", c.Route, o.Pattern)
		for _, a := range o.Actions {
			fmt.Println("action: ", a)
		}
		fmt.Printf("cost:    %d model calls, %d input + %d output tokens, %s\n", m.calls, m.input, m.output, time.Since(start).Round(time.Millisecond))
		fmt.Println("REPLY:  ", o.Reply)
	}
	fmt.Println("\ndecision log:", logPath)
}
