// Package rag holds module 03's building blocks: a small policy corpus for a
// fictional bank, a BM25 index, a naive chunker to compare against, and an
// offline retrieval eval. Larkspur Bank and its policies are made up.
package rag

// Doc is one policy document with the metadata retrieval should use.
type Doc struct {
	ID         string // the identifier staff actually type, e.g. POL-114
	Version    int
	Title      string
	Effective  string // YYYY-MM-DD
	Superseded string // YYYY-MM-DD, empty if current
	Body       string // markdown: "## " starts a section
}

var Corpus = []Doc{
	{ID: "POL-114", Version: 2, Title: "Wire Transfer Limits", Effective: "2024-02-01", Superseded: "2026-07-01", Body: `Applies to outgoing domestic and international wires initiated in branch or online.

## Daily limits
| Channel | Personal | Business |
|---|---|---|
| Online banking | $25,000 | $100,000 |
| Branch | $50,000 | $250,000 |

## Callback verification
Wires over $10,000 to a new beneficiary require a callback to the phone number on file before release.

## Cut-off times
Domestic wires received by 4:00 pm ET are sent the same business day.`},

	{ID: "POL-114", Version: 3, Title: "Wire Transfer Limits", Effective: "2026-07-01", Body: `Applies to outgoing domestic and international wires initiated in branch, online or through the mobile app.

## Daily limits
| Channel | Personal | Business |
|---|---|---|
| Online and mobile | $15,000 | $150,000 |
| Branch | $50,000 | $250,000 |
Limits reset at midnight ET. Temporary increases need a relationship manager's request and Operations approval.

## Callback verification
Wires over $5,000 to a new beneficiary, or any wire after a change of phone number or email in the last 30 days, require a callback to a number on file for at least 30 days. Never call back a number supplied in the wire request.

## Cut-off times
Domestic wires received by 4:30 pm ET are sent the same business day. International wires received by 2:00 pm ET are sent the same business day.

## Recalls
A wire can only be recalled with the receiving bank's cooperation. Submit recall requests within 24 hours through Operations; do not promise the customer the funds will return.`},

	{ID: "POL-207", Version: 1, Title: "Overdraft and Returned Item Fees", Effective: "2026-01-15", Body: `Covers consumer checking accounts.

## Fee schedule
| Fee | Amount | Daily cap |
|---|---|---|
| Overdraft item | $25 | 3 per day |
| Returned item (NSF) | $0 | none |
| Extended overdraft (after 7 days) | $0 | none |
No overdraft fee is charged when the account is overdrawn by $50 or less at end of day.

## Refund authority
Tellers and contact-centre staff may refund one overdraft fee per account per rolling 12 months without approval. Further refunds need a branch manager.

## Opt-in
ATM and one-time debit card overdrafts are declined unless the customer has opted in to overdraft coverage.`},

	{ID: "POL-311", Version: 1, Title: "Customer Identification for Account Changes", Effective: "2025-09-01", Body: `## Verification levels
Level 1 (balance enquiries): name plus two of date of birth, last four of SSN, or a recent transaction.
Level 2 (address, phone or email change): Level 1 plus a one-time passcode to the existing phone or email on file.
Level 3 (adding a signer, large wire after a contact change): Level 2 plus in-branch photo ID or a video call with ID.

## Red flags
Pressure to skip steps, requests to send a passcode to a new number, or a caller who knows the full SSN but not recent activity. Stop and escalate to Fraud Operations.`},

	{ID: "FRM-W8", Version: 1, Title: "Form W-8BEN Handling", Effective: "2025-03-01", Body: `## When it is needed
Non-US-person account holders provide Form W-8BEN to claim foreign status and any treaty rate. Without a valid form, backup withholding applies to interest.

## Validity
A W-8BEN stays valid until the last day of the third calendar year after signing, unless circumstances change (for example, a US address is added).

## Where to file
Scan the signed form to the customer's document record and set the tax-status flag. Do not email forms.`},
}
