// Exercise 7: enable a team to build and run Claude systems.
//
//	go run ./architect-professional/07-team-enablement/exercise
//
// Two parts.
//
// Part 1 is this file: the team's shared Claude helper. Run it live and time
// it. A wrong model ID gets retried five times, nothing in the log helps
// on-call, and a truncated answer is reported as success.
//
// Part 2 is ./.claude/settings.json and ./CLAUDE.md next to this file: the
// team's Claude Code setup. Open them and fix the TODOs in the comments
// below, then compare with ../solution.
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// TODO(1): Retries. The SDK already retries 429, 5xx and connection errors
// with backoff and honours retry-after. This loop retries everything,
// including a 400 or 404 that can never succeed, multiplied by the SDK's own
// retries. Remove the loop, configure option.WithMaxRetries and
// option.WithRequestTimeout, and classify the final error instead.
//
// TODO(2): Logging for on-call. Log one structured line per call: status,
// error type, request ID (errors.As into *anthropic.Error), whether it's
// retryable, and what to do. On success: message ID, model, stop reason,
// tokens, cache reads, latency.
//
// TODO(3): Treat HTTP 200 failures as failures: stop_reason max_tokens and
// refusal.
//
// TODO(4): Team Claude Code setup (./.claude/settings.json, ./CLAUDE.md):
//   - The settings file allows every Bash command and holds an API key. Shared
//     settings are committed to git. What belongs in shared project settings,
//     what in each person's user or local settings, and what in managed
//     settings that IT deploys and nobody can override?
//   - Add deny rules for secrets (.env, secrets/) and ask rules for risky
//     commands (git push).
//   - The team runs Claude through Amazon Bedrock. Which environment settings
//     point Claude Code at Bedrock, and where should they live?
//   - Write a CLAUDE.md that tells Claude the team's commands and conventions,
//     and package the incident triage steps as a skill.
func call(ctx context.Context, client anthropic.Client, p anthropic.MessageNewParams) {
	for attempt := 1; attempt <= 5; attempt++ {
		resp, err := client.Messages.New(ctx, p, option.WithMaxRetries(2))
		if err != nil {
			log.Printf("attempt %d failed: %v", attempt, err)
			time.Sleep(time.Second)
			continue
		}
		fmt.Println("OK:", claude.Text(resp))
		return
	}
	log.Println("gave up")
}

func main() {
	ctx := context.Background()
	client := claude.NewClient()
	start := time.Now()
	call(ctx, client, anthropic.MessageNewParams{
		Model: "claude-opus-5-5-20260401", MaxTokens: 1000,
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock("ping"))},
	})
	call(ctx, client, anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 40,
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			"List ten controls for a payments assistant, one sentence each."))},
	})
	fmt.Println("elapsed:", time.Since(start).Round(time.Millisecond))
}
