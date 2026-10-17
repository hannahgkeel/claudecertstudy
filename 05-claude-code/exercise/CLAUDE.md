<!--
TODO(1): This CLAUDE.md has problems. Rewrite it so it:
  - gives the exact build / test / lint commands
  - states conventions as concrete, checkable rules ("money is int64 cents")
    instead of vague wishes ("write good code")
  - lists hard boundaries (applied migrations are immutable; ask before adding deps)
  - moves the test-only and api-only guidance OUT of this file into
    path-scoped rules in .claude/rules/ so they load only when relevant
  - imports docs/architecture.md with an @ import instead of pasting it
-->
# Project

Please write good, clean code and be careful. Make sure everything works.
Use best practices. Money should be handled properly.

When writing tests, use table-driven tests and don't hit the network.
When working on API handlers, validate input and never log request bodies.

Architecture: api/ has handlers, service/ has logic, store/ talks to Postgres.
