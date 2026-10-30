// Exercise 6: communicate the decision and manage the release.
//
//	go run ./architect-professional/06-stakeholder-lifecycle/exercise   # offline, no API key
//
// Module 04's eval results feed a release decision. This gate promotes the
// candidate if average accuracy went up or cost went down, and it sends the
// business owner a status line full of jargon. Fix the TODOs, then compare
// with the solution's output.
package main

import (
	"fmt"
	"strings"

	"claudecertstudy/architect-professional/04-evaluation/evals"
)

// TODO(1): Write the SLA down as numbers agreed with stakeholders in
// discovery (see templates/sla.md): minimum all-fields-correct, regulatory
// recall, invented amounts, injections, p95 latency, cost per case, and the
// largest drop any segment may take. Which of these are hard gates?

// TODO(2): Gate on every threshold. One average can't outvote a hard gate.
// Check each segment against the baseline too, but don't block on a segment
// with too few cases to judge: say "add cases" instead.
func promote(base, cand evals.Summary) bool {
	return cand.Overall.CategoryAcc >= base.Overall.CategoryAcc || cand.Overall.CostPerCaseUSD < base.Overall.CostPerCaseUSD
}

// TODO(3): Two audiences, two messages.
//   - The business owner: lead with the decision, then customer and cost
//     impact, the risks in plain words, the next step, and whether you need a
//     decision from them. No jargon.
//   - The change record: every metric, baseline vs candidate vs limit.
func statusUpdate(base, cand evals.Summary, ok bool) string {
	return fmt.Sprintf("cand %s: cat_acc=%.3f (Δ%+.3f), reg_recall=%.2f, p95=%dms, $/case=%.4f, promote=%v",
		cand.Variant, cand.Overall.CategoryAcc, cand.Overall.CategoryAcc-base.Overall.CategoryAcc,
		cand.Overall.RegulatoryRecall, cand.Overall.P95MS, cand.Overall.CostPerCaseUSD, ok)
}

// TODO(4): Lifecycle. After promotion, what do you hand over to operations?
// Fill in templates/handoff-runbook.md for this system: owners, dashboards,
// alerts, the rollback step, and what happens when the model version you
// pinned is deprecated.

func main() {
	rec := evals.Recorded()
	base, cand := evals.Summarize("A", rec), evals.Summarize("B", rec)
	ok := promote(base, cand)
	msg := statusUpdate(base, cand, ok)
	fmt.Println("To: Head of Customer Care")
	fmt.Println(msg)

	fmt.Println()
	if ok {
		fmt.Println("CHECK FAIL: B promoted, but it misses regulator mentions, invents amounts and follows an injection")
	} else {
		fmt.Println("CHECK PASS: B held")
	}
	if !strings.HasPrefix(msg, "Decision:") {
		fmt.Println("CHECK FAIL: the business owner's message should lead with the decision in plain words")
	}
}
