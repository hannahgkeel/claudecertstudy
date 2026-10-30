# Claude Certified Architect – Professional (CCAR-P) study lab

Hands-on modules for each domain of the CCAR-P exam guide (v1.0, July 2026), plus three timed mock exams. The scenarios are set at a fictional bank, Larkspur, because the exam's audience and examples lean toward regulated industries.

> These are unofficial study materials built from the public exam guide, not exam content. Check the blueprint against the current guide before you book; domains and weights can change between versions.

## The exam at a glance

| | |
|---|---|
| Items | 63 multiple-choice and multiple-response; each says how many to choose |
| Time | 120 minutes |
| Passing score | Scaled 720 on 100–1,000 |
| Fee | $175 per attempt; retakes after 14, 30, then 90 days |
| Validity | 12 months; free renewal assessment if renewed on time |
| Prerequisites | None. Recommended: 3+ years of systems architecture or platform engineering, 6+ months of production work with Claude or a comparable LLM |

## Modules → exam domains

| # | Module | Domain (weight) | What you build |
|---|---|---|---|
| 01 | [Solution design](01-solution-design/) | Solution Design & Architecture (17%) | Card-dispute intake: routing, prompt chains with code gates, parallel fan-out, a decision log |
| 02 | [Models and prompting](02-models-prompting/) | Claude Models, Prompting & Context Engineering (13%) | A versioned, cache-friendly prompt library with a model and effort per task |
| 03 | [Integration](03-integration-rag/) | Integration (19%) | Structure-aware RAG with date filters and ID lookup, a least-privilege grant audit, per-request traces |
| 04 | [Evaluation](04-evaluation/) | Evaluation, Testing & Optimization (16%) | Mixed-method eval: code graders, an LLM-judge rubric, segments, paired A/B, hard gates |
| 05 | [Governance](05-governance/) | Governance, Safety & Risk Management (14%) | Guardrails around a payments agent: redaction, provenance, policy engine, human approval, audit |
| 06 | [Stakeholders and lifecycle](06-stakeholder-lifecycle/) | Stakeholder Communication & Lifecycle Management (14%) | A release gate tied to the SLA, written for executives and engineers, plus discovery, ADR, SLA and handoff templates |
| 07 | [Team enablement](07-team-enablement/) | Developer Productivity & Operational Enablement (7%) | A team Claude Code setup (managed and shared settings, CLAUDE.md, a skill) and an error-triage helper |

**Suggested order:** 03 → 01 → 04 → 05 → 06 → 02 → 07. Integration and solution design together are over a third of the exam. Modules 05 and 06 (28% combined) are what the Developer exam doesn't cover, so give them time even if you know the material from work.

## Running the modules

Every module has offline checks that need no API key:

```bash
go test ./architect-professional/...
go run ./architect-professional/03-integration-rag/solution -offline
go run ./architect-professional/04-evaluation/solution -offline
go run ./architect-professional/06-stakeholder-lifecycle/solution
```

The live runs use `ANTHROPIC_API_KEY` and `claude-opus-5-5` (set in `internal/claude/claude.go`). Each module README lists its commands, and each `exercise/` misbehaves on purpose until you fix its TODOs. Compare with the solution: `diff -u architect-professional/01-solution-design/exercise/main.go architect-professional/01-solution-design/solution/main.go`.

## Mock exams

Open [`mock-exams/index.html`](mock-exams/index.html) in a browser. Three 63-question exams, each with the blueprint's domain counts (11/8/12/10/9/9/4), a timer, a score report by domain, and an answer guide that explains every option. Use "Copy results for Claude" to go through your misses in a Claude Code session.

**Jumping straight to Professional?** Take mock exam 1 cold, before studying. Any domain under 70% tells you which module to start with.
