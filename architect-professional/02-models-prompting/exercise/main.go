// Exercise 2: models, prompts and context at scale.
//
//	go run ./architect-professional/02-models-prompting/exercise -check   # offline checks, no API key
//	go run ./architect-professional/02-models-prompting/exercise          # live: watch cache_read stay at 0
//
// The prompt below "has caching turned on", yet cache_read is 0 on every
// request, and a one-line tagging job runs at the same effort as a compliance
// check. Fix the TODOs until -check passes, then compare the live token lines
// with the solution.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"claudecertstudy/architect-professional/02-models-prompting/clients"
	"claudecertstudy/architect-professional/02-models-prompting/prompts"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var check = flag.Bool("check", false, "run the offline checks and exit")

// TODO(1): Model and effort per task. Tagging a note, writing a brief and
// judging suitability have different costs of error and latency needs.
// Return a different effort for each and record why. (Should you switch the
// tagging task to a smaller model now, or after an eval?)
func choose(task string) (string, anthropic.OutputConfigEffort) {
	return claude.Model, anthropic.OutputConfigEffortMax
}

// TODO(2): Few-shot examples. These are in a map, so Go prints them in a
// random order. What does that do to a cached prefix? Use a slice.
var tagExamples = map[string]string{
	"Client asked whether she can still contribute to her IRA after retiring in March.": "retirement, tax",
	"Son starts college in fall 2027, they want $40k available by then.":                "education, liquidity_need",
	"Unhappy that the bond fund lost money, asked why nobody warned him.":               "complaint, risk_change",
}

// TODO(3): Order for caching. The cache matches an exact prefix (tools ->
// system -> messages). Today's date, the advisor and the client profile are at
// the TOP of the system prompt, so the prefix differs on every request. Move
// everything that varies into the user message, after the breakpoint, and keep
// the system prompt identical across requests for the same task.
//
// TODO(4): Make it modular. One string per concern (role, guardrails, policy,
// output format per task) assembled in a fixed order, with a version string you
// log with every result. The policy text is in prompts.Policy.
func buildSystem(task string, now time.Time, advisor string, client map[string]any) string {
	profile, _ := json.Marshal(client)
	var sb strings.Builder
	fmt.Fprintf(&sb, "Today is %s. You are helping advisor %s.\nClient profile: %s\n\n", now.Format(time.RFC3339), advisor, profile)
	sb.WriteString("You assist financial advisors at Larkspur Wealth. Don't recommend specific securities. ")
	sb.WriteString("Flag conflicts with the policy.\n\n")
	sb.WriteString(prompts.Policy + "\n\n")
	if task == "tag_note" {
		sb.WriteString("Examples:\n")
		for note, tags := range tagExamples {
			sb.WriteString(note + " => " + tags + "\n")
		}
	}
	sb.WriteString("Answer the advisor's request.")
	return sb.String()
}

func params(call clients.Call, now time.Time) anthropic.MessageNewParams {
	model, effort := choose(call.Task)
	ask := call.Ask
	if len(call.Notes) > 0 {
		ask = "Notes:\n- " + strings.Join(call.Notes, "\n- ") + "\n\n" + ask
	}
	return anthropic.MessageNewParams{
		Model: model, MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{
			Text:         buildSystem(call.Task, now, call.Advisor, call.Client),
			CacheControl: anthropic.NewCacheControlEphemeralParam(),
		}},
		OutputConfig: anthropic.OutputConfigParam{Effort: effort},
		Messages:     []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(ask))},
	}
}

func runChecks() {
	fail := 0
	report := func(ok bool, msg string) {
		if ok {
			fmt.Println("PASS", msg)
		} else {
			fmt.Println("FAIL", msg)
			fail++
		}
	}
	a, b := clients.Calls[1], clients.Calls[1]
	b.Advisor, b.ClientID = "M. Lindqvist", "C-9999"
	pa := params(a, time.Date(2026, 10, 1, 9, 0, 0, 0, time.UTC))
	pb := params(b, time.Date(2026, 10, 20, 17, 0, 0, 0, time.UTC))
	report(pa.System[0].Text == pb.System[0].Text, "system prompt is identical across requests for the same task")
	stable := true
	first := params(clients.Calls[0], time.Now()).System[0].Text
	for i := 0; i < 20; i++ {
		if params(clients.Calls[0], time.Now()).System[0].Text != first {
			stable = false
		}
	}
	report(stable, "tagging prompt renders the same bytes every time (few-shot order)")
	report(!strings.Contains(pa.System[0].Text, "2026-10-01"), "the date is not in the cached prefix")
	_, e1 := choose("tag_note")
	_, e3 := choose("suitability_check")
	report(e1 != e3, "tagging and suitability checks use different effort levels")
	if fail > 0 {
		os.Exit(1)
	}
}

func main() {
	flag.Parse()
	if *check {
		runChecks()
		return
	}
	ctx := context.Background()
	client := claude.NewClient()
	for pass := 1; pass <= 2; pass++ {
		for _, call := range clients.Calls {
			claude.Banner(fmt.Sprintf("pass %d · %s · %s", pass, call.Task, call.ClientID))
			start := time.Now()
			resp, err := client.Messages.New(ctx, params(call, time.Now()))
			if err != nil {
				log.Fatal(err)
			}
			u := resp.Usage
			fmt.Printf("[tokens] input=%d cache_write=%d cache_read=%d output=%d · %s\n",
				u.InputTokens, u.CacheCreationInputTokens, u.CacheReadInputTokens, u.OutputTokens, time.Since(start).Round(time.Millisecond))
			if pass == 1 {
				fmt.Println(claude.Text(resp))
			}
		}
	}
}
