// Package support is a fake customer-support backend plus the tool
// definitions Claude sees. Both the exercise and the solution import it, so
// you only have to write the agent loop and the policy gate.
package support

import (
	"encoding/json"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
)

type Customer struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Verified bool   `json:"verified"`
}

type Order struct {
	ID         string  `json:"id"`
	CustomerID string  `json:"customer_id"`
	Item       string  `json:"item"`
	Total      float64 `json:"total"`
	Status     string  `json:"status"`
}

var customers = map[string]Customer{
	"ana@example.com": {ID: "C-100", Name: "Ana Ruiz", Email: "ana@example.com", Verified: true},
	"bo@example.com":  {ID: "C-200", Name: "Bo Chen", Email: "bo@example.com", Verified: true},
}

var orders = map[string]Order{
	"O-1": {ID: "O-1", CustomerID: "C-100", Item: "Headphones", Total: 89.99, Status: "delivered"},
	"O-2": {ID: "O-2", CustomerID: "C-200", Item: "Laptop", Total: 1299.00, Status: "delivered"},
}

// Tools returns the tool definitions. Read the descriptions: each one says
// what the tool does, what it needs, and when to use it instead of the others.
func Tools() []anthropic.ToolUnionParam {
	defs := []anthropic.ToolParam{
		{
			Name: "get_customer",
			Description: anthropic.String("Look up a customer by email address. Returns their customer ID and " +
				"verification status. Call this first in every conversation: other tools need the customer ID it returns."),
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"email": map[string]any{"type": "string", "description": "Customer email address"},
				},
				Required: []string{"email"},
			},
		},
		{
			Name: "lookup_order",
			Description: anthropic.String("Fetch one order by order ID (format O-<number>). Returns item, total " +
				"in USD, status, and the owning customer ID. Use this to confirm an order belongs to the customer before acting on it."),
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"order_id": map[string]any{"type": "string", "description": "Order ID, e.g. O-1"},
				},
				Required: []string{"order_id"},
			},
		},
		{
			Name: "process_refund",
			Description: anthropic.String("Refund an order in full. Requires the customer ID from get_customer and " +
				"an order that belongs to that customer. Refunds above the automatic limit are rejected and must be escalated."),
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"customer_id": map[string]any{"type": "string"},
					"order_id":    map[string]any{"type": "string"},
					"reason":      map[string]any{"type": "string"},
				},
				Required: []string{"customer_id", "order_id", "reason"},
			},
		},
		{
			Name: "escalate_to_human",
			Description: anthropic.String("Hand the case to a human agent. Use when the customer asks for a human, " +
				"when policy does not cover the request, or when a refund is rejected for exceeding the limit. " +
				"Include a summary a human can act on without re-reading the conversation."),
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"customer_id": map[string]any{"type": "string"},
					"summary":     map[string]any{"type": "string", "description": "What the customer wants, what was tried, and why it is escalated"},
				},
				Required: []string{"summary"},
			},
		},
	}
	out := make([]anthropic.ToolUnionParam, len(defs))
	for i := range defs {
		out[i] = anthropic.ToolUnionParam{OfTool: &defs[i]}
	}
	return out
}

// Execute runs a tool against the fake backend. It returns the result text
// and whether it is an error. It does NOT enforce business policy; that is
// your job in the exercise.
func Execute(name string, rawInput string) (string, bool) {
	var in map[string]string
	if err := json.Unmarshal([]byte(rawInput), &in); err != nil {
		return "invalid JSON input: " + err.Error(), true
	}
	switch name {
	case "get_customer":
		c, ok := customers[in["email"]]
		if !ok {
			return fmt.Sprintf(`{"found": false, "email": %q}`, in["email"]), false
		}
		return toJSON(c), false
	case "lookup_order":
		o, ok := orders[in["order_id"]]
		if !ok {
			return fmt.Sprintf(`{"found": false, "order_id": %q}`, in["order_id"]), false
		}
		return toJSON(o), false
	case "process_refund":
		o := orders[in["order_id"]]
		return fmt.Sprintf(`{"refunded": true, "order_id": %q, "amount": %.2f}`, o.ID, o.Total), false
	case "escalate_to_human":
		return `{"escalated": true, "ticket": "T-5521", "eta": "within 4 business hours"}`, false
	}
	return "unknown tool " + name, true
}

// LookupOrder is exposed so a policy gate can check ownership and amount.
func LookupOrder(orderID string) (Order, bool) {
	o, ok := orders[orderID]
	return o, ok
}

func toJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}
