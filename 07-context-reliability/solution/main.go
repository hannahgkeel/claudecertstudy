// Solution: a multi-turn support conversation that stays reliable as it grows.
//
//	go run ./07-context-reliability/solution
//	go run ./07-context-reliability/solution -no-trim   # compare token growth with raw tool output
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"

	"claudecertstudy/07-context-reliability/backend"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var noTrim = flag.Bool("no-trim", false, "append raw tool output instead of trimmed")

// ---------- 1. Case facts: a block of facts that never gets paraphrased ----------

// Long conversations (and summaries of them) blur exact numbers: "$149.99
// on Oct 2" turns into "about $150 last week". Code keeps the exact values,
// taken from tool results, and includes them in every turn.
type orderFact struct {
	Item        string  `json:"item"`
	Total       float64 `json:"total_usd"`
	Status      string  `json:"status"`
	DeliveredOn *string `json:"delivered_on"`
}

type caseFacts struct {
	CustomerID string               `json:"customer_id,omitempty"`
	Orders     map[string]orderFact `json:"orders"`
}

func (c *caseFacts) render() string {
	b, _ := json.MarshalIndent(c, "", "  ")
	return "<case_facts source=\"system of record; authoritative\">\n" + string(b) + "\n</case_facts>"
}

// ---------- 2. Trim tool output to what the task needs ----------

func trimOrder(raw string) (string, orderFact, string, bool) {
	var full struct {
		OrderID        string  `json:"order_id"`
		CustomerID     string  `json:"customer_id"`
		Item           string  `json:"item"`
		Total          float64 `json:"order_total"`
		Status         string  `json:"status"`
		DeliveredOn    *string `json:"delivered_on"`
		Carrier        string  `json:"carrier"`
		TrackingNumber string  `json:"tracking_number"`
		Events         []struct {
			TS   string `json:"ts"`
			Note string `json:"note"`
		} `json:"tracking_events"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal([]byte(raw), &full); err != nil || full.Error != "" {
		return raw, orderFact{}, "", false
	}
	slim := map[string]any{
		"order_id": full.OrderID, "item": full.Item, "total_usd": full.Total, "status": full.Status,
		"delivered_on": full.DeliveredOn, "carrier": full.Carrier, "tracking_number": full.TrackingNumber,
	}
	if n := len(full.Events); n > 0 {
		slim["latest_tracking_event"] = full.Events[n-1]
	}
	b, _ := json.Marshal(slim)
	return string(b), orderFact{full.Item, full.Total, full.Status, full.DeliveredOn}, full.CustomerID, true
}

// ---------- 3. Escalation with explicit criteria ----------

var tools = []anthropic.ToolParam{
	{
		Name:        "lookup_order",
		Description: anthropic.String("Fetch an order by ID (O-####): item, total, status, delivery date, tracking."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties: map[string]any{"order_id": map[string]any{"type": "string"}},
			Required:   []string{"order_id"},
		},
	},
	{
		Name: "escalate_to_human",
		Description: anthropic.String("Hand off to a human agent. Only for the escalation criteria in the policy: " +
			"explicit request for a human, a policy gap, or no progress after two attempts. Frustration alone is not a reason."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties: map[string]any{
				"reason":  map[string]any{"type": "string", "enum": []string{"customer_request", "policy_gap", "no_progress"}},
				"summary": map[string]any{"type": "string", "description": "Customer, orders, facts, what was offered, and what is still open"},
			},
			Required: []string{"reason", "summary"},
		},
	},
}

func toolUnion() []anthropic.ToolUnionParam {
	out := make([]anthropic.ToolUnionParam, len(tools))
	for i := range tools {
		out[i] = anthropic.ToolUnionParam{OfTool: &tools[i]}
	}
	return out
}

func main() {
	flag.Parse()
	ctx := context.Background()
	client := claude.NewClient()

	// ---------- 4. Prompt caching: stable content first, marked for caching ----------
	system := []anthropic.TextBlockParam{{
		Text: "You are a support agent. Follow this policy exactly. When <case_facts> appear, " +
			"treat them as authoritative over anything earlier in the conversation.\n\n" + backend.PolicyDocument(),
		CacheControl: anthropic.NewCacheControlEphemeralParam(),
	}}

	userTurns := []string{
		"Hi, I'm Dana (customer C-778). My order O-5512 arrived damaged, the jug is cracked.",
		"It's the blender. Also, my other order O-5520 hasn't arrived yet. Where is it?",
		"Remind me: what exactly did I pay for the blender, and when was it delivered?",
		"Honestly this whole thing is getting really frustrating.",
		"I'd like to talk to a real person please.",
	}

	facts := &caseFacts{Orders: map[string]orderFact{}}
	var messages []anthropic.MessageParam

	for turn, text := range userTurns {
		claude.Banner(fmt.Sprintf("Turn %d", turn+1))
		fmt.Println("USER:", text)
		// Case facts go at the START of the newest message, where they get the
		// most attention, and are appended, never edited into old turns, so the
		// cached prefix stays valid.
		content := text
		if len(facts.Orders) > 0 {
			content = facts.render() + "\n\n" + text
		}
		messages = append(messages, anthropic.NewUserMessage(anthropic.NewTextBlock(content)))

		for step := 0; step < 6; step++ {
			resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
				Model:        claude.Model,
				MaxTokens:    16000,
				System:       system,
				Tools:        toolUnion(),
				Messages:     messages,
				CacheControl: anthropic.NewCacheControlEphemeralParam(), // also cache the growing history
			})
			if err != nil {
				log.Fatal(err)
			}
			u := resp.Usage
			fmt.Printf("   [tokens] input=%d cache_read=%d cache_write=%d output=%d\n",
				u.InputTokens, u.CacheReadInputTokens, u.CacheCreationInputTokens, u.OutputTokens)
			messages = append(messages, resp.ToParam())

			if resp.StopReason != anthropic.StopReasonToolUse {
				fmt.Println("AGENT:", claude.Text(resp))
				break
			}
			var results []anthropic.ContentBlockParamUnion
			escalated := false
			for _, b := range resp.Content {
				tu, ok := b.AsAny().(anthropic.ToolUseBlock)
				if !ok {
					continue
				}
				switch tu.Name {
				case "lookup_order":
					var in struct {
						OrderID string `json:"order_id"`
					}
					_ = json.Unmarshal([]byte(tu.JSON.Input.Raw()), &in)
					raw := backend.LookupOrderRaw(in.OrderID)
					out := raw
					if slim, fact, cust, ok := trimOrder(raw); ok {
						facts.Orders[in.OrderID] = fact
						facts.CustomerID = cust
						if !*noTrim {
							out = slim
						}
					}
					fmt.Printf("   -> lookup_order %s (%d chars raw, %d sent)\n", in.OrderID, len(raw), len(out))
					results = append(results, anthropic.NewToolResultBlock(tu.ID, out, false))
				case "escalate_to_human":
					fmt.Println("   -> ESCALATED:", tu.JSON.Input.Raw())
					escalated = true
					results = append(results, anthropic.NewToolResultBlock(tu.ID, `{"ticket":"H-3391","eta_minutes":10}`, false))
				}
			}
			messages = append(messages, anthropic.NewUserMessage(results...))
			if escalated && turn < 3 {
				fmt.Println("   !! escalated before the customer asked: check the criteria")
			}
		}
	}
}
