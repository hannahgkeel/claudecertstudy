# 06 · Stakeholder communication and lifecycle management

**Exam domain:** 6. Stakeholder Communication & Lifecycle Management (14%)

## What you're building

The release step for module 04's complaint-triage prompt. The exercise promotes the candidate because average accuracy went up, and tells the business owner `cat_acc=0.941 (Δ+0.059), reg_recall=0.33…`. The solution gates the release on the SLA agreed in discovery, and writes the result twice: in plain words for the business owner, and as a full metric table for the change record. The `templates/` folder has the documents an architect owns across the lifecycle.

```
go run ./architect-professional/06-stakeholder-lifecycle/exercise          # offline: promotes B
go run ./architect-professional/06-stakeholder-lifecycle/solution          # offline: holds B, releases C
go run ./architect-professional/06-stakeholder-lifecycle/solution -draft   # Claude drafts the stakeholder email from the gate's facts
go test ./architect-professional/06-stakeholder-lifecycle/gate
```

| Template | Use it to |
|---|---|
| [`discovery.md`](templates/discovery.md) | Run structured discovery: problem, value, stakeholders, data, constraints, acceptance |
| [`adr.md`](templates/adr.md) | Record an architectural decision with the options, trade-offs and when to revisit it |
| [`sla.md`](templates/sla.md) | Agree quality, speed and cost levels as measurable numbers |
| [`handoff-runbook.md`](templates/handoff-runbook.md) | Hand the system to operations with owners, alerts, playbooks and a deprecation plan |

## Concepts to know cold

**1. Structured discovery comes before design.** Interview the business owner, the people who do the work today, and Risk/Compliance. Leave with: the decision being changed, the value pillar and its metric, volumes, the cost of an error, the data and systems involved (and their auth model), regulatory constraints, latency and budget limits, and how acceptance will be judged. Write down assumptions and open questions with owners. Most failed AI projects skipped this: they optimized a demo, not a measured business outcome.

**2. Communicate decisions and trade-offs for the audience.**
- **Executives and business owners:** lead with the decision, then impact on customers, cost and risk, then the next step and any decision you need from them. Plain words, no metric names without meaning.
- **Risk and Compliance:** controls, evidence, residual risk, who approves what, and the audit trail.
- **Engineers:** every metric, threshold, version and configuration.
- Present options with their trade-offs (quality, latency, cost, risk, effort to build and run) and recommend one. Record the decision in an ADR.
- Never let a model invent the numbers in a stakeholder message: numbers come from the eval or the gate.

**3. Expectations and SLAs.**
- Agree quality, latency, availability and cost as **numbers with a measurement method**, and say which are hard gates.
- State limits plainly: what the system will and won't decide, that quality varies by segment, and that errors will happen and how they're caught.
- Keep a feedback loop with stakeholders: a regular review of sampled cases and metrics, a channel for issues, and a visible list of changes.
- When a request conflicts with the SLA ("ship it this week anyway"), make the trade-off explicit, name the risk owner, and record the decision.

**4. Document the architecture and guide implementation.** A diagram of components and data flows (including where PII goes), the ADRs, the prompt and model versions, tool grants and identities, the controls in code, the eval set and gate, and the runbook. Write implementation guidance that a team can follow without you: interfaces, conventions, and the tests and evals every change must pass.

**5. Support every lifecycle phase.**

| Phase | Architect's deliverables |
|---|---|
| Discovery | Problem statement, value metric, constraints, acceptance criteria |
| Design | Architecture, ADRs, risk assessment, eval plan |
| Build and validate | Eval set and gate, controls, pilot plan |
| Handoff | Runbook, dashboards, alerts, owners, training |
| Monitoring | Weekly metrics and sampled reviews, drift alerts |
| Iteration | Changes through eval → gate → staged rollout, with rollback |

Plan for model lifecycle too: pin model IDs, watch deprecation notices, re-run the eval on the replacement, shadow it on live traffic where you can, and migrate before the retirement date.

## Exam-style questions

<details><summary>Q1. A business owner asks, "Is the new version better?" Accuracy is up 6 points but regulatory recall fell from 100% to 33%. How do you answer?</summary>

Lead with the decision: "Not yet: we're holding it." Then explain in their terms: it's cheaper and faster, but it misses complaints where customers have gone to a regulator, which must reach Compliance on time. Then the next step and the date.
</details>

<details><summary>Q2. Two months after launch, stakeholders say the assistant "isn't working", but nobody agreed what working meant. What should have happened, and what do you do now?</summary>

Discovery should have produced measurable acceptance criteria and an SLA. Now: agree the metrics and thresholds with the owner, measure the current system against them, and set up a regular review.
</details>

<details><summary>Q3. Your recommendation is a routing workflow rather than the autonomous agent the sponsor asked for. How do you present it?</summary>

Show the options side by side with eval results, latency, cost per task and risk, recommend the workflow with the reason, say what would make the agent worth revisiting, and record it in an ADR.
</details>

<details><summary>Q4. The model your system pins has a retirement date in 90 days. What's the plan?</summary>

Run the full eval on the replacement model, check the hard gates and segments, adjust prompts and effort if needed, shadow or canary on live traffic, get sign-off through the gate, migrate before the date, and update the runbook and ADR.
</details>

<details><summary>Q5. What belongs in the handoff to the operations team?</summary>

Owners and on-call, pinned versions, dashboards and alert thresholds, playbooks (provider errors, quality regression, injection or data incident, cost spike), rollback steps, the eval and gate process for changes, and the deprecation plan.
</details>

<details><summary>Q6. An executive wants the latency SLA cut from 3.5s to 1s next week. How do you respond?</summary>

Say what it would take and what it would cost (lower effort, a smaller model, less context, possibly lower quality), measure the options on the eval, and bring back the trade-off with a recommendation. Don't commit to a number you haven't measured.
</details>
