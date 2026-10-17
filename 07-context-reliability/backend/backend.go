// Package backend returns realistically bloated API responses and a long,
// stable policy document (long enough to be worth caching).
package backend

import (
	"encoding/json"
	"fmt"
	"strings"
)

// LookupOrderRaw returns what a real order API might: ~40 fields, most of
// which the agent never needs.
func LookupOrderRaw(orderID string) string {
	known := map[string]map[string]any{
		"O-5512": {"item": "ProBlend 900 blender", "total": 149.99, "status": "delivered", "delivered_on": "2026-10-02"},
		"O-5520": {"item": "Cast iron skillet set", "total": 89.50, "status": "in_transit", "delivered_on": nil},
	}
	core, ok := known[orderID]
	if !ok {
		return fmt.Sprintf(`{"error":"not_found","order_id":%q}`, orderID)
	}
	var events []map[string]any
	for i := 0; i < 18; i++ {
		events = append(events, map[string]any{
			"ts": fmt.Sprintf("2026-09-%02dT%02d:14:00Z", 20+i/3, (i*5)%24), "code": fmt.Sprintf("EVT-%03d", 100+i),
			"facility": fmt.Sprintf("FC-%d", 3+i%4), "scanner_id": fmt.Sprintf("SCN-%05d", 40000+i*17), "note": "package scanned",
		})
	}
	raw := map[string]any{
		"order_id": orderID, "customer_id": "C-778", "item": core["item"], "order_total": core["total"],
		"status": core["status"], "delivered_on": core["delivered_on"], "currency": "USD",
		"internal_sku": "ISKU-88231-B", "warehouse_bin": "A-14-03", "picker_id": "EMP-2291", "packer_id": "EMP-1180",
		"carrier": "FastShip", "carrier_service_code": "FS-GND-2", "tracking_number": "1Z999AA10123456784",
		"tracking_events":  events,
		"payment":          map[string]any{"processor": "stripe", "charge_id": "ch_3Nf9x2", "risk_score": 12, "avs": "Y", "cvc_check": "pass"},
		"tax":              map[string]any{"jurisdiction": "CA-SF", "rate": 0.08625, "amount": 11.89, "exempt": false},
		"marketing":        map[string]any{"utm_source": "newsletter", "utm_campaign": "fall-kitchen", "ab_bucket": "B"},
		"fulfillment_meta": map[string]any{"sla_tier": "standard", "box_type": "M2", "weight_g": 3120, "dims_cm": []int{40, 30, 25}},
		"audit":            map[string]any{"created_by": "web", "updated_at": "2026-10-02T18:22:10Z", "version": 14},
	}
	b, _ := json.Marshal(raw)
	return string(b)
}

// PolicyDocument is long and never changes between requests, which makes it
// the ideal thing to cache. (The product care entries are generated filler to
// push it past the minimum cacheable length.)
func PolicyDocument() string {
	var sb strings.Builder
	sb.WriteString(`# Customer support policy

## Refunds
- Damaged on arrival: full refund or replacement, customer's choice, within 30 days of delivery. Photo required.
- Change of mind: refund within 14 days if unused, minus return shipping.
- Refunds over $500 need a human agent's approval.

## Late deliveries
- An order is late 3 business days after its estimated delivery date. Before that, share tracking and reassure the customer.
- Late orders: offer a reship or a refund. Shipping fee refunded automatically.

## Escalation to a human. Escalate when ANY of these is true:
1. The customer explicitly asks for a human, a manager or a real person. Escalate immediately; don't try to solve it first.
2. The request isn't covered by this policy (a policy gap), e.g. compensation for consequential damages.
3. You have made no progress after two attempts at the same problem.
Do NOT escalate only because the customer sounds frustrated. Acknowledge it and keep solving the problem.

## Product care guide
`)
	products := []string{"blender", "skillet", "kettle", "toaster", "knife set", "stand mixer", "air fryer", "coffee grinder",
		"food processor", "rice cooker", "slow cooker", "dutch oven", "wok", "cutting board", "espresso machine", "juicer"}
	issues := []string{"won't power on", "makes a grinding noise", "has a cracked part", "smells of burning", "is missing a component",
		"arrived with a dented casing", "shows an error light"}
	for _, p := range products {
		for _, is := range issues {
			fmt.Fprintf(&sb, "- %s %s: confirm the order number, ask for a photo, and check delivery date. If within 30 days and damaged on arrival, offer replacement or refund. Otherwise refer to the manufacturer warranty (1 year for %s).\n", p, is, p)
		}
	}
	return sb.String()
}
