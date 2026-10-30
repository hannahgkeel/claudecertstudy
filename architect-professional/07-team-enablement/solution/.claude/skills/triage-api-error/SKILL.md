---
name: triage-api-error
description: Triage a failing Claude API or Bedrock call during an incident. Use when someone pastes an API error, an HTTP status such as 429 or 529, a request ID, or says Claude calls are failing, slow or truncated.
---

# Triage a Claude API error

1. Get the facts from the log line or the person: HTTP status, error type, request ID, model ID, platform (first-party API or Bedrock), when it started, and what share of calls fail.
2. Classify it:
   `go run ./architect-professional/07-team-enablement/solution -classify <status>[:<type>]`
   from the repository root. It prints the category, whether to retry, and the next action.
3. Act on the category:
   - **Not retryable (400, 401, 403, 404, 413):** find the change that caused it (deploy, key rotation, model ID, a removed parameter). Retrying won't help.
   - **429:** check whether retry-after is honoured and whether traffic spiked; look at cache hit rate and batchable work.
   - **5xx or 529:** confirm the SDK is retrying with backoff; if errors persist beyond a few minutes, switch to the manual queue per the runbook and check the provider status page.
   - **HTTP 200 but wrong:** check `stop_reason` (`max_tokens`, `refusal`) before suspecting the model.
4. Write a short incident note: impact, cause, request IDs, action taken, and follow-ups. Don't include customer data.
