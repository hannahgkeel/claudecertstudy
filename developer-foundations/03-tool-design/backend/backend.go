// Package backend is a fake warehouse system that fails in realistic ways.
// Your tool layer decides how those failures look to Claude.
package backend

import (
	"errors"
	"regexp"
	"strings"
)

type Product struct {
	SKU   string  `json:"sku"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

var catalog = []Product{
	{"SKU-1001", "Trail running shoes", 129.00},
	{"SKU-1002", "Waterproof hiking boots", 189.00},
	{"SKU-2001", "Insulated water bottle", 34.00},
	{"SKU-3001", "Ultralight tent (2 person)", 349.00},
}

var stock = map[string]map[string]int{
	"SKU-1001": {"US-EAST": 14, "US-WEST": 0, "EU": 6},
	"SKU-1002": {"US-EAST": 3, "US-WEST": 9, "EU": 0},
	"SKU-2001": {"US-EAST": 120, "US-WEST": 80, "EU": 44},
	"SKU-3001": {"US-EAST": 0, "US-WEST": 2, "EU": 1},
}

// Sentinel errors. Map them to categories Claude can act on.
var (
	ErrTimeout       = errors.New("upstream inventory service timed out")
	ErrBadSKU        = errors.New("malformed SKU")
	ErrUnknownSKU    = errors.New("no such SKU")
	ErrForbidden     = errors.New("caller lacks access to this warehouse")
	ErrUnknownWHouse = errors.New("unknown warehouse")
)

var skuRe = regexp.MustCompile(`^SKU-\d{4}$`)

// SearchProducts does a case-insensitive name match. Zero results is NOT an error.
func SearchProducts(query string) []Product {
	var out []Product
	q := strings.ToLower(query)
	for _, p := range catalog {
		for _, w := range strings.Fields(q) {
			if strings.Contains(strings.ToLower(p.Name), w) {
				out = append(out, p)
				break
			}
		}
	}
	return out
}

var checkCalls = map[string]int{}

// CheckStock returns units per warehouse. It times out on the first call for
// SKU-3001 to simulate a transient failure, and the EU warehouse needs a
// permission the caller doesn't have.
func CheckStock(sku, warehouse string) (map[string]int, error) {
	if !skuRe.MatchString(sku) {
		return nil, ErrBadSKU
	}
	levels, ok := stock[sku]
	if !ok {
		return nil, ErrUnknownSKU
	}
	checkCalls[sku]++
	if sku == "SKU-3001" && checkCalls[sku] == 1 {
		return nil, ErrTimeout
	}
	if warehouse == "" {
		visible := map[string]int{}
		for w, n := range levels {
			if w != "EU" {
				visible[w] = n
			}
		}
		return visible, nil
	}
	if warehouse == "EU" {
		return nil, ErrForbidden
	}
	n, ok := levels[warehouse]
	if !ok {
		return nil, ErrUnknownWHouse
	}
	return map[string]int{warehouse: n}, nil
}
