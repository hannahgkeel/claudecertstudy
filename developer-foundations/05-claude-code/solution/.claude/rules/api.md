---
paths:
  - "api/**/*.go"
---
# API handler rules (loaded only when working in api/)

- Validate every request body before calling a service.
- Map service errors to status codes in one place: `api/errors.go`.
- Never log request bodies; they can contain card data.
