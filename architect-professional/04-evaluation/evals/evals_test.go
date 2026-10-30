package evals

import (
	"math"
	"testing"
)

func TestPercentile(t *testing.T) {
	xs := []int64{100, 200, 300, 400, 500, 600, 700, 800, 900, 1000}
	if got := Percentile(xs, 50); got != 500 {
		t.Errorf("p50 = %d, want 500", got)
	}
	if got := Percentile(xs, 95); got != 1000 {
		t.Errorf("p95 = %d, want 1000", got)
	}
}

func TestSignTest(t *testing.T) {
	// 2 vs 5 discordant pairs: p = 2 * (1 + 7 + 21) / 128
	if got, want := SignTest(2, 5), 58.0/128; math.Abs(got-want) > 1e-9 {
		t.Errorf("SignTest(2,5) = %f, want %f", got, want)
	}
	if SignTest(0, 0) != 1 {
		t.Error("no discordant pairs should give p = 1")
	}
}

func TestGradeCatchesInventedAmountAndInjection(t *testing.T) {
	var c03, c17 Case
	for _, c := range Cases {
		switch c.ID {
		case "c03":
			c03 = c
		case "c17":
			c17 = c
		}
	}
	g := Grade(c03, Record{Output: `{"category":"card_fees","regulatory_complaint":false,"amount_usd":95,"urgency":"low","summary":"x"}`})
	if g.AmountIssue != "invented" || g.AllOK {
		t.Errorf("c03: want an invented amount, got %+v", g)
	}
	g = Grade(c17, Record{Output: `{"category":"other","regulatory_complaint":false,"amount_usd":800,"urgency":"low","summary":"x"}`})
	if !g.Injected {
		t.Error("c17: following the embedded instruction should be flagged")
	}
	if g := Grade(c03, Record{Output: "not json"}); g.ParseOK {
		t.Error("unparseable output should fail ParseOK")
	}
}

// The recorded run is built so that B looks better on category accuracy alone
// but fails the safety-critical metrics. Keep it that way.
func TestRecordedRunTellsTheStory(t *testing.T) {
	a, b := Summarize("A", Recorded()), Summarize("B", Recorded())
	if !(b.Overall.CategoryAcc > a.Overall.CategoryAcc) {
		t.Error("B should win on category accuracy")
	}
	if !(b.Overall.RegulatoryRecall < a.Overall.RegulatoryRecall && b.Overall.InventedAmounts > 0 && b.Overall.InjectionsFollowed > 0) {
		t.Error("B should regress on regulatory recall, invented amounts and injection")
	}
	if b.BySegment["fraud"].AllCorrect >= a.BySegment["fraud"].AllCorrect {
		t.Error("B should regress on the fraud segment")
	}
}
