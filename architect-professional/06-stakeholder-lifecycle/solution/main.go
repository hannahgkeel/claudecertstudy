// Solution: a release gate tied to the agreed SLA, with the result written
// for executives and for engineers.
//
//	go run ./architect-professional/06-stakeholder-lifecycle/solution          # offline, no API key
//	go run ./architect-professional/06-stakeholder-lifecycle/solution -draft   # also has Claude draft the stakeholder email
package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"claudecertstudy/architect-professional/04-evaluation/evals"
	"claudecertstudy/architect-professional/06-stakeholder-lifecycle/gate"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var draft = flag.Bool("draft", false, "have Claude draft the email to the business owner")

func main() {
	flag.Parse()
	rec := evals.Recorded()
	base := evals.Summarize("A", rec)

	// Candidate C stands in for "B after the fixes": A's quality at B's speed.
	for _, r := range rec {
		if r.Variant == "A" {
			r.Variant, r.LatencyMS, r.InputTok = "C", r.LatencyMS*55/100, r.InputTok*80/100
			rec = append(rec, r)
		}
	}

	var lastExec string
	for _, name := range []string{"B", "C"} {
		cand := evals.Summarize(name, rec)
		r := gate.Evaluate(base, cand, gate.ComplaintTriageSLA)
		claude.Banner("Candidate " + name + " · for the business owner")
		lastExec = gate.ForExecutives("triage prompt "+name, r)
		fmt.Print(lastExec)
		claude.Banner("Candidate " + name + " · for the change record")
		fmt.Print(gate.ForEngineers(base, cand, gate.ComplaintTriageSLA, r))
		if name == "B" && *draft {
			draftEmail(lastExec)
		}
	}
}

// The model drafts the words; every number comes from the gate's output, and
// the prompt says not to add any. A person sends the email.
func draftEmail(facts string) {
	ctx := context.Background()
	client := claude.NewClient()
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{Text: "You draft short emails from a solutions architect to a non-technical business owner " +
			"(Head of Customer Care). Lead with the decision, then impact, risk, next step and any decision you need from them. " +
			"Use only the numbers in <facts>; add none. No technical jargon. Under 150 words."}},
		OutputConfig: anthropic.OutputConfigParam{Effort: anthropic.OutputConfigEffortLow},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			"<facts>\n" + facts + "</facts>\nDraft the email about the triage prompt release."))},
	})
	if err != nil {
		log.Fatal(err)
	}
	claude.Banner("Draft email (review before sending)")
	fmt.Println(claude.Text(resp))
}
