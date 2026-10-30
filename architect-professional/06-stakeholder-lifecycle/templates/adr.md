# ADR-<number>: <decision in a few words>

- **Status:** proposed | accepted | superseded by ADR-<n>
- **Date:**
- **Deciders:**
- **Revisit when:** <a metric crosses a threshold, a model is deprecated, volume doubles>

## Context
What problem, which constraints (from discovery), and which measurements forced a decision now.

## Options considered
| Option | Quality (eval) | p95 latency | Cost / task | Risk | Effort to build and run |
|---|---|---|---|---|---|
| A. | | | | | |
| B. | | | | | |
| C. Do nothing | | | | | |

## Decision
The option chosen and the one-paragraph reason, in terms the business owner would accept.

## Consequences
- What gets better, what gets worse, what we now have to operate.
- Controls this decision depends on (module 05).
- Metrics we'll watch to know if the decision was wrong.

## Example (filled in)
**ADR-007: Route complaint triage through a classifier and per-category handlers instead of one agent.**
Context: one agent with 14 tools took 6.2 calls per complaint and misrouted 9% of fraud cases in the eval.
Options: single agent (91% routing, $0.031/case, p95 11s); routing workflow (97%, $0.008, p95 3.1s); routing workflow on a smaller model (93%, $0.003, p95 1.9s).
Decision: routing workflow on the current model at low effort for the classifier. It meets the 95% routing gate; the smaller model doesn't.
Consequences: four handlers to maintain; the classifier becomes a single point of failure, so its eval runs on every prompt change. Revisit if a smaller model passes the routing gate.
