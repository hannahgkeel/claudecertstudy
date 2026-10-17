---
paths:
  - "**/*_test.go"
---
# Test conventions (loaded only when working on test files)

- Use table-driven tests with `t.Run(tc.name, ...)`.
- No network calls in unit tests. Use the fakes in `internal/fakes`.
- Name cases after behaviour: "refund over limit is rejected", not "test3".
