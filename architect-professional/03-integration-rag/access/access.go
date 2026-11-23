// Package access models how an assistant's tools are granted, and audits a
// grant for capability bloat and authorization gaps.
package access

import (
	"fmt"
	"slices"
	"sort"
)

type Tool struct {
	Name         string
	Kind         string // read, write or admin
	Irreversible bool   // money moved, data deleted, account closed
	UserData     bool   // touches one customer's data, so it must run as that customer's agent
}

var Catalog = map[string]Tool{
	"search_policies":      {"search_policies", "read", false, false},
	"get_account_summary":  {"get_account_summary", "read", false, true},
	"lookup_transactions":  {"lookup_transactions", "read", false, true},
	"refund_fee":           {"refund_fee", "write", false, true},
	"update_contact_info":  {"update_contact_info", "write", false, true},
	"send_wire":            {"send_wire", "write", true, true},
	"close_account":        {"close_account", "admin", true, true},
	"export_customer_list": {"export_customer_list", "admin", false, false},
}

// RoleNeeds is what each role's job actually requires, agreed with the
// business owner. It's the baseline a grant is audited against.
var RoleNeeds = map[string][]string{
	"contact_centre_assistant": {"search_policies", "get_account_summary", "lookup_transactions", "refund_fee"},
	"policy_qa":                {"search_policies"},
}

// Grant is the configuration actually deployed for an assistant.
type Grant struct {
	Role     string
	Tools    []string
	Identity string   // "end_user" (delegated token for the signed-in user) or "service_account"
	Approval []string // tools that pause for a human before running
}

type Finding struct {
	Severity string // high, medium, low
	Tool     string
	Issue    string
}

// Audit compares a grant with the role's needs and 30 days of usage.
func Audit(g Grant, callsLast30d map[string]int) []Finding {
	var out []Finding
	need := RoleNeeds[g.Role]
	for _, name := range g.Tools {
		t, ok := Catalog[name]
		if !ok {
			out = append(out, Finding{"medium", name, "not in the tool catalog: unknown owner and behaviour"})
			continue
		}
		if !slices.Contains(need, name) {
			sev := "medium"
			if t.Irreversible || t.Kind == "admin" {
				sev = "high"
			}
			out = append(out, Finding{sev, name, fmt.Sprintf("not needed by %s: remove it (capability bloat)", g.Role)})
		} else if callsLast30d[name] == 0 {
			out = append(out, Finding{"low", name, "granted and needed on paper, but unused for 30 days: confirm with the owner"})
		}
		if t.Irreversible && !slices.Contains(g.Approval, name) {
			out = append(out, Finding{"high", name, "irreversible action with no human approval step"})
		}
		if t.UserData && g.Identity != "end_user" {
			out = append(out, Finding{"high", name, "runs as a shared service account: any user's prompt can reach any customer's data. Pass the signed-in user's delegated token and authorize in the tool server"})
		}
	}
	rank := map[string]int{"high": 0, "medium": 1, "low": 2}
	sort.SliceStable(out, func(i, j int) bool { return rank[out[i].Severity] < rank[out[j].Severity] })
	return out
}
