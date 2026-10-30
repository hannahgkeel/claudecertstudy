// Package opsdiag is module 07's on-call helper: it turns a Claude API
// failure or an unexpected stop reason into a category, whether to retry,
// how long to wait, and what to do next.
package opsdiag

import (
	"errors"
	"math"
	"strconv"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
)

// Failure is what you need from an error to triage it. Log all of it.
type Failure struct {
	Status     int    `json:"status"` // 0 for transport errors (DNS, TLS, timeout)
	Type       string `json:"type"`   // e.g. rate_limit_error, overloaded_error
	RequestID  string `json:"request_id"`
	RetryAfter string `json:"retry_after,omitempty"`
}

// FromError extracts a Failure from an SDK error.
func FromError(err error) Failure {
	var apierr *anthropic.Error
	if !errors.As(err, &apierr) {
		return Failure{}
	}
	f := Failure{Status: apierr.StatusCode, Type: string(apierr.Type()), RequestID: apierr.RequestID}
	if apierr.Response != nil {
		f.RetryAfter = apierr.Response.Header.Get("retry-after")
	}
	return f
}

type Triage struct {
	Category  string `json:"category"`
	Retryable bool   `json:"retryable"`
	Action    string `json:"action"`
}

// Classify maps a failure to an action. Retrying a 400 just repeats the bug
// and burns rate limit; not retrying a 529 turns a blip into an outage.
func Classify(f Failure) Triage {
	switch f.Status {
	case 0:
		return Triage{"transport", true, "retry with backoff; check network, proxy and client timeout settings"}
	case 400:
		return Triage{"invalid_request", false, "fix the request: a bad parameter, a feature removed on this model (budget_tokens, prefill, forced tool_choice on current models), or a beta header not enabled. Read the error message"}
	case 401:
		return Triage{"authentication", false, "credentials: rotated or missing key, both ANTHROPIC_API_KEY and ANTHROPIC_AUTH_TOKEN set, or on Bedrock the AWS credentials or region"}
	case 402:
		return Triage{"billing", false, "billing problem on the account: escalate to the account owner"}
	case 403:
		return Triage{"permission", false, "this credential or workspace can't use this model or feature, or a region restriction applies"}
	case 404:
		return Triage{"not_found", false, "model ID wrong for this platform (Bedrock IDs carry a prefix) or not enabled for the account"}
	case 413:
		return Triage{"too_large", false, "request over the size limit: trim context, split documents, or use the Files API where available"}
	case 429:
		return Triage{"rate_limit", true, "wait for retry-after, then retry; if sustained, smooth traffic, cache prefixes, batch offline work, or request a higher limit"}
	case 529:
		return Triage{"overloaded", true, "retry with backoff and jitter; if it persists, degrade gracefully (queue, manual path) rather than hammering"}
	}
	if f.Status >= 500 {
		return Triage{"server", true, "retry with backoff; if it persists, check the status page and open a ticket with the request ID"}
	}
	return Triage{"unknown", false, "log the request ID and investigate"}
}

// Backoff honours retry-after when the API sends it, and otherwise uses
// capped exponential backoff with jitter so many clients don't retry in sync.
// rnd is a random number in [0, 1).
func Backoff(attempt int, retryAfter string, rnd float64) time.Duration {
	if s, err := strconv.ParseFloat(retryAfter, 64); err == nil && s >= 0 {
		return time.Duration(s * float64(time.Second))
	}
	const base, ceiling = 500 * time.Millisecond, 30 * time.Second
	d := time.Duration(math.Min(float64(ceiling), float64(base)*math.Pow(2, float64(attempt))))
	return time.Duration(float64(d) * (0.5 + rnd/2))
}

// StopAdvice covers the failures that arrive as HTTP 200.
func StopAdvice(reason anthropic.StopReason) string {
	switch reason {
	case anthropic.StopReasonMaxTokens:
		return "output was cut off: raise max_tokens (stream for large values) or ask for shorter output"
	case anthropic.StopReasonRefusal:
		return "a safety classifier declined: read stop_details, route per policy, and use server-side fallbacks where available"
	case anthropic.StopReasonPauseTurn:
		return "a server tool paused a long turn: send the response back to continue"
	case anthropic.StopReasonToolUse:
		return "the model wants a tool result: your loop should run the tool and continue"
	}
	return ""
}
