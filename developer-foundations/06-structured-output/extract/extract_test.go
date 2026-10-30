package extract

import "testing"

func TestValidate(t *testing.T) {
	cases := []struct {
		name    string
		raw     string
		wantErr int
	}{
		{"consistent invoice passes",
			`{"line_items":[{"description":"a","quantity":2,"unit_price":5,"amount":10}],"stated_total":10,"calculated_total":10,"total_mismatch":false,"category":"travel"}`, 0},
		{"wrong arithmetic is caught",
			`{"line_items":[{"description":"a","quantity":2,"unit_price":5,"amount":10}],"stated_total":10,"calculated_total":110,"total_mismatch":false,"category":"travel"}`, 1},
		{"source discrepancy must be flagged",
			`{"line_items":[{"description":"a","quantity":2,"unit_price":5,"amount":10}],"stated_total":9,"calculated_total":10,"total_mismatch":false,"category":"travel"}`, 1},
		{"other needs detail",
			`{"line_items":[],"stated_total":null,"calculated_total":0,"total_mismatch":false,"category":"other","category_detail":null}`, 1},
		{"bad date format",
			`{"line_items":[],"calculated_total":0,"invoice_date":"03/04/2026","category":"travel"}`, 1},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, errs := Validate(tc.raw)
			if len(errs) != tc.wantErr {
				t.Fatalf("got %d errors %v, want %d", len(errs), errs, tc.wantErr)
			}
		})
	}
}
