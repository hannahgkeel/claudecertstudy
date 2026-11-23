// Package clients holds the fake advisory clients and the requests module 02 sends.
package clients

// Call is one request an advisor makes of the assistant.
type Call struct {
	Task     string // tag_note, meeting_brief or suitability_check
	Advisor  string
	ClientID string
	Client   map[string]any
	Notes    []string
	Ask      string
}

var okafor = map[string]any{
	"name": "Grace Okafor", "age": 63, "risk_profile": "moderate", "profile_reviewed": "2025-03-11",
	"investable_assets_usd": 1_850_000, "emergency_reserve_months": 9,
	"known_withdrawals": []map[string]any{{"purpose": "house deposit for daughter", "amount_usd": 120_000, "date": "2027-06"}},
	"holdings":          map[string]float64{"us_equity_index": 0.38, "intl_equity_index": 0.12, "investment_grade_bonds": 0.35, "employer_stock_NRTH": 0.11, "cash": 0.04},
}

var brandt = map[string]any{
	"name": "Walter Brandt", "age": 78, "risk_profile": "conservative", "profile_reviewed": "2026-01-20",
	"investable_assets_usd": 640_000, "emergency_reserve_months": 4, "trusted_contact_on_file": true,
	"holdings": map[string]float64{"short_term_treasuries": 0.45, "dividend_equity_fund": 0.25, "muni_bonds": 0.25, "cash": 0.05},
}

var Calls = []Call{
	{Task: "tag_note", Advisor: "R. Osei", ClientID: "C-2201", Client: okafor,
		Notes: []string{"Grace mentioned she's thinking of retiring a year early, and asked if she can still help with the house deposit next summer."},
		Ask:   "Tag the note."},
	{Task: "meeting_brief", Advisor: "R. Osei", ClientID: "C-2201", Client: okafor,
		Notes: []string{"2026-08-14: asked about Roth conversion before retirement.", "2026-09-30: retiring a year early is now likely; wants to keep the house deposit on track."},
		Ask:   "Prepare my brief for Thursday's review meeting."},
	{Task: "suitability_check", Advisor: "M. Lindqvist", ClientID: "C-3307", Client: brandt,
		Notes: []string{"Walter's nephew suggested a 5-year structured note paying 8% if the S&P doesn't fall more than 30%."},
		Ask:   "Proposal: move $150,000 from short-term treasuries into the structured note. Check it against policy."},
}
