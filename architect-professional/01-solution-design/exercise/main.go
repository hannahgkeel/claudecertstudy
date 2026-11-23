// Exercise 1: match the architecture to the problem.
//
//	go run ./architect-professional/01-solution-design/exercise
//
// Run it first. Every message, even "what's the ATM limit?", goes to one agent
// that holds every tool and decides the dispute rules itself. Note for each
// message: how many model calls it took, the tokens, whether it issued credit
// for the May hotel charge (outside the 60-day window), and whether it locked
// the card for the unrecognized charges. Then fix the TODOs.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"claudecertstudy/architect-professional/01-solution-design/disputes"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// TODO(1): Classify first. Add one schema-constrained call (OutputConfig.Format)
// that labels each message: case_status, billing_error, unrecognized_charges,
// general_question or other, and pulls out the case ID and the charges the
// customer mentions. Which effort level does a labelling call need?

// TODO(2): Route each label to the simplest pattern that handles it:
//   - case_status:          augmented LLM. Code fetches the case; one call writes the reply.
//   - general_question:     augmented LLM with the FAQ in context.
//   - billing_error:        prompt chain with a code gate (match -> disputes.Check -> draft).
//   - unrecognized_charges: parallel fan-out, one worker per charge, then one synthesis call.
//   - other:                the human queue.
// Which of these, if any, actually needs an agent that plans its own steps?

// TODO(3): Move the money and security rules out of the prompt. disputes.Check
// decides eligibility and provisional credit, and code locks the card on every
// fraud claim. The model writes the words, not the decision.

// TODO(4): Least privilege. Even where you keep a model in the loop, should it
// hold issue_credit or close_account? (Module 03 and 05 go further.)

// TODO(5): Feedback loop. Append one JSON line per message (route, pattern, actions,
// model calls, tokens, latency, and an empty outcome field a reviewer fills in
// later) so you can build an eval set from real traffic.

var tools = []anthropic.ToolParam{
	{Name: "list_transactions", Description: anthropic.String("List the customer's recent card transactions."),
		InputSchema: anthropic.ToolInputSchemaParam{Properties: map[string]any{}}},
	{Name: "get_case", Description: anthropic.String("Fetch a dispute case by ID."),
		InputSchema: anthropic.ToolInputSchemaParam{Properties: map[string]any{"case_id": map[string]any{"type": "string"}}, Required: []string{"case_id"}}},
	{Name: "open_dispute", Description: anthropic.String("Open a dispute on a transaction."),
		InputSchema: anthropic.ToolInputSchemaParam{Properties: map[string]any{"transaction_id": map[string]any{"type": "string"}, "fraud": map[string]any{"type": "boolean"}}, Required: []string{"transaction_id"}}},
	{Name: "issue_credit", Description: anthropic.String("Credit the customer's account."),
		InputSchema: anthropic.ToolInputSchemaParam{Properties: map[string]any{"transaction_id": map[string]any{"type": "string"}, "amount_usd": map[string]any{"type": "number"}}, Required: []string{"transaction_id", "amount_usd"}}},
	{Name: "lock_card", Description: anthropic.String("Lock the customer's card."),
		InputSchema: anthropic.ToolInputSchemaParam{Properties: map[string]any{"card_last4": map[string]any{"type": "string"}}, Required: []string{"card_last4"}}},
	{Name: "close_account", Description: anthropic.String("Close the customer's account."),
		InputSchema: anthropic.ToolInputSchemaParam{Properties: map[string]any{"reason": map[string]any{"type": "string"}}, Required: []string{"reason"}}},
}

const system = `You are Larkspur Bank's card servicing agent. Help the customer with whatever they need.
Disputes must be opened within 60 days of the transaction. Issue provisional credit for disputes up to $2,500.
Lock the card if the customer reports charges they didn't make.`

func runTool(name, input string, actions *[]string) string {
	var in map[string]any
	_ = json.Unmarshal([]byte(input), &in)
	switch name {
	case "list_transactions":
		return disputes.TransactionsJSON()
	case "get_case":
		id, _ := in["case_id"].(string)
		if c, ok := disputes.Cases[id]; ok {
			b, _ := json.Marshal(c)
			return string(b)
		}
		return `{"error":"case not found"}`
	default:
		*actions = append(*actions, fmt.Sprintf("%s %s", name, input))
		return `{"ok":true}`
	}
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()
	union := make([]anthropic.ToolUnionParam, len(tools))
	for i := range tools {
		union[i] = anthropic.ToolUnionParam{OfTool: &tools[i]}
	}

	for _, msg := range disputes.Messages {
		claude.Banner(msg.ID + ": " + msg.Text)
		start := time.Now()
		var calls int
		var in, out int64
		var actions []string
		messages := []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(msg.Text))}
		var reply string
		for step := 0; step < 10; step++ {
			resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
				Model: claude.Model, MaxTokens: 16000,
				System:   []anthropic.TextBlockParam{{Text: system}},
				Tools:    union,
				Messages: messages,
			})
			if err != nil {
				log.Fatal(err)
			}
			calls++
			in += resp.Usage.InputTokens
			out += resp.Usage.OutputTokens
			messages = append(messages, resp.ToParam())
			if resp.StopReason != anthropic.StopReasonToolUse {
				reply = claude.Text(resp)
				break
			}
			var results []anthropic.ContentBlockParamUnion
			for _, b := range resp.Content {
				if tu, ok := b.AsAny().(anthropic.ToolUseBlock); ok {
					results = append(results, anthropic.NewToolResultBlock(tu.ID, runTool(tu.Name, tu.JSON.Input.Raw(), &actions), false))
				}
			}
			messages = append(messages, anthropic.NewUserMessage(results...))
		}
		fmt.Println("pattern: one agent with every tool")
		for _, a := range actions {
			fmt.Println("action: ", a)
		}
		fmt.Printf("cost:    %d model calls, %d input + %d output tokens, %s\n", calls, in, out, time.Since(start).Round(time.Millisecond))
		fmt.Println("REPLY:  ", reply)
	}
}
