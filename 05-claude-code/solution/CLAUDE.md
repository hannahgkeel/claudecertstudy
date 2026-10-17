# Payments service

Go 1.25 service that charges cards and issues refunds.

## Commands
- Build: `go build ./...`
- Test: `go test ./...` (must pass before you say a task is done)
- Lint: `go vet ./...`

## Conventions
- Money is always `int64` cents. Never `float64`.
- Errors wrap with `fmt.Errorf("doing X: %w", err)`.
- Public functions get a doc comment.

## Boundaries
- Never edit files under `migrations/` that have already been applied. Add a new migration instead.
- Ask before adding a new third-party dependency.

@docs/architecture.md
