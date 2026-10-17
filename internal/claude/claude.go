// Package claude holds the small amount of setup every exercise shares, so
// each exercise file can focus on the concept it teaches.
package claude

import (
	"fmt"
	"os"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// Model used by every exercise. Swap to "claude-sonnet-5-5" or
// "claude-haiku-4-5" if you want cheaper runs while studying.
const Model = "claude-opus-5-5"

// NewClient returns a client that reads ANTHROPIC_API_KEY from the
// environment. It also opts every request into server-side refusal
// fallbacks: if a safety classifier declines a request, the API re-serves it
// on a fallback model inside the same call instead of just stopping.
func NewClient() anthropic.Client {
	if os.Getenv("ANTHROPIC_API_KEY") == "" {
		fmt.Fprintln(os.Stderr, "ANTHROPIC_API_KEY is not set. Run: export ANTHROPIC_API_KEY=sk-ant-...")
		os.Exit(1)
	}
	return anthropic.NewClient(
		option.WithHeaderAdd("anthropic-beta", "server-side-fallback-2026-07-01"),
		option.WithJSONSet("fallbacks", "default"),
	)
}

// Text concatenates every text block in a response.
func Text(resp *anthropic.Message) string {
	var sb strings.Builder
	for _, block := range resp.Content {
		if t, ok := block.AsAny().(anthropic.TextBlock); ok {
			sb.WriteString(t.Text)
		}
	}
	return sb.String()
}

// Banner prints a section header so multi-step demos are easy to follow.
func Banner(title string) {
	fmt.Printf("\n===== %s =====\n", title)
}
