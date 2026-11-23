package opsdiag

import (
	"testing"
	"time"
)

func TestClassifyRetryable(t *testing.T) {
	retry := map[int]bool{0: true, 400: false, 401: false, 403: false, 404: false, 413: false, 429: true, 500: true, 529: true}
	for status, want := range retry {
		if got := Classify(Failure{Status: status}).Retryable; got != want {
			t.Errorf("status %d: retryable=%v, want %v", status, got, want)
		}
	}
}

func TestBackoffHonoursRetryAfter(t *testing.T) {
	if got := Backoff(0, "7", 0.5); got != 7*time.Second {
		t.Errorf("retry-after 7: got %s", got)
	}
}

func TestBackoffGrowsAndCaps(t *testing.T) {
	a, b := Backoff(1, "", 0.99), Backoff(4, "", 0.99)
	if !(b > a) {
		t.Errorf("backoff should grow: attempt 1 %s, attempt 4 %s", a, b)
	}
	if c := Backoff(20, "", 0.99); c > 30*time.Second {
		t.Errorf("backoff should cap at 30s, got %s", c)
	}
	if lo, hi := Backoff(3, "", 0), Backoff(3, "", 0.99); lo == hi {
		t.Error("jitter should spread retries")
	}
}
