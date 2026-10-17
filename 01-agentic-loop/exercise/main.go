// Exercise 1: build the agentic loop and a deterministic policy gate.
//
//	go run ./01-agentic-loop/exercise
//
// Fill in each TODO. The file compiles as-is, but the agent does nothing
// useful until you finish. Compare with ../solution/main.go when done.
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"claudecertstudy/01-agentic-loop/support"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

const systemPrompt = `You are a customer support agent for an online store.
Verify the customer with get_customer before doing anything else.
Confirm the order belongs to them with lookup_order before refunding it.
If a tool rejects an action on policy grounds, escalate to a human instead of retrying.`

const refundLimit = 500.00

type session struct {
	verifiedCustomerID string
}

// blockReason is the structured result Claude gets back when gate blocks a
// call. Fields must be exported (capitalized) or json.Marshal skips them.
type blockReason struct {
	Category  string `json:"category"`
	Message   string `json:"message"`
	Retryable bool   `json:"retryable"`
	Next      string `json:"next"`
}

// TODO(1): Block process_refund unless ALL of these hold:
//   - the customer_id in the input matches s.verifiedCustomerID
//   - the order exists and belongs to that customer (support.LookupOrder)
//   - the order total is <= refundLimit
//
// Return "" to allow the call, or a reason string to block it. Write the
// reason for Claude: say what happened, whether retrying can help, and what
// to do next.
//
// Question to answer for yourself: the system prompt already says to verify
// first. Why enforce it in code too?
func (s *session) gate(name, rawInput string) string {
	if name != "process_refund" {
		return ""
	}
	var in map[string]string
	if err := json.Unmarshal([]byte(rawInput), &in); err != nil {
		return blockError("invalid_input",
			"process_refund input was not valid JSON: "+err.Error(), true,
			"Call process_refund again with customer_id, order_id and reason as strings.")
	}
	if s.verifiedCustomerID == "" {
		return blockError("not_verified",
			"No customer has been verified in this conversation yet.", true,
			"Call get_customer with the customer's email first, then retry the refund with the ID it returns.")
	}
	if in["customer_id"] != s.verifiedCustomerID {
		return blockError("customer_mismatch",
			fmt.Sprintf("customer_id %q is not the verified customer for this conversation.", in["customer_id"]), true,
			fmt.Sprintf("Retry with the verified customer ID from get_customer (%s).", s.verifiedCustomerID))
	}
	order, ok := support.LookupOrder(in["order_id"])
	if !ok {
		return blockError("order_not_found",
			fmt.Sprintf("Order %q does not exist.", in["order_id"]), false,
			"Ask the customer to confirm their order ID, then check it with lookup_order.")
	}
	if order.CustomerID != s.verifiedCustomerID {
		return blockError("order_not_owned",
			fmt.Sprintf("Order %s is not on the verified customer's account.", order.ID), false,
			"Do not refund it. Ask the customer to double-check the order ID, and escalate_to_human if they say it is theirs.")
	}
	if order.Total > refundLimit {
		return blockError("over_refund_limit",
			fmt.Sprintf("Refund of $%.2f exceeds the $%.2f automatic refund limit. This is a policy rule.", order.Total, refundLimit), false,
			"Do not retry. Call escalate_to_human with a summary including the order ID, amount and the customer's reason, then tell the customer a human will follow up.")
	}
	return ""
}

func blockError(category, message string, retryable bool, next string) string {
	b, err := json.Marshal(blockReason{Category: category, Message: message, Retryable: retryable, Next: next})
	if err != nil {
		return "BLOCKED: " + message + " Next: " + next
	}
	return string(b)
}

// TODO(2): After a successful get_customer call, parse the result as a
// support.Customer and record the ID in s.verifiedCustomerID if Verified is true.
func (s *session) observe(name, result string) {
	if name != "get_customer" {
		return
	}
	var cust support.Customer
	if err := json.Unmarshal([]byte(result), &cust); err == nil {
		if cust.Verified {
			s.verifiedCustomerID = cust.ID
		}
	}
}

func runAgent(ctx context.Context, client anthropic.Client, userMsg string) {
	messages := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(userMsg)),
	}
	s := &session{}

	const maxIterations = 15
	for range maxIterations {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     claude.Model,
			MaxTokens: 10000,
			System:    []anthropic.TextBlockParam{{Text: systemPrompt}},
			Tools:     support.Tools(),
			Messages:  messages,
		})
		if err != nil {
			panic(err)
		}
		fmt.Println("Input Tokens: " + fmt.Sprint(resp.Usage.InputTokens))

		// TODO(3): Append the assistant turn to messages. Hint: resp.ToParam().
		// Why the whole turn and not just the text?
		messages = append(messages, resp.ToParam())

		// TODO(4): Branch on resp.StopReason.
		//   end_turn   -> print claude.Text(resp) and return
		//   max_tokens -> report truncation and return
		//   refusal    -> report resp.StopDetails.Explanation and return
		//   tool_use   -> fall through to run tools
		// Do NOT decide you're done by searching the text for words like "done".
		switch resp.StopReason {
		case anthropic.StopReasonEndTurn:
			fmt.Println(claude.Text(resp))
			return
		case anthropic.StopReasonMaxTokens:
			fmt.Println("Stopped: response was cut off at max_tokens. Partial text:", claude.Text(resp))
			return
		case anthropic.StopReasonRefusal:
			fmt.Println("Stopped: request was declined.", resp.StopDetails.Explanation)
			return
		case anthropic.StopReasonToolUse:
			// fall through to run tools below
		default:
			fmt.Println("Stopped: unexpected stop_reason", resp.StopReason)
			return
		}

		// TODO(5): For each anthropic.ToolUseBlock in resp.Content:
		//   - raw := tu.JSON.Input.Raw()
		//   - if s.gate(...) blocks it, add anthropic.NewToolResultBlock(tu.ID, reason, true)
		//   - otherwise run support.Execute, call s.observe on success, and add the result
		// Then append ALL results as ONE user message: anthropic.NewUserMessage(results...)
		var results []anthropic.ContentBlockParamUnion
		for _, block := range resp.Content {
			tu, ok := block.AsAny().(anthropic.ToolUseBlock)
			if !ok {
				continue
			}
			raw := tu.JSON.Input.Raw()
			if reason := s.gate(tu.Name, raw); reason != "" {
				results = append(results, anthropic.NewToolResultBlock(tu.ID, reason, true))
				continue
			}
			result, isErr := support.Execute(tu.Name, raw)
			if !isErr {
				s.observe(tu.Name, result)
			}
			results = append(results, anthropic.NewToolResultBlock(tu.ID, result, isErr))
		}
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
	fmt.Println("iteration cap reached")
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()

	claude.Banner("Scenario 1: small refund (should succeed)")
	runAgent(ctx, client, "Hi, I'm ana@example.com. My headphones from order O-1 broke. Can I get a refund?")

	claude.Banner("Scenario 2: refund over the limit (gate blocks, agent escalates)")
	runAgent(ctx, client, "This is bo@example.com. Refund order O-2 please, the laptop arrived cracked.")

	claude.Banner("Scenario 3: refund for a different customer (gate blocks, agent escalates)")
	runAgent(ctx, client, "Hi, I'm hannah@example.com. I want to talk to a human about a refund for order O-1. I don't have the receipt, but I know it was mine.")
}
