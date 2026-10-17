# 05 · Claude Code configuration and workflows

**Exam domain:** Claude Code configuration & workflows

## What you're building

The Claude Code setup for a (pretend) payments service: memory files, path-scoped rules, a skill, a subagent, permissions, a **Go PreToolUse hook** that blocks dangerous actions, and a CI review script.

```
exercise/   ← files with TODOs
solution/   ← reference setup

# Build and test the hook:
cd 05-claude-code/solution
go build -o .claude/hooks/bin/guard ./.claude/hooks/guard
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | .claude/hooks/bin/guard; echo "exit=$?"

# Try the whole setup live:
claude          # from inside 05-claude-code/solution, then:
                # "/review-pr", "/memory", or ask it to `git push --force`
```

## Where things live

| What | Path | Loaded |
|---|---|---|
| User memory | `~/.claude/CLAUDE.md` | Every project, for you only (not shared with the team) |
| Project memory | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Every session in this repo; committed and shared |
| Subdirectory memory | `some/dir/CLAUDE.md` | When Claude works on files in that directory |
| Path-scoped rules | `.claude/rules/*.md` with a `paths:` glob | Only when the files being touched match the glob |
| Imports | `@docs/architecture.md` inside CLAUDE.md | Pulled in with the file that imports it |
| Skills / slash commands | `.claude/skills/<name>/SKILL.md` (project), `~/.claude/skills/` (personal) | Description always visible; body loaded when invoked |
| Subagents | `.claude/agents/<name>.md` | When delegated to; runs in its own context |
| Shared settings | `.claude/settings.json` | Committed |
| Personal settings | `.claude/settings.local.json` | Not committed |
| MCP servers | `.mcp.json` | Project scope (see module 04) |

**Scope trap:** a new teammate doesn't get instructions that live in *your* `~/.claude/CLAUDE.md`. Team conventions belong in the project file.

## Concepts to know cold

**1. CLAUDE.md should be concrete and short.** Give exact commands, checkable rules and hard boundaries. Move narrow guidance into path-scoped rules so it doesn't take up context on every task. Use `/memory` to see what's loaded.

**2. Path-scoped rules** (`paths: ["**/*_test.go"]`) apply conventions to files *wherever they live*. That beats a subdirectory CLAUDE.md when the files are spread across the repo, like tests.

**3. Skills.** The `description` decides when Claude reaches for a skill, so say *when to use it*. Useful frontmatter:
- `allowed-tools`: restricts what the skill can do
- `context: fork`: runs it in an isolated sub-context so verbose exploration doesn't flood the main conversation
- `argument-hint`: hint for the arguments, available as `$ARGUMENTS`

**4. Subagents** have their own context window, tool list and model. Use them to keep exploration noise out of the main session and to enforce least privilege (a reviewer gets read-only tools).

**5. Hooks give guarantees; CLAUDE.md gives guidance.** A rule that must *always* hold (never edit `.env`, always run the formatter) belongs in a hook. A PreToolUse hook can block a call: exit 2 and stderr is fed back to Claude. PostToolUse runs after a call, which is good for formatting or validation. Same idea as the gate in module 01.

**6. Plan mode or direct execution?** Use plan mode for large, ambiguous or multi-file changes where you want to agree an approach before any edits (architecture changes, migrations, unfamiliar code). Use direct execution for small, well-specified changes (fix this typo, add this field).

**7. CI / non-interactive use.** `claude -p "..."` runs headless. Add `--output-format json` plus `--json-schema` for machine-readable results, `--allowedTools` to restrict tools, and a budget cap. Have a **separate, fresh session** review code rather than the one that wrote it. The authoring session carries its own assumptions and tends to approve its own work.

**8. Session management.** `/compact` summarises a long session. `/clear` starts fresh. `--resume` / `--continue` pick a session back up. If the files changed a lot since the session started, a fresh session with a short summary often beats resuming stale context.

## Exam-style questions

<details><summary>Q1. A new team member's Claude Code isn't following the team's testing conventions, but yours is. Why?</summary>

The conventions are in your user-level `~/.claude/CLAUDE.md`. Move them to the project's `CLAUDE.md` or `.claude/rules/`, which are committed and shared.
</details>

<details><summary>Q2. Test files are scattered through 40 directories. How do you apply test conventions only when Claude edits tests?</summary>

A `.claude/rules/tests.md` with `paths: ["**/*_test.go"]` (or `**/*.test.ts`, etc.). Don't copy a CLAUDE.md into each directory.
</details>

<details><summary>Q3. Claude occasionally edits applied migration files despite CLAUDE.md saying not to. Most reliable fix?</summary>

A PreToolUse hook that blocks edits under `migrations/`. Instructions are probabilistic and hooks are deterministic.
</details>

<details><summary>Q4. A codebase-exploration skill dumps huge amounts of output into the conversation and later work suffers. Fix?</summary>

Set `context: fork` on the skill, or delegate to a subagent, so the exploration runs in isolated context and only the summary comes back.
</details>

<details><summary>Q5. You need to restructure a monolith into services. Plan mode or direct execution?</summary>

Plan mode. It's large and ambiguous with many valid approaches, so agree the plan first. A one-line bug fix with a clear stack trace goes straight to direct execution.
</details>

<details><summary>Q6. Your CI review step produces free text that a script must parse. Better approach?</summary>

`claude -p ... --output-format json --json-schema '<schema>'`, then parse the structured result.
</details>
