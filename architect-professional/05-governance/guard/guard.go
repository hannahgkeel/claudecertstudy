// Package guard holds module 05's controls: PII redaction, an action policy
// with human approval, an output check, and an audit record. These run in
// code around the model, so they hold whatever the prompt or the input says.
package guard

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"
)

// ---------- 1. Redaction: minimize what the model, logs and vendors see ----------

var (
	ssnRe  = regexp.MustCompile(`\b\d{3}-\d{2}-\d{4}\b`)
	panRe  = regexp.MustCompile(`\b(?:\d[ -]?){12,18}\d\b`)
	acctRe = regexp.MustCompile(`(?i)\b(account|acct)(\s*(?:no\.?|number|#))?\s*:?\s*(\d{6,17})\b`)
)

// Luhn separates real card numbers from order numbers and phone numbers,
// so redaction doesn't destroy data the task needs.
func Luhn(digits string) bool {
	sum, double := 0, false
	for i := len(digits) - 1; i >= 0; i-- {
		d := int(digits[i] - '0')
		if double {
			if d *= 2; d > 9 {
				d -= 9
			}
		}
		sum += d
		double = !double
	}
	return len(digits) >= 13 && sum%10 == 0
}

func onlyDigits(s string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, s)
}

// Redact replaces SSNs, card numbers and account numbers, keeping the last
// four digits so staff can still match records. It returns what it found.
func Redact(s string) (string, []string) {
	var found []string
	s = ssnRe.ReplaceAllStringFunc(s, func(m string) string {
		found = append(found, "ssn")
		return "[SSN ***-**-" + m[len(m)-4:] + "]"
	})
	s = panRe.ReplaceAllStringFunc(s, func(m string) string {
		d := onlyDigits(m)
		if !Luhn(d) {
			return m
		}
		found = append(found, "card")
		return "[CARD ••••" + d[len(d)-4:] + "]"
	})
	s = acctRe.ReplaceAllStringFunc(s, func(m string) string {
		sub := acctRe.FindStringSubmatch(m)
		found = append(found, "account")
		n := sub[3]
		return sub[1] + " [••••" + n[len(n)-4:] + "]"
	})
	return s, found
}

// ---------- 2. Action policy: code decides, a human approves the risky ones ----------

type Verdict string

const (
	Allow         Verdict = "allow"
	NeedsApproval Verdict = "needs_approval"
	Block         Verdict = "block"
)

type Wire struct {
	AmountUSD         float64 `json:"amount_usd"`
	Payee             string  `json:"payee"`
	PayeeAgeDays      int     `json:"payee_age_days"`      // how long the payee has been on file
	ContactChangeDays int     `json:"contact_change_days"` // days since phone or email changed; -1 if never
	RequestedVia      string  `json:"requested_via"`       // "customer" or "document": where the instruction came from
}

type Decision struct {
	Verdict Verdict  `json:"verdict"`
	Reasons []string `json:"reasons"`
}

const (
	DailyOnlineLimit  = 15000.00 // POL-114 v3
	AutoApproveLimit  = 1000.00
	CallbackThreshold = 5000.00
)

// DecideWire applies the wire policy. The model can propose a wire; only this
// function decides whether it runs, waits for a person, or is refused.
func DecideWire(w Wire) Decision {
	var d Decision
	if w.RequestedVia != "customer" {
		return Decision{Block, []string{"the instruction came from content (" + w.RequestedVia + "), not from the customer"}}
	}
	if w.AmountUSD <= 0 {
		return Decision{Block, []string{"amount must be positive"}}
	}
	if w.AmountUSD > DailyOnlineLimit {
		return Decision{Block, []string{fmt.Sprintf("over the $%.0f daily online limit", DailyOnlineLimit)}}
	}
	if w.PayeeAgeDays < 30 && w.AmountUSD > CallbackThreshold {
		d.Reasons = append(d.Reasons, "new payee over $5,000: callback to a number on file for 30+ days")
	}
	if w.ContactChangeDays >= 0 && w.ContactChangeDays < 30 {
		d.Reasons = append(d.Reasons, "contact details changed in the last 30 days")
	}
	if w.AmountUSD > AutoApproveLimit {
		d.Reasons = append(d.Reasons, fmt.Sprintf("over the $%.0f auto-approve limit", AutoApproveLimit))
	}
	if len(d.Reasons) > 0 {
		d.Verdict = NeedsApproval
		return d
	}
	return Decision{Allow, []string{"within limits, established payee"}}
}

// ---------- 3. Output check before anything reaches the customer ----------

var promiseRe = regexp.MustCompile(`(?i)\b(guarantee[ds]?|you will (definitely )?(get|receive) (your|the) (money|funds) back|risk[- ]free)\b`)

// CheckOutput returns the problems with a customer-facing reply. Any problem
// means the reply goes to a human instead of the customer.
func CheckOutput(reply string) []string {
	var problems []string
	if _, found := Redact(reply); len(found) > 0 {
		problems = append(problems, "contains unredacted "+strings.Join(found, ", "))
	}
	if m := promiseRe.FindString(reply); m != "" {
		problems = append(problems, "promises an outcome: \""+m+"\"")
	}
	return problems
}

// ---------- 4. Audit: who did what, decided by what, approved by whom ----------

type Event struct {
	At       string   `json:"at"`
	Actor    string   `json:"actor"` // the signed-in customer or staff member
	Agent    string   `json:"agent"` // agent name and prompt version
	Action   string   `json:"action"`
	Input    string   `json:"input"` // redacted
	Decision Decision `json:"decision"`
	Approver *string  `json:"approver"`
}

func Audit(actor, agent, action, input string, d Decision, approver *string) string {
	red, _ := Redact(input)
	b, _ := json.Marshal(Event{time.Now().UTC().Format(time.RFC3339), actor, agent, action, red, d, approver})
	return string(b)
}
