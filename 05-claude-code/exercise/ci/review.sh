#!/usr/bin/env bash
# TODO(6): Make this a CI review step:
#   - run Claude Code non-interactively (-p)
#   - get machine-readable output (--output-format json) shaped by a schema (--json-schema)
#   - restrict it to read-only tools (--allowedTools)
#   - cap spend (--max-budget-usd)
#   - fail the build on high-severity findings (jq -e ...)
# Why should a FRESH session do the review instead of the session that wrote the code?
set -euo pipefail
claude "review the code"
