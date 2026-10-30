# Claude certification study lab (Go)

Study material for two Claude certifications, one folder each. Every module has a runnable **exercise** with TODOs, a **solution**, and a **README** with concepts and exam-style questions (answers are collapsed). Each certification also has three timed mock exams.

| Certification | Folder | Mock exams |
|---|---|---|
| Claude Certified Developer – Foundations (CCDV-F) | [`developer-foundations/`](developer-foundations/) | 3 × 53 questions |
| Claude Certified Architect – Professional (CCAR-P) | [`architect-professional/`](architect-professional/) | 3 × 63 questions |

Both use one shared exam engine in [`shared/mock-exam/`](shared/mock-exam/) and the shared Claude client in [`internal/claude/`](internal/claude/).

> These are unofficial study materials built from the public exam guides, not exam content.

## Quick start: mock exams

The mock exams are static HTML, so you don't need Go, an API key or a server:

```bash
git clone <repo-url>
open claudecertstudy/developer-foundations/mock-exams/index.html     # CCDV-F
open claudecertstudy/architect-professional/mock-exams/index.html    # CCAR-P
# macOS shown; use xdg-open on Linux, start on Windows
```

Progress is saved in your browser, separately for each certification. If your browser blocks local files, or the **Copy results for Claude** button doesn't copy, serve the repository instead with `python3 -m http.server 8000` from the repo root and open `http://localhost:8000/architect-professional/mock-exams/` (serve from the root, because both exam pages load the shared engine from `../../shared/`).

## Setup for the code modules

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # from console.anthropic.com
go build ./...                       # everything should compile
go test ./...                        # offline tests (no API key needed)
```

All exercises use `claude-opus-5-5` (set in `internal/claude/claude.go`). For cheaper practice runs, switch to `claude-sonnet-5-5` or `claude-haiku-4-5`. A full run of every solution costs well under a few dollars. Run commands from the repository root.

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
