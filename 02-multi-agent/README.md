# 02 · Multi-agent orchestration: coordinator and subagents

**Exam domain:** Agentic architecture & orchestration (the most heavily weighted domain)

## What you're building

A coordinator agent splits a research question into subtopics and hands each one to a research subagent. The subagents run in parallel, search a document store and return cited findings. The coordinator then writes the report.

```
go run ./02-multi-agent/exercise
go run ./02-multi-agent/solution
FAIL_SUBAGENT=1 go run ./02-multi-agent/solution   # watch how failure is handled
```

```
              ┌──────────── Coordinator ────────────┐
              │ splits the question, delegates,     │
              │ writes the report                   │
              └──┬──────────────┬──────────────┬────┘
   explicit context│              │              │   (all traffic goes
              ┌───▼───┐      ┌───▼───┐      ┌───▼───┐ through the hub)
              │ Sub A │      │ Sub B │      │ Sub C │  ← own history, own
              └───────┘      └───────┘      └───────┘    narrow tool set
```

## Concepts to know cold

**1. Subagents do not inherit context.** Each subagent starts with an empty history. Anything it needs (the overall goal, its scope, earlier findings) must go explicitly into its prompt. "The subagent should already know X" is a classic wrong answer.

**2. Hub-and-spoke.** Subagents report to the coordinator, not to each other. That gives you one place for observability, error handling and synthesis.

**3. Parallelism comes from several tool calls in one turn.** If the coordinator emits several `delegate_research` calls in one response, your code can run them concurrently. Ask for this in the prompt.

**4. Decomposition quality is the coordinator's job.** A typical exam scenario: the final report is missing whole areas even though every subagent did its job well. The root cause is that the coordinator split the topic too narrowly, so the fix goes in the coordinator's decomposition. Making subagents "search harder" doesn't help.

**5. Keep provenance through synthesis.** Have subagents return structured findings (claim → source ID, year). Otherwise attribution is lost when the coordinator summarises. When sources conflict, report both with their sources and don't quietly pick one.

**6. Least privilege per agent.** Give each subagent only the tools its role needs. Fewer tools also makes tool selection more reliable.

**7. Error propagation.** If a subagent fails, return a structured error (what failed, whether retrying might help, any partial results). Don't crash the whole run, and don't return an empty "success" that the coordinator would treat as "nothing found".

**8. When *not* to use multi-agent.** Several agents add cost and latency. Use them when subtasks are independent and parallelisable, or when one context window would overflow with reading. A fixed, predictable pipeline is better built as a workflow (code-driven prompt chaining).

## Exam-style questions

<details><summary>Q1. A subagent keeps re-researching things the coordinator already found. Why, and what's the fix?</summary>

Subagents can't see the coordinator's history. Put the earlier findings and the exact scope into the delegation's context.
</details>

<details><summary>Q2. Every subagent returns high-quality findings, but the final report on "the impact of AI on creative industries" covers only visual art. Where's the bug?</summary>

In the coordinator's task decomposition, which was too narrow. Fix the coordinator's prompt or logic so subtopics cover the full scope (music, writing, film and so on).
</details>

<details><summary>Q3. A subagent's search times out. Which is best: (a) the coordinator crashes, (b) the subagent returns an empty findings list, (c) the subagent returns a structured error with context, or (d) retry forever?</summary>

(c). The coordinator can then retry once, re-delegate, or report the gap honestly. (b) is the worst choice because it hides the failure as "no evidence exists".
</details>

<details><summary>Q4. Two sources give different statistics. What should the final report do?</summary>

Present both values, each with its source (and date), and note the conflict. Don't silently choose one.
</details>

<details><summary>Q5. Your coordinator delegates one subtopic per turn, waiting each time. How do you cut latency?</summary>

Tell the coordinator to issue all independent delegations in a single response, and run those tool calls concurrently in your code.
</details>

## Stretch goals
1. Add a second subagent type, a "critic" with no tools, that reviews the draft report against the findings and flags unsupported claims. The coordinator calls it before finishing.
2. Make subagents cheaper: run them on `claude-haiku-4-5` and keep the coordinator on Opus. Compare the quality.
3. Count total tokens across all agents. When is the multi-agent version worth its cost?
