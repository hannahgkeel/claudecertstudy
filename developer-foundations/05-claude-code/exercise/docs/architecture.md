# Architecture (imported into CLAUDE.md with @docs/architecture.md)

- `api/` HTTP handlers. Thin: parse, validate, call a service, respond.
- `service/` business logic. No HTTP types here.
- `store/` Postgres access. The only package that imports `database/sql`.
