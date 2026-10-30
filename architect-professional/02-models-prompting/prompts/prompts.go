// Package prompts is the reference prompt library for module 02: versioned
// fragments assembled in a fixed order, a cache breakpoint after the stable
// part, per-request data after it, and a model/effort choice per task.
package prompts

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// Version goes in logs and eval results so you can tie a quality change to a
// prompt change (module 04, module 06).
const Version = "advisor-assist@4"

// Task is what the caller wants done. Each task gets its own model and effort.
type Task string

const (
	TaskTagNote          Task = "tag_note"          // high volume, latency-sensitive labelling
	TaskMeetingBrief     Task = "meeting_brief"     // a page of prose for an advisor
	TaskSuitabilityCheck Task = "suitability_check" // high stakes: a compliance-relevant judgement
)

// Choice is a model plus effort, with the reason recorded for the design doc.
type Choice struct {
	Model  string
	Effort anthropic.OutputConfigEffort // empty means "don't send effort"
	Why    string
}

// Choose picks per task. The defaults start with the most capable model and
// lower the effort, because measuring that is cheaper than running a cascade
// of models (one model also means one cache). A smaller model is a candidate
// only after an eval shows it holds quality on that task.
func Choose(t Task) Choice {
	switch t {
	case TaskTagNote:
		return Choice{claude.Model, anthropic.OutputConfigEffortLow,
			"labelling: low effort keeps latency and output tokens down; candidate for a smaller model once the tagging eval passes"}
	case TaskMeetingBrief:
		return Choice{claude.Model, anthropic.OutputConfigEffortMedium,
			"summarising known facts: medium effort is enough"}
	case TaskSuitabilityCheck:
		return Choice{claude.Model, anthropic.OutputConfigEffortHigh,
			"compliance judgement with an expensive error: spend more reasoning"}
	}
	return Choice{claude.Model, anthropic.OutputConfigEffortMedium, "default"}
}

// ---------- fragments: stable, versioned, assembled in one fixed order ----------

const Role = `You assist financial advisors at Larkspur Wealth (a fictional firm). You prepare material for the advisor, never for the client directly. The advisor decides what to say and do.`

const Guardrails = `Rules that always apply:
- Do not recommend buying or selling a specific security. You may describe how a proposal fits or conflicts with the client's profile and the policy below.
- Use only the client data and notes provided. If something you need is missing, say what is missing instead of assuming.
- Flag any conflict with the suitability policy at the top of your answer, quoting the policy section number.
- Never include full account numbers or tax IDs in your output, even if they appear in the input.`

// Policy is long and identical on every request, which is what makes it worth caching.
const Policy = `<suitability_policy version="2026-07">
1. Risk profile. Every client has one risk profile: conservative, moderate, growth or aggressive. The profile is set at onboarding and reviewed at least every 12 months or after a life event (retirement, inheritance, divorce, job loss). A proposal must not move the portfolio's expected volatility above the band for the client's profile without a documented profile review.
2. Time horizon. Money the client needs within 3 years must not be invested in instruments where a 20% drawdown is plausible in that period. Advisors record the amount and date of known withdrawals (tuition, house deposit, required minimum distributions).
3. Concentration. No single issuer above 10% of investable assets, and no single sector above 30%, unless the client holds the position from employment (company stock) and has signed the concentration acknowledgement. Proposals that increase an existing breach are not allowed; proposals that reduce one are encouraged.
4. Complex products. Leveraged or inverse ETFs, structured notes, options strategies beyond covered calls, private placements and interval funds require: (a) a growth or aggressive profile, (b) documented product experience or training, and (c) supervisor pre-approval. Complex products are never suitable for money needed within 3 years.
5. Liquidity. Illiquid holdings (lock-ups, private funds, real estate partnerships) are capped at 15% of investable assets, and lower if the client's emergency reserve covers less than 6 months of expenses.
6. Age and capacity. For clients aged 75 and over, or where the advisor has noted possible diminished capacity, proposals that add complexity or illiquidity need a second advisor review and, where on file, notification of the trusted contact.
7. Costs. When two options meet the client's objective, prefer the lower total cost (expense ratio plus advisory fee plus transaction costs). Record the cost comparison.
8. Documentation. Every proposal records the client's objective in their words, the alternatives considered, and why the chosen option fits sections 1-7. Missing documentation is itself a finding.
9. Conflicts of interest. Proprietary products and products that pay the firm revenue sharing must be disclosed in the proposal and compared with at least one non-proprietary alternative.
10. Escalation. Anything that conflicts with sections 1-9 goes to the supervising principal before the client meeting, not after.
</suitability_policy>`

// FormatFor is the output template per task.
func FormatFor(t Task) string {
	switch t {
	case TaskTagNote:
		return "Output: the tags only, as a comma-separated list from this set: retirement, tax, estate, education, liquidity_need, risk_change, complaint, life_event, product_question."
	case TaskMeetingBrief:
		return "Output format:\n## Policy flags\n## Since the last meeting\n## Open items\n## Questions to ask\nKeep it under 250 words."
	case TaskSuitabilityCheck:
		return "Output format:\n## Verdict (fits / conflicts / needs information)\n## Policy sections involved\n## What the advisor should document or change"
	}
	return ""
}

// Example is one few-shot pair. A slice, not a map: Go map iteration order is
// random, and a random order changes the prompt bytes and breaks the cache.
type Example struct{ Note, Tags string }

var TagExamples = []Example{
	{"Client asked whether she can still contribute to her IRA after retiring in March.", "retirement, tax"},
	{"Son starts college in fall 2027, they want $40k available by then.", "education, liquidity_need"},
	{"Unhappy that the bond fund lost money, asked why nobody warned him.", "complaint, risk_change"},
}

func examplesBlock() string {
	var sb strings.Builder
	sb.WriteString("<examples>\n")
	for _, e := range TagExamples {
		fmt.Fprintf(&sb, "<example><note>%s</note><tags>%s</tags></example>\n", e.Note, e.Tags)
	}
	sb.WriteString("</examples>")
	return sb.String()
}

// ---------- assembly ----------

// Request is everything that varies per call.
type Request struct {
	Task     Task
	Now      time.Time
	Advisor  string
	ClientID string
	Client   map[string]any // profile and holdings
	Notes    []string
	Ask      string
}

// System returns the stable prefix: the same bytes for every request of a
// given task. The cache breakpoint goes on the last block.
func System(t Task) []anthropic.TextBlockParam {
	parts := []string{Role, Guardrails, Policy}
	if t == TaskTagNote {
		parts = append(parts, examplesBlock())
	}
	parts = append(parts, FormatFor(t))
	return []anthropic.TextBlockParam{{
		Text:         strings.Join(parts, "\n\n"),
		CacheControl: anthropic.NewCacheControlEphemeralParam(),
	}}
}

// UserMessage carries the volatile parts, after the cached prefix. Keys are
// marshalled by encoding/json, which sorts map keys, so the same data always
// renders the same way.
func UserMessage(r Request) anthropic.MessageParam {
	client, _ := json.MarshalIndent(r.Client, "", "  ")
	var sb strings.Builder
	fmt.Fprintf(&sb, "<context>\ndate: %s\nadvisor: %s\nclient_id: %s\n</context>\n", r.Now.Format("2006-01-02"), r.Advisor, r.ClientID)
	fmt.Fprintf(&sb, "<client_profile>\n%s\n</client_profile>\n", client)
	if len(r.Notes) > 0 {
		sb.WriteString("<notes>\n")
		for _, n := range r.Notes {
			sb.WriteString("- " + n + "\n")
		}
		sb.WriteString("</notes>\n")
	}
	sb.WriteString("\n" + r.Ask)
	return anthropic.NewUserMessage(anthropic.NewTextBlock(sb.String()))
}

// Params builds the whole request.
func Params(r Request) anthropic.MessageNewParams {
	c := Choose(r.Task)
	p := anthropic.MessageNewParams{
		Model:     c.Model,
		MaxTokens: 16000,
		System:    System(r.Task),
		Messages:  []anthropic.MessageParam{UserMessage(r)},
	}
	if c.Effort != "" {
		p.OutputConfig = anthropic.OutputConfigParam{Effort: c.Effort}
	}
	return p
}
