package disputes

import "testing"

func TestCheck(t *testing.T) {
	cases := []struct {
		txn         string
		fraud       bool
		eligible    bool
		provisional bool
	}{
		{"T-8812", false, false, false}, // May hotel charge: outside the 60-day window
		{"T-9132", false, true, true},   // duplicate subscription charge
		{"T-9206", true, true, true},    // $1,249 is under the provisional-credit limit
	}
	for _, c := range cases {
		txn, ok := FindTransaction(c.txn)
		if !ok {
			t.Fatalf("%s: not found", c.txn)
		}
		got := Check(txn, c.fraud)
		if got.Eligible != c.eligible || got.ProvisionalCredit != c.provisional {
			t.Errorf("%s: got eligible=%v provisional=%v (%s), want %v/%v",
				c.txn, got.Eligible, got.ProvisionalCredit, got.Reason, c.eligible, c.provisional)
		}
		if got.RequiresCardReissue != c.fraud {
			t.Errorf("%s: card reissue should follow the fraud flag", c.txn)
		}
	}
}

func TestCheckOverLimit(t *testing.T) {
	big := Transaction{ID: "T-X", Date: "2026-10-18", Merchant: "JEWELLER", Amount: 3200, Card: "4471"}
	got := Check(big, true)
	if !got.Eligible || got.ProvisionalCredit {
		t.Errorf("$3,200 claim: want eligible without provisional credit, got %+v", got)
	}
}
