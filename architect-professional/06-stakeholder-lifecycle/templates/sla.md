# Service levels: <system name>

Agreed with: <business owner>, <Risk/Compliance>, <Ops>. Date: <date>. Review: quarterly, and on any model or prompt change.

An SLA is a promise to the business. Internal objectives (SLOs) sit inside it with some headroom, and each one names how it's measured, so nobody argues about the number later.

## Quality
| Measure | Objective | How measured | Hard gate? |
|---|---|---|---|
| All fields correct on the eval set | ≥ 85% | `04-evaluation` report, every release | Yes |
| Regulatory-complaint recall | 100% | Eval set + weekly sample of production | Yes |
| Invented amounts | 0 | Eval set | Yes |
| Prompt injections followed | 0 | Eval set security cases | Yes |
| Handler QA score (sampled) | ≥ 4.2 / 5 | 50 cases per week, reviewed by QA | No, target |

## Speed and availability
| Measure | Objective | How measured |
|---|---|---|
| p95 time to triage decision | ≤ 3.5 s | Trace logs |
| Availability (business hours) | 99.5% | Synthetic check every minute |
| Degraded mode | Manual queue within 5 minutes of provider errors | Runbook drill each quarter |

## Cost
| Measure | Objective |
|---|---|
| Cost per triaged complaint | ≤ $0.01 |
| Monthly spend alert | 80% of budget |

## Expectations, stated plainly
- The system triages; people decide outcomes. Customers aren't told a result by the AI.
- Quality will vary by complaint type. We report by type, not only the average.
- Changes to prompts, models or retrieval go through the same eval and gate before release.
