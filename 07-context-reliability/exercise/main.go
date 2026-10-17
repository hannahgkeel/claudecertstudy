// Exercise 7: keep a long conversation reliable.
//
//	go run ./07-context-reliability/exercise
//
// Run it first. Watch the [tokens] line grow, check turn 3's answer, and see
// whether the agent escalates on turn 4 (frustration) or only on turn 5 (asked
// for a human). Then fix the TODOs.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"claudecertstudy/07-context-reliability/backend"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// TODO(1): Case facts. Keep exact values from tool results (order item, total,
// status, delivery date, customer ID) in Go, and render them as a
// <case_facts> block at the start of EVERY new user message.
// Why not rely on the conversation history, or on a summary of it?
type caseFacts struct{}

func (c *caseFacts) render() string { return "" }

// TODO(2): The order API returns ~40 fields and 18 tracking events. Trim it to
// what the agent needs (order_id, item, total, status, delivered_on, carrier,
// tracking number, latest event) before it goes into history.
// Compare the "chars raw / chars sent" numbers before and after.
func trimOrder(raw string) string {
	return raw
}

// TODO(3): Escalation. Give escalate_to_human a "reason" enum
// (customer_request | policy_gap | no_progress) and a description that
// matches the criteria in backend.PolicyDocument(). Then make sure the agent
// escalates on turn 5 but NOT on turn 4. Why are sentiment and "confidence"
// poor escalation triggers?
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
		Name:        "escalate_to_human",
		Description: anthropic.String("Escalate to a human if the customer is upset or you're not confident."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties: map[string]any{"summary": map[string]any{"type": "string"}},
			Required:   []string{"summary"},
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
	ctx := context.Background()
	client := claude.NewClient()

	// TODO(4): Prompt caching. The policy document is long and identical on
	// every request. Add CacheControl: anthropic.NewCacheControlEphemeralParam()
	// to this block, and the top-level CacheControl on the request so the
	// growing history is cached too. Then check that cache_read > 0 from the
	// second request on.
	// Question: what would happen to the cache if you put time.Now() in the system prompt?
	system := []anthropic.TextBlockParam{{
		Text: "You are a support agent. Follow this policy exactly.\n\n" + backend.PolicyDocument(),
	}}

	userTurns := []string{
		"Hi, I'm Dana (customer C-778). My order O-5512 arrived damaged, the jug is cracked.",
		"It's the blender. Also, my other order O-5520 hasn't arrived yet. Where is it?",
		"Remind me: what exactly did I pay for the blender, and when was it delivered?",
		"Honestly this whole thing is getting really frustrating.",
		"I'd like to talk to a real person please.",
	}

	facts := &caseFacts{}
	var messages []anthropic.MessageParam

	for turn, text := range userTurns {
		claude.Banner(fmt.Sprintf("Turn %d", turn+1))
		fmt.Println("USER:", text)
		content := text
		if f := facts.render(); f != "" {
			content = f + "\n\n" + text
		}
		messages = append(messages, anthropic.NewUserMessage(anthropic.NewTextBlock(content)))

		for step := 0; step < 6; step++ {
			resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
				Model:     claude.Model,
				MaxTokens: 16000,
				System:    system,
				Tools:     toolUnion(),
				Messages:  messages,
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
					out := trimOrder(raw)
					// TODO(1b): record this order in facts.
					fmt.Printf("   -> lookup_order %s (%d chars raw, %d sent)\n", in.OrderID, len(raw), len(out))
					results = append(results, anthropic.NewToolResultBlock(tu.ID, out, false))
				case "escalate_to_human":
					fmt.Println("   -> ESCALATED:", tu.JSON.Input.Raw())
					results = append(results, anthropic.NewToolResultBlock(tu.ID, `{"ticket":"H-3391","eta_minutes":10}`, false))
				}
			}
			messages = append(messages, anthropic.NewUserMessage(results...))
		}
	}
}
