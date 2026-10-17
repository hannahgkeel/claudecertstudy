// Worked example: the same extraction through the Message Batches API.
// Batches cost 50% less and finish within 24 hours (usually much sooner).
// Good for overnight backlogs, not for anything a user is waiting on.
//
//	go run ./06-structured-output/batch
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"claudecertstudy/06-structured-output/extract"
	"claudecertstudy/06-structured-output/invoices"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

func main() {
	ctx := context.Background()
	client := claude.NewClient()

	// 1. One request per document. custom_id is how you match results back:
	//    results can arrive in ANY order.
	var reqs []anthropic.MessageBatchNewParamsRequest
	for _, doc := range invoices.All {
		reqs = append(reqs, anthropic.MessageBatchNewParamsRequest{
			CustomID: doc.ID,
			Params: anthropic.MessageBatchNewParamsRequestParams{
				Model:        claude.Model,
				MaxTokens:    16000,
				System:       []anthropic.TextBlockParam{{Text: extract.SystemPrompt}},
				OutputConfig: anthropic.OutputConfigParam{Format: anthropic.JSONOutputFormatParam{Schema: extract.Schema}},
				Messages:     []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock("<invoice>\n" + doc.Text + "\n</invoice>"))},
			},
		})
	}
	batch, err := client.Messages.Batches.New(ctx, anthropic.MessageBatchNewParams{Requests: reqs})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("submitted batch", batch.ID)

	// 2. Poll until processing ends.
	for batch.ProcessingStatus != anthropic.MessageBatchProcessingStatusEnded {
		time.Sleep(15 * time.Second)
		batch, err = client.Messages.Batches.Get(ctx, batch.ID, anthropic.MessageBatchGetParams{})
		if err != nil {
			log.Fatal(err)
		}
		c := batch.RequestCounts
		fmt.Printf("  status=%s processing=%d succeeded=%d errored=%d\n", batch.ProcessingStatus, c.Processing, c.Succeeded, c.Errored)
	}

	// 3. Stream results; validate each; collect failures to resubmit.
	var resubmit []string
	stream := client.Messages.Batches.ResultsStreaming(ctx, batch.ID, anthropic.MessageBatchResultsParams{})
	for stream.Next() {
		r := stream.Current()
		switch r.Result.Type {
		case "succeeded":
			msg := r.Result.AsSucceeded().Message
			_, errs := extract.Validate(claude.Text(&msg))
			if len(errs) > 0 {
				fmt.Printf("%s: extracted but invalid %v\n", r.CustomID, errs)
				resubmit = append(resubmit, r.CustomID)
				continue
			}
			fmt.Printf("%s: ok\n", r.CustomID)
		default: // errored, canceled, expired
			fmt.Printf("%s: %s\n", r.CustomID, r.Result.Type)
			resubmit = append(resubmit, r.CustomID)
		}
	}
	if err := stream.Err(); err != nil {
		log.Fatal(err)
	}
	if len(resubmit) > 0 {
		// Only the failed custom_ids go into the next batch, not the whole set.
		fmt.Println("resubmit only these:", resubmit)
	}
}
