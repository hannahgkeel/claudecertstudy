# 02 · Claude models, prompting and context engineering

**Exam domain:** 2. Claude Models, Prompting & Context Engineering (13%)

## What you're building

The prompt layer of an advisor assistant at Larkspur Wealth (fictional): tagging call notes, writing meeting briefs and checking proposals against a suitability policy. The exercise "turns caching on" but never gets a cache hit, and runs every task at maximum effort. The solution is a small prompt library (`prompts/`) with versioned fragments in a fixed order, the volatile data after the cache breakpoint, and a model and effort per task.

```
go run ./architect-professional/02-models-prompting/exercise -check   # offline: fails until you fix the TODOs
go run ./architect-professional/02-models-prompting/exercise          # live: cache_read stays 0
go run ./architect-professional/02-models-prompting/solution          # live: pass 2 reads the cache
go test ./architect-professional/02-models-prompting/prompts          # offline checks on the reference library
```

## Concepts to know cold

**1. Model selection is a trade-off you write down.** Weigh capability, latency, cost, context window and feature support, per step, not per system.

| Model | ID | Context | $ per 1M in / out | Typical fit |
|---|---|---|---|---|
| Claude Fable 5.1 | `claude-fable-5-1` | 1M | 10 / 50 | The hardest reasoning and long-horizon agent work |
| Claude Opus 5.5 | `claude-opus-5-5` | 1M | 4 / 20 | Default for complex work and agents |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 1M | 2 / 10 | Everyday coding, agents and enterprise work at lower cost |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | 1 / 5 | High-volume, latency-sensitive, simpler tasks |

- **Effort** (`output_config.effort`: low → max) is the first lever within one model. Lower effort means fewer thinking tokens, fewer tool calls and shorter answers. Claude Opus 5.5 defaults to `medium`, so set it explicitly.
- **Measure before you build a cascade.** The most capable model at lower effort often matches a smaller model's quality at similar cost. One model also means one cache, because caches are per model.
- **Features differ by model and platform.** Haiku 4.5 doesn't accept `effort` and needs a 4,096-token prefix before it caches; the newest models cache from 512 tokens. Bedrock, Vertex and Foundry don't have every first-party feature (module 03). Check before you design around a feature.
- Prices are first-party API rates; Bedrock and Vertex price separately.

**2. System prompts, templates and guardrails.**
- Put the role, the rules and the output format in the system prompt. Use XML tags to separate instructions from data (`<suitability_policy>`, `<client_profile>`, `<notes>`).
- Templates fix the output shape per task so downstream code and readers can rely on it. For machine-read output, use structured outputs (`output_config.format`), not "reply in JSON".
- Guardrails in a prompt guide behaviour; they don't guarantee it. Anything that must always hold (no account numbers in output, a limit, an approval) needs a check in code as well (module 05).

**3. Prompting techniques.**
- **Zero-shot** for clear tasks; **few-shot** when format or judgement is subtle. Examples should be diverse, cover the edge cases, and be in a fixed order.
- **Chain of thought:** on current models use adaptive thinking with `effort`, not "think step by step" text or a `budget_tokens` setting (budgets return a 400 on Opus 5.5, Sonnet 5.5 and Fable 5.1). Ask for reasoning in the output only when someone needs to read it.
- **Assistant prefill is rejected** on current models, and forced `tool_choice` returns a 400 on Opus 5.5, Sonnet 5.5 and Fable 5.1. Use structured outputs for a guaranteed shape.

**4. Context windows and token use.**
- Count with the token-counting endpoint (`count_tokens`), not a third-party tokenizer.
- Put long documents first and the question last. Use section headers; models attend best to the beginning and end.
- Trim tool results to the fields the task needs, and use context editing (clears old tool results) or compaction (summarises old turns) for long sessions.
- A bigger window isn't a fix for noise. Retrieval (module 03) or subagents that return summaries keep context focused.

**5. Reuse: caching, modular prompts and Skills.**
- **Prompt caching** matches an exact prefix in the order tools → system → messages. Stable content first; anything that varies (timestamps, user names, request IDs, randomly ordered JSON or examples) after the last breakpoint. Up to 4 breakpoints, 5-minute default TTL or 1 hour. Cache reads cost a small fraction of base input ($0.20 per million tokens on Opus 5.5 and Sonnet 5.5, against $4 and $2 uncached) and cut time to first token. Cache writes cost 1.25× base input for the 5-minute TTL and 2× for 1 hour, so a 5-minute cache pays off from the second request. Check `usage.cache_read_input_tokens`; 0 on repeat requests means a silent invalidator.
- **Modular prompts:** one fragment per concern, assembled in a fixed order, with a version string logged with every result. That's how you tie a quality change to a prompt change and roll back.
- **Skills** package instructions, scripts and reference files in a folder with a `SKILL.md`. Only the short description sits in context until the skill is relevant, then the body loads (progressive disclosure). Use them for procedures several teams or agents reuse, instead of copying the text into every system prompt.

## Exam-style questions

<details><summary>Q1. Every request sends the same 9,000-token policy plus a short question. Latency and cost are both too high. What's the most direct fix?</summary>

Put the static policy first, mark it with `cache_control`, and keep the varying question after it. Repeat requests read the cached prefix, cutting cost and time to first token without dropping needed context.
</details>

<details><summary>Q2. Caching is configured but `cache_read_input_tokens` is always 0. The system prompt starts with "Advisor: {name}, Date: {today}". Why?</summary>

The prefix differs on every request, so it never matches. Move per-request values into the user message, after the breakpoint. Also check for map-ordered JSON and changing tool lists.
</details>

<details><summary>Q3. A team wants Haiku 4.5 for all tasks to save money. What do you ask for first?</summary>

An eval per task comparing quality, latency and cost per completed task against the current model at lower effort. Also check feature fit: Haiku 4.5 has a 200K context window, no `effort` parameter, and a 4,096-token caching minimum.
</details>

<details><summary>Q4. A prompt says "Think step by step" and sets a thinking budget. On Claude Opus 5.5 the request returns a 400. Why, and what replaces it?</summary>

`budget_tokens` is removed on Opus 5.5. Thinking is adaptive and always on; control depth with `output_config.effort`. Remove the "think step by step" text unless the reasoning must appear in the answer.
</details>

<details><summary>Q5. Five product teams copy the same 3-page KYC procedure into their system prompts, and the copies have drifted. What's the reuse strategy?</summary>

Put the procedure in one versioned place, either a Skill or a shared prompt fragment, and have every team load it. Log the version with results, so a change can be evaluated and rolled back once.
</details>

<details><summary>Q6. Few-shot examples improved tagging accuracy, but outputs now copy the examples' wording. Fix?</summary>

Make the examples more diverse (different wording, lengths and edge cases) and say they illustrate the format and judgement, not phrases to reuse. Check the result with the tagging eval.
</details>
