# 06 · Prompt engineering and structured output

**Exam domain:** Prompt engineering & structured output

## What you're building

An invoice extractor that returns schema-valid JSON, doesn't make up missing fields, checks its arithmetic in code, retries with specific feedback, and sends real source discrepancies to a human. There's also a batch version for overnight backlogs.

```
go run ./06-structured-output/exercise
go run ./06-structured-output/solution
go run ./06-structured-output/solution -simulate-error   # watch the retry loop recover
go run ./06-structured-output/batch                      # Message Batches API
go test ./06-structured-output/extract                   # offline validator tests
```

## Concepts to know cold

**1. Ways to get structured output, from strongest guarantee to weakest**

| Technique | Guarantees |
|---|---|
| `output_config.format` with a JSON schema (structured outputs) | Output parses and matches the schema |
| A tool with `strict: true`, whose `input_schema` is the output format | Tool input matches the schema |
| A tool without strict | Usually matches, not guaranteed |
| "Respond in JSON" in the prompt | Least reliable |

Exam material often presents a **forced `tool_choice`** (an extraction tool) as the way to guarantee a structured response. Know that answer, and know that on current models (Opus 5.5 and others) forced tool choice returns a 400, so use structured outputs or `strict: true` with `auto`.

**2. A schema guarantees shape, not truth.** A valid schema can still contain wrong sums, swapped dates, or values in the wrong field. Validate semantics in code.

**3. Design the schema so the model doesn't fabricate.**
- **Nullable fields** for anything that might be absent. A required non-null `due_date` *pressures* the model to invent one.
- **enum + "other" + detail field** for categories you can't fully predict.
- Include both `stated_total` and `calculated_total`, so a discrepancy becomes visible instead of being silently "fixed".

**4. Validate-and-retry loop.** On failure, send back the document, the failed output and the **specific** errors. Retries fix extraction mistakes (format, arithmetic, wrong field). They **can't** fix information that's missing from, or inconsistent in, the source. Route those to a human.

**5. Few-shot examples** are the most effective way to show behaviour on ambiguous cases: edge-case formats, how to handle nulls, judgment calls. Pick 2–4 that cover the *tricky* cases, not the easy ones. They beat long abstract rules.

**6. Explicit criteria beat vague instructions.** "Flag only when stated and computed totals differ by more than $0.01" beats "be careful with totals". "Report only bugs that would cause wrong output; skip style" beats "be conservative". Vague instructions produce false positives, and false positives erode trust in the whole tool.

**7. Message Batches API.**
- 50% cheaper, results within 24h, **no latency guarantee**.
- Good for: overnight reports, backfills, bulk extraction, offline evals.
- Bad for: anything blocking a user or a pre-merge check that someone is waiting on.
- Match results by `custom_id` (order isn't guaranteed). Resubmit only the failures.
- Each request is a single Messages call, so you can't run a multi-turn tool loop inside one batch request.

## Exam-style questions

<details><summary>Q1. Extraction sometimes returns a plausible but fake PO number when the document has none. Best fix?</summary>

Make `po_number` nullable in the schema and give a few-shot example showing `null` for missing fields. Required non-null fields push the model to fabricate.
</details>

<details><summary>Q2. Output always matches the schema, but line items sometimes don't add up to the total. What's missing?</summary>

Semantic validation in code (sums, cross-field rules), plus a retry that feeds the specific error back. Schemas don't check arithmetic.
</details>

<details><summary>Q3. After 3 retries an invoice still fails because the vendor's stated total is wrong. Next step?</summary>

Stop retrying and flag it for human review. The error is in the source, not the extraction.
</details>

<details><summary>Q4. You need to process 50,000 archived documents by next week, and also run a check on every PR before merge. Which should use the Batches API?</summary>

The archive. A pre-merge check blocks a developer, and batch results have no latency guarantee.
</details>

<details><summary>Q5. A code-review prompt says "be conservative and only flag important issues", but it still flags lots of style nits. Fix?</summary>

Replace the vague wording with explicit criteria for what counts as a finding, plus examples of what *not* to report.
</details>
