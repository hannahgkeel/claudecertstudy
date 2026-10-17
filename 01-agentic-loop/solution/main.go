// Solution: a manual agentic loop with a deterministic policy gate.
//
//	go run ./01-agentic-loop/solution
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"claudecertstudy/01-agentic-loop/support"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

const systemPrompt = `You are a customer support agent for an online store.
Verify the customer with get_customer before doing anything else.
Confirm the order belongs to them with lookup_order before refunding it.
If a tool rejects an action on policy grounds, escalate to a human instead of retrying.`

const refundLimit = 500.00

// session holds facts the gate has established from real tool results,
// not from anything the model says.
type session struct {
	verifiedCustomerID string
}

// gate runs before every tool call. Prompt instructions make the model
// *likely* to follow policy; code here makes it *certain*. Return a non-empty
// reason to block the call; the reason goes back to Claude as an error result.
func (s *session) gate(name, rawInput string) string {
	if name != "process_refund" {
		return ""
	}
	var in struct {
		CustomerID string `json:"customer_id"`
		OrderID    string `json:"order_id"`
	}
	if err := json.Unmarshal([]byte(rawInput), &in); err != nil {
		return "invalid input: " + err.Error()
	}
	if s.verifiedCustomerID == "" || in.CustomerID != s.verifiedCustomerID {
		return "BLOCKED: customer not verified in this session. Call get_customer first."
	}
	order, ok := support.LookupOrder(in.OrderID)
	if !ok || order.CustomerID != in.CustomerID {
		return "BLOCKED: order does not belong to this customer."
	}
	if order.Total > refundLimit {
		return fmt.Sprintf("BLOCKED (policy): refund of $%.2f exceeds the $%.0f automatic limit. "+
			"Not retryable. Escalate to a human.", order.Total, refundLimit)
	}
	return ""
}

// observe updates session state from a successful tool result.
func (s *session) observe(name, result string) {
	if name != "get_customer" {
		return
	}
	var c support.Customer
	if json.Unmarshal([]byte(result), &c) == nil && c.Verified {
		s.verifiedCustomerID = c.ID
	}
}

func runAgent(ctx context.Context, client anthropic.Client, userMsg string) {
	messages := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(userMsg)),
	}
	s := &session{}

	// The loop ends on stop_reason, never on what the text says. The
	// iteration cap is a safety backstop, not the normal way out.
	const maxIterations = 15
	for i := 0; i < maxIterations; i++ {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     claude.Model,
			MaxTokens: 16000,
			System:    []anthropic.TextBlockParam{{Text: systemPrompt}},
			Tools:     support.Tools(),
			Messages:  messages,
		})
		if err != nil {
			log.Fatal(err)
		}

		// Append the WHOLE assistant turn (text + tool_use blocks, and any
		// thinking blocks) so the next request sees exactly what Claude said.
		messages = append(messages, resp.ToParam())

		switch resp.StopReason {
		case anthropic.StopReasonEndTurn:
			fmt.Println("AGENT:", claude.Text(resp))
			return
		case anthropic.StopReasonMaxTokens:
			fmt.Println("Stopped: hit max_tokens mid-response. Raise MaxTokens or ask for less output.")
			return
		case anthropic.StopReasonRefusal:
			fmt.Println("Stopped: request was declined.", resp.StopDetails.Explanation)
			return
		case anthropic.StopReasonToolUse:
			// handled below
		default:
			fmt.Println("Stopped: unexpected stop_reason", resp.StopReason)
			return
		}

		// Run every tool_use block and return ALL results in ONE user message.
		var results []anthropic.ContentBlockParamUnion
		for _, block := range resp.Content {
			tu, ok := block.AsAny().(anthropic.ToolUseBlock)
			if !ok {
				continue
			}
			raw := tu.JSON.Input.Raw()
			fmt.Printf("  -> %s %s\n", tu.Name, raw)

			if reason := s.gate(tu.Name, raw); reason != "" {
				fmt.Println("     gate:", reason)
				results = append(results, anthropic.NewToolResultBlock(tu.ID, reason, true))
				continue
			}
			out, isErr := support.Execute(tu.Name, raw)
			if !isErr {
				s.observe(tu.Name, out)
			}
			fmt.Println("     <-", out)
			results = append(results, anthropic.NewToolResultBlock(tu.ID, out, isErr))
		}
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
	fmt.Println("Stopped: iteration cap reached (this should be rare; investigate if it happens).")
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()

	claude.Banner("Scenario 1: small refund (should succeed)")
	runAgent(ctx, client, "Hi, I'm ana@example.com. My headphones from order O-1 broke. Can I get a refund?")

	claude.Banner("Scenario 2: refund over the limit (gate blocks, agent escalates)")
	runAgent(ctx, client, "This is bo@example.com. Refund order O-2 please, the laptop arrived cracked.")
}
