// Solution: retrieval matched to the data, a least-privilege tool grant, and
// a trace for every answer.
//
//	go run ./architect-professional/03-integration-rag/solution -offline   # retrieval eval + access audit, no API key
//	go run ./architect-professional/03-integration-rag/solution            # also answers questions with Claude
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"claudecertstudy/architect-professional/03-integration-rag/access"
	"claudecertstudy/architect-professional/03-integration-rag/rag"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var offline = flag.Bool("offline", false, "skip the live answers")

// ---------- 1. Chunk along the document's own structure ----------

// One chunk per section, so a table or a rule stays whole. Each chunk starts
// with a header naming the document, version, section and effective date:
// the section body alone often doesn't say what it's about ("Daily limits"
// of what?), and BM25 can only match words that are in the chunk.
func sectionChunks(docs []rag.Doc) []rag.Chunk {
	var out []rag.Chunk
	for _, d := range docs {
		sections := strings.Split("\n"+d.Body, "\n## ")
		for i, s := range sections {
			s = strings.TrimSpace(s)
			if s == "" {
				continue
			}
			name, body := "Scope", s
			if i > 0 {
				name, body, _ = strings.Cut(s, "\n")
			}
			header := fmt.Sprintf("[%s v%d · %s · %s · effective %s]", d.ID, d.Version, d.Title, name, d.Effective)
			out = append(out, rag.Chunk{
				ID: fmt.Sprintf("%s-v%d#%s", d.ID, d.Version, slug(name)), DocID: d.ID, Version: d.Version,
				Section: name, Effective: d.Effective, Superseded: d.Superseded,
				Text: header + "\n" + strings.TrimSpace(body),
			})
		}
	}
	return out
}

func slug(s string) string { return strings.ReplaceAll(strings.ToLower(s), " ", "-") }

// ---------- 2. Retrieval matched to the query and the data ----------

var docIDRe = regexp.MustCompile(`\b(POL-\d{3}|FRM-[A-Z0-9]+)\b`)

var index = rag.NewIndex(sectionChunks(rag.Corpus))

// retrieve applies, in order:
//   - a metadata filter: only the version in force on the as-of date. Without
//     it, the superseded wire policy competes with the current one.
//   - exact lookup: staff type policy IDs, and an ID is a filter, not a hint.
//   - BM25 ranking for the words. Policy text is full of exact terms and
//     numbers, which keyword search handles well. For paraphrased questions,
//     add embeddings and merge the two rankings (hybrid search).
func retrieve(query, asOf string, k int) []rag.Chunk {
	ids := docIDRe.FindAllString(query, -1)
	keep := func(c rag.Chunk) bool {
		if c.Effective > asOf || (c.Superseded != "" && c.Superseded <= asOf) {
			return false
		}
		if len(ids) > 0 {
			for _, id := range ids {
				if c.DocID == id {
					return true
				}
			}
			return false
		}
		return true
	}
	var out []rag.Chunk
	for _, s := range index.Search(query, k, keep) {
		out = append(out, s.Chunk)
	}
	return out
}

// ---------- 3. Least privilege: grant what the role needs, as the user ----------

var grant = access.Grant{
	Role:     "contact_centre_assistant",
	Tools:    []string{"search_policies", "get_account_summary", "lookup_transactions", "refund_fee"},
	Identity: "end_user",
}

// ---------- 4. Observability: one trace record per answer ----------

type trace struct {
	Query       string   `json:"query"`
	AsOf        string   `json:"as_of"`
	Retrieved   []string `json:"retrieved"`
	RetrieveMS  int64    `json:"retrieve_ms"`
	ModelMS     int64    `json:"model_ms"`
	InputTok    int64    `json:"input_tokens"`
	OutputTok   int64    `json:"output_tokens"`
	Cited       []string `json:"cited"`
	Uncited     bool     `json:"answered_without_citation"`
	RequestID   string   `json:"request_id"`
	StopReason  string   `json:"stop_reason"`
	PromptLabel string   `json:"prompt"`
}

var citeRe = regexp.MustCompile(`\[([A-Z]+-[A-Z0-9]+-v\d+#[a-z-]+)\]`)

func answer(ctx context.Context, client anthropic.Client, q rag.Question) (string, trace) {
	tr := trace{Query: q.Q, AsOf: q.AsOf, PromptLabel: "policy-qa@2"}
	t0 := time.Now()
	chunks := retrieve(q.Q, q.AsOf, 3)
	tr.RetrieveMS = time.Since(t0).Milliseconds()
	var sb strings.Builder
	for _, c := range chunks {
		tr.Retrieved = append(tr.Retrieved, c.ID)
		fmt.Fprintf(&sb, "<source id=\"%s\">\n%s\n</source>\n", c.ID, c.Text)
	}
	t1 := time.Now()
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{Text: "Answer bank staff questions from the policy sources only. " +
			"Cite every claim with the source id in square brackets, like [POL-207-v1#fee-schedule]. " +
			"If the sources don't answer the question, say so and name the policy owner to ask."}},
		OutputConfig: anthropic.OutputConfigParam{Effort: anthropic.OutputConfigEffortLow},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			sb.String() + "\nAs of " + q.AsOf + ": " + q.Q))},
	})
	if err != nil {
		log.Fatal(err)
	}
	tr.ModelMS = time.Since(t1).Milliseconds()
	tr.InputTok, tr.OutputTok = resp.Usage.InputTokens, resp.Usage.OutputTokens
	tr.StopReason = string(resp.StopReason)
	tr.RequestID = resp.ID // log the message ID; on errors, log the request ID from the error
	text := claude.Text(resp)
	for _, m := range citeRe.FindAllStringSubmatch(text, -1) {
		tr.Cited = append(tr.Cited, m[1])
	}
	tr.Uncited = len(tr.Cited) == 0
	return text, tr
}

func main() {
	flag.Parse()

	claude.Banner("Retrieval eval (offline)")
	naiveIx := rag.NewIndex(rag.FixedChunks(rag.Corpus, 400))
	naive := func(q, _ string, k int) []rag.Chunk {
		var out []rag.Chunk
		for _, s := range naiveIx.Search(q, k, nil) {
			out = append(out, s.Chunk)
		}
		return out
	}
	rag.PrintEval("fixed 400-char chunks, no filters", naive, 3)
	rag.PrintEval("section chunks + effective-date filter + ID lookup", retrieve, 3)

	claude.Banner("Access audit (offline)")
	bloated := access.Grant{Role: "contact_centre_assistant", Identity: "service_account",
		Tools: []string{"search_policies", "get_account_summary", "lookup_transactions", "refund_fee", "update_contact_info", "send_wire", "close_account", "export_customer_list"}}
	usage := map[string]int{"search_policies": 5120, "get_account_summary": 2210, "lookup_transactions": 1980, "refund_fee": 140}
	for name, g := range map[string]access.Grant{"before": bloated, "after": grant} {
		f := access.Audit(g, usage)
		fmt.Printf("%s: %d tools, %d findings\n", name, len(g.Tools), len(f))
		for _, x := range f {
			fmt.Printf("  [%s] %s: %s\n", x.Severity, x.Tool, x.Issue)
		}
	}

	if *offline {
		return
	}
	ctx := context.Background()
	client := claude.NewClient()
	for _, q := range rag.Questions[:4] {
		claude.Banner(q.Q)
		text, tr := answer(ctx, client, q)
		fmt.Println(text)
		b, _ := json.Marshal(tr)
		fmt.Println("trace:", string(b))
	}
}
