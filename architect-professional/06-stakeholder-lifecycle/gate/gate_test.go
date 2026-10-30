package gate

import (
	"strings"
	"testing"

	"claudecertstudy/architect-professional/04-evaluation/evals"
)

func TestGateBlocksVariantB(t *testing.T) {
	rec := evals.Recorded()
	a, b := evals.Summarize("A", rec), evals.Summarize("B", rec)
	r := Evaluate(a, b, ComplaintTriageSLA)
	if r.Promote {
		t.Fatal("B fails regulatory recall, invented amounts and injection: it must not promote")
	}
	joined := strings.Join(r.Blocking, "\n")
	for _, want := range []string{"regulatory", "invented", "injection", "segment fraud"} {
		if !strings.Contains(joined, want) {
			t.Errorf("missing a blocking finding about %q in:\n%s", want, joined)
		}
	}
	if len(r.Improvements) == 0 {
		t.Error("the cost and latency gains should still be reported")
	}
}

func TestGatePromotesBaselineAgainstItself(t *testing.T) {
	a := evals.Summarize("A", evals.Recorded())
	if r := Evaluate(a, a, ComplaintTriageSLA); !r.Promote {
		t.Errorf("baseline vs itself should pass, got %v", r.Blocking)
	}
}

func TestExecutiveSummaryHasNoJargon(t *testing.T) {
	rec := evals.Recorded()
	r := Evaluate(evals.Summarize("A", rec), evals.Summarize("B", rec), ComplaintTriageSLA)
	s := ForExecutives("the new triage prompt", r)
	if !strings.HasPrefix(s, "Decision:") {
		t.Error("lead with the decision")
	}
	if !strings.Contains(s, "Next step") {
		t.Error("say what happens next")
	}
}
