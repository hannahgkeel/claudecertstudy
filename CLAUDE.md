# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Go study lab for two Claude certifications, one folder each:
- `developer-foundations/`: Claude Certified Developer – Foundations (CCDV-F), modules `01-agentic-loop` … `07-context-reliability`
- `architect-professional/`: Claude Certified Architect – Professional (CCAR-P), modules `01-solution-design` … `07-team-enablement`, one per exam domain

`internal/claude/` is the shared client and `shared/mock-exam/` the shared exam engine. Run Go commands from the repo root (`go run ./architect-professional/04-evaluation/solution -offline`). Each numbered module maps to an exam domain and contains:
- `exercise/` — compiles as-is but has TODOs; it's meant to misbehave until they're filled in
- `solution/` — the reference implementation
- `README.md` — concepts plus exam-style questions with collapsed answers

The user is studying, so the exercise files are theirs to fill in. Don't fill in TODOs or edit `exercise/` code unless they ask you to. When they want feedback, compare their version with `solution/` (`diff -u <cert>/NN-x/exercise/main.go <cert>/NN-x/solution/main.go`). Many CCAR-P exercises have an offline `-check` or `-offline` flag that shows what still fails.

## Current-API conventions (deliberately different from some "textbook" exam answers)

On current models (Opus 5.5, Sonnet 5.5, Fable 5.1):
- Forced `tool_choice` (`any` or a named tool) returns a 400. For guaranteed structure, use structured outputs (`output_config.format`) or `strict: true` with `auto`.
- Assistant prefill is rejected. Use structured outputs.
- Extended thinking uses adaptive thinking plus `effort`, not `budget_tokens`.

Keep new or edited code consistent with these. The READMEs mention the textbook answers only for exam context.

## Mock exams (`<cert>/mock-exams/`)

Static HTML/JS practice exams (no build step), three per certification. Each `index.html` sets `window.MOCK` (exam code, domains, bands, storage key) and loads `../../shared/mock-exam/app.js`. Questions live in `<cert>/mock-exams/data/exam{1,2,3}.js`; see that folder's README for the item format. IDs tell you the cert: `e2-31` is CCDV-F, `p2-31` is CCAR-P. When the user pastes "Copy results for Claude" output, look up each missed question by its ID in the data files and coach on the concept, not just the letter, and point to the matching study module. Question and option order are shuffled deterministically by `app.js`, so letters in the pasted results refer to the displayed order, not the order in the data file. Each exam must keep its blueprint domain counts: CCDV-F 8/17/2/1/9/6/4/6 (53 items), CCAR-P 11/8/12/10/9/9/4 (63 items). Keep the storage keys and seeds unchanged, or saved progress and question numbering break.
