# 03 · Integration

**Exam domain:** 3. Integration (19%, the largest domain)

## What you're building

A policy Q&A assistant for Larkspur Bank (fictional) staff, plus the tool grant for a contact-centre assistant. The exercise cuts policies into fixed 400-character pieces, ranks them with no filters, and deploys a tool grant copied from an admin prototype. The solution chunks along each document's sections, filters to the policy version in force, routes policy IDs to exact lookup, grants only what the role needs as the signed-in user, and writes a trace record for every answer.

```
go run ./architect-professional/03-integration-rag/exercise -offline   # recall@3 6/7, 4 stale chunks, 12 audit findings
go run ./architect-professional/03-integration-rag/solution -offline   # 7/7, 0 stale, a clean grant
go run ./architect-professional/03-integration-rag/solution            # live answers with citations and traces
go test ./architect-professional/03-integration-rag/...
```

## Concepts to know cold

**1. Capability bloat.** Every tool you add makes tool selection less accurate, adds tokens to every request, and widens what a prompt injection can reach.
- Grant the tools the role needs, agreed with the business owner, and nothing else. **Removing** a capability beats logging it, adding a confirmation, or a bigger model.
- Audit grants regularly: tools nobody needs, tools nobody has called in 30 days, irreversible tools with no approval step.
- Split by role: a policy Q&A assistant needs one read-only tool, not the contact-centre set.

**2. Authentication and authorization.**
- Tools that touch a customer's data should run with the **signed-in user's delegated credential** (for example an OAuth token scoped to that user), so the system of record enforces what that user may see. A shared service account turns the assistant into a confused deputy: any user's prompt can reach any customer.
- Authorize in the tool server or API, never in the prompt. "Only look up the caller's own account" in a system prompt isn't access control.
- Keep secrets out of prompts, logs and tool results. Remote MCP servers use OAuth; local ones read credentials from environment variables.
- Watch for gaps: write tools behind read-only scopes, tokens that never expire, and tools that accept an account ID without checking ownership.

**3. Accuracy-latency trade-offs.** The levers: chunks retrieved (k), chunk size, a reranking step, model and effort, caching, streaming, and parallel calls. Justify every setting with eval numbers (recall@k, answer accuracy, p95 latency, cost per answer), not intuition. For a contact-centre SLA, a 400 ms reranker that lifts accuracy from 88% to 95% may be worth it; for an internal search box it may not.

**4. Observability at scale.** You can't read every transcript, so log one structured record per request: retrieved IDs, per-stage latency, tokens and cache reads, stop reason, refusals, the request or message ID, the prompt and model version, and whether the answer cited a source. Watch distributions and alert on drift: falling cache hit rate, rising `max_tokens` stops, more uncited answers, more stale retrievals. Redact PII before logs leave the boundary (module 05), and sample transcripts for human review.

**5. Designing a RAG pipeline.**
- **Ingest:** parse, clean, and keep metadata (document ID, version, effective and superseded dates, owner, access level).
- **Chunk:** follow the document's own structure. Keep tables and rules whole. Give each chunk a header that says where it came from (contextual chunk headers), because "Daily limits" alone doesn't say limits of what. Size is a trade-off: too small loses context, too large dilutes relevance and costs tokens.
- **Index:** keyword (BM25) for exact terms, codes and numbers; embeddings for paraphrase; hybrid search plus a reranker for both. Anthropic doesn't offer an embedding model; teams typically use a provider such as Voyage AI.
- **Keep it fresh:** re-index when a document changes, version documents, and filter on effective dates. Confident-but-wrong answers right after a document refresh usually mean a retrieval or index problem, not a model change.
- **Evaluate retrieval separately** from generation, with recall@k on questions whose right source you know.

**6. Match retrieval to data shape and query pattern.**

| Data or query | Strategy |
|---|---|
| IDs, codes, product names, exact numbers | Exact match or keyword search, used as a filter |
| Paraphrased natural-language questions | Embeddings, usually hybrid with keyword |
| Live structured data (balances, transactions, positions) | Query the system of record through a tool or API. Don't embed it; it's stale the moment you index it |
| Versioned or time-sensitive documents | Metadata filter on the as-of date |
| Tables and forms | Keep whole, or convert to structured records |
| Multi-hop questions across sources | Agentic search: let the model run several retrieval calls |

**7. Choosing an integration mechanism.**
- **Direct API with tool use:** one application, full control over the loop, lowest overhead.
- **MCP:** a standard way to expose tools, resources and prompts once and reuse them across clients (Claude Code, Claude Desktop, your own agents). Use it when several clients or teams need the same integration.
- **CLI:** when the agent runs where a shell is available (such as Claude Code) and a mature CLI exists (`gh`, `aws`, `kubectl`). Often cheaper in tokens than wrapping the same commands as tools.
- **Agent-to-agent:** when another team's agent owns a domain and its own tools and policies, delegate the task to it rather than reaching into its systems.

**8. Progressive discovery or monolithic context.**
- **Monolithic:** all tools and reference material in context up front. Simple, predictable and cache-friendly. Fine for a small, stable set.
- **Progressive:** load what's relevant when it's needed: tool search with `defer_loading` on rarely used tools, Skills that load their body only when relevant, MCP resources fetched on demand, retrieval instead of whole documents. Scales to large tool sets and keeps context focused. Tool search appends schemas rather than swapping them, so the cached prefix survives.

**9. Platform differences matter in the design.** On Amazon Bedrock, model IDs take an `anthropic.` prefix, authentication is AWS IAM, and the region is the data-residency control. Some first-party features aren't there: Message Batches, the Files API, web search and fetch, the MCP connector, and the `inference_geo` parameter. Check the platform before designing around a feature.

## Exam-style questions

<details><summary>Q1. A support agent can read tickets, draft replies, issue refunds and delete accounts. Staff only read tickets and draft replies. What reduces risk most?</summary>

Remove the refund and delete tools from the agent's configuration. Logging and confirmation prompts are compensating controls; least privilege removes the capability and the attack surface.
</details>

<details><summary>Q2. An assistant's tools call the core banking API with one service account. A tester asks it about another customer's account and gets an answer. What's the root cause and fix?</summary>

The tools run with more privilege than the user (a confused deputy). Pass the signed-in user's delegated credential to the tools and authorize at the API, which already knows what each user may see.
</details>

<details><summary>Q3. After a policy refresh, a RAG system gives confident, wrong answers. Latency and model version are unchanged. Where do you look first?</summary>

Retrieval and indexing: a broken re-index, mismatched embeddings, or stale or superseded chunks still in the index. A change triggered by a document refresh points at the data path.
</details>

<details><summary>Q4. Staff search policies by ID ("POL-114 callback rules"), and semantic search keeps returning the wrong policy. Fix?</summary>

Detect identifiers and use them as an exact filter, with keyword search for the rest (hybrid). Embeddings are weak at exact codes and numbers.
</details>

<details><summary>Q5. An assistant answers "what's my balance?" from a vector index of nightly account snapshots. Customers complain about wrong balances. Fix?</summary>

Query the system of record through a tool at request time. Live structured data shouldn't be embedded.
</details>

<details><summary>Q6. Three internal agents and Claude Code all need the same ticketing integration. Each team built its own wrapper. What do you recommend?</summary>

One MCP server for the ticketing system, owned by one team, with OAuth and scoped permissions. Every client reuses it, and fixes ship once.
</details>

<details><summary>Q7. An agent has 120 tools across 9 systems; tool selection is poor and every request carries 40K tokens of schemas. What changes?</summary>

Progressive discovery: keep a few core tools loaded and mark the rest `defer_loading` behind tool search, or split by role. Tool search appends schemas, so the cached prefix survives.
</details>
