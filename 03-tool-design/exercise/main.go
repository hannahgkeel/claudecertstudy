// Exercise 3: fix badly designed tools and error handling.
//
//	go run ./03-tool-design/exercise
//
// Run it BEFORE changing anything and note the eval score and how the agent
// copes with errors. Then fix the TODOs and run it again.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"claudecertstudy/03-tool-design/backend"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// TODO(1): These tools are badly designed:
//   - vague names (which one gives stock levels?)
//   - one-line descriptions with no input format, output shape, or
//     "use this instead of the other one when..." guidance
//   - loose schemas (no pattern/enum, no additionalProperties:false)
//
// Rename them to search_products / check_stock (update execute and the
// eval's expected names too), write descriptions that tell them apart, and
// tighten the schemas. Consider Strict: anthropic.Bool(true).
var tools = []anthropic.ToolParam{
	{
		Name:        "search_products",
		Description: anthropic.String("Searches for products. Returns a list of matching products with their SKUs, prices, and names. Use it when you don't know the SKU of the product you want to check stock for. It does not return stock levels: pass the SKU from a match to check_stock for that. count 0 means no products matched; that is not an error."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties:  map[string]any{"query": map[string]any{"type": "string"}},
			Required:    []string{"query"},
			ExtraFields: map[string]any{"additionalProperties": false},
		},
		Strict: anthropic.Bool(true),
	},
	{
		Name:        "check_stock",
		Description: anthropic.String("Checks the stock level for a product. If a warehouse is not specified, checks all warehouses we have access to. Returns units per warehouse. If you don't know the SKU, use search_products first."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties: map[string]any{
				"sku": map[string]any{
					"type":        "string",
					"pattern":     "^SKU-\\d{4}$",
					"description": "Product SKU (e.g., SKU-1002)",
				},
				"warehouse": map[string]any{
					"type": "string",
					"enum": []string{"US-EAST", "US-WEST", "EU"},
				},
			},
			Required:    []string{"sku"},
			ExtraFields: map[string]any{"additionalProperties": false},
		},
		Strict: anthropic.Bool(true),
	},
}

// TODO(2): Replace this with a structured error. Map each backend sentinel
// error (backend.ErrTimeout, ErrBadSKU, ErrUnknownSKU, ErrForbidden,
// ErrUnknownWHouse) to JSON like
//
//	{"errorCategory": "transient|validation|permission|not_found",
//	 "isRetryable": true/false, "message": "...", "hint": "what to do next"}
//
// Use errors.Is to match.
func describeError(err error) string {
	if errors.Is(err, backend.ErrTimeout) {
		return `{"errorCategory": "transient", "isRetryable": true, "message": "Request timed out.", "hint": "Try again once now since timeouts may be temporary."}`
	}
	if errors.Is(err, backend.ErrBadSKU) {
		return `{"errorCategory": "validation", "isRetryable": false, "message": "Invalid SKU.", "hint": "Please check the SKU and try again. The SKU should be in the format 'SKU-XXXX' where X is a digit."}`
	}
	if errors.Is(err, backend.ErrUnknownSKU) {
		return `{"errorCategory": "not_found", "isRetryable": false, "message": "SKU not found.", "hint": "Please check the SKU and try again."}`
	}
	if errors.Is(err, backend.ErrForbidden) {
		return `{"errorCategory": "permission", "isRetryable": false, "message": "Access denied.", "hint": "You are not authorized to perform this action. Don't retry; the warehouse can not be accessed."}`
	}
	if errors.Is(err, backend.ErrUnknownWHouse) {
		return `{"errorCategory": "not_found", "isRetryable": false, "message": "Warehouse not found.", "hint": "Please check the warehouse location and try again. The valid options are 'US-EAST', 'US-WEST', and 'EU'."}`
	}
	return `{"errorCategory": "unknown", "isRetryable": false, "message": "An unknown error occurred.", "hint": "Please contact support."}`
}

func execute(name, raw string) (string, bool) {
	var in struct {
		Query     string `json:"query"`
		SKU       string `json:"sku"`
		Warehouse string `json:"warehouse"`
	}
	_ = json.Unmarshal([]byte(raw), &in)
	switch name {
	case "search_products":
		res := backend.SearchProducts(in.Query)
		// TODO(3): Zero matches is reported here as an error. Why is that
		// wrong? Return a normal result instead, e.g. {"matches": [], "count": 0}.
		if res == nil {
			res = []backend.Product{}
		}
		b, _ := json.Marshal(res)
		return string(b), false
	case "check_stock":
		levels, err := backend.CheckStock(in.SKU, in.Warehouse)
		if err != nil {
			// TODO(4): The error is reported as a success (isError=false).
			// Fix it so Claude knows the call failed.
			return describeError(err), true
		}
		b, _ := json.Marshal(levels)
		return string(b), false
	}
	return "unknown tool", true
}

func toolUnion() []anthropic.ToolUnionParam {
	out := make([]anthropic.ToolUnionParam, len(tools))
	for i := range tools {
		out[i] = anthropic.ToolUnionParam{OfTool: &tools[i]}
	}
	return out
}

func selectionEval(ctx context.Context, client anthropic.Client) {
	// TODO(5): After renaming, update these expected names. Then add 3 cases
	// of your own, including one that's ambiguous on purpose.
	cases := []struct{ query, want string }{
		{"Do you sell anything for carrying water?", "search_products"},
		{"How many SKU-1002 are in US-WEST?", "check_stock"},
		{"Is the tent available to ship from the west coast?", "search_products"},
		{"What do the hiking boots cost?", "search_products"},
		{"Any SKU-2001 left?", "check_stock"},
		{"What's the status of SKU-3001?", "check_stock"},
		{"Do you have the red hiking boots in size large?", "search_products"},
		{"Can you tell me if SKU-4001 is in stock at the EU warehouse?", "check_stock"},
	}
	pass := 0
	for _, c := range cases {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     claude.Model,
			MaxTokens: 4000,
			Tools:     toolUnion(),
			Messages:  []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(c.query))},
		})
		if err != nil {
			log.Fatal(err)
		}
		got := "(no tool)"
		for _, b := range resp.Content {
			if tu, ok := b.AsAny().(anthropic.ToolUseBlock); ok {
				got = tu.Name
				break
			}
		}
		mark := "FAIL"
		if got == c.want {
			mark, pass = "ok  ", pass+1
		}
		fmt.Printf("%s %-50q want=%-16s got=%s\n", mark, c.query, c.want, got)
	}
	fmt.Printf("%d/%d correct\n", pass, len(cases))
}

func agent(ctx context.Context, client anthropic.Client, prompt string) {
	messages := []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(prompt))}
	for i := 0; i < 10; i++ {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     claude.Model,
			MaxTokens: 16000,
			Tools:     toolUnion(),
			Messages:  messages,
		})
		if err != nil {
			log.Fatal(err)
		}
		messages = append(messages, resp.ToParam())
		if resp.StopReason != anthropic.StopReasonToolUse {
			fmt.Println("AGENT:", claude.Text(resp))
			return
		}
		var results []anthropic.ContentBlockParamUnion
		for _, b := range resp.Content {
			if tu, ok := b.AsAny().(anthropic.ToolUseBlock); ok {
				out, isErr := execute(tu.Name, tu.JSON.Input.Raw())
				fmt.Printf("  -> %s %s\n     <- (error=%v) %s\n", tu.Name, tu.JSON.Input.Raw(), isErr, out)
				results = append(results, anthropic.NewToolResultBlock(tu.ID, out, isErr))
			}
		}
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()

	claude.Banner("Part A: tool-selection eval")
	selectionEval(ctx, client)

	claude.Banner("Part B: recovering from transient, permission and validation errors")
	agent(ctx, client, "Is the ultralight tent in stock? Check every warehouse including EU.")
}
