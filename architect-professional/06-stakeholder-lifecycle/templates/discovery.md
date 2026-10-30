# Discovery: <system name>

Fill this in with the business owner, the people who do the work today, and Risk/Compliance before any design work. Every "unknown" is a question to resolve, not a gap to fill with an assumption.

## 1. Problem and value
- What decision or task are we changing? Who does it today, and how long does it take?
- Which value pillar: efficiency, productivity, cost, transformation, or a performance SLA?
- Volume: per day, peak per hour, seasonality.
- What does success look like in numbers in 90 days? (for example "median handle time from 9 to 4 minutes with no drop in QA score")

## 2. Users and stakeholders
| Role | Name | Interest | Decision rights |
|---|---|---|---|
| Business owner | | Outcome and budget | Go / no-go |
| Process users | | Daily workflow | Feedback |
| Risk / Compliance | | Regulatory exposure | Approve controls |
| Security / Privacy | | Data handling | Approve data flows |
| Platform / Ops | | Run it | Accept handoff |

## 3. Current process
- Steps, systems touched, hand-offs, exceptions and how they're handled.
- Where errors happen today, and what an error costs (money, customer harm, regulatory).

## 4. Data and integration
- Inputs: sources, formats, languages, quality. Do they contain PII, PCI, PHI?
- Systems of record to read and write, their APIs, auth model (delegated user tokens?), rate limits.
- Residency and retention rules. Which cloud and platform must it run on (first-party API, Bedrock, Vertex, Foundry)?

## 5. Constraints and risks
- Regulations in scope (GDPR, HIPAA, FedRAMP, GLBA, PCI DSS, fair lending, model risk management).
- Actions that must never happen without a human. Actions that must never happen at all.
- Latency and availability needs. Budget per month and per task.

## 6. Acceptance
- The eval set: who labels it, how many cases, which segments and edge cases.
- Hard gates (must-pass) vs targets.
- Pilot plan: who, how long, how we decide to expand or stop.

## 7. Open questions and assumptions
| # | Question or assumption | Owner | Due |
|---|---|---|---|
