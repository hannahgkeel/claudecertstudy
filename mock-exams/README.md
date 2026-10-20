# CCDV-F mock exams

Three timed practice exams for **Claude Certified Developer – Foundations (CCDV-F)**, built from the public exam guide (v1.0, July 2026). These are unofficial study material, not questions from the real exam.

Each exam matches the real format: 53 multiple-choice and multiple-response items, 120 minutes, and items spread across the eight domains by blueprint weight:

| Domain | Weight | Items per exam |
|---|---|---|
| 1. Agents and Workflows | 14.7% | 8 |
| 2. Applications and Integration | 33.1% | 17 |
| 3. Claude Code | 3.1% | 2 |
| 4. Eval, Testing, and Debugging | 2.6% | 1 |
| 5. Model Selection and Optimization | 16.8% | 9 |
| 6. Prompt and Context Engineering | 11.0% | 6 |
| 7. Security and Safety | 8.1% | 4 |
| 8. Tools and MCPs | 10.6% | 6 |

## Using it

Open `index.html` in a browser, or use the published artifact link. Each exam has a timer, a question navigator, flag-for-review, and a review screen before you submit. After you submit you get a score report (estimated scaled score, percent correct by domain) and an answer guide that explains every option.

Progress is saved in your browser's local storage. **Copy results for Claude** on the score report produces a summary you can paste into a Claude Code session to go through your misses.

## Scoring rubric

- Each item is worth 1 point. Multiple-response items are all-or-nothing, and unanswered items score 0.
- Estimated scaled score = `100 + 900 × (correct ÷ 53)`. The real conversion isn't published. On this estimate, the 720 cut is about 69%, so 37 of 53 passes.
- Readiness bands: 45–53 Strong, 40–44 Likely pass, 37–39 Borderline, 0–36 Not yet.

## Files

- `index.html`: the page (styles and markup)
- `app.js`: the exam runner (timer, navigation, scoring, score report, answer guide)
- `data/exam{1,2,3}.js`: the questions. Each item has an `id` (such as `e1-07`), domain `d`, skill `s`, `stem`, options `o` (each one a `[text, why it's right or wrong]` pair), the correct option indices `a`, and an explanation `why`. A stem that says TWO means two options are correct.

The app shuffles question and option order deterministically, seeded from the exam number and question ID. Question 12 is therefore the same question on every attempt, in the answer guide and in the copied results, but the correct options don't always sit in the same letter position.
