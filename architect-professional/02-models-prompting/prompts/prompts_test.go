package prompts

import (
	"strings"
	"testing"
	"time"
)

func req(now time.Time, advisor, client string) Request {
	return Request{
		Task: TaskMeetingBrief, Now: now, Advisor: advisor, ClientID: client,
		Client: map[string]any{"risk_profile": "moderate", "age": 61, "holdings": map[string]float64{"bonds": 0.4, "equity": 0.6}},
		Notes:  []string{"Retiring next spring."},
		Ask:    "Prepare the brief.",
	}
}

// The cached prefix must be byte-identical across requests, or the cache never hits.
func TestSystemIsStable(t *testing.T) {
	for _, task := range []Task{TaskTagNote, TaskMeetingBrief, TaskSuitabilityCheck} {
		a := Params(Request{Task: task, Now: time.Date(2026, 10, 1, 9, 0, 0, 0, time.UTC), Advisor: "R. Osei", ClientID: "C-1"})
		b := Params(Request{Task: task, Now: time.Date(2026, 10, 20, 17, 30, 0, 0, time.UTC), Advisor: "M. Lindqvist", ClientID: "C-2"})
		for i := 0; i < 20; i++ { // repeat: catches map-order randomness
			c := Params(Request{Task: task, Now: time.Now(), Advisor: "x", ClientID: "y"})
			if c.System[0].Text != a.System[0].Text {
				t.Fatalf("%s: system prompt changes between requests", task)
			}
		}
		if a.System[0].Text != b.System[0].Text {
			t.Fatalf("%s: system prompt depends on per-request data", task)
		}
	}
}

func TestVolatileDataAfterBreakpoint(t *testing.T) {
	p := Params(req(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC), "R. Osei", "C-1"))
	sys := p.System[len(p.System)-1]
	if sys.CacheControl.Type == "" {
		t.Fatal("last system block should carry the cache breakpoint")
	}
	for _, s := range []string{"2026-10-20", "R. Osei", "C-1"} {
		if strings.Contains(p.System[0].Text, s) {
			t.Errorf("per-request value %q is in the cached system prompt", s)
		}
	}
}

func TestSameDataRendersSameBytes(t *testing.T) {
	now := time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC)
	first := UserMessage(req(now, "R. Osei", "C-1")).Content[0].OfText.Text
	for i := 0; i < 20; i++ {
		if got := UserMessage(req(now, "R. Osei", "C-1")).Content[0].OfText.Text; got != first {
			t.Fatal("same request rendered differently: check map iteration order")
		}
	}
}

func TestChooseRecordsAReason(t *testing.T) {
	for _, task := range []Task{TaskTagNote, TaskMeetingBrief, TaskSuitabilityCheck} {
		if Choose(task).Why == "" {
			t.Errorf("%s: record why this model and effort were chosen", task)
		}
	}
	if Choose(TaskSuitabilityCheck).Effort == Choose(TaskTagNote).Effort {
		t.Error("a compliance judgement and a labelling call shouldn't get the same effort")
	}
}
