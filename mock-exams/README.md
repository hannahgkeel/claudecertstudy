# Claude certification mock exams

Timed practice exams for two Claude certifications, built from their public exam guides (v1.0, July 2026). These are unofficial study material, not questions from the real exams.

- **CCDV-F**: Claude Certified Developer – Foundations. 3 exams of 53 items, 120 minutes each.
- **CCAR-P**: Claude Certified Architect – Professional. 3 exams of 63 items, 120 minutes each.

Every exam matches its certification's real format: multiple-choice and multiple-response items, with items spread across the domains by blueprint weight.

## Using it

Open `index.html` in a browser and pick a certification. If your browser blocks local files, serve the folder instead:

```bash
python3 -m http.server -d mock-exams 8000
```

Then open http://localhost:8000.

- **During the exam:** a timer, a question navigator, flag-for-review, and a review screen before you submit.
- **After you submit:** a score report (estimated scaled score, percent correct by domain) and an answer guide that explains every option.
- **Progress:** saved in your browser's local storage, separately for each certification.
- **Copy results for Claude:** on the score report, produces a summary you can paste into a Claude Code session to go through your misses.

Old links such as `#exam1` still open CCDV-F. Links now look like `#ccdvf/exam1` or `#ccarp/guide2`.

## Blueprints

### CCDV-F (53 items)

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

### CCAR-P (63 items)

| Domain | Weight | Items per exam |
|---|---|---|
| 1. Solution Design & Architecture | 17% | 11 |
| 2. Claude Models, Prompting & Context Engineering | 13% | 8 |
| 3. Integration | 19% | 12 |
| 4. Evaluation, Testing & Optimization | 16% | 10 |
| 5. Governance, Safety & Risk Management | 14% | 9 |
| 6. Stakeholder Communication & Lifecycle Management | 14% | 9 |
| 7. Developer Productivity & Operational Enablement | 7% | 4 |

Items per exam are the largest-remainder split of the item count by weight. `check.js` computes the same split.

## Scoring rubric

- Each item is worth 1 point. Multiple-response items are all-or-nothing, and unanswered items score 0.
- Estimated scaled score = `100 + 900 × (correct ÷ items)`. The real conversion isn't published. On this estimate, the 720 cut is about 69%, so:
  - CCDV-F: 37 of 53 passes
  - CCAR-P: 44 of 63 passes

| Band | CCDV-F | CCAR-P |
|---|---|---|
| Strong | 45–53 | 54–63 |
| Likely pass | 40–44 | 48–53 |
| Borderline | 37–39 | 44–47 |
| Not yet | 0–36 | 0–43 |

## Files

- `index.html`: the page (styles and markup) and the script list
- `app.js`: the exam runner for every certification (picker, timer, navigation, scoring, score report, answer guide)
- `certs/<id>.js`: one config per certification, with:
  - code, name and guide version
  - item count, minutes and cut
  - domains and weights
  - readiness bands and study tip
  - the localStorage key
  - the shuffle seed prefix
- `data/<id>/exam{1,2,3}.js`: the questions. Each item has:
  - an `id` (`e1-07` for CCDV-F, `p1-07` for CCAR-P)
  - domain `d` and skill `s`
  - the `stem`
  - options `o`, each one a `[text, why it's right or wrong]` pair
  - the correct option indices `a`
  - an explanation `why`

  A stem that says TWO means two options are correct.
- `check.js`: validates every bank against its config. Run `node mock-exams/check.js`. It checks:
  - item counts and blueprint domain counts
  - unique, well-formed IDs
  - answer indices, including TWO stems having exactly two answers
  - a rationale for every option

The app shuffles question and option order deterministically, seeded from the cert's seed prefix, the exam number and the question ID. Question 12 is therefore the same question on every attempt, in the answer guide and in the copied results, but the correct options don't always sit in the same letter position. Don't change an existing cert's `storageKey` or `seedPrefix`: that would lose saved progress and renumber questions.

## Adding a certification

1. Create `certs/<id>.js` that sets `MOCK.certs.<id> = { ... }`. Copy the shape of `certs/ccarp.js`, and give it a new `storageKey` and `seedPrefix`.
2. Add `data/<id>/exam{1,2,3}.js`. Each file calls `MOCK.certs.<id>.exams[N].push(...)`.
3. Add the `<script>` tags to `index.html`: the cert config before the data files, all before `app.js`.
4. Run `node mock-exams/check.js`.

Exams without questions show as "Coming soon".
