// Package disputes is the fake card-servicing backend for module 01: a
// customer's transactions, open dispute cases, the bank's dispute rules, and
// the inbound messages the intake system has to handle.
//
// Larkspur Bank is fictional and the rules are simplified for study. They are
// not a statement of Regulation E or Regulation Z.
package disputes

import (
	"encoding/json"
	"fmt"
	"time"
)

// Today is fixed so eligibility checks give the same answer every run.
var Today = time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC)

type Transaction struct {
	ID       string  `json:"id"`
	Date     string  `json:"date"` // YYYY-MM-DD
	Merchant string  `json:"merchant"`
	Amount   float64 `json:"amount_usd"`
	Card     string  `json:"card_last4"`
}

type Case struct {
	ID              string  `json:"case_id"`
	TransactionID   string  `json:"transaction_id"`
	Status          string  `json:"status"`
	Opened          string  `json:"opened"`
	ProvisionalPaid bool    `json:"provisional_credit_issued"`
	CreditAmount    float64 `json:"credit_amount_usd"`
	NextStep        string  `json:"next_step"`
	DecisionDueBy   string  `json:"decision_due_by"`
}

var Transactions = []Transaction{
	{"T-8812", "2026-05-14", "PINECREST HOTEL & SUITES", 412.00, "4471"},
	{"T-9020", "2026-09-02", "HARBORLIGHT CINEMAS", 38.50, "4471"},
	{"T-9131", "2026-10-03", "STREAMBOX SUBSCRIPTION", 15.99, "4471"},
	{"T-9132", "2026-10-03", "STREAMBOX SUBSCRIPTION", 15.99, "4471"},
	{"T-9206", "2026-10-19", "NOVA ELECTRONICS ONLINE", 1249.00, "4471"},
	{"T-9207", "2026-10-19", "QUICKFUEL #2231", 95.00, "4471"},
	{"T-9208", "2026-10-19", "NOVA ELECTRONICS ONLINE", 310.00, "4471"},
}

var Cases = map[string]Case{
	"D-7781": {"D-7781", "T-9020", "under_review", "2026-09-30", true, 38.50,
		"Waiting on the merchant's response (requested 2026-10-01).", "2026-11-14"},
}

// Rules the bank applies in code, never in a prompt.
const (
	DisputeWindowDays       = 60
	ProvisionalCreditLimit  = 2500.00 // at or below this, credit is issued while the case is reviewed
	ProvisionalCreditBizDay = 10
)

// Eligibility is the deterministic part of a dispute decision.
type Eligibility struct {
	Eligible            bool   `json:"eligible"`
	Reason              string `json:"reason"`
	ProvisionalCredit   bool   `json:"provisional_credit"`
	DaysSinceTxn        int    `json:"days_since_transaction"`
	RequiresCardReissue bool   `json:"requires_card_reissue"`
}

// Check applies the dispute rules to one transaction. fraud means the customer
// says they didn't make the purchase (as opposed to a billing error).
func Check(t Transaction, fraud bool) Eligibility {
	d, err := time.Parse("2006-01-02", t.Date)
	if err != nil {
		return Eligibility{Reason: "transaction date unreadable: " + t.Date}
	}
	days := int(Today.Sub(d).Hours() / 24)
	e := Eligibility{DaysSinceTxn: days, RequiresCardReissue: fraud}
	if days > DisputeWindowDays {
		e.Reason = fmt.Sprintf("outside the %d-day dispute window (%d days ago)", DisputeWindowDays, days)
		return e
	}
	e.Eligible = true
	e.ProvisionalCredit = t.Amount <= ProvisionalCreditLimit
	e.Reason = "within the dispute window"
	return e
}

func FindTransaction(id string) (Transaction, bool) {
	for _, t := range Transactions {
		if t.ID == id {
			return t, true
		}
	}
	return Transaction{}, false
}

// TransactionsJSON is what a "list transactions" call returns.
func TransactionsJSON() string {
	b, _ := json.Marshal(Transactions)
	return string(b)
}

// Inbound is one customer message arriving at intake.
type Inbound struct {
	ID   string
	Text string
}

var Messages = []Inbound{
	{"M1", "Hi, what's the status of my dispute D-7781?"},
	{"M2", "I was charged twice for StreamBox on Oct 3, $15.99 each. I only have one subscription."},
	{"M3", "I don't recognize three charges from last night: Nova Electronics $1,249, QuickFuel $95 and another Nova charge for $310. I still have my card with me."},
	{"M4", "What's the daily ATM withdrawal limit on my debit card?"},
	{"M5", "Pinecrest Hotel charged me $412 back in May for a room I cancelled. I want that money back."},
}

// FAQ is the small knowledge base for general questions.
const FAQ = `Larkspur Bank card FAQ
- Daily ATM withdrawal limit: $800 for standard debit cards, $1,500 for Premier.
- Daily debit purchase limit: $5,000.
- Lost or stolen card: call 1-800-555-0142 (24/7) or lock the card in the app.
- Disputes: open within 60 days of the transaction in the app or by replying here.`
