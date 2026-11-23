// Exercise 3: integrate Claude with enterprise data and tools.
//
//	go run ./architect-professional/03-integration-rag/exercise -offline   # retrieval eval + access audit, no API key
//	go run ./architect-professional/03-integration-rag/exercise            # also answers questions with Claude
//
// Run it first. Retrieval misses the POL-114 callback question and feeds the
// model chunks from a superseded wire policy, and the assistant's tool grant
// gets 12 audit findings. Fix the TODOs until recall@3 is 7/7 with no stale
// chunks, and the grant audits clean.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"strings"

	"claudecertstudy/architect-professional/03-integration-rag/access"
	"claudecertstudy/architect-professional/03-integration-rag/rag"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var offline = flag.Bool("offline", false, "skip the live answers")

// TODO(1): Chunking. Fixed 400-character pieces cut tables and rules in half,
// and no chunk says which policy, version or section it came from. Split on
// the "## " section headings instead, and start each chunk with a header line
// like "[POL-114 v3 · Wire Transfer Limits · Daily limits · effective 2026-07-01]".
// Set Section, Effective and Superseded on every chunk.
func chunk(docs []rag.Doc) []rag.Chunk {
	return rag.FixedChunks(docs, 400)
}

var index = rag.NewIndex(chunk(rag.Corpus))

// TODO(2): Retrieval matched to the data and the query.
//   - Metadata filter: keep only chunks in force on asOf (Effective <= asOf,
//     and Superseded empty or after asOf). Why is ranking alone not enough?
//   - Exact lookup: when the query contains a policy or form ID (POL-114,
//     FRM-W8), restrict to that document.
//   - Keep BM25 for the words. When would you add embeddings (hybrid search)?
func retrieve(query, asOf string, k int) []rag.Chunk {
	var out []rag.Chunk
	for _, s := range index.Search(query, k, nil) {
		out = append(out, s.Chunk)
	}
	return out
}

// TODO(3): Least privilege. This grant was copied from an admin prototype.
// Grant only what access.RoleNeeds lists for the role, and run the tools as
// the signed-in user (delegated token), not a shared service account. Why does
// the identity matter even after you remove the extra tools?
var grant = access.Grant{
	Role:     "contact_centre_assistant",
	Identity: "service_account",
	Tools: []string{"search_policies", "get_account_summary", "lookup_transactions", "refund_fee",
		"update_contact_info", "send_wire", "close_account", "export_customer_list"},
}

// TODO(4): Observability. At scale you can't read transcripts. For every
// answer, log one structured record: query, as-of date, retrieved chunk IDs,
// retrieval and model latency, tokens, stop reason, response or request ID,
// prompt version, and whether the answer cited a source. Which of those
// fields would have shown the stale-policy problem in production?
func answer(ctx context.Context, client anthropic.Client, q rag.Question) string {
	var sb strings.Builder
	for _, c := range retrieve(q.Q, q.AsOf, 3) {
		sb.WriteString(c.Text + "\n---\n")
	}
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{Text: "Answer bank staff questions using the policy text provided."}},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			sb.String() + "\nQuestion: " + q.Q))},
	})
	if err != nil {
		log.Fatal(err)
	}
	return claude.Text(resp)
}

func main() {
	flag.Parse()
	claude.Banner("Retrieval eval (offline)")
	rag.PrintEval("your retriever", retrieve, 3)

	claude.Banner("Access audit (offline)")
	usage := map[string]int{"search_policies": 5120, "get_account_summary": 2210, "lookup_transactions": 1980, "refund_fee": 140}
	f := access.Audit(grant, usage)
	fmt.Printf("%d tools, %d findings\n", len(grant.Tools), len(f))
	for _, x := range f {
		fmt.Printf("  [%s] %s: %s\n", x.Severity, x.Tool, x.Issue)
	}

	if *offline {
		return
	}
	ctx := context.Background()
	client := claude.NewClient()
	for _, q := range rag.Questions[:4] {
		claude.Banner(q.Q)
		fmt.Println(answer(ctx, client, q))
	}
}
