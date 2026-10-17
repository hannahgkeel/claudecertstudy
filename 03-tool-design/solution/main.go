// Solution: well-designed tools plus structured, actionable errors.
//
//	go run ./03-tool-design/solution
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

// Good descriptions say what the tool does, what goes in, what comes out,
// and when to use it INSTEAD of the other tool. Names are specific.
var tools = []anthropic.ToolParam{
	{
		Name: "search_products",
		Description: anthropic.String("Search the product catalog by name or description words. Returns a list of " +
			"{sku, name, price}. Use this when the user describes a product in words, or asks about price, and you " +
			"don't have its SKU yet. Does NOT return stock levels; use check_stock with the SKU for that. " +
			"An empty list means no product matched, which is not an error."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties: map[string]any{
				"query": map[string]any{"type": "string", "description": "Words describing the product, e.g. 'hiking boots'"},
			},
			Required:    []string{"query"},
			ExtraFields: map[string]any{"additionalProperties": false},
		},
		Strict: anthropic.Bool(true),
	},
	{
		Name: "check_stock",
		Description: anthropic.String("Get units in stock for ONE product by exact SKU (format SKU-#### like SKU-1001). " +
			"Optionally limit to one warehouse: US-EAST, US-WEST or EU. Omit warehouse to get every warehouse you " +
			"have access to. Use search_products first if you only have a product name."),
		InputSchema: anthropic.ToolInputSchemaParam{
			Properties: map[string]any{
				"sku":       map[string]any{"type": "string", "pattern": "^SKU-\\d{4}$"},
				"warehouse": map[string]any{"type": "string", "enum": []string{"US-EAST", "US-WEST", "EU", ""}, "description": "Empty string for all accessible warehouses"},
			},
			Required:    []string{"sku", "warehouse"},
			ExtraFields: map[string]any{"additionalProperties": false},
		},
		Strict: anthropic.Bool(true),
	},
}

// toolError is the error shape every tool returns. The category and the
// retryable flag tell Claude whether to retry, fix its input, or stop and
// tell the user. A bare "Error" string tells it none of that.
type toolError struct {
	Category  string `json:"errorCategory"` // transient | validation | permission | not_found
	Retryable bool   `json:"isRetryable"`
	Message   string `json:"message"`
	Hint      string `json:"hint,omitempty"`
}

func classify(err error) toolError {
	switch {
	case errors.Is(err, backend.ErrTimeout):
		return toolError{"transient", true, err.Error(), "Retry the same call once."}
	case errors.Is(err, backend.ErrBadSKU):
		return toolError{"validation", false, err.Error(), "SKUs look like SKU-1001. Use search_products to find the right one."}
	case errors.Is(err, backend.ErrUnknownSKU):
		return toolError{"not_found", false, err.Error(), "Check the SKU with search_products."}
	case errors.Is(err, backend.ErrForbidden):
		return toolError{"permission", false, err.Error(), "Do not retry. Tell the user this warehouse can't be checked from here."}
	case errors.Is(err, backend.ErrUnknownWHouse):
		return toolError{"validation", false, err.Error(), "Valid warehouses: US-EAST, US-WEST, EU."}
	}
	return toolError{"internal", false, err.Error(), ""}
}

func execute(name, raw string) (string, bool) {
	var in struct {
		Query     string `json:"query"`
		SKU       string `json:"sku"`
		Warehouse string `json:"warehouse"`
	}
	if err := json.Unmarshal([]byte(raw), &in); err != nil {
		return mustJSON(toolError{"validation", false, "input was not valid JSON", ""}), true
	}
	switch name {
	case "search_products":
		res := backend.SearchProducts(in.Query)
		// Success with zero matches is different from a failure.
		return mustJSON(map[string]any{"matches": res, "count": len(res)}), false
	case "check_stock":
		levels, err := backend.CheckStock(in.SKU, in.Warehouse)
		if err != nil {
			return mustJSON(classify(err)), true
		}
		return mustJSON(map[string]any{"sku": in.SKU, "units": levels}), false
	}
	return mustJSON(toolError{"validation", false, "unknown tool " + name, ""}), true
}

func toolUnion() []anthropic.ToolUnionParam {
	out := make([]anthropic.ToolUnionParam, len(tools))
	for i := range tools {
		out[i] = anthropic.ToolUnionParam{OfTool: &tools[i]}
	}
	return out
}

// selectionEval checks which tool Claude picks FIRST for each query. This is
// how you test descriptions: a cheap, single-turn check per case.
func selectionEval(ctx context.Context, client anthropic.Client) {
	cases := []struct{ query, want string }{
		{"Do you sell anything for carrying water?", "search_products"},
		{"How many SKU-1002 are in US-WEST?", "check_stock"},
		{"Is the tent available to ship from the west coast?", "search_products"},
		{"What do the hiking boots cost?", "search_products"},
		{"Any SKU-2001 left?", "check_stock"},
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

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()

	claude.Banner("Part A: tool-selection eval")
	selectionEval(ctx, client)

	claude.Banner("Part B: recovering from transient, permission and validation errors")
	agent(ctx, client, "Is the ultralight tent in stock? Check every warehouse including EU.")
}
