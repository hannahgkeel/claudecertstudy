// Exercise 6: reliable structured extraction.
//
//	go run ./06-structured-output/exercise
//
// Run it first and look at the output for inv-missing-fields: does the model
// make up a date or PO number? Then work through the TODOs.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"claudecertstudy/06-structured-output/invoices"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// TODO(1): Add few-shot examples for the tricky cases:
//   - "net 30" payment terms -> due_date = invoice date + 30 days
//   - a field that isn't in the invoice -> null (not a guess, not today's date)
//   - a category that doesn't fit the list -> "other" + category_detail
//
// Short concrete examples usually beat long abstract rules.
const systemPrompt = `Extract the invoice data as JSON.`

// TODO(2): Fix the schema:
//   - invoice_date, due_date, po_number, category_detail, stated_total must be
//     NULLABLE ("type": ["string","null"]) so the model isn't forced to invent values
//   - category needs an enum with an "other" option plus a category_detail field
//   - add stated_total (what the invoice says), calculated_total (sum of
//     line items) and total_mismatch (boolean)
//   - structured outputs need "required" listing every property and
//     "additionalProperties": false on every object
var schema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"invoice_number": map[string]any{"type": "string"},
		"vendor":         map[string]any{"type": "string"},
		"invoice_date":   map[string]any{"type": []any{"string", "null"}},
		"due_date":       map[string]any{"type": []any{"string", "null"}},
		"po_number":      map[string]any{"type": []any{"string", "null"}},
		"currency":       map[string]any{"type": "string"},
		"category":       map[string]any{"type": "string"},
		"line_items": map[string]any{
			"type": "array",
			"items": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"description": map[string]any{"type": "string"},
					"quantity":    map[string]any{"type": "number"},
					"unit_price":  map[string]any{"type": "number"},
					"amount":      map[string]any{"type": "number"},
				},
				"required":             []string{"description", "quantity", "unit_price", "amount"},
				"additionalProperties": false,
			},
		},
		"total": map[string]any{"type": "number"},
	},
	"required":             []string{"invoice_number", "vendor", "invoice_date", "due_date", "po_number", "currency", "category", "line_items", "total"},
	"additionalProperties": false,
}

// TODO(3): Validate what the schema can't:
//   - every line item: quantity * unit_price == amount (within 0.01)
//   - calculated_total == sum of line item amounts
//   - total_mismatch is true exactly when stated_total != calculated_total
//   - dates match YYYY-MM-DD
//   - category "other" requires category_detail
//
// Return a list of SPECIFIC messages ("calculated_total is 1200 but items sum to 1101").
func validate(raw string) []string {
	var m map[string]any
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return []string{"not JSON: " + err.Error()}
	}
	return nil
}

func extractOnce(ctx context.Context, client anthropic.Client, prompt string) string {
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     claude.Model,
		MaxTokens: 16000,
		System:    []anthropic.TextBlockParam{{Text: systemPrompt}},
		OutputConfig: anthropic.OutputConfigParam{
			Format: anthropic.JSONOutputFormatParam{Schema: schema},
		},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(prompt))},
	})
	if err != nil {
		log.Fatal(err)
	}
	return claude.Text(resp)
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()
	for _, doc := range invoices.All {
		claude.Banner(doc.ID)
		out := extractOnce(ctx, client, "<invoice>\n"+doc.Text+"\n</invoice>")
		fmt.Println(out)

		// TODO(4): Turn this into a retry loop (max 3 attempts). On failure, send
		// a NEW request containing the invoice, the previous output and the
		// specific validation errors. If it still fails after the last attempt,
		// or total_mismatch is true, print that it goes to human review.
		// Question: why can't retrying fix a total that's wrong in the source document?
		if errs := validate(out); len(errs) > 0 {
			fmt.Println("validation errors:", errs)
		}
	}
}
