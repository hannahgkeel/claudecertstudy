# 07 · Context management and reliability

**Exam domain:** Context management & reliability

## What you're building

A five-turn support conversation that stays accurate as it grows. Exact facts survive, tool output is trimmed, escalation follows explicit rules, and the long policy prompt is cached.

```
go run ./07-context-reliability/exercise
go run ./07-context-reliability/solution
go run ./07-context-reliability/solution -no-trim   # watch input tokens balloon
```

## Concepts to know cold

**1. Facts degrade over a long context.** Exact values (amounts, dates, IDs, what was promised) get blurred by summarisation ("about $150 last week") or lost in the middle of a long history. The fix is a **case facts block**: code holds the authoritative values and includes them with every turn. Don't rely on the model to remember, or on a summary to keep the numbers.

**2. Lost in the middle.** Models pay most attention to the beginning and end of long inputs. Put key facts and summaries at the **start** of the newest message, and give long inputs section headers.

**3. Trim tool output before it enters history.** A 40-field API response repeated over 10 turns crowds out what matters. Keep only the fields the task needs. Related API features:
- **Context editing** clears old tool results (`clear_tool_uses`).
- **Compaction** summarises old history server-side.
- Subagents can do read-heavy work in their own context and return only a summary (module 02).

**4. Escalation needs explicit criteria.**
- Escalate when the customer explicitly asks for a human (**immediately**, without trying to solve it first), when policy doesn't cover the case, or when there's no progress after N attempts.
- **Not** based on sentiment alone. Frustration is a reason to acknowledge and keep helping.
- **Not** based on the model's self-reported confidence, which is poorly calibrated.
- The handoff includes a **summary a human can act on** without reading the transcript.

**5. Prompt caching.** The cache matches on an exact **prefix** in the order tools → system → messages.
- Put stable content first and mark it with `cache_control`.
- Anything that changes per request (timestamps, request IDs) goes **after** the last breakpoint. A `time.Now()` in the system prompt silently disables caching.
- There's a minimum cacheable length; shorter prefixes just don't cache.
- Check that it's working with `usage.cache_read_input_tokens`.
- Append to history and don't edit earlier turns; edits break the cached prefix.

**6. Reliability patterns that show up in scenarios.**
- **Error propagation:** a failing component reports *what failed, what was tried and any partial results*. Don't return an empty success (module 02).
- **Provenance:** keep claim→source links through synthesis (module 02).
- **Human review sampling:** even when accuracy looks high overall, spot-check a stratified sample across document types and confidence levels. An aggregate accuracy figure can hide one category that fails badly.
- **Validate, retry, then route to a human** (module 06).

## Exam-style questions

<details><summary>Q1. After 30 turns the agent quotes the wrong refund amount, though the right one appeared early on. Best fix?</summary>

Keep a structured case-facts block (amounts, dates, order IDs) taken from tool results and include it with each turn. A bigger context window or "remember the amount" in the prompt doesn't address the cause.
</details>

<details><summary>Q2. A customer says "this is ridiculous, I've been waiting forever." Should the agent escalate?</summary>

Not on that alone. Acknowledge the frustration and keep solving the problem. Escalate if they ask for a human, if policy doesn't cover the case, or if there's been no progress.
</details>

<details><summary>Q3. Your agent escalates whenever its self-rated confidence is below 7/10, and escalation rates are erratic. Why?</summary>

Self-reported confidence is poorly calibrated. Use explicit, observable criteria instead.
</details>

<details><summary>Q4. Cache reads are always 0 despite cache_control on the system prompt. The prompt starts with "Current time: {now}". Why?</summary>

The prefix changes on every request, so nothing ever matches. Move volatile content after the cached portion, for example into the user message.
</details>

<details><summary>Q5. Order lookups return 40+ fields and context fills up after a few turns. Fix?</summary>

Trim tool results to the relevant fields before adding them to history. Context editing or compaction are options for older turns.
</details>

<details><summary>Q6. Extraction accuracy is 97% overall. Can you stop human review?</summary>

Not without checking by segment. Sample across document types and fields. The 3% might all be in one category, such as handwritten invoices, where accuracy is unacceptable.
</details>
