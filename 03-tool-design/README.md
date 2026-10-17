# 03 · Tool design and error handling

**Exam domain:** Tool design & MCP integration

## What you're building

A warehouse assistant with two tools. You start from badly designed tools, measure how often Claude picks the right one, fix them, and measure again. The backend times out, rejects bad input and denies permission, so you also design how those errors look to Claude.

```
go run ./03-tool-design/exercise   # run BEFORE fixing too, to get a baseline
go run ./03-tool-design/solution
```

## Concepts to know cold

**1. The description is the main thing Claude uses to choose a tool.** A good description says:
- what the tool does and what it returns
- the expected input format, with an example
- **when to use it instead of a similar tool** (this is what fixes misrouting)
- what an empty result means

When two tools overlap, the first fix to reach for is clearer names and descriptions, before adding routing logic or few-shot examples. Splitting one vague tool into specific ones, or merging two near-duplicates, is also fair game.

**2. Keep the tool count small per agent.** Selection gets less reliable as the toolset grows (think 4–5 focused tools, not 18). Give each agent or subagent the tools for its role only.

**3. Errors need structure.** Compare:

| Bad | Good |
|---|---|
| `"Error"` | `{"errorCategory":"transient","isRetryable":true,"message":"timeout","hint":"Retry once"}` |
| Failure returned with `is_error: false` | `is_error: true` |
| Empty search result returned as an error | `{"matches":[],"count":0}` returned as success |

Categories to know: **transient** (retry), **validation** (fix the input), **permission** (don't retry, explain to the user), **business/policy** (don't retry, escalate). Mixing up "no results" with "the lookup failed" is a frequent exam trap.

**4. Make schemas strict.** Use `enum`s for closed sets, `pattern` for formats, `required` and `additionalProperties:false`, plus `strict: true` so tool inputs always match the schema.

**5. `tool_choice`.**

| Value | Meaning |
|---|---|
| `auto` (default) | Claude decides whether to call a tool |
| `any` | Must call *some* tool |
| `tool` + name | Must call *that* tool |
| `none` | No tool calls |

Plus `disable_parallel_tool_use: true` to allow at most one call per turn.

> ⚠️ **Exam vs. current API.** Exam material may present `tool_choice: any` or a forced `tool` as the way to guarantee structured output. That's a valid answer in exam terms. **On current models (Claude Opus 5.5, Sonnet 5.5, Fable 5.1), forced `any`/`tool` returns a 400.** In code today, use `auto` plus a prompt instruction, `strict: true`, or structured outputs (`output_config.format`, module 06). Know both.

## Exam-style questions

<details><summary>Q1. An agent keeps calling <code>get_customer</code> when it should call <code>lookup_order</code>. Both descriptions are one line. What's the best first fix?</summary>

Rewrite the descriptions so each says what it returns, its input format, and when to use it instead of the other. Clearer descriptions come before adding classifiers or routing layers.
</details>

<details><summary>Q2. A tool returns <code>"Operation failed"</code> for both timeouts and permission denials. What problem does this cause?</summary>

The agent can't tell whether to retry. It may retry a permission error forever, or give up on a timeout that would have worked on a second try. Return the category and a retryable flag.
</details>

<details><summary>Q3. A search returns no matches, and the tool reports it as an error. The agent tells the user "the system is down." What should change?</summary>

An empty result is a successful query. Return it as success with an empty list so the agent says "nothing matched".
</details>

<details><summary>Q4. One agent has 20 tools and picks the wrong one fairly often. Options?</summary>

Narrow the toolset per agent or role (split into specialised subagents), merge overlapping tools, and sharpen the descriptions.
</details>

## Stretch goals
1. Add a third tool, `reserve_stock`, whose description overlaps with `check_stock`. Write eval cases that would catch misrouting between them.
2. Run the eval 3 times. Is it stable? Why do evals need several samples?
