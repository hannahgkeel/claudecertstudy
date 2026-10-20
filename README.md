# Claude certification study lab (Go)

Hands-on exercises for each area of the Claude architecture / developer foundations exam. Each module has a runnable **exercise** with TODOs, a **solution**, and a **README** with the concepts and exam-style questions (answers are collapsed).

> Check the module list against the official exam guide. Domain names and weights can change between versions.

## Quick start: mock exams

Three timed CCDV-F practice exams live in [`mock-exams/`](mock-exams/). They're static HTML, so you don't need Go, an API key or a server:

```bash
git clone <repo-url>
open claudecertstudy/mock-exams/index.html   # macOS; use xdg-open on Linux, start on Windows
```

Progress is saved in your browser. If your browser blocks local files, or the **Copy results for Claude** button doesn't copy, serve the folder instead with `python3 -m http.server -d mock-exams 8000` and open `http://localhost:8000`. See [`mock-exams/README.md`](mock-exams/README.md) for the format and scoring.

## Setup

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # from console.anthropic.com
go build ./...                       # everything should compile
go test ./...                        # offline tests (no API key needed)
```

All exercises use `claude-opus-5-5` (set in `internal/claude/claude.go`). For cheaper practice runs, switch to `claude-sonnet-5-5` or `claude-haiku-4-5`. A full run of every solution costs well under a few dollars.

## Modules → exam domains

| # | Module | Domain | Main skills |
|---|---|---|---|
| 01 | [Agentic loop](01-agentic-loop/) | Agentic architecture & orchestration | `stop_reason` loop, tool results, **policy enforced in code, not the prompt** |
| 02 | [Multi-agent](02-multi-agent/) | Agentic architecture & orchestration | Coordinator/subagents, explicit context passing, parallel fan-out, error propagation, provenance |
| 03 | [Tool design](03-tool-design/) | Tool design & MCP | Descriptions that route correctly, structured errors, strict schemas, `tool_choice`, a tool-selection eval |
| 04 | [MCP](04-mcp/) | Tool design & MCP | Go MCP server (tools + resource), MCP→Claude bridge, `.mcp.json` scopes and env vars |
| 05 | [Claude Code](05-claude-code/) | Claude Code configuration & workflows | CLAUDE.md hierarchy, path rules, skills, subagents, **Go PreToolUse hook**, CI with `claude -p` |
| 06 | [Structured output](06-structured-output/) | Prompt engineering & structured output | JSON schema output, nullable fields, few-shot, validate→retry, Batches API |
| 07 | [Context & reliability](07-context-reliability/) | Context management & reliability | Case facts, trimming tool output, escalation criteria, prompt caching |

**Suggested order:** 01 → 03 → 02 → 06 → 07 → 04 → 05. Agentic architecture is the most heavily weighted domain, so go back over 01 and 02 before the exam.

## How to use each module

1. Read the module README.
2. Run the **exercise** as-is and notice what goes wrong.
3. Fill in the TODOs and run it again.
4. Diff against the solution: `diff -u 01-agentic-loop/exercise/main.go 01-agentic-loop/solution/main.go`
5. Answer the exam-style questions *before* expanding the answers.

## Ideas that recur across the exam

1. **Deterministic over probabilistic** for anything that must always hold: hooks, gates and validation in code, *plus* clear prompts.
2. **Explicit beats implicit.** Subagents get context passed in, escalation has stated criteria, prompts have concrete definitions of what to report.
3. **Errors are information.** Use a category, whether it's retryable, and partial results. Never an empty success.
4. **Narrow scope per agent.** Few, well-described tools; least privilege; isolated context for noisy work.
5. **Fix the root cause.** Bad routing means fixing descriptions; missing coverage means fixing decomposition; lost facts means a case-facts block. Distractor answers usually add machinery (classifiers, bigger models, more retries) without fixing the cause.

## Exam answers vs. today's API

A few things that are textbook answers may behave differently on the newest models:
- **Forced `tool_choice` (`any` / a named `tool`)** is the classic way to guarantee a structured response. On Claude Opus 5.5, Sonnet 5.5 and Fable 5.1 it returns a 400. Use structured outputs (`output_config.format`) or `strict: true` with `auto`. The exercises use the current approach.
- **Assistant prefill** (putting `{` at the start of the reply) is rejected on current models. Use structured outputs.
- **`budget_tokens`** for extended thinking has been replaced by adaptive thinking plus `effort`.

Every request here also turns on server-side refusal fallbacks (`internal/claude/claude.go`). If a safety classifier declines a request, it's retried on a fallback model instead of just stopping.
