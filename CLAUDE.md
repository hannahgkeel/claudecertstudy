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
