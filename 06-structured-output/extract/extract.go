// Package extract is the reference schema, prompt and validator for invoice
// extraction. The solution and the batch example both use it.
package extract

import (
	"encoding/json"
	"fmt"
	"math"
	"regexp"
)

// SystemPrompt shows the model how to handle the tricky cases using short
// examples, rather than long abstract rules.
const SystemPrompt = `You extract structured data from invoices for an accounts-payable system.

Rules:
- Copy values exactly as written. If a field is not in the invoice, return null. Never guess.
- Amounts are numbers without currency symbols or thousands separators.
- calculated_total is the sum of line item amounts that YOU compute. stated_total is what the invoice says.

Examples of the tricky cases:

<example>
Invoice text: "Date: 2026-05-01 ... Payment terms: net 15"
due_date: "2026-05-16"   (invoice date plus the net days)
</example>

<example>
Invoice text: "Monthly retainer ... TOTAL 500" with no date anywhere
invoice_date: null, due_date: null   (missing, so null; not today's date)
</example>

<example>
Invoice text: "Team offsite catering"
category: "other", category_detail: "event catering"
</example>`

// Schema: nullable fields let the model say "not present" instead of
// inventing a value; the enum plus "other" + detail handles categories you
// didn't anticipate without losing information.
var Schema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"invoice_number": map[string]any{"type": "string"},
		"vendor":         map[string]any{"type": "string"},
		"invoice_date":   map[string]any{"type": []string{"string", "null"}, "description": "YYYY-MM-DD"},
		"due_date":       map[string]any{"type": []string{"string", "null"}, "description": "YYYY-MM-DD"},
		"po_number":      map[string]any{"type": []string{"string", "null"}},
		"currency":       map[string]any{"type": "string", "enum": []string{"USD", "EUR", "GBP", "CAD", "OTHER"}},
		"category": map[string]any{
			"type": "string",
			"enum": []string{"design_services", "cloud_hosting", "office_supplies", "travel", "other"},
		},
		"category_detail": map[string]any{"type": []string{"string", "null"}, "description": "Required when category is other"},
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
		"stated_total":     map[string]any{"type": []string{"number", "null"}},
		"calculated_total": map[string]any{"type": "number"},
		"total_mismatch":   map[string]any{"type": "boolean", "description": "true when stated_total differs from calculated_total"},
	},
	"required": []string{"invoice_number", "vendor", "invoice_date", "due_date", "po_number", "currency",
		"category", "category_detail", "line_items", "stated_total", "calculated_total", "total_mismatch"},
	"additionalProperties": false,
}

type LineItem struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Amount      float64 `json:"amount"`
}

type Invoice struct {
	InvoiceNumber   string     `json:"invoice_number"`
	Vendor          string     `json:"vendor"`
	InvoiceDate     *string    `json:"invoice_date"`
	DueDate         *string    `json:"due_date"`
	PONumber        *string    `json:"po_number"`
	Currency        string     `json:"currency"`
	Category        string     `json:"category"`
	CategoryDetail  *string    `json:"category_detail"`
	LineItems       []LineItem `json:"line_items"`
	StatedTotal     *float64   `json:"stated_total"`
	CalculatedTotal float64    `json:"calculated_total"`
	TotalMismatch   bool       `json:"total_mismatch"`
}

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func near(a, b float64) bool { return math.Abs(a-b) < 0.01 }

// Validate checks what a JSON schema CAN'T: arithmetic, cross-field rules,
// formats. The schema guarantees the shape; only code can check the meaning.
func Validate(raw string) (Invoice, []string) {
	var inv Invoice
	if err := json.Unmarshal([]byte(raw), &inv); err != nil {
		return inv, []string{"response is not valid JSON: " + err.Error()}
	}
	var errs []string
	sum := 0.0
	for i, li := range inv.LineItems {
		if !near(li.Quantity*li.UnitPrice, li.Amount) {
			errs = append(errs, fmt.Sprintf("line_items[%d]: quantity %.2f x unit_price %.2f = %.2f, but amount is %.2f",
				i, li.Quantity, li.UnitPrice, li.Quantity*li.UnitPrice, li.Amount))
		}
		sum += li.Amount
	}
	if !near(sum, inv.CalculatedTotal) {
		errs = append(errs, fmt.Sprintf("calculated_total is %.2f but line item amounts sum to %.2f", inv.CalculatedTotal, sum))
	}
	if inv.StatedTotal != nil {
		mismatch := !near(*inv.StatedTotal, sum)
		if mismatch != inv.TotalMismatch {
			errs = append(errs, fmt.Sprintf("total_mismatch should be %v (stated %.2f vs line items %.2f)", mismatch, *inv.StatedTotal, sum))
		}
	}
	for name, d := range map[string]*string{"invoice_date": inv.InvoiceDate, "due_date": inv.DueDate} {
		if d != nil && !dateRe.MatchString(*d) {
			errs = append(errs, fmt.Sprintf("%s %q is not YYYY-MM-DD", name, *d))
		}
	}
	if inv.Category == "other" && (inv.CategoryDetail == nil || *inv.CategoryDetail == "") {
		errs = append(errs, "category is other, so category_detail must describe it")
	}
	return inv, errs
}
