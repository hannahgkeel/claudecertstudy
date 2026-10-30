// Solution: an operable Claude client, plus a triage command the team's
// Claude Code skill calls during incidents.
//
//	go run ./architect-professional/07-team-enablement/solution -classify 429
//	go run ./architect-professional/07-team-enablement/solution -classify 400   # no API key needed
//	go run ./architect-professional/07-team-enablement/solution                 # live: a 404 and a max_tokens stop, triaged
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"claudecertstudy/architect-professional/07-team-enablement/opsdiag"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

var classify = flag.String("classify", "", "print the triage for an HTTP status (optionally status:type) and exit")

func main() {
	flag.Parse()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	if *classify != "" {
		status, typ, _ := strings.Cut(*classify, ":")
		n, _ := strconv.Atoi(status)
		b, _ := json.MarshalIndent(opsdiag.Classify(opsdiag.Failure{Status: n, Type: typ}), "", "  ")
		fmt.Println(string(b))
		return
	}

	// The SDK already retries 408/409/429/5xx and connection errors with
	// backoff, honouring retry-after. Configure it rather than wrapping it in
	// a second retry loop that multiplies attempts.
	client := claude.NewClient()
	ctx := context.Background()
	opts := []option.RequestOption{option.WithMaxRetries(4), option.WithRequestTimeout(90 * time.Second)}

	call := func(name string, p anthropic.MessageNewParams) {
		start := time.Now()
		resp, err := client.Messages.New(ctx, p, opts...)
		if err != nil {
			f := opsdiag.FromError(err)
			t := opsdiag.Classify(f)
			// One structured line with everything on-call needs, including the
			// request ID to quote to support.
			logger.Error("claude_call_failed", "call", name, "status", f.Status, "type", f.Type,
				"request_id", f.RequestID, "category", t.Category, "retryable", t.Retryable,
				"action", t.Action, "elapsed_ms", time.Since(start).Milliseconds())
			return
		}
		attrs := []any{"call", name, "message_id", resp.ID, "model", resp.Model, "stop_reason", resp.StopReason,
			"input_tokens", resp.Usage.InputTokens, "cache_read", resp.Usage.CacheReadInputTokens,
			"output_tokens", resp.Usage.OutputTokens, "elapsed_ms", time.Since(start).Milliseconds()}
		if advice := opsdiag.StopAdvice(resp.StopReason); advice != "" && resp.StopReason != anthropic.StopReasonToolUse {
			logger.Warn("claude_call_incomplete", append(attrs, "action", advice)...)
			return
		}
		logger.Info("claude_call_ok", attrs...)
	}

	// A date-suffixed model ID is a classic copy-paste mistake: 404, not retryable.
	call("bad-model-id", anthropic.MessageNewParams{
		Model: "claude-opus-5-5-20260401", MaxTokens: 1000,
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock("ping"))},
	})
	// A max_tokens stop is a failure that arrives as HTTP 200.
	call("truncated", anthropic.MessageNewParams{
		Model: claude.Model, MaxTokens: 40,
		OutputConfig: anthropic.OutputConfigParam{Effort: anthropic.OutputConfigEffortLow},
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(
			"List ten controls for a payments assistant, one sentence each."))},
	})
}
