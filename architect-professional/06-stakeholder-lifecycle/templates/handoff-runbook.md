# Handoff and runbook: <system name>

## Ownership
| Area | Owner | Backup |
|---|---|---|
| Business outcome | | |
| Prompts, eval set, release gate | | |
| Integration and infrastructure | | |
| On-call | | |

## What's deployed
- Model ID (pinned, never an alias): `claude-opus-5-5` · platform and region:
- Prompt version: `<name@n>` · eval report for this version: <link>
- Tools granted and to which identity (module 03 audit attached).
- Controls in code (module 05): redaction, action policy, approvals, output checks.

## Dashboards and alerts
| Signal | Alert when | First action |
|---|---|---|
| Error rate (429, 5xx, 529) | > 2% for 5 min | See "Provider errors" |
| p95 latency | > SLA for 15 min | Check provider status, effort, context size |
| `stop_reason` = max_tokens | > 1% of requests | Output cap or prompt change |
| Refusals | Above baseline | Sample and review; check fallbacks |
| Cache read ratio | Drops by half | Look for a prefix change in the last deploy |
| Uncited or invented answers (sampled) | Any | Open a quality incident |
| Spend | 80% of monthly budget | Check volume and tokens per task |

## Playbooks
- **Provider errors or overload:** the SDK retries 429/5xx with backoff; if errors persist, switch to the manual queue, post status, and check the provider status page. Don't retry 400s.
- **Quality regression:** roll back to the previous prompt version (one config change), then add the failing cases to the eval set.
- **Prompt-injection or data incident:** disable the affected tool, preserve the audit log, notify Security and Privacy within the agreed window.
- **Cost spike:** check for loops (step caps), context growth and cache misses.

## Lifecycle
- **Monitoring and iteration:** weekly review of sampled cases and metrics with the business owner; feed failures into the eval set.
- **Model deprecation:** when a deprecation notice arrives, run the full eval on the replacement model, shadow it on live traffic if possible, get the gate's sign-off, and migrate before the retirement date.
- **Change control:** every prompt, model, tool or retrieval change goes through the eval and the gate, with an ADR when the design changes.
