# CCAR-P mock exams

Three timed practice exams for **Claude Certified Architect – Professional (CCAR-P)**, built from the public exam guide (v1.0, July 2026). These are unofficial study material, not questions from the real exam.

Each exam matches the real format: 63 multiple-choice and multiple-response items, 120 minutes, and items spread across the seven domains by blueprint weight:

| Domain | Weight | Items per exam | Study module |
|---|---|---|---|
| 1. Solution Design & Architecture | 17% | 11 | [01](../01-solution-design/) |
| 2. Claude Models, Prompting & Context Engineering | 13% | 8 | [02](../02-models-prompting/) |
| 3. Integration | 19% | 12 | [03](../03-integration-rag/) |
| 4. Evaluation, Testing & Optimization | 16% | 10 | [04](../04-evaluation/) |
| 5. Governance, Safety & Risk Management | 14% | 9 | [05](../05-governance/) |
| 6. Stakeholder Communication & Lifecycle Management | 14% | 9 | [06](../06-stakeholder-lifecycle/) |
| 7. Developer Productivity & Operational Enablement | 7% | 4 | [07](../07-team-enablement/) |

## Using it

Open `index.html` in a browser. Each exam has a timer, a question navigator, flag-for-review, and a review screen before you submit. After you submit you get a score report (estimated scaled score, percent correct by domain) and an answer guide that explains every option.

Progress is saved in your browser's local storage, separately from the CCDV-F exams. **Copy results for Claude** on the score report produces a summary you can paste into a Claude Code session to go through your misses.

## Scoring rubric

- Each item is worth 1 point. Multiple-response items are all-or-nothing, and unanswered items score 0.
- Estimated scaled score = `100 + 900 × (correct ÷ 63)`. The real conversion isn't published. On this estimate, the 720 cut is about 69%, so 44 of 63 passes.
- Readiness bands: 54–63 Strong, 48–53 Likely pass, 44–47 Borderline, 0–43 Not yet.

## Files

- `index.html`: the page, including the exam settings (`window.MOCK`: code, domains, bands, storage key)
- `../../shared/mock-exam/app.js` and `exam.css`: the exam runner and styles, shared with the CCDV-F exams
- `data/exam{1,2,3}.js`: the questions. Each item has an `id` (such as `p1-07`), domain `d`, skill `s`, `stem`, options `o` (each one a `[text, why it's right or wrong]` pair), the correct option indices `a`, and an explanation `why`. A stem that says TWO means two options are correct.

The app shuffles question and option order deterministically, seeded from the exam number and question ID, so a question's number is stable across attempts, the answer guide and copied results, while the correct option's letter varies.
