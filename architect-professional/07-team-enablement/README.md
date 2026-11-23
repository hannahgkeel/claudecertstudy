# 07 · Developer productivity and operational enablement

**Exam domain:** 7. Developer Productivity & Operational Enablement (7%)

## What you're building

Two things a platform lead hands to every team.

1. **A Claude Code setup for the team** (`solution/.claude/`, `solution/managed-settings.json`, `solution/CLAUDE.md`, a skill and an MCP example). The exercise's version allows every shell command, holds an API key in a committed file, and has a CLAUDE.md that says "write good code".
2. **An operable Claude client.** The exercise's helper retries a wrong model ID five times (on top of the SDK's own retries), logs nothing on-call can use, and reports a truncated answer as success. The solution configures the SDK's retries, classifies failures, and logs one structured line per call. It also has a `-classify` command the team's skill uses during incidents.

```
go run ./architect-professional/07-team-enablement/exercise                 # live: slow, noisy, wrong
go run ./architect-professional/07-team-enablement/solution                 # live: a 404 and a max_tokens stop, triaged
go run ./architect-professional/07-team-enablement/solution -classify 529   # no API key needed
go test ./architect-professional/07-team-enablement/opsdiag
```

> `solution/.claude/settings.json` points Claude Code at Amazon Bedrock. If you start `claude` inside `solution/` without Bedrock access, it won't connect. Read the files rather than running Claude Code there, or remove the `env` block first.

## Concepts to know cold

**1. Settings scopes, highest precedence first.**

| Scope | File | Who controls it | Use for |
|---|---|---|---|
| Managed | `managed-settings.json` deployed by IT (macOS `/Library/Application Support/ClaudeCode/`, Linux `/etc/claude-code/`) | The organization; users can't override | Security floor: deny rules for secrets, no bypass mode, the approved platform (Bedrock, region) |
| Command line | flags such as `--allowedTools`, `--model` | The person or CI job | One session |
| Local project | `.claude/settings.local.json` (git-ignored) | Each developer | Personal tweaks for this repo |
| Shared project | `.claude/settings.json` (committed) | The team | Allowed build/test commands, ask rules, hooks, team env |
| User | `~/.claude/settings.json` | Each developer | Personal defaults across repos |

- Permission rules are **allow**, **ask** and **deny**; deny wins. Allow the safe, frequent commands (build, test, vet) so people aren't trained to click "yes" on everything; ask for risky ones (`git push`); deny secrets.
- **Never put credentials in committed settings.** Use environment variables, a credential helper (`apiKeyHelper`), or the cloud provider's identity (AWS credentials for Bedrock).
- **Bedrock:** set `CLAUDE_CODE_USE_BEDROCK=1` and `AWS_REGION`, and use AWS credentials. Put these in managed settings when the whole organization must use Bedrock.

**2. The rest of the team kit.**
- **CLAUDE.md:** short and specific: commands, conventions, data rules, where things live. Project-level is committed; `~/.claude/CLAUDE.md` is personal; subdirectory files add context for that part of the tree.
- **Skills** (`.claude/skills/<name>/SKILL.md`): repeatable procedures (incident triage, release checklist) that load only when relevant.
- **Subagents** (`.claude/agents/`): focused helpers with their own context and tool limits, such as a security reviewer.
- **Hooks:** deterministic checks that run on events (format after every edit, block writes to protected paths). Use a hook when something must always happen, not a CLAUDE.md line.
- **MCP servers:** project scope in `.mcp.json` with `${VAR}` expansion for secrets, so the file can be committed without tokens.
- **Plugins and marketplaces** package all of the above so teams install one versioned bundle instead of copying files.
- **CI:** `claude -p` in headless mode with a narrow `--allowedTools` list and JSON output, for reviews and triage in pipelines.

**3. Improving developer workflows with AI tooling.**
- Explore, then plan, then code, then verify: ask for a plan before edits on anything non-trivial, and give Claude a way to check its work (tests, a build, a screenshot).
- Turn repeated prompts into skills or slash commands; turn repeated review comments into CLAUDE.md lines or hooks.
- Run parallel sessions on separate git worktrees for independent tasks.
- Measure outcomes (PR cycle time, escaped defects, review load), not lines of code generated.

**4. Debugging and operational issue resolution.**

| Symptom | Category | Retry? | First action |
|---|---|---|---|
| 400 `invalid_request_error` | Request bug | No | Read the message: bad parameter, removed feature (`budget_tokens`, prefill, forced `tool_choice` on current models), beta not enabled |
| 401 / 403 | Credentials or permissions | No | Key rotated, both `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` set, AWS credentials or region on Bedrock, workspace or model access |
| 404 | Not found | No | Model ID wrong for this platform (Bedrock prefixes; no date suffixes on current IDs) |
| 413 | Too large | No | Trim context, split documents |
| 429 | Rate limit | Yes, after `retry-after` | Smooth traffic, cache prefixes, batch offline work, raise limits or Bedrock quotas |
| 500 / 529 | Server or overloaded | Yes, with backoff and jitter | Degrade gracefully (queue, manual path); check the status page |
| HTTP 200, cut-off answer | `stop_reason: max_tokens` | Not as-is | Raise `max_tokens` (stream for large values) or ask for less |
| HTTP 200, declined | `stop_reason: refusal` | Depends | Read `stop_details`, route per policy, use fallbacks |
| Slow responses | Latency | n/a | Separate time to first token from total; check context size, cache hits, effort |

- The SDKs already retry 408, 409, 429, 5xx and connection errors with backoff. Configure that (`WithMaxRetries`, timeouts) instead of wrapping it in another loop that multiplies attempts.
- Log the **request ID** on every failure; it's what support needs.

## Exam-style questions

<details><summary>Q1. A team's committed `.claude/settings.json` contains an API key and allows `Bash(*)`. What do you change?</summary>

Remove the key (environment variable, credential helper, or cloud identity), rotate it because it was committed, narrow allow rules to safe frequent commands, add ask rules for risky commands and deny rules for secrets. Put the organization's floor in managed settings.
</details>

<details><summary>Q2. Security wants every developer's Claude Code to deny reading `.env` files and to use Bedrock in one region, with no way to opt out. Where does that go?</summary>

Managed settings, deployed by IT. They take precedence over user and project settings and can't be overridden.
</details>

<details><summary>Q3. Every developer types the same 8-step incident triage prompt. How do you improve the workflow?</summary>

Package it as a skill (or a plugin with the skill) in the repository, so it's versioned, shared and loads only when relevant.
</details>

<details><summary>Q4. A service's Claude calls fail with 404 after a config change. Retries make the incident worse. Why?</summary>

404 isn't retryable: the model ID is wrong (often a date-suffixed or wrong-platform ID). Retries add load and delay. Fix the ID, and classify errors so only retryable ones are retried.
</details>

<details><summary>Q5. Users report answers that stop mid-sentence, but there are no errors in the logs. What do you check?</summary>

`stop_reason`. A `max_tokens` stop returns HTTP 200. Log stop reasons, alert on them, and raise `max_tokens` or ask for shorter output.
</details>

<details><summary>Q6. During a traffic spike you see sustained 429s. Besides honouring retry-after, what reduces them?</summary>

Smooth or queue traffic, cache stable prefixes so each request sends fewer uncached tokens, move offline work to batch where the platform supports it, and request higher limits or Bedrock quotas.
</details>
