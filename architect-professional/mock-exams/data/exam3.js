// CCAR-P mock exam 3. Question format: see architect-professional/mock-exams/README.md.
MOCK.exams[3].push(
{
  "id": "p3-01", "d": 1, "s": "Architectural patterns",
  "stem": "An evaluator-optimizer loop rewrites client-facing investment commentary until a compliance checker approves it. Some drafts loop 15 times and still fail. What's the best design change?",
  "o": [
    ["Cap the iterations (for example 3), have the evaluator return specific failed criteria each round, and send drafts that still fail to a human reviewer.", "Correct. Iteration needs a stopping rule and an escape path."],
    ["Remove the cap so the loop runs until it passes.", "Unbounded loops waste cost and may never converge."],
    ["Let the optimizer also approve its own drafts.", "That removes the independent check."],
    ["Lower the checker's standards until drafts pass.", "That defeats the purpose of the compliance check."]
  ],
  "a": [0],
  "why": "Evaluator-optimizer works best with clear criteria, specific feedback, a stopping rule and human fallback."
},
{
  "id": "p3-02", "d": 1, "s": "End-to-end architecture",
  "stem": "A chargeback assistant handles most cases end to end. Where should human escalation be designed into the architecture?",
  "o": [
    ["As an explicit route with stated criteria (amount above a threshold, policy gap, customer request, no progress after N attempts), carrying a summary a human can act on without reading the transcript.", "Correct. Escalation is a designed path with criteria and a useful handoff."],
    ["Nowhere. The assistant should handle everything.", "Some cases will always need people."],
    ["Only when the customer gets angry.", "Sentiment alone isn't a reliable criterion."],
    ["As a button that forwards the raw transcript.", "Raw transcripts make the human start from scratch."]
  ],
  "a": [0],
  "why": "End-to-end design includes exception paths: explicit escalation criteria and actionable handoff summaries."
},
{
  "id": "p3-03", "d": 1, "s": "Decomposition",
  "stem": "An agent that issues fee refunds sometimes retries a tool call after a timeout, and customers get refunded twice. What's the architectural fix?",
  "o": [
    ["Make the refund action idempotent: the agent passes an idempotency key per refund, and the refund service ignores duplicates.", "Correct. Actions that can be retried must be safe to repeat."],
    ["Tell the agent never to retry.", "Retries are sometimes necessary, and instructions don't guarantee behaviour."],
    ["Lower the timeout so calls fail faster.", "That causes more retries."],
    ["Review refunds monthly for duplicates.", "That detects the problem after customers are affected."]
  ],
  "a": [0],
  "why": "Decompose actions with reliability in mind: side-effecting tools should be idempotent, with validation in the service."
},
{
  "id": "p3-04", "d": 1, "s": "End-to-end architecture",
  "stem": "A relationship-manager assistant must remember client preferences across meetings that are weeks apart. What's the most appropriate design?",
  "o": [
    ["Store structured client facts (preferences, commitments, open items) in a system of record or memory store, retrieve them at the start of each session, and let people view and correct them.", "Correct. Durable, inspectable memory outside the conversation fits long gaps."],
    ["Keep one never-ending conversation per client.", "Context grows without bound and old details blur."],
    ["Rely on the model to remember between sessions.", "Models don't retain memory across separate requests."],
    ["Paste every past transcript into each new session.", "That's costly and noisy, and exact facts still get lost."]
  ],
  "a": [0],
  "why": "Design state and memory explicitly: structured, retrievable facts with an owner and a way to correct them."
},
{
  "id": "p3-05", "d": 1, "s": "Architectural patterns",
  "stem": "A quarterly regulatory report pulls data from five systems, applies fixed calculations, and needs a narrative section explaining significant changes. Which design fits?",
  "o": [
    ["A workflow: code extracts the data and does the calculations, then one model call drafts the narrative from the computed figures, followed by human review.", "Correct. Fixed data and calculation steps belong in code; the model writes the narrative."],
    ["An autonomous agent that queries the five systems and computes the figures.", "Fixed calculations shouldn't be left to a model."],
    ["A multi-agent system with one agent per data source.", "Unneeded coordination for a fixed pipeline."],
    ["One model call that receives raw data dumps and writes the whole report.", "Calculations would be done by the model, and raw dumps flood the context."]
  ],
  "a": [0],
  "why": "Use code for deterministic steps and the model for language, with review where accountability requires it."
},
{
  "id": "p3-06", "d": 1, "s": "Architectural patterns",
  "stem": "Analysts want to ask ad-hoc questions about a 2-million-row transactions extract ('which merchants grew fastest last quarter?'). Which approach fits best?",
  "o": [
    ["Let Claude write and run analysis code in a sandbox (code execution, or a SQL tool with read-only access) and explain the results, instead of reading rows as text.", "Correct. Structured data is best queried with code; the model plans and explains."],
    ["Paste the extract into the prompt.", "It won't fit, and the model shouldn't aggregate millions of rows by reading them."],
    ["Embed each row in a vector index.", "Vector search doesn't do aggregation."],
    ["Pre-build one dashboard per possible question.", "Ad-hoc questions can't all be anticipated."]
  ],
  "a": [0],
  "why": "Match the approach to the data: tabular analysis goes through code or SQL, with the model generating queries and interpreting results."
},
{
  "id": "p3-07", "d": 1, "s": "Multi-agent systems",
  "stem": "What should a subagent in a research system return to its coordinator?",
  "o": [
    ["A condensed, structured result: findings, the sources for each, confidence notes, and anything it couldn't complete.", "Correct. Condensed results with provenance and gaps keep the coordinator effective."],
    ["Its full transcript, so nothing is lost.", "That floods the coordinator's context."],
    ["Only a yes or no.", "That loses the evidence and provenance."],
    ["Nothing if it fails, to keep things clean.", "Silent failure hides gaps; report what failed and any partial results."]
  ],
  "a": [0],
  "why": "Subagent contracts: explicit context in, condensed and attributable results out, with errors and partial results reported."
},
{
  "id": "p3-08", "d": 1, "s": "Business value alignment",
  "stem": "A sponsor asks how an AI-assisted document review will cut cost. Which framing is strongest?",
  "o": [
    ["Cost per reviewed document, today against projected (staff time plus AI cost), with the quality guardrail that QA pass rate doesn't fall, measured in the pilot.", "Correct. A unit cost with a quality guardrail, measured in a pilot, is defensible."],
    ["'AI is cheaper than people.'", "Unquantified and easily challenged."],
    ["The total token bill per month.", "That's one input cost, not the business outcome."],
    ["The number of employees who could be let go.", "Not a measured unit economics case, and it ignores quality."]
  ],
  "a": [0],
  "why": "Tie the cost pillar to unit economics (cost per completed task) with a quality guardrail."
},
{
  "id": "p3-09", "d": 1, "s": "Architectural patterns",
  "stem": "Staff need answers about internal policies that they can verify quickly. What's the simplest design that supports verification?",
  "o": [
    ["An augmented LLM with retrieval that cites the exact policy passages it used, using the API's citations feature or source IDs in the answer.", "Correct. Citations let staff check answers against the source."],
    ["A fine-tuned model with no retrieval.", "Answers have no source to check, and policies change."],
    ["An agent that browses the intranet each time.", "Slower and less predictable than retrieval for known documents."],
    ["A model that answers from memory with a confidence score.", "Confidence scores aren't verification."]
  ],
  "a": [0],
  "why": "Grounded answers with citations support verification and auditability."
},
{
  "id": "p3-10", "d": 1, "s": "Decomposition",
  "stem": "A team must decompose a complex 'open a business account' process into an AI-assisted design. Which split is best?",
  "o": [
    ["Model: read uploaded documents and extract fields, and explain next steps to the customer. Code: KYC rule checks, sanctions screening calls, account creation. Human: exceptions and final approval for flagged cases.", "Correct. Each part goes to the component suited to it: language to the model, rules to code, judgement on exceptions to people."],
    ["The model does everything, including account creation.", "Rules and irreversible actions belong in code with controls."],
    ["Humans do everything; the model only greets customers.", "That leaves the clear value of document extraction unused."],
    ["Code does everything, including reading free-text documents.", "Code struggles with unstructured documents."]
  ],
  "a": [0],
  "why": "Decomposition assigns language and interpretation to the model, deterministic rules and actions to code, and judgement on exceptions to people."
},
{
  "id": "p3-11", "d": 1, "s": "Architectural patterns",
  "stem": "Which TWO factors argue for a fixed workflow over an agent?",
  "o": [
    ["The steps are known and the same for every case.", "Correct. Predictable steps suit predefined code paths."],
    ["Errors are costly and hard to reverse.", "Correct. A high cost of error argues for less autonomy and more control."],
    ["The task needs open-ended exploration.", "That argues for an agent."],
    ["The right next step depends on what earlier steps find.", "That's a sign an agent may be needed."],
    ["Errors are caught by tests and easily rolled back.", "That makes autonomy more acceptable."]
  ],
  "a": [0, 1],
  "why": "Choose workflows when steps are predictable and errors are costly; agents when the path is open-ended and errors are recoverable."
},
{
  "id": "p3-12", "d": 2, "s": "System prompts and guardrails",
  "stem": "A system prompt says 'Never disclose a customer's full account number.' A red-team test gets the assistant to reveal one anyway. What's the right conclusion?",
  "o": [
    ["Prompt guardrails guide behaviour but don't guarantee it. Add code controls: don't send full numbers to the model, and check outputs before they're shown.", "Correct. Anything that must always hold needs enforcement in code."],
    ["Make the instruction longer and add capital letters.", "Emphasis doesn't make a prompt a guarantee."],
    ["The model is broken; switch providers.", "Every model can be manipulated; controls belong in the system."],
    ["Stop red-teaming; it causes problems.", "Red-teaming found a real gap."]
  ],
  "a": [0],
  "why": "Design guardrails in layers: prompt instructions plus input minimization and output checks in code."
},
{
  "id": "p3-13", "d": 2, "s": "Prompting techniques",
  "stem": "A team adds 'Show your reasoning step by step before answering' to a customer-facing prompt on Claude Opus 5.5. Answers are now long and customers dislike them. What's the better approach?",
  "o": [
    ["Remove the instruction and rely on adaptive thinking, adjusting effort if needed. Ask for visible reasoning only where someone needs to read it, and keep customer answers concise.", "Correct. Current models reason internally; visible chain of thought is a separate choice."],
    ["Keep it and set `budget_tokens` higher.", "`budget_tokens` returns a 400 on Opus 5.5."],
    ["Ask for the reasoning in a hidden HTML comment.", "Customers or downstream systems may still see it, and it's unnecessary."],
    ["Switch thinking off.", "Thinking can't be disabled on Opus 5.5."]
  ],
  "a": [0],
  "why": "Chain-of-thought prompting is largely replaced by adaptive thinking with effort on current models. Show reasoning only where it's needed."
},
{
  "id": "p3-14", "d": 2, "s": "Context window optimization",
  "stem": "A 40-turn support conversation re-sends a 3,000-token account record returned by a tool on every turn, and costs climb. What's the most direct fix?",
  "o": [
    ["Trim tool results to the fields the task needs before adding them to history, and keep key facts in a short case-facts block.", "Correct. Smaller tool results shrink every later turn."],
    ["Switch to a model with a larger context window.", "That allows more waste; it doesn't remove it."],
    ["Restart the conversation every 5 turns.", "That loses context the customer expects you to keep."],
    ["Lower `max_tokens`.", "That limits output, not the input that keeps growing."]
  ],
  "a": [0],
  "why": "Manage token usage at the source: trim tool output, keep authoritative facts compact, and use context editing or compaction for long sessions."
},
{
  "id": "p3-15", "d": 2, "s": "Model selection",
  "stem": "For a high-volume internal agent doing everyday coding and enterprise tasks, the team wants a model below Opus in price but still strong at agent work. Which is the natural candidate to evaluate?",
  "o": [
    ["Claude Sonnet 5.5, the current Sonnet, designed for everyday coding, agent and enterprise work at lower cost than Opus.", "Correct. Sonnet 5.5 is the mid-tier fit; confirm with an eval."],
    ["Claude Fable 5.1.", "It's the most capable and priced above Opus."],
    ["An older Sonnet version, because older is cheaper.", "Use the current generation unless there's a reason not to."],
    ["No model; agents need a human for every step.", "That doesn't answer the selection question."]
  ],
  "a": [0],
  "why": "Model tiers: Fable 5.1 for the hardest work, Opus 5.5 as the default for complex work, Sonnet 5.5 for everyday work at lower cost, Haiku 4.5 for high-volume simpler tasks."
},
{
  "id": "p3-16", "d": 2, "s": "Prompt reuse and caching",
  "stem": "A design places `cache_control` markers on six different content blocks to cache several stable sections. The request fails. Why?",
  "o": [
    ["A request allows at most 4 cache breakpoints. Consolidate them, usually one after the stable system prefix plus automatic caching for the conversation tail.", "Correct. The breakpoint limit is four per request."],
    ["Caching only works on the user message.", "Tools and system blocks can be cached too."],
    ["Each breakpoint must be a separate request.", "Breakpoints are positions within one request."],
    ["The blocks are too short to cache.", "Short blocks don't cache, but they don't cause failure."]
  ],
  "a": [0],
  "why": "Prompt caching allows up to 4 breakpoints; put stable content first and break after it."
},
{
  "id": "p3-17", "d": 2, "s": "Model selection",
  "stem": "Migrating to Claude Opus 5.5, requests that set `temperature: 0` for consistency return 400. What should the team do?",
  "o": [
    ["Remove the sampling parameters, which current models reject. For consistency, use structured outputs, clear instructions, examples and code validation.", "Correct. Sampling controls are removed on Opus 5.5; consistency comes from specification and validation."],
    ["Set `temperature: 0.01` instead.", "Any non-default sampling value is rejected."],
    ["Use `top_p: 0` instead.", "Also rejected."],
    ["Retry the request until it succeeds.", "The request will keep failing until the parameter is removed."]
  ],
  "a": [0],
  "why": "On current models, sampling parameters, `budget_tokens`, prefill and forced tool choice return 400s. Migrate to effort, structured outputs and `strict` tools."
},
{
  "id": "p3-18", "d": 2, "s": "Prompt reuse and caching",
  "stem": "Partway through a long, cached agent session, the operator needs to add a new instruction ('stop offering fee waivers today'). Editing the top-level system prompt would invalidate the cached history. What's the better option on models that support it?",
  "o": [
    ["Append a mid-conversation system message to the messages array, which preserves the cached prefix.", "Correct. A mid-conversation system message adds the instruction without rewriting the prefix."],
    ["Edit the first user message to include the instruction.", "Editing earlier turns invalidates the cache and breaks append-only history."],
    ["Restart the session with a new system prompt.", "That loses the session's context and cache."],
    ["Put the instruction in a tool description.", "That's the wrong channel, and changing tools also invalidates the cache."]
  ],
  "a": [0],
  "why": "Keep long sessions append-only. On models that support them (such as Opus 5.5), mid-conversation system messages carry new operator instructions without breaking the cache."
},
{
  "id": "p3-19", "d": 2, "s": "Prompt reuse and caching",
  "stem": "Which content belongs in a Skill rather than in every system prompt?",
  "o": [
    ["A multi-step procedure with reference files (for example the steps and templates for preparing a suspicious activity report) that's needed only in some sessions.", "Correct. Skills load their body only when relevant, keeping other sessions lean."],
    ["The assistant's core role and safety rules, which apply to every request.", "Always-on rules belong in the system prompt."],
    ["Today's date.", "Volatile values go in the message, not a Skill."],
    ["A customer's account number.", "Per-request data doesn't belong in a reusable Skill."]
  ],
  "a": [0],
  "why": "Skills package reusable procedures and files with progressive disclosure; system prompts hold what applies to every request."
},
{
  "id": "p3-20", "d": 3, "s": "Retrieval strategies",
  "stem": "A question like 'Did the fee change announced in March affect customers who opened accounts after the April migration?' needs facts from three different documents. Single-shot retrieval misses parts. What helps?",
  "o": [
    ["Agentic search: let the model run several retrieval calls, refining queries as it learns, before answering with citations.", "Correct. Multi-hop questions benefit from iterative retrieval."],
    ["Increase k to 50 in a single search.", "That adds noise and still may not find each hop."],
    ["Merge all documents into one chunk.", "That defeats retrieval."],
    ["Answer from the model's general knowledge.", "Internal facts aren't in the model's knowledge."]
  ],
  "a": [0],
  "why": "Match the retrieval strategy to the query pattern: single lookups for simple questions, iterative or agentic search for multi-hop ones."
},
{
  "id": "p3-21", "d": 3, "s": "RAG pipeline design",
  "stem": "A team picked 2,000-token chunks to 'give more context'. Answers are now vaguer and cost more. What's the trade-off at play?",
  "o": [
    ["Large chunks dilute relevance (one good sentence buried in much unrelated text) and cost more tokens; small chunks lose context. Tune size on retrieval and answer evals, using document structure.", "Correct. Chunk size is a measured trade-off, not 'bigger is better'."],
    ["Larger chunks are always better.", "They dilute relevance and add cost."],
    ["Chunk size doesn't affect answers.", "It affects both retrieval precision and context quality."],
    ["The model should choose the chunk size at query time.", "Chunking happens at indexing time."]
  ],
  "a": [0],
  "why": "Design chunking by evaluation: structure-aware boundaries and a size tuned on retrieval and answer quality."
},
{
  "id": "p3-22", "d": 3, "s": "Capability bloat",
  "stem": "An analytics assistant only needs to query reporting data. It connects with a database user that can insert, update and drop tables. What should change?",
  "o": [
    ["Connect with a read-only role scoped to the reporting schema.", "Correct. Least privilege at the data layer removes write and drop capability."],
    ["Tell the assistant never to write to the database.", "Prompts aren't permissions."],
    ["Log all queries and review them weekly.", "Detection comes after damage."],
    ["Use a more careful model.", "Model choice doesn't change database permissions."]
  ],
  "a": [0],
  "why": "Apply least privilege at every layer: tools, credentials and data access."
},
{
  "id": "p3-23", "d": 3, "s": "Authentication and authorization",
  "stem": "A `get_statement` tool takes an `account_id` and returns the statement. The assistant passes whatever account ID the user mentions. What's the security gap?",
  "o": [
    ["The tool doesn't check that the account belongs to the authenticated user. It should derive the account from the user's session or verify ownership server-side before returning data.", "Correct. This is a broken object-level authorization gap."],
    ["The account ID isn't encrypted.", "Encryption doesn't stop an unauthorized lookup."],
    ["The tool description is too short.", "Descriptions don't enforce authorization."],
    ["The tool should be called less often.", "Frequency isn't the problem."]
  ],
  "a": [0],
  "why": "Analyze auth requirements per tool: every object access must be authorized for the actual user, in the server."
},
{
  "id": "p3-24", "d": 3, "s": "Observability",
  "stem": "Product managers want to read real conversations to understand quality, but conversations contain customer PII. What's the right approach?",
  "o": [
    ["Sample conversations, redact PII before they leave the production boundary, restrict access, set retention, and pair the samples with structured metrics.", "Correct. Sampling plus redaction gives insight without broad exposure."],
    ["Give PMs full production log access.", "That exposes PII unnecessarily."],
    ["Never look at conversations.", "Sampled review is an important quality signal."],
    ["Ask the model to summarize each conversation without PII and discard the originals.", "Summaries can drop the detail needed to diagnose issues, and redaction should be deterministic."]
  ],
  "a": [0],
  "why": "Observability at scale combines structured metrics with privacy-preserving, sampled transcript review."
},
{
  "id": "p3-25", "d": 3, "s": "Accuracy-latency trade-offs",
  "stem": "Raising retrieved chunks from 5 to 20 lifts answer accuracy from 90% to 91% but doubles input tokens and adds 900 ms. The latency SLA has 1 second of headroom. What should you do?",
  "o": [
    ["Keep k=5 (or try a middle value), since the gain is within noise and uses most of the latency headroom and budget. Look at a reranker or better chunking for accuracy instead.", "Correct. A one-point gain doesn't justify doubling cost and almost exhausting the SLA headroom."],
    ["Use k=20, because more accuracy is always better.", "The trade-off isn't worth it on these numbers."],
    ["Use k=50 to get even more accuracy.", "That likely breaks the SLA and adds noise."],
    ["Remove retrieval to save latency.", "That would collapse accuracy."]
  ],
  "a": [0],
  "why": "Evaluate accuracy-latency trade-offs with measured deltas against SLAs and budgets, and prefer changes that improve both."
},
{
  "id": "p3-26", "d": 3, "s": "Integration mechanisms",
  "stem": "An MCP server for a policy library needs to expose both 'search policies' and the current version of each policy document for clients to read. How should it model these?",
  "o": [
    ["Expose search as a tool the model can call, and expose policy documents as resources that clients can list and read.", "Correct. MCP tools are actions the model invokes; resources are content the client can read and attach."],
    ["Expose everything as tools.", "Workable, but it misses the resource primitive designed for readable content."],
    ["Put all policy text in the server's description.", "That doesn't scale and wastes context."],
    ["Skip MCP and email the documents.", "That isn't an integration."]
  ],
  "a": [0],
  "why": "Know MCP primitives: tools for actions, resources for readable content, prompts for reusable templates."
},
{
  "id": "p3-27", "d": 3, "s": "Progressive discovery",
  "stem": "An agent uses tool search with 80 deferred tools. A teammate worries this will break prompt caching as tools load during the session. What's accurate?",
  "o": [
    ["Tool search appends the discovered schemas rather than swapping the tool list, so the existing cached prefix is preserved.", "Correct. Progressive discovery through tool search is designed to be cache-friendly."],
    ["Every tool load invalidates the whole cache.", "Swapping tools would; tool search appends instead."],
    ["Caching can't be used with tool search.", "The two work together."],
    ["Deferred tools are loaded on every request anyway.", "They load only when the search finds them relevant."]
  ],
  "a": [0],
  "why": "Progressive discovery (tool search, Skills) keeps context focused and preserves caching by appending rather than replacing."
},
{
  "id": "p3-28", "d": 3, "s": "Integration mechanisms",
  "stem": "A design for a Bedrock-hosted assistant relies on Claude's server-side web search tool for current market news. What should the architect flag?",
  "o": [
    ["Server-side web search isn't available on Bedrock. Use another news source integration (an API or MCP server you control), or a platform that offers the tool.", "Correct. Check feature availability per platform before designing around a server tool."],
    ["Web search needs a larger model on Bedrock.", "The issue is availability, not model size."],
    ["Nothing. All server tools work on every platform.", "Server tool availability varies by platform."],
    ["Web search is only blocked at night.", "There's no such limitation."]
  ],
  "a": [0],
  "why": "Integration designs must account for platform differences. On Bedrock, web search and fetch, Batches, the Files API and the MCP connector aren't available."
},
{
  "id": "p3-29", "d": 3, "s": "Integration mechanisms",
  "stem": "A design uses the API's citations feature on document blocks and also wants a JSON-schema structured output in the same request. The request returns 400. What's the issue?",
  "o": [
    ["Citations are incompatible with `output_config.format`. Use citations for the grounded text answer, and get structured fields in a separate call, or put source IDs in the schema yourself.", "Correct. These two features can't be combined in one request."],
    ["Citations need a beta header.", "Citations don't need a beta header."],
    ["Documents must be under 10 pages for citations.", "Page count isn't the cause of this 400."],
    ["Structured outputs only work with tools.", "Structured outputs work on plain message responses."]
  ],
  "a": [0],
  "why": "Feature interactions matter in integration design: citations and structured outputs can't be used in the same request."
},
{
  "id": "p3-30", "d": 3, "s": "Observability",
  "stem": "Leadership asks for one dashboard to manage an AI assistant at scale. Which set of signals is most useful?",
  "o": [
    ["Volume, p50 and p95 latency, error rate by class, stop-reason distribution (including max_tokens and refusals), cache hit rate, cost per completed task, sampled quality scores by segment, and escalation rate.", "Correct. These cover reliability, cost and quality together."],
    ["Total tokens only.", "Tokens alone miss quality and reliability."],
    ["Number of users and a satisfaction emoji.", "Too coarse to manage the system."],
    ["Model name and version.", "Useful metadata, not operating metrics."]
  ],
  "a": [0],
  "why": "Monitoring at scale means a balanced set of reliability, cost and quality metrics, broken down by segment."
},
{
  "id": "p3-31", "d": 3, "s": "Authentication and authorization",
  "stem": "Which TWO are authentication or authorization gaps in an assistant that integrates with internal systems?",
  "o": [
    ["The assistant's tools use an API key with permanent, organization-wide write access.", "Correct. Over-scoped, non-expiring credentials are a classic gap."],
    ["Tools accept a user ID from the model's arguments instead of the authenticated session.", "Correct. The model can be manipulated into supplying another user's ID."],
    ["The tool server validates the user's delegated token on every call.", "That's the desired control."],
    ["Read-only tools are separated from write tools with different scopes.", "That's good practice."],
    ["Secrets come from a secrets manager at runtime.", "That's good practice."]
  ],
  "a": [0, 1],
  "why": "Look for over-scoped or permanent credentials and identity taken from model output instead of the authenticated session."
},
{
  "id": "p3-32", "d": 4, "s": "Evaluation metrics",
  "stem": "How should the security metric be measured for an assistant that reads customer-uploaded documents?",
  "o": [
    ["Include adversarial cases with injected instructions in the eval set and measure the share the system follows, with zero as a hard gate.", "Correct. Security needs its own test cases and threshold."],
    ["Count customer complaints about security.", "A lagging, incomplete signal."],
    ["Rely on the model provider's safety testing.", "That doesn't test your system, tools and data."],
    ["Measure overall accuracy; security follows from it.", "Accuracy on normal cases says nothing about adversarial ones."]
  ],
  "a": [0],
  "why": "Evaluation metrics include security: design adversarial cases and gate on them."
},
{
  "id": "p3-33", "d": 4, "s": "Test frameworks",
  "stem": "A team wants every pull request that changes prompts, tools or retrieval to be checked automatically. What test framework design fits?",
  "o": [
    ["A CI job that runs code-graded checks and a fast regression subset of the eval on every change, with the full eval and LLM-judge runs before release, failing the build on any hard-gate failure.", "Correct. Tiered automated evals catch regressions early and keep the release gate strict."],
    ["Manual spot checks by the author.", "Not consistent or reliable."],
    ["Running the full 5,000-case eval on every commit.", "Often too slow and costly; tier it."],
    ["Only testing in production.", "That exposes customers to regressions."]
  ],
  "a": [0],
  "why": "Design test frameworks with fast, cheap checks in CI and fuller evals before release."
},
{
  "id": "p3-34", "d": 4, "s": "Diagnosing system issues",
  "stem": "After switching a claims classifier to a smaller model, routine claims are still fine but complex multi-policy claims fail far more often. How do you diagnose this?",
  "o": [
    ["Model mismatch for that segment. Route complex claims to the more capable model, or raise effort for them, and confirm with the segment eval.", "Correct. Capability shortfalls often show up in the hardest segment first."],
    ["A prompt failure. Add more few-shot examples of routine claims.", "Routine claims are fine; the failure is capability on the complex ones."],
    ["A retrieval failure.", "No retrieval change was made."],
    ["Random noise. Ignore it.", "A consistent segment-level drop isn't noise."]
  ],
  "a": [0],
  "why": "Diagnose by segment: a model or configuration mismatch often appears only where the task is hardest."
},
{
  "id": "p3-35", "d": 4, "s": "Evaluation datasets",
  "stem": "Which is the most trustworthy ground truth for an eval of a loan-document extractor?",
  "o": [
    ["A gold set labelled by trained reviewers using written labelling guidelines, with a sample double-labelled to measure agreement.", "Correct. Clear guidelines and measured agreement make labels reliable."],
    ["The current model's outputs.", "That measures agreement with itself, not correctness."],
    ["A single reviewer's quick pass with no guidelines.", "Inconsistent and unmeasured."],
    ["Outputs from another vendor's model.", "Another model isn't ground truth."]
  ],
  "a": [0],
  "why": "Design eval datasets with reliable labels: guidelines, trained labellers and inter-rater agreement."
},
{
  "id": "p3-36", "d": 4, "s": "Monitoring",
  "stem": "Why should a latency SLA be set and monitored on p95 rather than the mean?",
  "o": [
    ["The mean hides the slow tail that many users experience. p95 shows how slow it gets for the worst 5% of requests, which is what breaches commitments.", "Correct. Tail latency drives user experience and SLA breaches."],
    ["The mean is always higher than p95.", "Usually the reverse."],
    ["p95 is cheaper to compute.", "Cost isn't the reason."],
    ["p95 removes the need to monitor errors.", "Errors still need separate monitoring."]
  ],
  "a": [0],
  "why": "Monitor latency percentiles (p50, p95, p99) and time to first token, not averages alone."
},
{
  "id": "p3-37", "d": 4, "s": "Cost-performance optimization",
  "stem": "A 12,000-token instruction prefix is identical across requests, and time to first token is 2.8 seconds. Which optimization most directly cuts that time without changing outputs?",
  "o": [
    ["Cache the stable prefix, so later requests read it instead of reprocessing it.", "Correct. Cache reads reduce time to first token and cost."],
    ["Shorten `max_tokens`.", "That limits output length, not prefix processing."],
    ["Switch to a smaller model without testing.", "May change outputs; caching doesn't."],
    ["Add more examples to the prefix.", "That makes the prefix longer."]
  ],
  "a": [0],
  "why": "Prompt caching is one of the free optimizations: lower cost and time to first token without changing outputs."
},
{
  "id": "p3-38", "d": 4, "s": "Cost-performance optimization",
  "stem": "A team wants to find the cheapest effort level that still meets the quality bar for a document classifier. What's the right method?",
  "o": [
    ["Run an effort sweep (low, medium, high) on the same eval set, and pick the lowest level that passes every hard gate and the accuracy target, judged by cost per completed task.", "Correct. Measure each level against the same gates."],
    ["Always use max, to be safe.", "That overspends when lower effort holds quality."],
    ["Always use low, since classification is simple.", "It may be fine, but you need to measure it."],
    ["Ask the model which effort it prefers.", "Not a measurement."]
  ],
  "a": [0],
  "why": "Optimize cost-performance empirically: sweep effort and model choices on the eval, per route."
},
{
  "id": "p3-39", "d": 4, "s": "A/B testing",
  "stem": "A new prompt raised the online resolution rate by 3 points, but escalations to human agents rose 15%. What should the team conclude?",
  "o": [
    ["Investigate before shipping. The guardrail metric moved against you, which could mean resolutions are being claimed prematurely or hard cases are pushed to humans. Look at the cases and segments.", "Correct. Guardrail regressions can outweigh primary-metric gains."],
    ["Ship it; the primary metric improved.", "That ignores a significant guardrail regression."],
    ["Ignore escalations; they're the human team's problem.", "Escalations are a cost and quality signal for the system."],
    ["Revert and never test again.", "The test produced useful information; investigate it."]
  ],
  "a": [0],
  "why": "Read A/B results across primary and guardrail metrics, then investigate any conflict before deciding."
},
{
  "id": "p3-40", "d": 4, "s": "Test frameworks",
  "stem": "Your LLM judge uses a single 1-to-10 'overall quality' score. Scores are noisy and hard to act on. What's the better rubric design?",
  "o": [
    ["Separate criteria (for example faithful to the source, complete, compliant, clear), each with defined levels and a short reason, returned through a schema.", "Correct. Per-criterion scores are more reliable and tell you what to fix."],
    ["Use a 1-to-100 scale for more precision.", "Finer scales add noise without clarity."],
    ["Ask the judge whether the answer is good: yes or no.", "Coarser still, and harder to act on."],
    ["Have the judge grade without the source document.", "It can't check faithfulness without the source."]
  ],
  "a": [0],
  "why": "LLM-judge rubrics should have explicit criteria, defined levels, reasons and the source material."
},
{
  "id": "p3-41", "d": 4, "s": "Diagnosing system issues",
  "stem": "Which TWO symptoms point to a retrieval problem rather than a generation problem?",
  "o": [
    ["The right source passage isn't among the retrieved chunks for questions that fail.", "Correct. Low recall@k shows retrieval is the cause."],
    ["Failures started right after a re-index, with no prompt or model change.", "Correct. The data path changed."],
    ["The correct passage is retrieved, but the answer misreads it.", "That's generation."],
    ["Answers are correct but too long.", "That's an output style issue."],
    ["The model ignores a formatting instruction.", "That's a prompt or format issue."]
  ],
  "a": [0, 1],
  "why": "Diagnose RAG systems stage by stage: check whether the right evidence was retrieved before blaming generation."
},
{
  "id": "p3-42", "d": 5, "s": "Guardrails and safety controls",
  "stem": "Which set of controls best represents defence in depth for a customer-facing banking assistant?",
  "o": [
    ["Prompt rules, input redaction, least-privilege tools with the user's identity, code-enforced action policies, human approval for high-impact actions, output checks, and an audit trail.", "Correct. Several independent layers, so one failure isn't catastrophic."],
    ["A very detailed system prompt.", "One layer, and the weakest."],
    ["A content filter on outputs only.", "Catches some problems late and misses action risks."],
    ["Monthly manual review of logs.", "Detective only, and slow."]
  ],
  "a": [0],
  "why": "Implement guardrails in layers, with the critical ones enforced in code."
},
{
  "id": "p3-43", "d": 5, "s": "Risks and failure modes",
  "stem": "A customer asks an assistant about this year's contribution limits for a retirement account. The model's training data predates this year's change. What failure mode is this, and the mitigation?",
  "o": [
    ["Stale knowledge. Retrieve current figures from a maintained source with an effective date, and cite them.", "Correct. Time-sensitive facts should come from retrieval, not model memory."],
    ["Prompt injection. Block the question.", "There's no injection here."],
    ["Sycophancy. Tell the model to be firmer.", "Firmness doesn't fix outdated facts."],
    ["Latency. Use streaming.", "Unrelated."]
  ],
  "a": [0],
  "why": "LLM limitations include a training cutoff. Ground time-sensitive facts in maintained, dated sources."
},
{
  "id": "p3-44", "d": 5, "s": "Human-in-the-loop",
  "stem": "A credit decision with legal effect is made with AI assistance for an EU applicant. Under GDPR, what must the design support?",
  "o": [
    ["Meaningful human involvement in the decision, the right to contest it, and an explanation of the logic involved, with records to support them.", "Correct. GDPR restricts solely automated decisions with legal or similarly significant effects."],
    ["Nothing, if the model is accurate enough.", "Accuracy doesn't remove the requirement."],
    ["Only a privacy notice on the website.", "Notice alone doesn't provide review or contestation."],
    ["Deleting all records immediately after the decision.", "That would prevent explanation and contestation."]
  ],
  "a": [0],
  "why": "Human-in-the-loop design for regulated decisions: meaningful review, contestability, explanation and records."
},
{
  "id": "p3-45", "d": 5, "s": "Regulatory compliance",
  "stem": "A claims assistant handling PHI needs only the claim's diagnosis codes and dates, but the source system returns full medical histories. Which HIPAA principle applies, and how?",
  "o": [
    ["Minimum necessary: request or pass only the diagnosis codes and dates the task needs, and keep the rest out of prompts and logs.", "Correct. Limit PHI to what the task requires."],
    ["Patient consent: ask each patient before every request.", "That isn't the operative principle for this design question."],
    ["Encryption: encrypt the full history and send it.", "The model still receives more PHI than it needs."],
    ["Breach notification: notify patients after each request.", "Notification is for breaches, not routine processing."]
  ],
  "a": [0],
  "why": "HIPAA's minimum-necessary standard is applied at the integration layer: send only what the task needs."
},
{
  "id": "p3-46", "d": 5, "s": "Regulatory compliance",
  "stem": "A state agency contractor must run an AI case-review tool for a federal programme. The vendor's commercial endpoint isn't FedRAMP-authorized. What's the right path?",
  "o": [
    ["Use a deployment of Claude on a platform and region with the required FedRAMP authorization (such as a government cloud region), and verify the current authorization level.", "Correct. Federal programme data needs an authorized service."],
    ["Use the commercial endpoint with extra encryption.", "Encryption doesn't substitute for authorization."],
    ["Get each case worker to accept the risk.", "Individuals can't waive FedRAMP requirements."],
    ["Run it on a personal account to avoid procurement.", "That violates policy and security requirements."]
  ],
  "a": [0],
  "why": "FedRAMP compliance comes from choosing an authorized deployment, not from application-level measures."
},
{
  "id": "p3-47", "d": 5, "s": "Ethical AI",
  "stem": "How can a team test a loan pre-screening assistant for bias when it has few historical outcomes by demographic group?",
  "o": [
    ["Counterfactual testing: submit matched applications that differ only in a protected attribute or proxy (such as name or postcode) and compare outcomes and explanations.", "Correct. Matched pairs reveal sensitivity to attributes that shouldn't matter."],
    ["Ask the model whether it treats groups equally.", "Self-report isn't a test."],
    ["Assume there's no bias without data.", "Absence of evidence isn't evidence of fairness."],
    ["Remove all applicant information.", "The model can't do the task then."]
  ],
  "a": [0],
  "why": "Bias testing includes counterfactual and outcome analysis, documented and repeated over time."
},
{
  "id": "p3-48", "d": 5, "s": "Risks and failure modes",
  "stem": "A safety classifier declines some legitimate security-training requests from a bank's internal red team, returning `stop_reason: refusal`. What's the right handling?",
  "o": [
    ["Check for the refusal stop reason in code, read `stop_details`, route per policy (for example to a reviewer), and use server-side fallbacks where the platform supports them.", "Correct. Refusals arrive as HTTP 200 and need explicit handling."],
    ["Retry the identical request in a loop until it succeeds.", "That wastes cost and isn't a policy."],
    ["Rephrase requests to evade the classifier.", "Evading safety controls isn't an acceptable design."],
    ["Treat refusals as successful empty answers.", "That silently drops the work."]
  ],
  "a": [0],
  "why": "Treat refusals as a known failure mode: detect, route, and use supported fallbacks rather than evasion."
},
{
  "id": "p3-49", "d": 5, "s": "Human-in-the-loop",
  "stem": "An AI drafts responses to customer complaints, and agents review each draft before sending. Which design detail most reduces the risk of rubber-stamping?",
  "o": [
    ["Highlight in the review screen the facts the draft relies on with their sources, and flag drafts that make commitments or mention regulators, so reviewers check what matters.", "Correct. Reviewers need evidence and focus, not just a 'send' button."],
    ["Require reviewers to approve faster to keep queues short.", "Speed pressure increases rubber-stamping."],
    ["Hide the AI's sources to avoid clutter.", "That makes verification harder."],
    ["Let drafts send automatically after 5 minutes without review.", "That removes review altogether."]
  ],
  "a": [0],
  "why": "Effective human-in-the-loop review gives reviewers evidence, focus on high-risk content and manageable volume."
},
{
  "id": "p3-50", "d": 5, "s": "Ethical AI",
  "stem": "A wealth firm deploys a client-facing AI assistant. Which practice best supports transparency?",
  "o": [
    ["Tell clients they're talking to an AI, explain what it can and can't do (it doesn't give personalized advice), offer a human, and document the system's purpose, data and limitations.", "Correct. Disclosure, clear scope and documentation support transparency."],
    ["Give the AI a human name and persona so clients feel comfortable.", "Implying a human misleads clients."],
    ["Only disclose AI use if a client asks.", "Proactive disclosure is the transparent practice."],
    ["Publish the model's weights.", "Not available, and not what clients need for transparency."]
  ],
  "a": [0],
  "why": "Transparency means disclosing AI use, stating capabilities and limits, offering human help, and documenting the system."
},
{
  "id": "p3-51", "d": 6, "s": "Discovery and requirements",
  "stem": "During discovery for an AI underwriting aid, which question most affects how much autonomy the design can have?",
  "o": [
    ["What does an error cost, who catches it today, and can a wrong decision be reversed?", "Correct. Cost and reversibility of errors drive how much autonomy and human review the design needs."],
    ["Which model is the newest?", "Model choice comes after the requirements."],
    ["What colour should the interface be?", "Not an architecture driver."],
    ["How many prompts will be needed?", "An implementation detail."]
  ],
  "a": [0],
  "why": "Discovery covers the cost of error and the current controls, because they shape the level of autonomy, the human-in-the-loop design and the risk controls."
},
{
  "id": "p3-52", "d": 6, "s": "Communicating decisions",
  "stem": "A board committee asks about the main risks of the bank's new AI assistant. What's the best format for this audience?",
  "o": [
    ["A short summary of the top risks in plain language, with the likelihood and impact of each, the controls in place, residual risk, the owner, and how it's monitored.", "Correct. Boards need risk, controls and accountability at a glance."],
    ["The full eval report with per-case results.", "Too detailed for the audience."],
    ["The system prompt.", "It doesn't explain risk or controls."],
    ["A statement that the vendor handles all risk.", "Accountability stays with the bank."]
  ],
  "a": [0],
  "why": "Communicate risk to senior audiences as top risks, controls, residual risk, owners and monitoring."
},
{
  "id": "p3-53", "d": 6, "s": "Documentation and guidance",
  "stem": "Which artifact best helps a privacy officer approve an AI system's data handling?",
  "o": [
    ["A data-flow diagram showing where personal data enters, which components and vendors see it, what's redacted, where it's stored and for how long, and how deletion works.", "Correct. Privacy review needs the data flows, minimization and retention."],
    ["The model card from the vendor.", "Useful context, but not your system's data flows."],
    ["A list of prompts.", "It doesn't show where data goes."],
    ["Uptime statistics.", "Not a privacy artifact."]
  ],
  "a": [0],
  "why": "Document architectures for each reviewer: data flows and retention for privacy, controls for risk, interfaces for engineers."
},
{
  "id": "p3-54", "d": 6, "s": "Lifecycle management",
  "stem": "During handoff to a contact-centre team, what's most often missed but critical for adoption?",
  "o": [
    ["Training front-line users on what the assistant does and doesn't do, how to spot and report bad output, and when to escalate.", "Correct. Users need to know the limits and the feedback path."],
    ["The source code repository link.", "Useful for engineers, not for front-line adoption."],
    ["The architecture diagram.", "Useful for technical teams, not for daily use."],
    ["The model's parameter count.", "Irrelevant to users."]
  ],
  "a": [0],
  "why": "Handoff includes people: user training, feedback channels and escalation guidance, not just runbooks."
},
{
  "id": "p3-55", "d": 6, "s": "Stakeholder expectations and SLAs",
  "stem": "Operations and Compliance disagree about an AI assistant's SLA: Operations wants a 2-second p95, while Compliance wants an extra verification step that adds 1.5 seconds. What should the architect do?",
  "o": [
    ["Lay out the options with measured impact (for example, verify only high-risk cases, run verification in parallel, or accept 3.5 seconds), recommend one, and get both stakeholders to agree to the SLA in writing.", "Correct. Turn the conflict into explicit, measured options and a documented agreement."],
    ["Side with Operations, since speed matters most to customers.", "That ignores a compliance requirement."],
    ["Side with Compliance and skip the conversation.", "That leaves Operations' expectations unmanaged."],
    ["Promise both 2 seconds and the extra step.", "That's not achievable as stated."]
  ],
  "a": [0],
  "why": "Manage expectations by making trade-offs explicit, offering measured options and documenting the agreed SLA."
},
{
  "id": "p3-56", "d": 6, "s": "Lifecycle management",
  "stem": "In the monitoring phase, what should a weekly review with the business owner cover?",
  "o": [
    ["The SLA metrics against targets, sampled cases with their quality scores, new failure types added to the eval set, incidents, and planned changes with their eval results.", "Correct. Regular reviews keep the system, expectations and improvements aligned."],
    ["Only cost.", "That misses quality and reliability."],
    ["A demo of a new feature each week.", "Features without metrics don't show health."],
    ["Nothing unless there's an incident.", "Problems would only surface after they hurt."]
  ],
  "a": [0],
  "why": "Support the monitoring and iteration phases with regular, metric-based reviews and a visible improvement pipeline."
},
{
  "id": "p3-57", "d": 6, "s": "Lifecycle management",
  "stem": "A product owner wants to tweak the assistant's prompt directly in production to fix a wording issue quickly. What change process should apply?",
  "o": [
    ["The same as any change: a versioned prompt update, the regression eval and release gate, a staged rollout, and the ability to roll back.", "Correct. Small prompt changes can cause large regressions."],
    ["Allow direct edits for wording-only changes.", "Wording changes can shift behaviour in unexpected ways."],
    ["Ban all prompt changes after launch.", "That blocks necessary improvements."],
    ["Let the model rewrite its own prompt.", "Uncontrolled and untested."]
  ],
  "a": [0],
  "why": "Lifecycle change control applies to prompts, models, tools and retrieval alike."
},
{
  "id": "p3-58", "d": 6, "s": "Communicating decisions",
  "stem": "Stakeholders keep forwarding single bad answers as proof that the assistant 'doesn't work', while metrics show 96% quality. How should you respond?",
  "o": [
    ["Acknowledge each report, check it against traces, add confirmed failures to the eval set, and share the metric context (96% overall, with per-segment rates) plus the fixes made.", "Correct. Respect anecdotes as signals and put them in the context of the data."],
    ["Dismiss the anecdotes as unrepresentative.", "That damages trust and may miss real failure patterns."],
    ["Change the prompt after every anecdote.", "Unevaluated reactive changes risk regressions."],
    ["Stop publishing metrics.", "That removes the shared basis for discussion."]
  ],
  "a": [0],
  "why": "Stakeholder feedback loops combine individual reports with measured performance and visible follow-through."
},
{
  "id": "p3-59", "d": 6, "s": "Discovery and requirements",
  "stem": "Which requirement is most likely to be missed in discovery but force a redesign later in a regulated bank?",
  "o": [
    ["Data residency and approved platforms: where inference may run, and which cloud platforms and regions Procurement and Risk have approved.", "Correct. Platform and residency constraints can rule out designs late if not captured early."],
    ["The preferred font in the chat widget.", "Easily changed later."],
    ["The exact wording of the greeting message.", "Easily changed later."],
    ["The name of the assistant.", "Easily changed later."]
  ],
  "a": [0],
  "why": "Capture constraints that shape architecture early: residency, approved platforms, regulations, data access and identity."
},
{
  "id": "p3-60", "d": 7, "s": "Configuring Claude tools for teams",
  "stem": "What makes a team's CLAUDE.md most effective?",
  "o": [
    ["Short, specific content: build and test commands, conventions, data rules and where things live, kept up to date as the codebase changes.", "Correct. Specific, current guidance helps every session."],
    ["Long general advice such as 'write clean code' and 'follow best practices'.", "Vague guidance adds tokens without changing behaviour."],
    ["A copy of the entire architecture document.", "Too long to load into every session; link or summarize instead."],
    ["API keys so Claude can access services.", "Secrets must never go in CLAUDE.md."]
  ],
  "a": [0],
  "why": "Configure Claude Code for teams with concise, specific CLAUDE.md files, and put enforcement in settings and hooks."
},
{
  "id": "p3-61", "d": 7, "s": "AI-assisted developer workflows",
  "stem": "A team wants a focused security review of every change, with limited tools and its own context, invoked during development in Claude Code. What's the best fit?",
  "o": [
    ["A subagent definition in `.claude/agents/` with a security-review prompt and only the read tools it needs.", "Correct. Subagents give a focused role, isolated context and restricted tools."],
    ["A paragraph in CLAUDE.md asking Claude to think about security.", "Guidance without isolation or tool limits."],
    ["A separate chat window with no project access.", "It can't read the code."],
    ["A hook that blocks every edit until a human reviews it.", "Too heavy for every edit, and it isn't a review."]
  ],
  "a": [0],
  "why": "Improve developer workflows with subagents for focused roles, Skills for procedures and hooks for must-run checks."
},
{
  "id": "p3-62", "d": 7, "s": "AI-assisted developer workflows",
  "stem": "A team wants Claude to review every pull request in CI and post findings, without interactive prompts. What's the recommended setup?",
  "o": [
    ["Run Claude Code headless (`claude -p`) in the CI job with a narrow `--allowedTools` list, JSON output, and credentials from CI secrets.", "Correct. Headless mode with restricted tools fits automated pipelines."],
    ["Run an interactive Claude Code session on the CI server.", "CI can't answer interactive prompts."],
    ["Give the CI job `Bash(*)` permission so nothing blocks.", "Overly broad permissions in automation are risky."],
    ["Have a developer paste each diff into a chat.", "Manual and not scalable."]
  ],
  "a": [0],
  "why": "Use headless mode for CI with least-privilege tool lists and secrets from the CI system."
},
{
  "id": "p3-63", "d": 7, "s": "Debugging and operational issues",
  "stem": "On-call sees Claude API calls failing with HTTP 529 for several minutes. Which response fits?",
  "o": [
    ["Treat it as overload: let the SDK retry with backoff and jitter, and if errors persist, degrade gracefully (queue work, switch to the manual path), check the provider status page, and log request IDs.", "Correct. 529 is retryable but needs backoff and a degradation plan."],
    ["Retry immediately in a tight loop until it succeeds.", "That adds load and prolongs the problem."],
    ["Rotate the API key.", "Credentials aren't the problem for a 529."],
    ["Change the request parameters; 529 means the request is invalid.", "Invalid requests return 400, not 529."]
  ],
  "a": [0],
  "why": "Operational resolution: classify by status, retry what's retryable with backoff, degrade gracefully, and keep request IDs for support."
}
);
