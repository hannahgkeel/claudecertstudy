# 04 · Evaluation, testing and optimization

**Exam domain:** 4. Evaluation, Testing & Optimization (16%)

## What you're building

An eval for a complaint-triage prompt at Larkspur Bank (fictional). A teammate rewrote the prompt to be shorter and cheaper (variant B). The exercise's eval measures category accuracy and total cost, and says ship B. The solution grades every field in code, judges the free-text summary with a rubric, breaks results down by segment, runs a paired comparison, applies hard gates, and picks a human review sample. B turns out to miss regulator mentions, invent amounts and follow a prompt injection.

```
go run ./architect-professional/04-evaluation/exercise -offline   # "Ship B"
go run ./architect-professional/04-evaluation/solution -offline   # the full report, from a recorded run
go run ./architect-professional/04-evaluation/solution            # run both variants live (34 calls + 34 judge calls)
go test ./architect-professional/04-evaluation/evals
```

## Concepts to know cold

**1. Define the metrics before you look at results.** Tie each one to the business case and decide which are hard gates.

| Dimension | Example metric | Typical role |
|---|---|---|
| Accuracy | per-field accuracy, recall on the class that matters | Primary metric |
| Latency | p50 and p95 end-to-end, time to first token | SLA threshold |
| Cost | cost per **completed** task (retries included), not per request | Budget threshold |
| Safety | invented facts, harmful or non-compliant output, missed compliance flags | Hard gate |
| Security | prompt injections followed, data leaked across users | Hard gate |

A cheaper variant that fails a hard gate doesn't ship, however it does on average.

**2. Build the dataset deliberately.**
- **Representative traffic**, sampled from production logs (module 01's decision log), and **edge cases** chosen on purpose: missing fields, other languages, sarcasm, ambiguity, adversarial input.
- **Regression cases:** every production failure becomes a test case.
- Label each case with a segment and the reason it's there, so results can be broken down.
- Version the set, and keep a **held-out** portion you don't tune against, or you'll overfit the prompt to the eval.
- Size matters: with 17 cases a one- or two-case swing is noise. Grow the set where decisions are close.

**3. Mixed methods: code, model and people.**
- **Code graders** for anything with a right answer (exact match, enums, numeric tolerance, regex, schema validity). Cheap, repeatable, no drift.
- **LLM-as-judge** for open-ended quality. Give it the source, a rubric that scores **each criterion separately**, a reason, and a structured-output schema. Calibrate it against human grades before trusting it. Watch for position bias in pairwise comparisons (swap the order) and for the judge favouring output that sounds like itself.
- **Human review** for a stratified sample plus every failure, which also checks the judge.

**4. A/B testing and iteration.**
- **Offline:** run both variants on the same cases and compare **pairwise**. Only the cases where they disagree carry information; a sign test or bootstrap says whether the split could be chance.
- **Online:** split live traffic, watch guardrail metrics (complaints, escalations, refusals) as well as the primary metric, and plan the sample size before starting.
- Change one thing at a time, version every prompt and config, and re-run the full set (including the held-out part) before promoting.

**5. Diagnose by symptom.**

| Symptom | Likely cause | First check |
|---|---|---|
| Output doesn't parse or misses fields | Format not enforced | Use structured outputs; check `stop_reason` for `max_tokens` |
| Confident facts not in the source | Hallucination | Grounding instructions, "null if absent", citations, retrieval quality |
| Right after a document refresh, wrong answers | Retrieval or index | Re-index, stale chunks, embedding mismatch (module 03) |
| Fails one segment only | Prompt gap for that segment | Add rules or examples for it |
| Good quality but slow or expensive | Model or effort mismatch | Lower effort, a smaller model *with an eval*, caching |
| Follows instructions in user content | Prompt injection | Mark untrusted data, least privilege, output checks (module 05) |
| Erratic results on reruns | Ambiguous instructions or missing context | Tighten the spec; compare several runs |

**6. Optimizing tokens, latency and cost.** In rough order: cache the stable prefix (module 02); trim context and tool results; lower effort where quality holds; cap and shape output; batch non-urgent work (the Message Batches API is 50% off, but it isn't on Bedrock); parallelize independent calls; stream to cut perceived latency; only then consider a smaller model, with an eval. Judge cost per completed task, because a cheaper request that needs retries isn't cheaper.

**7. Monitoring in production.** Log every request with prompt and model version, tokens, cache reads, latency, stop reason and an outcome label when one becomes available. Track distributions (p95 latency, `max_tokens` stops, refusal rate, cache hit rate, cost per task) and per-segment quality from sampled reviews. Alert on drift, and feed new failures back into the eval set.

## Exam-style questions

<details><summary>Q1. A new prompt raises overall accuracy from 88% to 94% and cuts cost by 28%. What do you check before shipping?</summary>

Segment-level results and the hard-gate metrics: safety (invented facts, compliance flags), security (injection) and the critical classes. An overall gain can hide a regression where errors are most expensive.
</details>

<details><summary>Q2. An LLM judge rates 98% of outputs "good", but users complain. What's wrong with the judge?</summary>

Probably a vague, single-verdict rubric that was never calibrated. Score each criterion separately with a reason, use a schema, give the judge the source, and measure its agreement with human grades on a sample.
</details>

<details><summary>Q3. Variant B wins on 9 cases and loses on 6 out of 200. Should you conclude B is better?</summary>

No. Only the 15 disagreements matter, and a 9-6 split is consistent with chance (sign test p ≈ 0.61). Look at which cases flipped, check the hard gates, or collect more data.
</details>

<details><summary>Q4. An extraction pipeline sometimes returns amounts that aren't in the document. Classify the failure and give two fixes.</summary>

Hallucination. Allow null ("if not stated, use null; never estimate"), require citations or evidence spans, check extracted values against the source in code, and add no-amount cases to the eval set.
</details>

<details><summary>Q5. Quality is fine, but p95 latency breaks the 3-second SLA. What do you try, in order?</summary>

Cache the stable prefix, trim context, lower effort, cap output length, stream for time to first token, and parallelize independent calls. Re-run the eval after each change. Try a smaller model only if the eval shows quality holds.
</details>

<details><summary>Q6. The team tuned a prompt on the eval set for two weeks; the score is 99%, but production quality hasn't moved. Why?</summary>

Overfitting to the eval set. Keep a held-out set you never tune on, refresh cases from production traffic, and check that the set represents real inputs.
</details>
