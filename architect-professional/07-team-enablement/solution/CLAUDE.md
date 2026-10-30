# CLAUDE.md: Larkspur payments-assist service

Team conventions for anyone (or any agent) working in this repository.

## Commands
- Build: `go build ./...`
- Test (offline, no credentials): `go test ./...`
- Evals before any prompt or model change: `go run ./evals -offline`, then the live run in CI
- Triage an API error during an incident: use the `triage-api-error` skill

## Conventions
- Prompts live in `prompts/` as versioned fragments. Bump the version string with every change; the eval report records it.
- Money, limits and approvals are decided in Go code, never in prompts.
- Model IDs are pinned in one constant. Don't use date-suffixed IDs or aliases.
- Every Claude call logs request or message ID, stop reason, tokens and latency.

## Data rules
- Never paste customer data, card numbers or account numbers into prompts, tests or eval cases. Use the fixtures in `testdata/`.
- Secrets come from the environment or AWS Secrets Manager, never from files in the repo.

## Platform
- Claude runs through Amazon Bedrock in `us-east-1` (see `.claude/settings.json`). Bedrock doesn't offer every first-party API feature (Message Batches, Files API, web search, MCP connector); check before designing around one.
