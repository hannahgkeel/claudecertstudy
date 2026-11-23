# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Go study lab for the Claude architecture / developer certification exam. Each numbered module (`01-agentic-loop` … `07-context-reliability`) maps to an exam domain and contains:
- `exercise/` — compiles as-is but has TODOs; it's meant to misbehave until they're filled in
- `solution/` — the reference implementation
- `README.md` — concepts plus exam-style questions with collapsed answers

The user is studying, so the exercise files are theirs to fill in. Don't fill in TODOs or edit `exercise/` code unless they ask you to. When they want feedback, compare their version with `solution/` (`diff -u NN-x/exercise/main.go NN-x/solution/main.go`).

## Current-API conventions (deliberately different from some "textbook" exam answers)

On current models (Opus 5.5, Sonnet 5.5, Fable 5.1):
- Forced `tool_choice` (`any` or a named tool) returns a 400. For guaranteed structure, use structured outputs (`output_config.format`) or `strict: true` with `auto`.
- Assistant prefill is rejected. Use structured outputs.
- Extended thinking uses adaptive thinking plus `effort`, not `budget_tokens`.

Keep new or edited code consistent with these. The READMEs mention the textbook answers only for exam context.

## Mock exams (`mock-exams/`)

Static HTML/JS practice exams (no build step) for two certifications: CCDV-F and CCAR-P. One runner (`app.js`) serves both. Each cert's config (domains, item count, cut, bands) is in `mock-exams/certs/<id>.js`, and its questions are in `mock-exams/data/<id>/exam{1,2,3}.js`. See `mock-exams/README.md` for the item format. When the user pastes "Copy results for Claude" output, the first line names the cert. Look up each missed question by its ID in that cert's data files and coach on the concept, not just the letter. IDs are `e2-31` for CCDV-F and `p2-31` for CCAR-P. Question and option order are shuffled deterministically by `app.js`, so letters in the pasted results refer to the displayed order, not the order in the data file. Never change a cert's `storageKey` or `seedPrefix`. Each exam must keep its blueprint domain counts: CCDV-F 8/17/2/1/9/6/4/6 (53 items), CCAR-P 11/8/12/10/9/9/4 (63 items). Run `node mock-exams/check.js` after editing questions.
