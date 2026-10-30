---
name: review-pr
description: Review the current branch's changes for correctness bugs, money-handling mistakes and missing tests. Use when the user asks for a code review or a PR review.
argument-hint: "[base-branch]"
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*)
context: fork
---

Review the changes between the base branch ($ARGUMENTS, or `main` if empty) and HEAD.

1. Run `git diff <base>...HEAD` to see the changes.
2. For each changed file, check:
   - money is int64 cents, never float
   - errors are wrapped with context
   - new behaviour has a test
3. Report only real problems. For each one give `file:line`, what goes wrong and a concrete failing input.
   If you find nothing, say so. Don't pad the review with style nits.
