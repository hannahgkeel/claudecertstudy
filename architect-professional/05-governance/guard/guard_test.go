package guard

import (
	"strings"
	"testing"
)

func TestRedact(t *testing.T) {
	in := "Card 4111 1111 1111 1111, SSN 123-45-6789, acct no. 004417820193, order 1234567890123, call 555-0142."
	out, found := Redact(in)
	for _, leak := range []string{"4111 1111 1111 1111", "123-45-6789", "004417820193"} {
		if strings.Contains(out, leak) {
			t.Errorf("%q not redacted: %s", leak, out)
		}
	}
	for _, keep := range []string{"••••1111", "***-**-6789", "••••0193", "order 1234567890123", "555-0142"} {
		if !strings.Contains(out, keep) {
			t.Errorf("want %q in output (last four kept, non-card numbers untouched): %s", keep, out)
		}
	}
	if len(found) != 3 {
		t.Errorf("want 3 findings, got %v", found)
	}
}

func TestDecideWire(t *testing.T) {
	cases := []struct {
		name string
		w    Wire
		want Verdict
	}{
		{"small, established payee", Wire{400, "Landlord LLC", 400, -1, "customer"}, Allow},
		{"over auto-approve", Wire{2500, "Landlord LLC", 400, -1, "customer"}, NeedsApproval},
		{"new payee over callback threshold", Wire{4800, "New Co", 0, -1, "customer"}, NeedsApproval},
		{"recent contact change", Wire{300, "Landlord LLC", 400, 3, "customer"}, NeedsApproval},
		{"over daily limit", Wire{20000, "Landlord LLC", 400, -1, "customer"}, Block},
		{"instruction found in a document", Wire{4800, "New Co", 0, -1, "document"}, Block},
	}
	for _, c := range cases {
		if got := DecideWire(c.w); got.Verdict != c.want {
			t.Errorf("%s: got %s %v, want %s", c.name, got.Verdict, got.Reasons, c.want)
		}
	}
}

func TestCheckOutput(t *testing.T) {
	if p := CheckOutput("We've opened a recall request. We can't promise the funds will return."); len(p) != 0 {
		t.Errorf("a careful reply was flagged: %v", p)
	}
	if p := CheckOutput("Don't worry, you will get your money back, guaranteed."); len(p) == 0 {
		t.Error("a promised outcome should be flagged")
	}
	if p := CheckOutput("Your card 4111111111111111 is locked."); len(p) == 0 {
		t.Error("a full card number in a reply should be flagged")
	}
}

func TestAuditRedacts(t *testing.T) {
	line := Audit("C-2201", "wire-assist@3", "request_wire", `{"note":"from card 4111111111111111"}`, Decision{Verdict: Block}, nil)
	if strings.Contains(line, "4111111111111111") {
		t.Error("audit log must not contain the card number")
	}
}
