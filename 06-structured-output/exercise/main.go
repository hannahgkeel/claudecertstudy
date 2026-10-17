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
	"math"
	"time"

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
const systemPrompt = `Extract the invoice data as JSON.
Rules:
- If a field is not present in the invoice, return null.
- Never guess, and never use today's date for missing dates.
- If the category doesn't fit the list (design_services, cloud_hosting, office_supplies, travel), return "other" and fill in category_detail.

<examples>
<example>
<invoice>Inv 301 | 2026-05-10 | Terms: net 30
Acme Print Co. -> Harbor Foods
500 x Flyers @ 0.40 = 200.00
Total: USD 200.00</invoice>
<notes>"net 30" means due_date = invoice_date + 30 days.</notes>
<output>{"invoice_date": "2026-05-10", "due_date": "2026-06-09", "po_number": null, ...}</output>
</example>

<example>
<invoice>Inv 302
Acme Print Co. -> Harbor Foods
500 x Flyers @ 0.40 = 200.00
Total: USD 200.00</invoice>
<output>{"invoice_date": null, "due_date": null, "po_number": null, ...}</output>
</example>

<example>
<invoice>Inv 304 | 2026-05-10 | Terms: net 30
Acme Print Co. -> Harbor Foods
category: printing
500 x Flyers @ 0.40 = 200.00
Total: USD 200.00</invoice>
<notes>Category "printing" doesn't fit the list, so use "other" and fill in category_detail.</notes>
<output>{"category": "other", "category_detail": "printing", ...}</output>
</example>
</examples>
`

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
		"invoice_number":   map[string]any{"type": "string"},
		"vendor":           map[string]any{"type": "string"},
		"invoice_date":     map[string]any{"type": []any{"string", "null"}},
		"due_date":         map[string]any{"type": []any{"string", "null"}},
		"po_number":        map[string]any{"type": []any{"string", "null"}},
		"currency":         map[string]any{"type": "string"},
		"category":         map[string]any{"type": "string", "enum": []any{"design_services", "cloud_hosting", "office_supplies", "travel", "other"}},
		"category_detail":  map[string]any{"type": []any{"string", "null"}},
		"stated_total":     map[string]any{"type": []any{"number", "null"}},
		"calculated_total": map[string]any{"type": "number"},
		"total_mismatch":   map[string]any{"type": "boolean"},
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
	},
	"required":             []string{"invoice_number", "vendor", "invoice_date", "due_date", "po_number", "currency", "category", "line_items", "stated_total", "calculated_total", "total_mismatch", "category_detail"},
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
	var inv Invoice
	if err := json.Unmarshal([]byte(raw), &inv); err != nil {
		return []string{"not JSON: " + err.Error()}
	}
	var errs []string
	sum := 0.0
	for i, li := range inv.LineItems {
		if math.Abs(li.Quantity*li.UnitPrice-li.Amount) > 0.01 {
			errs = append(errs, fmt.Sprintf("line_items[%d] %q: %g x %.2f = %.2f, but amount is %.2f",
				i, li.Description, li.Quantity, li.UnitPrice, li.Quantity*li.UnitPrice, li.Amount))
		}
		sum += li.Amount
	}
	if math.Abs(inv.CalculatedTotal-sum) > 0.01 {
		errs = append(errs, fmt.Sprintf("calculated_total is %.2f but items sum to %.2f", inv.CalculatedTotal, sum))
	}
	wantMismatch := inv.StatedTotal != nil && math.Abs(*inv.StatedTotal-inv.CalculatedTotal) > 0.01
	if inv.TotalMismatch != wantMismatch {
		errs = append(errs, fmt.Sprintf("total_mismatch is %t but should be %t (stated_total %v, calculated_total %.2f)",
			inv.TotalMismatch, wantMismatch, fmtPtr(inv.StatedTotal), inv.CalculatedTotal))
	}
	dates := map[string]*string{"invoice_date": inv.InvoiceDate, "due_date": inv.DueDate}
	for field, d := range dates {
		if d == nil {
			continue // null is allowed
		}
		if _, err := time.Parse("2006-01-02", *d); err != nil {
			errs = append(errs, fmt.Sprintf("%s is %q, want YYYY-MM-DD", field, *d))
		}
	}
	if inv.Category == "other" && (inv.CategoryDetail == nil || *inv.CategoryDetail == "") {
		errs = append(errs, "category is 'other' but category_detail is empty")
	}
	return errs
}

func fmtPtr(f *float64) string {
	if f == nil {
		return "null"
	}
	return fmt.Sprintf("%.2f", *f)
}

type LineItem struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Amount      float64 `json:"amount"`
}

type Invoice struct {
	InvoiceDate     *string    `json:"invoice_date"`
	DueDate         *string    `json:"due_date"`
	Category        string     `json:"category"`
	CategoryDetail  *string    `json:"category_detail"`
	StatedTotal     *float64   `json:"stated_total"`
	CalculatedTotal float64    `json:"calculated_total"`
	TotalMismatch   bool       `json:"total_mismatch"`
	LineItems       []LineItem `json:"line_items"`
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
		retries := 0
		for {
			errs := validate(out)
			if len(errs) == 0 {
				break
			}
			retries++
			if retries >= 3 {
				fmt.Println("validation errors:", errs)
				fmt.Println("→ human review: still failing after 3 attempts")
				break
			}
			fmt.Println("validation errors:", errs)
			fmt.Printf("retrying (%d/3)...\n", retries)
			out = extractOnce(ctx, client, "<invoice>\n"+doc.Text+"\n</invoice>\n<previous_output>\n"+out+"\n</previous_output>\n<validation_errors>\n"+fmt.Sprintf("%v", errs)+"\n</validation_errors>")
			fmt.Println(out)
		}
		var inv Invoice
		if json.Unmarshal([]byte(out), &inv) == nil && inv.TotalMismatch {
			fmt.Println("→ human review: stated total doesn't match the line items")
		}
	}
}
