// Solution: an A/B eval with mixed methods, metrics by segment, and a
// decision you can defend.
//
//	go run ./architect-professional/04-evaluation/solution -offline   # report from the recorded run, no API key
//	go run ./architect-professional/04-evaluation/solution            # run both prompt variants live, then report
//	go run ./architect-professional/04-evaluation/solution -save run.json
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
	"time"

	"claudecertstudy/architect-professional/04-evaluation/evals"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var (
	offline = flag.Bool("offline", false, "use the recorded run instead of calling the API")
	save    = flag.String("save", "", "write the records to this JSON file")
)

func runCase(ctx context.Context, client anthropic.Client, variant string, c evals.Case) evals.Record {
	start := time.Now()
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{Text: evals.Variants[variant]}},
		OutputConfig: anthropic.OutputConfigParam{
			Effort: anthropic.OutputConfigEffortLow,
			Format: anthropic.JSONOutputFormatParam{Schema: evals.Schema},
		},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock("<complaint>" + c.Text + "</complaint>"))},
	})
	if err != nil {
		log.Fatal(err)
	}
	return evals.Record{CaseID: c.ID, Variant: variant, Output: claude.Text(resp), LatencyMS: time.Since(start).Milliseconds(),
		InputTok: resp.Usage.InputTokens, OutputTok: resp.Usage.OutputTokens}
}

// The judge grades only what code can't: the free-text summary. It gets the
// source complaint, a rubric with one score per criterion, and a schema.
// Calibrate it against a few human-graded examples before trusting it.
func judge(ctx context.Context, client anthropic.Client, c evals.Case, out string) *evals.JudgeScore {
	var o struct {
		Summary string `json:"summary"`
	}
	_ = json.Unmarshal([]byte(out), &o)
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{Text: evals.JudgePrompt}},
		OutputConfig: anthropic.OutputConfigParam{
			Effort: anthropic.OutputConfigEffortMedium,
			Format: anthropic.JSONOutputFormatParam{Schema: evals.JudgeSchema},
		},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			"<complaint>" + c.Text + "</complaint>\n<summary>" + o.Summary + "</summary>"))},
	})
	if err != nil {
		log.Fatal(err)
	}
	var s evals.JudgeScore
	if err := json.Unmarshal([]byte(claude.Text(resp)), &s); err != nil {
		return nil
	}
	return &s
}

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
				r := runCase(ctx, client, v, c)
				r.Judge = judge(ctx, client, c, r.Output)
				fmt.Printf("ran %s %s in %dms\n", v, c.ID, r.LatencyMS)
				records = append(records, r)
			}
		}
	}
	if *save != "" {
		b, _ := json.MarshalIndent(records, "", "  ")
		if err := os.WriteFile(*save, b, 0o644); err != nil {
			log.Fatal(err)
		}
	}

	a, b := evals.Summarize("A", records), evals.Summarize("B", records)
	claude.Banner("Report")
	evals.Print(a)
	evals.Print(b)

	claude.Banner("Paired comparison (same cases, all fields correct)")
	p := evals.Compare(a, b)
	fmt.Printf("B better on %d, A better on %d, same on %d. Sign test p = %.2f\n", p.BBetter, p.ABetter, p.Same, p.PValue)
	fmt.Println("With 17 cases, a 1-2 case swing is noise. Grow the set before reading small differences.")

	claude.Banner("Decision")
	// Hard gates first: a cheaper variant that fails a safety or compliance
	// metric doesn't ship, however it does on average.
	var blockers []string
	if b.Overall.RegulatoryRecall < 1 {
		blockers = append(blockers, fmt.Sprintf("regulatory recall %.0f%% (must be 100%%: missed regulator mentions are a compliance failure)", b.Overall.RegulatoryRecall*100))
	}
	if b.Overall.InventedAmounts > 0 {
		blockers = append(blockers, fmt.Sprintf("%d invented amounts (hallucination)", b.Overall.InventedAmounts))
	}
	if b.Overall.InjectionsFollowed > 0 {
		blockers = append(blockers, fmt.Sprintf("%d prompt injection followed (security)", b.Overall.InjectionsFollowed))
	}
	fmt.Printf("B is %.0f%% cheaper per case and its p95 is %dms faster, and it wins on category accuracy alone.\n",
		100*(1-b.Overall.CostPerCaseUSD/a.Overall.CostPerCaseUSD), a.Overall.P95MS-b.Overall.P95MS)
	if len(blockers) > 0 {
		fmt.Println("Don't ship B. Blocking findings:")
		for _, x := range blockers {
			fmt.Println("  -", x)
		}
		fmt.Println("Next: take A's rules for regulators, amounts and untrusted input into B, re-run, and keep the effort low if quality holds.")
	} else {
		fmt.Println("B passes the hard gates; take the cost and latency win.")
	}

	claude.Banner("Human review sample")
	// Mixed methods: code graders, an LLM judge, and people. Send every failure
	// plus one passing case per segment, so reviewers also check the judge.
	seen := map[string]bool{}
	var sample []string
	for _, g := range b.Graded {
		if !g.AllOK || (g.Record.Judge != nil && g.Record.Judge.Faithful <= 2) {
			sample = append(sample, g.Case.ID+" (failed or low faithfulness)")
		} else if !seen[g.Case.Segment] {
			seen[g.Case.Segment] = true
			sample = append(sample, g.Case.ID+" (passing "+g.Case.Segment+" spot check)")
		}
	}
	sort.Strings(sample)
	for _, s := range sample {
		fmt.Println("  -", s)
	}
}
