// Solution: schema-constrained extraction + semantic validation + retry with
// specific error feedback.
//
//	go run ./06-structured-output/solution
//	go run ./06-structured-output/solution -simulate-error   # force one bad first attempt to watch the retry
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"strings"

	"claudecertstudy/06-structured-output/extract"
	"claudecertstudy/06-structured-output/invoices"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

var simulateError = flag.Bool("simulate-error", false, "corrupt the first attempt so the retry path runs")

func call(ctx context.Context, client anthropic.Client, prompt string) (string, error) {
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     claude.Model,
		MaxTokens: 16000,
		System:    []anthropic.TextBlockParam{{Text: extract.SystemPrompt}},
		// The API constrains decoding to this schema, so the output always
		// parses and has every required field. It does NOT make values right.
		OutputConfig: anthropic.OutputConfigParam{
			Format: anthropic.JSONOutputFormatParam{Schema: extract.Schema},
		},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(prompt))},
	})
	if err != nil {
		return "", err
	}
	if resp.StopReason != anthropic.StopReasonEndTurn {
		return "", fmt.Errorf("stopped with %s", resp.StopReason)
	}
	return claude.Text(resp), nil
}

func extractWithRetry(ctx context.Context, client anthropic.Client, doc invoices.Sample) {
	prompt := "<invoice>\n" + doc.Text + "\n</invoice>"
	const maxAttempts = 3
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		out, err := call(ctx, client, prompt)
		if err != nil {
			log.Fatal(err)
		}
		if *simulateError && attempt == 1 {
			out = corrupt(out)
		}

		inv, errs := extract.Validate(out)
		if len(errs) == 0 {
			pretty, _ := json.MarshalIndent(inv, "", "  ")
			fmt.Printf("attempt %d: valid\n%s\n", attempt, pretty)
			if inv.TotalMismatch {
				// A real discrepancy in the SOURCE isn't an extraction error.
				// Retrying can't fix it, so route it to a human.
				fmt.Println(">> flagged for human review: stated total doesn't match line items")
			}
			return
		}

		fmt.Printf("attempt %d: %d validation error(s)\n", attempt, len(errs))
		for _, e := range errs {
			fmt.Println("   -", e)
		}
		// Retry with the document, the previous output and the SPECIFIC
		// errors. "Try again" alone gives the model nothing to fix.
		prompt = fmt.Sprintf("<invoice>\n%s\n</invoice>\n\n<previous_extraction>\n%s\n</previous_extraction>\n\n"+
			"The previous extraction failed these checks:\n- %s\n\n"+
			"Extract again. Fix only what these errors point to and keep the other fields.",
			doc.Text, out, strings.Join(errs, "\n- "))
	}
	fmt.Println(">> still invalid after retries: send to human review queue")
}

// corrupt adds 100 to calculated_total, to simulate a model arithmetic slip.
func corrupt(out string) string {
	var m map[string]any
	if json.Unmarshal([]byte(out), &m) != nil {
		return out
	}
	if v, ok := m["calculated_total"].(float64); ok {
		m["calculated_total"] = v + 100
	}
	b, _ := json.Marshal(m)
	return string(b)
}

func main() {
	flag.Parse()
	ctx := context.Background()
	client := claude.NewClient()
	for _, doc := range invoices.All {
		claude.Banner(doc.ID)
		extractWithRetry(ctx, client, doc)
	}
}
