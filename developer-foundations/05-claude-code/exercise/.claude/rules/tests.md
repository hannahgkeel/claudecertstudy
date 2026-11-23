<!--
TODO(2): Add YAML frontmatter with a `paths:` glob so this rule loads only
when Claude works on Go test files. Then add a second rule file, api.md, for api/**.
-->
# Test conventions

- Use table-driven tests with `t.Run(tc.name, ...)`.
- No network calls in unit tests.
