#!/usr/bin/env bash
# CI code review with Claude Code in non-interactive (print) mode.
# A FRESH session reviews the diff: it did not write the code, so it doesn't
# share the author's assumptions.
set -euo pipefail

BASE="${1:-origin/main}"

SCHEMA='{
  "type": "object",
  "properties": {
    "verdict":  {"type": "string", "enum": ["approve", "request_changes"]},
    "findings": {"type": "array", "items": {
      "type": "object",
      "properties": {
        "file": {"type": "string"},
        "line": {"type": "integer"},
        "severity": {"type": "string", "enum": ["high", "medium", "low"]},
        "problem": {"type": "string"}
      },
      "required": ["file", "line", "severity", "problem"]
    }}
  },
  "required": ["verdict", "findings"]
}'

git diff "$BASE"...HEAD > /tmp/pr.diff

claude -p "Review the diff in /tmp/pr.diff against the rules in CLAUDE.md. Report only real bugs." \
  --output-format json \
  --json-schema "$SCHEMA" \
  --allowedTools "Read,Grep,Glob" \
  --max-budget-usd 2 \
  > review.json

# Fail the build on any high-severity finding. (Open review.json once to confirm
# the field name your Claude Code version uses for the schema-shaped result.)
jq -e '[.structured_output.findings[]? | select(.severity == "high")] | length == 0' review.json
