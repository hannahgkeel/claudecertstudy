// Exercise 4: evaluate before you ship.
//
//	go run ./architect-professional/04-evaluation/exercise -offline   # uses the recorded run, no API key
//	go run ./architect-professional/04-evaluation/exercise            # runs both prompt variants live
//
// A teammate rewrote the complaint-triage prompt (variant B) to be shorter and
// cheaper. This eval says B is better: higher accuracy, lower cost. Run it,
// then fix the TODOs and see whether the conclusion survives. The answer key
// is in evals.Cases; the recorded outputs are in evals.Recorded().
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"

	"claudecertstudy/architect-professional/04-evaluation/evals"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var offline = flag.Bool("offline", false, "use the recorded run instead of calling the API")

// TODO(1): Define the metrics before you look at the results. Category
// accuracy alone hides the failures that matter here. For complaint triage at
// a bank, which of these should be part of the decision, and which should be a
// hard gate that blocks a release on its own?
//
//	accuracy per field · regulatory-complaint recall · invented amounts
//	(hallucination) · prompt injections followed (security) · p50/p95 latency ·
//	cost per case
func accuracy(variant string, records []evals.Record) float64 {
	want := map[string]string{}
	for _, c := range evals.Cases {
		want[c.ID] = c.Want.Category
	}
	right, n := 0, 0
	for _, r := range records {
		if r.Variant != variant {
			continue
		}
		var o struct {
			Category string `json:"category"`
		}
		_ = json.Unmarshal([]byte(r.Output), &o)
		n++
		if o.Category == want[r.CaseID] {
			right++
		}
	}
	return float64(right) / float64(n)
}

// TODO(2): Break results down by segment (evals.Case.Segment) and by purpose.
// An overall number can hide a segment that fails badly: look at fraud.

// TODO(3): Mixed methods. Grade fields with a right answer in code. Use an
// LLM judge only for the free-text summary, with a rubric that scores each
// criterion (faithful, complete, neutral) and a structured-output schema,
// not "is this good? yes/no". Then send failures plus a stratified sample to
// human reviewers, who also check the judge.
func judge(ctx context.Context, client anthropic.Client, complaint, output string) string {
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 16000,
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			"Is this a good triage result? Answer yes or no.\n" + output))},
	})
	if err != nil {
		log.Fatal(err)
	}
	return claude.Text(resp)
}

// TODO(4): A/B properly. Compare case by case (paired), count where each
// variant wins, and ask whether that split could be chance (a sign test). With
// 17 cases, what difference can you actually detect? What would you add to the
// dataset before the next comparison?

// TODO(5): Diagnose each failure: format (didn't parse), hallucination
// (invented amount), compliance (regulator missed), security (followed the
// injected instruction), prompt gap (wrong category), or model mismatch (a
// latency or cost problem that effort or model choice would fix).

func main() {
	flag.Parse()
	var records []evals.Record
	if *offline {
		records = evals.Recorded()
	} else {
		ctx := context.Background()
		client := claude.NewClient()
		for _, v := range []string{"A", "B"} {
			for _, c := range evals.Cases {
				resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
					Model: claude.Model, MaxTokens: 16000,
					System: []anthropic.TextBlockParam{{Text: evals.Variants[v]}},
					OutputConfig: anthropic.OutputConfigParam{
						Effort: anthropic.OutputConfigEffortLow,
						Format: anthropic.JSONOutputFormatParam{Schema: evals.Schema},
					},
					Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(c.Text))},
				})
				if err != nil {
					log.Fatal(err)
				}
				out := claude.Text(resp)
				fmt.Printf("%s %s judge: %s\n", v, c.ID, judge(ctx, client, c.Text, out))
				records = append(records, evals.Record{CaseID: c.ID, Variant: v, Output: out,
					InputTok: resp.Usage.InputTokens, OutputTok: resp.Usage.OutputTokens})
			}
		}
	}

	cost := func(v string) float64 {
		var in, out int64
		for _, r := range records {
			if r.Variant == v {
				in += r.InputTok
				out += r.OutputTok
			}
		}
		return float64(in)*evals.InputPerM/1e6 + float64(out)*evals.OutputPerM/1e6
	}
	a, b := accuracy("A", records), accuracy("B", records)
	fmt.Printf("A: accuracy %.0f%%, total cost $%.4f\n", a*100, cost("A"))
	fmt.Printf("B: accuracy %.0f%%, total cost $%.4f\n", b*100, cost("B"))
	if b >= a && cost("B") < cost("A") {
		fmt.Println("Ship B: more accurate and cheaper.")
	} else {
		fmt.Println("Keep A.")
	}
}
