package access

import "testing"

func TestAuditFindsBloatAndAuthGaps(t *testing.T) {
	g := Grant{
		Role:     "contact_centre_assistant",
		Tools:    []string{"search_policies", "get_account_summary", "send_wire", "export_customer_list"},
		Identity: "service_account",
	}
	got := Audit(g, map[string]int{"search_policies": 900, "get_account_summary": 400})
	want := map[string]bool{"send_wire": false, "export_customer_list": false}
	for _, f := range got {
		if _, ok := want[f.Tool]; ok && f.Severity == "high" {
			want[f.Tool] = true
		}
	}
	for tool, found := range want {
		if !found {
			t.Errorf("expected a high-severity finding for %s", tool)
		}
	}
	if got[0].Severity != "high" {
		t.Error("findings should be sorted most severe first")
	}
}

func TestLeastPrivilegeGrantIsClean(t *testing.T) {
	g := Grant{Role: "policy_qa", Tools: []string{"search_policies"}, Identity: "end_user"}
	if f := Audit(g, map[string]int{"search_policies": 50}); len(f) != 0 {
		t.Errorf("want no findings, got %+v", f)
	}
}
