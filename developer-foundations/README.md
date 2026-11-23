# Claude Certified Developer – Foundations (CCDV-F) study lab

Hands-on exercises for the developer foundations exam. Each module has a runnable **exercise** with TODOs, a **solution**, and a **README** with the concepts and exam-style questions (answers are collapsed). Three timed mock exams are in [`mock-exams/`](mock-exams/).

> Check the module list against the official exam guide. Domain names and weights can change between versions.

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
4. Diff against the solution: `diff -u developer-foundations/01-agentic-loop/exercise/main.go developer-foundations/01-agentic-loop/solution/main.go` (from the repo root)
5. Answer the exam-style questions *before* expanding the answers.

