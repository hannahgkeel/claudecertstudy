# 01 · Solution design and architecture

**Exam domain:** 1. Solution Design & Architecture (17%)

## What you're building

Card-dispute intake for Larkspur Bank (fictional). Five customer messages arrive: a case-status question, a duplicate charge, three unrecognized charges, an FAQ question, and a five-month-old hotel charge. The exercise sends all five to one agent that has every tool and applies the dispute rules from its prompt. The solution classifies each message and gives each kind the simplest pattern that handles it, with the money rules in code and a decision log that feeds evals.

```
go run ./architect-professional/01-solution-design/exercise
go run ./architect-professional/01-solution-design/solution
go run ./architect-professional/01-solution-design/solution -only M3   # just the fan-out case
go test ./architect-professional/01-solution-design/...                # offline rule tests
```

Compare the `cost:` lines. The FAQ question should take one or two calls in the solution, not an agent loop.

## Concepts to know cold

**1. Start from the business problem, not the model.** Before choosing a pattern, pin down:
- the decision being automated and who owns it today
- the value pillar it serves: efficiency (handle time), productivity (cases per analyst), cost, transformation (a new capability), or a performance SLA (first response in 2 minutes)
- the cost of an error, and who catches it
- what "good" looks like in numbers, so you can evaluate it (module 04)

If you can't name the metric, you can't defend the design to stakeholders (module 06).

**2. The building blocks, simplest first.** Use the least autonomy that solves the problem.

| Pattern | What it is | Use when |
|---|---|---|
| Augmented LLM | One call, with retrieval, tools or memory supplied by code | The task is one step once the context is right |
| Prompt chaining | Fixed sequence of calls, with code gates between steps | Steps are known; you want to check each step |
| Routing | Classify, then send to a specialised handler | Inputs fall into distinct categories with different handling |
| Parallelization | Sectioning (independent subtasks at once) or voting (same task several times) | Subtasks are independent, or you need confidence from agreement |
| Orchestrator-workers | A model breaks the task into subtasks it decides at runtime | You can't predict the subtasks in advance |
| Evaluator-optimizer | One call drafts, another critiques against criteria, loop | Clear criteria exist and iteration measurably helps |
| Agent | The model plans, calls tools and decides when it's done | Open-ended, multi-step work you can't specify in advance |

Workflows are predefined code paths. Agents choose their own path. Move up the table only when the simpler pattern measurably fails.

**3. Should this be an agent?** Check all four. A "no" on any of them means stay with a workflow.
- **Complexity:** multi-step and hard to specify in advance?
- **Value:** does the outcome justify more cost and latency?
- **Viability:** can Claude do this kind of task well?
- **Cost of error:** can mistakes be caught and reversed (tests, review, rollback)?

Card disputes fail the first test: the steps are known. They also have a high cost of error, so the rules belong in code.

**4. End-to-end architecture has four stages.** Input (channels, validation, PII handling) → processing (classification, retrieval, model calls, business rules in code) → output (reply, actions, structured records) → **feedback** (logged decisions plus their real outcomes). The feedback loop is what turns production traffic into eval sets and tells you when quality drifts. A design without one can't improve and can't prove it works.

**5. Decomposition.** Split work along boundaries that matter:
- **By determinism:** anything with a right answer (eligibility windows, limits, arithmetic) goes to code.
- **By independence:** independent subtasks can run in parallel (one worker per disputed charge).
- **By context:** reading-heavy subtasks go to a subagent or worker that returns a summary, so the coordinator's context stays clean.
- **By risk:** irreversible actions are separate steps with their own controls (module 05).

**6. Multi-agent systems have a cost.** They help with parallel breadth, context isolation and specialised tool sets. They cost more tokens (each agent re-reads its context), add coordination failure modes, and are harder to debug. Coordinators must pass context explicitly, because subagents don't share memory. Pick multi-agent only when a single agent's context or latency is the measured bottleneck.

**7. Model choice is per step, not per system.** A labelling step can run at low effort, and possibly on a smaller model if an eval shows quality holds. A customer-facing reply or a complex investigation may need more. Measure the most capable model at lower effort before building a multi-model cascade (module 02).

## Exam-style questions

<details><summary>Q1. Mortgage-servicing emails fall into five known categories, each with a fixed procedure. The team proposes one autonomous agent with 25 tools. What do you recommend?</summary>

A routing workflow. Classify each email, then send it to a handler built for that category, using chains with code gates where rules apply. The procedures are known, so an agent adds cost, latency and unpredictability, and 25 tools make tool selection worse.
</details>

<details><summary>Q2. When is an orchestrator-workers design better than parallel sectioning?</summary>

When the subtasks can't be known in advance and the orchestrator has to decide them from the input, such as researching an open question. If the subtasks are fixed (one per disputed charge), sectioning in code is simpler and cheaper.
</details>

<details><summary>Q3. A design passes the demo, but the team can't say whether it got better after a prompt change. What's missing?</summary>

A feedback loop: logging each decision with its outcome so you can build eval sets from real traffic and compare versions. Add the metric definitions from the business case.
</details>

<details><summary>Q4. A wealth-management assistant decides whether a client is eligible for a fee waiver, using rules written in the system prompt. Audit finds inconsistent decisions. Fix?</summary>

Move the eligibility rules into code (a deterministic gate) and let the model handle language: gathering facts and explaining the decision. Prompts guide behaviour; they don't guarantee it.
</details>

<details><summary>Q5. An executive asks which value pillar a claims-triage assistant serves. Handle time drops from 9 minutes to 4, with the same headcount. Which pillar, and what SLA would you write?</summary>

Efficiency, which shows up as productivity (more claims per adjuster). An SLA could be "p95 time to first triage decision under 2 minutes, with at least 95% routing accuracy on the monthly eval set". Name both the speed and the quality bar.
</details>

<details><summary>Q6. A multi-agent research system costs four times what a single agent did, and the answers are no better. What should you check first?</summary>

Whether the work actually benefits from parallel breadth or context isolation. If not, go back to a single agent or a workflow. Then check that the coordinator passes complete context to subagents and that subagents return condensed results, not raw text.
</details>
