// Solution: a modular, cache-friendly prompt with a model and effort per task.
//
//	go run ./architect-professional/02-models-prompting/solution
//	go test ./architect-professional/02-models-prompting/prompts   # offline checks on the prompt library
//
// Watch the [tokens] lines. The first request writes the cache; later requests
// for the same task read it. The suitability check uses high effort; tagging
// uses low.
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"claudecertstudy/architect-professional/02-models-prompting/clients"
	"claudecertstudy/architect-professional/02-models-prompting/prompts"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

func main() {
	ctx := context.Background()
	client := claude.NewClient()

	// Count the stable prefix once, so you know whether it clears the model's
	// minimum cacheable length and what caching saves per request.
	for _, t := range []prompts.Task{prompts.TaskTagNote, prompts.TaskMeetingBrief, prompts.TaskSuitabilityCheck} {
		n, err := client.Messages.CountTokens(ctx, anthropic.MessageCountTokensParams{
			Model:    claude.Model,
			System:   anthropic.MessageCountTokensParamsSystemUnion{OfTextBlockArray: prompts.System(t)},
			Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock("."))},
		})
		if err != nil {
			log.Fatal(err)
		}
		c := prompts.Choose(t)
		fmt.Printf("%-18s prefix ≈ %d tokens · %s, effort %s (%s)\n", t, n.InputTokens, c.Model, c.Effort, c.Why)
	}

	// Run every call twice: the second pass should read the cache.
	for pass := 1; pass <= 2; pass++ {
		for _, call := range clients.Calls {
			r := prompts.Request{Task: prompts.Task(call.Task), Now: time.Now(), Advisor: call.Advisor,
				ClientID: call.ClientID, Client: call.Client, Notes: call.Notes, Ask: call.Ask}
			claude.Banner(fmt.Sprintf("pass %d · %s · %s", pass, call.Task, call.ClientID))
			start := time.Now()
			resp, err := client.Messages.New(ctx, prompts.Params(r))
			if err != nil {
				log.Fatal(err)
			}
			u := resp.Usage
			fmt.Printf("[tokens] input=%d cache_write=%d cache_read=%d output=%d · %s · prompt %s\n",
				u.InputTokens, u.CacheCreationInputTokens, u.CacheReadInputTokens, u.OutputTokens,
				time.Since(start).Round(time.Millisecond), prompts.Version)
			if pass == 1 {
				fmt.Println(claude.Text(resp))
			}
		}
	}
}
