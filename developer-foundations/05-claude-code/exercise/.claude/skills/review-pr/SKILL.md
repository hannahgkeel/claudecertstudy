<!--
TODO(3): Turn this into a working skill. Add frontmatter with:
  - name and a description that says WHEN to use it (Claude matches on this)
  - argument-hint for the optional base branch
  - allowed-tools restricted to read-only tools plus `git diff` / `git log`
  - context: fork, so the noisy review runs in an isolated sub-context and
    only the summary comes back to the main conversation
Then tighten the instructions: what counts as a finding, what to leave out,
and what to say when there are no problems.
-->
Review my code and tell me what you think.
