// CCAR-P mock exam 2. Question format: see architect-professional/mock-exams/README.md.
MOCK.exams[2].push(
{
  "id": "p2-01", "d": 1, "s": "Architectural patterns",
  "stem": "A mortgage document pipeline must extract borrower details from an application, verify them against a credit report, and then draft a conditions letter. Each step's output must be checked before the next step runs. Which pattern fits?",
  "o": [
    ["Prompt chaining with code gates between steps: extract, validate in code, verify, validate, then draft.", "Correct. The steps are fixed and sequential, and the gates catch errors before they propagate."],
    ["One autonomous agent with the three tasks as its goal.", "The sequence is known; autonomy only removes the checkpoints."],
    ["Parallel sectioning of the three steps.", "The steps depend on each other, so they can't run independently."],
    ["Routing between three prompts.", "Routing picks one path per input. This task needs all three steps in order."]
  ],
  "a": [0],
  "why": "Prompt chaining breaks a task into a fixed sequence of steps, with programmatic checks between them. It trades a little latency for accuracy and control."
},
{
  "id": "p2-02", "d": 1, "s": "Architectural patterns",
  "stem": "A sanctions-screening step must decide whether a payment beneficiary is a possible match to a sanctioned party. Missing a match is very costly; extra reviews are acceptable. Which pattern increases confidence in the model's judgement?",
  "o": [
    ["Parallelization by voting: run the check several times (or with different prompts) and escalate to an analyst unless all runs agree it's clear.", "Correct. Voting trades extra calls for confidence, and the escalation threshold reflects the asymmetric cost of errors."],
    ["Lower the effort to save cost.", "That reduces reasoning on a high-stakes judgement."],
    ["Run it once and accept the answer.", "One run gives no measure of agreement on a costly decision."],
    ["An evaluator-optimizer loop that rewrites the beneficiary name until it clears.", "That optimizes toward clearing the check, which is the wrong goal."]
  ],
  "a": [0],
  "why": "Parallelization has two forms: sectioning (independent subtasks) and voting (the same task several times for confidence). Thresholds should reflect the cost of each error type."
},
{
  "id": "p2-03", "d": 1, "s": "Architectural patterns",
  "stem": "Which of these tasks is the best candidate for an autonomous agent rather than a workflow?",
  "o": [
    ["Investigating why a batch payment file failed reconciliation, where the cause could be in any of several systems and each finding suggests the next check, in a sandbox with read-only access.", "Correct. The steps can't be specified in advance, and with read-only access and a sandbox, errors are recoverable."],
    ["Extracting the IBAN from incoming payment instructions.", "That's a single, well-defined extraction."],
    ["Sending monthly statements on the first business day.", "That's a fixed schedule. Use code, possibly with a model for text."],
    ["Classifying support tickets into five queues.", "Classification and routing is a workflow."]
  ],
  "a": [0],
  "why": "Agents fit open-ended, multi-step problems that are hard to specify in advance, and where errors can be caught and recovered from."
},
{
  "id": "p2-04", "d": 1, "s": "Decomposition",
  "stem": "A due-diligence task requires reading 200 supplier filings to find any with going-concern warnings. A single agent's context fills with filing text, and its later answers degrade. What decomposition helps most?",
  "o": [
    ["Fan the filings out to subagents or workers that each read a batch in their own context and return a structured finding with the source reference.", "Correct. Decomposing by context keeps the noisy reading out of the coordinator's context."],
    ["Give the single agent a larger context window.", "More room for noise doesn't fix the diluted attention."],
    ["Ask the agent to summarize each filing in one word.", "That loses the detail the task needs."],
    ["Process the filings in a fixed random order.", "Order doesn't address the context overload."]
  ],
  "a": [0],
  "why": "Decompose along context boundaries: reading-heavy subtasks run in isolated contexts and return condensed results with provenance."
},
{
  "id": "p2-05", "d": 1, "s": "End-to-end architecture",
  "stem": "Customers upload bank statements to an onboarding assistant. In the input stage of the architecture, what's the most important design decision for risk?",
  "o": [
    ["Validate and minimize at the input stage: check file type and size, and redact data the task doesn't need (full account and card numbers) before it reaches the model, logs or vendors.", "Correct. Controls at the input stage reduce what every later stage has to protect."],
    ["Let the model read the raw file and decide what's sensitive.", "That exposes the data to the model, logs and vendors before any control."],
    ["Store every upload indefinitely for future training.", "That conflicts with data minimization and retention policies."],
    ["Skip validation to reduce latency.", "Unvalidated input creates security and reliability problems."]
  ],
  "a": [0],
  "why": "End-to-end design covers input (validation, PII handling), processing, output and feedback. Data minimization belongs at the start."
},
{
  "id": "p2-06", "d": 1, "s": "Business value alignment",
  "stem": "A bank adds a multilingual assistant that lets customers in 30 languages resolve card issues around the clock, which the bank couldn't offer before. Which value pillar does this primarily serve?",
  "o": [
    ["Transformation: a capability the business didn't have before.", "Correct. This isn't a faster version of an existing process; it's a new service."],
    ["Cost: fewer tokens per conversation.", "Token cost is an input, not this initiative's value."],
    ["Efficiency: the same process done faster.", "There was no existing 30-language, 24/7 process to speed up."],
    ["Performance SLA: p95 latency under two seconds.", "Latency may be an SLA, but it isn't the primary value here."]
  ],
  "a": [0],
  "why": "Value pillars include efficiency, transformation, productivity, cost and performance SLAs. Name the pillar and a metric for it."
},
{
  "id": "p2-07", "d": 1, "s": "Architectural patterns",
  "stem": "An internal coding assistant drafts refactors on a developer's branch. Every change is reviewed in a pull request, CI runs the tests, and nothing merges automatically. How does this cost-of-error profile affect the design?",
  "o": [
    ["It supports more autonomy: errors are caught by tests and review and are easy to reverse, so an agent that plans and edits is reasonable.", "Correct. Low, recoverable cost of error is one of the conditions for using an agent."],
    ["It requires a fixed workflow because code is high risk.", "With review, tests and no auto-merge, the errors are recoverable."],
    ["It means the agent should merge directly to main.", "Removing review would change the cost-of-error profile."],
    ["It doesn't affect the design.", "Cost of error is a key factor in choosing how much autonomy to give."]
  ],
  "a": [0],
  "why": "The four agent checks are complexity, value, viability and cost of error. Recoverable errors, through tests, review and rollback, allow more autonomy."
},
{
  "id": "p2-08", "d": 1, "s": "Multi-agent systems",
  "stem": "A coordinator receives findings from five research subagents. Its final report sometimes states claims without saying where they came from, and analysts can't verify them. What should change?",
  "o": [
    ["Have subagents return structured findings with source references, and have the coordinator keep the claim-to-source links through synthesis.", "Correct. Provenance must be preserved end to end."],
    ["Have subagents return their full transcripts.", "That floods the coordinator without guaranteeing provenance."],
    ["Ask the coordinator to 'be accurate'.", "A vague instruction doesn't create source links."],
    ["Drop subagents and let one agent read everything.", "That reintroduces the context overload the subagents solved."]
  ],
  "a": [0],
  "why": "Multi-agent designs need explicit contracts: complete context going in, condensed and attributable results coming out."
},
{
  "id": "p2-09", "d": 1, "s": "Architectural patterns",
  "stem": "A routing classifier sends customer messages to five handlers. About 4% of messages fit none of them and get handled badly. What's the best design fix?",
  "o": [
    ["Add an explicit 'other' route that goes to a human queue (or a general handler), and track its volume to find new categories worth building.", "Correct. Routing needs a safe default for inputs outside the known categories."],
    ["Force every message into the closest of the five categories.", "That's what causes the bad handling."],
    ["Replace routing with one agent for everything.", "Breaking the 96% that works to fix the 4% that doesn't is the wrong trade."],
    ["Retrain the classifier until it never sees unknown messages.", "Unknown inputs will always occur."]
  ],
  "a": [0],
  "why": "Routing designs need a fallback route, plus monitoring so new categories can be added deliberately."
},
{
  "id": "p2-10", "d": 1, "s": "Business value alignment",
  "stem": "A trading desk's AI summary of overnight news must be ready before the 7:30am briefing every day. Which architectural choices most directly protect this performance SLA?",
  "o": [
    ["Run the per-source summaries in parallel, set a deadline with a fallback (send what's ready and note what's missing), and monitor completion time against 7:30.", "Correct. The design is built around the deadline and degrades gracefully."],
    ["Use the largest model at maximum effort on everything.", "That raises latency risk against a fixed deadline."],
    ["Start the job at 7:25 to get the freshest news.", "That leaves no margin for slow requests or retries."],
    ["Run sequentially so failures are easier to debug.", "Sequential runs make the deadline harder to meet."]
  ],
  "a": [0],
  "why": "Align designs to performance SLAs with parallelism, deadlines, graceful degradation and monitoring."
},
{
  "id": "p2-11", "d": 1, "s": "Multi-agent systems",
  "stem": "Which TWO situations most justify a multi-agent design over a single agent?",
  "o": [
    ["The task needs breadth across many independent sources that can be explored in parallel.", "Correct. Parallel exploration is a core multi-agent benefit."],
    ["Reading-heavy subtasks would otherwise flood one agent's context.", "Correct. Context isolation keeps the coordinator focused."],
    ["The task is a fixed three-step procedure.", "That's a workflow."],
    ["The team wants the system to look more advanced.", "Not a technical justification; it adds cost and failure modes."],
    ["The budget is tight and token cost must be minimized.", "Multi-agent designs typically use more tokens."]
  ],
  "a": [0, 1],
  "why": "Multi-agent designs help with parallel breadth, context isolation and specialised tool sets, at the cost of tokens and coordination."
},
{
  "id": "p2-12", "d": 2, "s": "System prompts and guardrails",
  "stem": "A loan assistant's system prompt, policy text and the customer's uploaded documents are all concatenated into one block. Sometimes text in a document is treated as an instruction. What's the recommended structure?",
  "o": [
    ["Keep instructions in the system prompt, wrap documents in clearly labelled XML tags marked as data from the customer, and back the prompt with controls in code for anything that must hold.", "Correct. Separating instructions from data helps, and code controls carry what prompts can't guarantee."],
    ["Put the documents in the system prompt so they carry more authority.", "That gives untrusted content more weight, not less."],
    ["Remove the system prompt and put everything in the user message.", "That loses the separation entirely."],
    ["Use all capitals for the instructions.", "Emphasis doesn't create separation between instructions and data."]
  ],
  "a": [0],
  "why": "Use system prompts for role and rules, XML tags to separate instructions from data, and code for guarantees."
},
{
  "id": "p2-13", "d": 2, "s": "System prompts and guardrails",
  "stem": "Downstream code parses the assistant's account-summary output, and parsing breaks whenever wording varies. What should define the output?",
  "o": [
    ["A JSON schema enforced with structured outputs, plus a template for any human-readable text fields.", "Correct. Machine-read output needs a guaranteed shape."],
    ["A stronger instruction: 'always use exactly this format'.", "Instructions improve consistency but don't guarantee it."],
    ["Regex post-processing to tidy up the text.", "That's brittle and fails on variations you didn't anticipate."],
    ["Prefill the response with the first line of the template.", "Prefill is rejected on current models."]
  ],
  "a": [0],
  "why": "Templates fix the output shape for each task. Use structured outputs (`output_config.format`) when code consumes the result."
},
{
  "id": "p2-14", "d": 2, "s": "Model selection",
  "stem": "A team is choosing a model for a long-horizon agent that plans multi-week regulatory remediation programmes. It's the hardest reasoning task in the portfolio, and cost is a secondary concern. Which choice fits best?",
  "o": [
    ["Claude Fable 5.1, Anthropic's most capable widely released model for the most demanding reasoning and long-horizon work, priced above Opus.", "Correct. The hardest, highest-value tasks are where the top tier earns its cost."],
    ["Claude Haiku 4.5, to keep costs low.", "The task's difficulty argues against the smallest model."],
    ["Whichever model has the most typed constants in the SDK.", "SDK constants aren't a capability signal."],
    ["Any model. They all perform the same.", "Capability differs by tier."]
  ],
  "a": [0],
  "why": "Match model tier to task difficulty and value. Opus 5.5 is the default for complex work, and Fable 5.1 suits the most demanding reasoning."
},
{
  "id": "p2-15", "d": 2, "s": "Prompt reuse and caching",
  "stem": "A research tool sends the same 40,000-token reference pack in bursts. Analysts often pause 15 to 40 minutes between questions, so the 5-minute cache keeps expiring. What should you consider?",
  "o": [
    ["The 1-hour cache TTL. Writes cost 2x base input (against 1.25x for 5 minutes), but reads after long pauses avoid rewriting the 40K prefix.", "Correct. The longer TTL pays off when reuse spans pauses longer than 5 minutes."],
    ["Turn off caching, since it keeps expiring.", "That pays full price for 40K tokens on every request."],
    ["Shorten the reference pack until it's below the cacheable minimum.", "That loses needed content to avoid a cost you can manage."],
    ["Add a timestamp to the system prompt to refresh the cache.", "That changes the prefix and prevents any cache hit."]
  ],
  "a": [0],
  "why": "Choose the cache TTL by traffic pattern. Five minutes suits steady traffic; one hour suits bursty traffic with long gaps."
},
{
  "id": "p2-16", "d": 2, "s": "Prompt reuse and caching",
  "stem": "With the 5-minute TTL, a cache write costs 1.25x base input and a read costs about 0.1x or less. When does caching a stable prefix start paying off?",
  "o": [
    ["From the second request that reuses the prefix within the TTL.", "Correct. Two requests cost about 1.25x + 0.1x against 2x uncached."],
    ["Only after 100 requests.", "Break-even comes much sooner."],
    ["Never, because writes cost more than base input.", "Reads quickly recoup the write premium."],
    ["Only with the 1-hour TTL.", "The 5-minute TTL pays off from the second request."]
  ],
  "a": [0],
  "why": "Caching economics: a small write premium, cheap reads. With 5-minute TTL two requests break even; with 1-hour TTL it takes about three."
},
{
  "id": "p2-17", "d": 2, "s": "Context window optimization",
  "stem": "A long-running operations agent accumulates hundreds of verbose tool results. The team wants to drop old tool output without summarizing the conversation. Which API feature fits?",
  "o": [
    ["Context editing, which clears old tool results (and optionally their inputs) before the model sees the conversation.", "Correct. Context editing removes old tool output; compaction summarizes instead."],
    ["Compaction, which summarizes the conversation.", "Compaction summarizes history; the team asked to clear tool results without summarizing."],
    ["A larger `max_tokens`.", "That controls output length, not input context."],
    ["Prompt caching.", "Caching reduces the cost of a stable prefix; it doesn't remove content."]
  ],
  "a": [0],
  "why": "To manage context, trim tool results at the source, clear old ones with context editing, and use compaction to summarize long histories."
},
{
  "id": "p2-18", "d": 2, "s": "Context window optimization",
  "stem": "Before committing to a design, you need an accurate count of how many tokens a 300-page policy manual plus the system prompt will use with Claude. What should you use?",
  "o": [
    ["The token-counting endpoint (`count_tokens`) with the actual model, system prompt and content.", "Correct. It counts with the model's own tokenizer."],
    ["A rule of thumb of four characters per token.", "Fine for rough sizing, not for decisions near limits or for cost."],
    ["A third-party tokenizer from another model family.", "Different tokenizers give different counts."],
    ["Send the request and see whether it fails.", "That costs money and doesn't give you the number in advance."]
  ],
  "a": [0],
  "why": "Measure token usage with the token-counting endpoint, then decide between full context, retrieval or summaries."
},
{
  "id": "p2-19", "d": 2, "s": "Prompt reuse and caching",
  "stem": "Quality on a complaint classifier dropped last week. Three teams edited the prompt during that time, and nobody knows which version produced which results. What practice would have prevented this?",
  "o": [
    ["Modular, versioned prompt fragments, with the version string logged alongside every result and eval run.", "Correct. Versions tie quality changes to prompt changes and make rollback possible."],
    ["One giant prompt only a single engineer may edit.", "That's a bottleneck that still lacks versioning."],
    ["Prompts stored in a spreadsheet.", "No change control and no link to results."],
    ["Re-writing the prompt from scratch each quarter.", "That loses history and makes regressions harder to trace."]
  ],
  "a": [0],
  "why": "Treat prompts like code: modular fragments, versions, change control and the version recorded with results."
},
{
  "id": "p2-20", "d": 3, "s": "RAG pipeline design",
  "stem": "Policy Q&A uses embedding search only. Questions using the exact term from a policy ('callback verification') sometimes miss the right section, while paraphrased questions work well. What should you build?",
  "o": [
    ["Hybrid search: BM25 keyword results merged with embedding results, followed by a reranker, evaluated with recall@k on known questions.", "Correct. Keyword and semantic retrieval have complementary strengths, and reranking orders the merged candidates."],
    ["Replace embeddings with keyword search only.", "That would break the paraphrased questions."],
    ["Increase the embedding dimension.", "That doesn't fix exact-term matching."],
    ["Add more documents to the index.", "More documents don't improve ranking of the right one."]
  ],
  "a": [0],
  "why": "Use hybrid retrieval when queries mix exact terms and paraphrase, and evaluate retrieval separately from generation."
},
{
  "id": "p2-21", "d": 3, "s": "RAG pipeline design",
  "stem": "Retrieved chunks like 'Limits reset at midnight. Increases need approval.' don't say which policy or product they belong to, so they rank poorly and confuse the model. What's the fix?",
  "o": [
    ["Contextual chunk headers: prefix each chunk with its document title, version and section before indexing, so it's understandable on its own.", "Correct. Chunks need enough context to be matched and interpreted in isolation."],
    ["Use smaller chunks.", "Smaller chunks carry even less context."],
    ["Retrieve every chunk from the document.", "That defeats retrieval and floods the context."],
    ["Ask the model to guess which policy each chunk is from.", "Guessing invites wrong answers."]
  ],
  "a": [0],
  "why": "Design chunking so each chunk carries its context: structure-aware boundaries plus contextual headers."
},
{
  "id": "p2-22", "d": 3, "s": "RAG pipeline design",
  "stem": "Your design needs semantic retrieval over internal documents, and the team asks which Anthropic embedding model to use. What's the accurate answer?",
  "o": [
    ["Anthropic doesn't offer an embedding model. Use an embedding provider such as Voyage AI (or your platform's option), and evaluate retrieval quality on your own documents.", "Correct. Claude generates and reasons over text; embeddings come from a separate provider."],
    ["Use Claude Haiku 4.5 as the embedding model.", "Claude models aren't embedding models."],
    ["Use the Messages API with `embed: true`.", "There's no such parameter."],
    ["Skip retrieval and put all documents in the prompt.", "That doesn't scale and ignores the retrieval need."]
  ],
  "a": [0],
  "why": "RAG pipelines pair Claude with an embedding provider and a vector or hybrid index. Evaluate retrieval separately."
},
{
  "id": "p2-23", "d": 3, "s": "Authentication and authorization",
  "stem": "An HR policy assistant retrieves from a shared index that includes documents restricted to managers. An employee asks a question and receives text from a manager-only document. What's the fix?",
  "o": [
    ["Store access-control metadata with each chunk, and filter retrieval by the signed-in user's entitlements before ranking.", "Correct. Authorization must apply at retrieval time, using the user's identity."],
    ["Tell the model not to reveal manager-only information.", "The restricted text has already reached the model; a prompt isn't access control."],
    ["Remove all restricted documents from the system.", "That loses capability for managers instead of enforcing access."],
    ["Log the access and review it weekly.", "That detects the leak after it happened."]
  ],
  "a": [0],
  "why": "Analyze auth requirements across the whole pipeline. Retrieval must respect each user's permissions, not just tool calls."
},
{
  "id": "p2-24", "d": 3, "s": "Integration mechanisms",
  "stem": "Claude Code runs in developers' terminals, and the team wants it to work with GitHub issues and pull requests. The `gh` CLI is installed and authenticated. What's the most efficient integration?",
  "o": [
    ["Let Claude use the existing `gh` CLI through the shell, with permission rules allowing the read commands and asking before writes.", "Correct. Where a shell and a mature CLI exist, the CLI is often the simplest and most token-efficient integration."],
    ["Build a new MCP server that wraps every GitHub API endpoint.", "Possible, but more to build and maintain when a CLI already exists."],
    ["Paste issue text into the chat manually.", "That's manual and loses the ability to act on issues."],
    ["Give Claude a GitHub admin token in CLAUDE.md.", "That puts a secret in a file and grants far too much access."]
  ],
  "a": [0],
  "why": "Choose CLI, MCP, direct API or agent-to-agent by context. CLIs fit agents that already run with shell access."
},
{
  "id": "p2-25", "d": 3, "s": "Progressive discovery",
  "stem": "An internal assistant uses five stable tools and one 2,000-token reference document on every request. Someone proposes tool search and on-demand document loading. What do you advise?",
  "o": [
    ["Keep it monolithic. With a small, stable set, loading everything up front is simpler, predictable and cache-friendly.", "Correct. Progressive discovery pays off for large or rarely used sets, not five tools."],
    ["Adopt tool search, since it's always better.", "It adds a step and complexity without a benefit at this size."],
    ["Remove the reference document to save tokens.", "The document is needed, and caching makes it cheap."],
    ["Split the assistant into five agents, one per tool.", "That adds cost and coordination for no gain."]
  ],
  "a": [0],
  "why": "Weigh progressive discovery against monolithic context. Small, stable sets favour monolithic; large or sparse sets favour progressive."
},
{
  "id": "p2-26", "d": 3, "s": "Capability bloat",
  "stem": "Two tools in an agent, `search_accounts` and `find_customer_accounts`, overlap, and the model often picks the wrong one. Descriptions are one line each. What should you do first?",
  "o": [
    ["Merge or remove the overlap, and write clear descriptions saying when to use each remaining tool, its inputs and what it returns.", "Correct. Fewer, distinct, well-described tools improve selection."],
    ["Add a third tool that decides which of the two to call.", "That adds another layer to a bloat problem."],
    ["Force the model to call `search_accounts` every time.", "Forced tool choice returns a 400 on current models, and it hides the overlap."],
    ["Use a bigger model.", "Ambiguous tools confuse every model."]
  ],
  "a": [0],
  "why": "Evaluate tool configuration for bloat: remove overlap and write descriptions that make the right tool obvious."
},
{
  "id": "p2-27", "d": 3, "s": "Authentication and authorization",
  "stem": "A remote MCP server gives several assistants access to a CRM. Today it uses one static API key that grants full read and write access to everyone. What's the better design?",
  "o": [
    ["OAuth with per-user tokens and scopes (for example read-only for most assistants), with the server enforcing the user's CRM permissions.", "Correct. Delegated, scoped credentials keep each caller to its own permissions."],
    ["Rotate the static key monthly.", "Rotation helps hygiene but still gives everyone full access."],
    ["Hide the key in each assistant's system prompt.", "That exposes the secret to the model and its logs."],
    ["Restrict the server to the internal network.", "Network location doesn't scope what each caller can do."]
  ],
  "a": [0],
  "why": "Find auth gaps such as shared static keys, missing scopes and no per-user authorization. Remote MCP servers should use OAuth."
},
{
  "id": "p2-28", "d": 3, "s": "Integration mechanisms",
  "stem": "A European bank must keep inference for customer conversations in the EU. Which approach meets the requirement?",
  "o": [
    ["Use a deployment whose inference stays in the EU: an EU region on a cloud platform (Bedrock, Vertex AI), or the first-party API's `inference_geo` setting where it supports the region you need. Confirm in the platform documentation.", "Correct. Residency is controlled by platform region or the inference geography setting."],
    ["Add 'process this data only in the EU' to the system prompt.", "Prompts don't control where inference runs."],
    ["Encrypt the conversations before sending them.", "The model must read the content, and encryption doesn't decide where processing happens."],
    ["Use the smallest model, which runs locally.", "Model size doesn't determine processing location."]
  ],
  "a": [0],
  "why": "Data residency is an integration decision: choose the platform and region, or the first-party inference geography setting, to fit the requirement. `inference_geo` isn't available on Bedrock."
},
{
  "id": "p2-29", "d": 3, "s": "Integration mechanisms",
  "stem": "A team's Bedrock integration returns 404 for every request after they copied the model ID `claude-opus-5-5` from first-party API docs. What's the likely cause?",
  "o": [
    ["Bedrock uses platform-specific model IDs (with a prefix, such as `anthropic.claude-opus-5-5`). Use the ID the platform lists for your account and region.", "Correct. Model IDs differ by platform."],
    ["Opus 5.5 doesn't exist on Bedrock.", "Model availability should be checked, but a copied first-party ID is the classic cause of this 404."],
    ["The request needs a beta header.", "A missing header doesn't produce a 404 for every request."],
    ["The AWS region is overloaded.", "Overload returns throttling or 5xx errors, not 404."]
  ],
  "a": [0],
  "why": "Platform differences affect integration: Bedrock uses prefixed model IDs, AWS IAM authentication and a different feature set."
},
{
  "id": "p2-30", "d": 3, "s": "Observability",
  "stem": "A request passes through an API gateway, a retrieval service, a Claude call and a tool call to the core banking system. Debugging slow requests is hard because each service logs separately. What's the best observability fix?",
  "o": [
    ["Propagate one trace ID across every stage and log per-stage spans (latency, status, tokens, Claude message or request ID), so one query shows the whole path.", "Correct. Distributed tracing makes multi-stage latency and failures diagnosable."],
    ["Log more lines in each service.", "More unconnected logs don't link the stages."],
    ["Only monitor the Claude call, since it's the slowest.", "You can't know that without per-stage timing."],
    ["Turn on debug logging in production permanently.", "That costs a lot and risks logging PII, without linking stages."]
  ],
  "a": [0],
  "why": "Monitoring at scale means structured, correlated telemetry: trace IDs, spans, request IDs, tokens and versions."
},
{
  "id": "p2-31", "d": 3, "s": "Accuracy-latency trade-offs",
  "stem": "Which TWO changes reduce latency for a RAG assistant with the least risk to accuracy?",
  "o": [
    ["Cache the stable system prompt and instructions so repeat requests read the prefix.", "Correct. Caching cuts time to first token without changing content."],
    ["Run independent retrieval calls (keyword and semantic) in parallel instead of in sequence.", "Correct. Parallelism removes waiting time without changing results."],
    ["Cut retrieved chunks from 8 to 1 without measuring.", "That may drop needed evidence and lower accuracy."],
    ["Switch to the smallest model without an eval.", "An unmeasured downgrade risks quality."],
    ["Remove the citation requirement.", "Citations help grounding and auditing; removing them trades away accuracy safeguards."]
  ],
  "a": [0, 1],
  "why": "Prefer latency wins that don't change content (caching, parallelism, streaming) before trade-offs that need an eval (fewer chunks, smaller models)."
},
{
  "id": "p2-32", "d": 4, "s": "Evaluation datasets",
  "stem": "A team compares two prompts on a 20-case eval set and sees 85% against 90%. They want to ship the 90% prompt. What's the main concern?",
  "o": [
    ["20 cases is too small to detect a 5-point difference reliably (one case is 5 points). Grow the set where decisions are close, and look at which cases differ.", "Correct. Small sets can't resolve small differences."],
    ["90% isn't high enough to ship anything.", "The absolute bar depends on the SLA; the problem here is statistical."],
    ["They should have used a larger model.", "Model choice doesn't fix an underpowered comparison."],
    ["Eval sets should always have exactly 100 cases.", "There's no magic number; size depends on the difference you need to detect."]
  ],
  "a": [0],
  "why": "Eval datasets need enough cases to detect the differences that matter, with segments and edge cases, and versioning."
},
{
  "id": "p2-33", "d": 4, "s": "A/B testing",
  "stem": "You're running an online A/B test of a new support prompt on 10% of traffic. Besides the primary metric (resolution rate), what else must you watch?",
  "o": [
    ["Guardrail metrics such as escalations, complaints, refusals, safety flags, latency and cost, with a plan for sample size and stopping rules.", "Correct. Online tests need guardrails so a primary-metric gain can't hide harm."],
    ["Only the primary metric, to keep it simple.", "That can miss regressions that matter more than the gain."],
    ["The number of tokens in the prompt.", "Prompt length is a design detail, not an outcome."],
    ["Nothing until the test has run for six months.", "Guardrails need monitoring from the start."]
  ],
  "a": [0],
  "why": "A/B tests compare variants on real traffic with a primary metric, guardrail metrics, a planned sample size and stopping rules."
},
{
  "id": "p2-34", "d": 4, "s": "Diagnosing system issues",
  "stem": "A RAG assistant's answers are often wrong. How do you tell whether the problem is retrieval or generation?",
  "o": [
    ["Evaluate retrieval separately: measure recall@k on questions with known source passages. If the right passage is retrieved and the answer is still wrong, it's generation. If not, it's retrieval.", "Correct. Separating the stages pinpoints the failure."],
    ["Switch models and see if it improves.", "A model change mixes both stages and wastes effort if retrieval is the cause."],
    ["Read ten answers and decide.", "Too few, and without ground truth it can't separate the stages."],
    ["Increase the temperature to get more varied answers.", "That doesn't diagnose anything, and sampling parameters are removed on current models."]
  ],
  "a": [0],
  "why": "Diagnose RAG issues stage by stage: retrieval metrics (recall@k, staleness), then answer grounding and accuracy."
},
{
  "id": "p2-35", "d": 4, "s": "Test frameworks",
  "stem": "An LLM judge grading Claude-written summaries consistently prefers summaries that read like Claude, even when human reviewers prefer the other version. What bias is this, and how do you manage it?",
  "o": [
    ["Self-preference bias. Use a specific rubric tied to the source, check the judge against human labels, and keep human review for the cases that matter.", "Correct. Judges can favour output that resembles their own; calibration exposes and limits this."],
    ["Position bias. Always show the human version first.", "Position bias is about order. This is about style similarity."],
    ["No bias. Trust the judge.", "Disagreement with humans is a signal to investigate."],
    ["Stop using rubrics.", "Rubrics reduce bias; removing them makes it worse."]
  ],
  "a": [0],
  "why": "Validate LLM judges against human grades and control for known biases (position, verbosity, self-preference)."
},
{
  "id": "p2-36", "d": 4, "s": "Cost-performance optimization",
  "stem": "Variant A costs $0.004 per request and needs a retry on 30% of tasks. Variant B costs $0.005 per request and almost never retries. How should you compare cost?",
  "o": [
    ["By cost per completed task, including retries and follow-up calls. A is about $0.0052 per completed task against B's $0.005.", "Correct. A request is cheaper; a completed task isn't."],
    ["By cost per request. A is cheaper.", "That ignores the retries needed to finish the task."],
    ["By output tokens only.", "That ignores input tokens and retries."],
    ["By the number of models used.", "That's not a cost measure."]
  ],
  "a": [0],
  "why": "Optimize cost-performance on cost per completed task, not per request."
},
{
  "id": "p2-37", "d": 4, "s": "Cost-performance optimization",
  "stem": "Users of a chat assistant complain it 'feels slow'. Total response time is 6 seconds, but nothing appears until the full answer is ready. Which change most improves perceived latency?",
  "o": [
    ["Stream the response, so text appears as it's generated. Then measure time to first token separately from total time.", "Correct. Streaming improves perceived latency without changing the content."],
    ["Lower effort to max-speed for every question.", "That may cut quality; perceived latency is mainly about the wait before any output."],
    ["Shorten the system prompt by half.", "That may help slightly but not as much as streaming, and it may cost quality."],
    ["Add a spinner with a fixed 6-second timer.", "Cosmetic; users still wait for the whole answer."]
  ],
  "a": [0],
  "why": "Separate time to first token from total latency, and use streaming, caching and parallelism to improve both."
},
{
  "id": "p2-38", "d": 4, "s": "A/B testing",
  "stem": "A team changed the prompt wording, the model, the effort level and the retrieval k in one release. Quality dropped. What's the problem with this process?",
  "o": [
    ["Too many changes at once, so you can't attribute the drop. Change one thing at a time, version each change, and re-run the eval.", "Correct. Iterative improvement needs isolated changes."],
    ["They should have made even more changes to compensate.", "That makes attribution harder still."],
    ["Quality drops are always the model's fault.", "Any of the four changes could be responsible."],
    ["They should have skipped the eval to move faster.", "The eval is what revealed the drop."]
  ],
  "a": [0],
  "why": "Improve iteratively: one change at a time, versioned, evaluated, with rollback."
},
{
  "id": "p2-39", "d": 4, "s": "Evaluation datasets",
  "stem": "After weeks of prompt tuning, eval accuracy is 99% but production quality hasn't changed. What's the likely issue and fix?",
  "o": [
    ["Overfitting to the eval set. Keep a held-out set you never tune on, refresh cases from production traffic, and check the set is representative.", "Correct. Tuning on the same cases inflates scores."],
    ["Production users are doing it wrong.", "That dismisses a measurement gap."],
    ["The model got worse in production.", "There's no evidence of a model change."],
    ["Eval sets can't predict production.", "Representative, held-out sets can."]
  ],
  "a": [0],
  "why": "Design eval datasets with a held-out portion and refresh them with real traffic to avoid overfitting."
},
{
  "id": "p2-40", "d": 4, "s": "Monitoring",
  "stem": "Which production signal most directly shows that a prompt change made responses longer than intended and started cutting them off?",
  "o": [
    ["A rise in the share of responses with `stop_reason: max_tokens`, together with higher output tokens per request.", "Correct. Those two metrics show the truncation directly."],
    ["The HTTP 5xx error rate.", "Truncation returns HTTP 200."],
    ["Cache hit rate.", "That reflects prefix stability, not output length."],
    ["Number of active users.", "That's usage, not a symptom of truncation."]
  ],
  "a": [0],
  "why": "Monitor stop reason distributions, tokens, latency and cost per task, and alert on shifts after releases."
},
{
  "id": "p2-41", "d": 4, "s": "Evaluation metrics",
  "stem": "For an assistant that drafts responses to regulator inquiries, which TWO metrics should be hard gates?",
  "o": [
    ["Zero unsupported factual claims (every claim traceable to a source document).", "Correct. Unsupported claims to a regulator are unacceptable."],
    ["Zero leaks of other customers' data in drafts.", "Correct. Data leakage is a hard security and privacy failure."],
    ["Average response length under 400 words.", "A style target, not a hard gate."],
    ["Lowest possible cost per draft.", "Cost matters, but it can't outrank accuracy and privacy."],
    ["Judge score above 4.0.", "A useful signal, but it doesn't guarantee the critical properties."]
  ],
  "a": [0, 1],
  "why": "Define safety and security metrics that block a release on their own, alongside accuracy, latency and cost targets."
},
{
  "id": "p2-42", "d": 5, "s": "Guardrails and safety controls",
  "stem": "A support assistant needs a customer's recent transactions to answer questions, but the transaction feed also includes full card numbers and the customer's SSN. What's the best practice?",
  "o": [
    ["Minimize before the model: pass only the fields the task needs, and redact sensitive identifiers (keeping the last four digits if staff need them).", "Correct. Data minimization reduces exposure in the model, logs and vendors."],
    ["Pass everything and instruct the model not to reveal it.", "The data is still exposed to the model and logs."],
    ["Encrypt the SSN inside the prompt.", "The model can't use encrypted text, and it doesn't need the SSN."],
    ["Let customers choose whether to share their SSN with the model.", "The task doesn't need it, so it shouldn't be sent."]
  ],
  "a": [0],
  "why": "Guardrails start at the input: send only what the task needs, and redact the rest."
},
{
  "id": "p2-43", "d": 5, "s": "Guardrails and safety controls",
  "stem": "An agent can close dormant accounts. A test shows it closing an active account after misreading a customer's message. Which control set is most appropriate?",
  "o": [
    ["Check dormancy in code from the system of record, require human approval for every closure, and log the decision with its inputs.", "Correct. Irreversible actions get deterministic checks and human approval."],
    ["Add 'be careful when closing accounts' to the prompt.", "That doesn't prevent misreading."],
    ["Let the agent close accounts but notify the customer afterwards.", "Notification doesn't undo an irreversible action."],
    ["Lower the effort to make it more conservative.", "Effort doesn't create a safety control."]
  ],
  "a": [0],
  "why": "Layer guardrails for high-impact actions: least privilege, code-checked conditions, human approval and audit."
},
{
  "id": "p2-44", "d": 5, "s": "Risks and failure modes",
  "stem": "A customer pushes back on the assistant's correct statement of an overdraft fee, and the assistant reverses itself and agrees the fee doesn't apply. What failure mode is this, and how do you mitigate it?",
  "o": [
    ["Sycophancy. Ground answers in the retrieved policy and account facts, tell the model to keep correct facts under pushback, test pushback scenarios in the eval, and keep fee decisions in code.", "Correct. Sycophancy shows up as caving under user pressure."],
    ["Hallucination. Shorten the context.", "The model had the right fact; it gave it up under pressure."],
    ["Prompt injection. Block the customer.", "Pushing back isn't an injection attack."],
    ["Latency. Use streaming.", "Unrelated to timing."]
  ],
  "a": [0],
  "why": "LLM failure modes include hallucination, injection, sycophancy, inconsistency, leakage and over-reliance. Mitigate each specifically."
},
{
  "id": "p2-45", "d": 5, "s": "Risks and failure modes",
  "stem": "What's the difference between a jailbreak and an indirect prompt injection?",
  "o": [
    ["A jailbreak is a user trying to get the model to ignore its rules. An indirect injection plants instructions in content the system processes (documents, web pages, emails, tool results) so the model acts on them.", "Correct. The source of the malicious instruction differs."],
    ["They're the same thing.", "They differ in where the instruction comes from and how you defend against it."],
    ["Jailbreaks only affect images; injections only affect text.", "Both are mainly text-based."],
    ["Indirect injections only happen in open-source models.", "Any model that processes untrusted content is exposed."]
  ],
  "a": [0],
  "why": "Know the risk categories. Indirect injection is especially relevant for agents that read external content."
},
{
  "id": "p2-46", "d": 5, "s": "Regulatory compliance",
  "stem": "A firm's policy forbids vendors from retaining customer prompts beyond processing. What should the architect check for the Claude deployment?",
  "o": [
    ["The data retention arrangements available for the chosen platform and model (for example a zero-data-retention agreement where eligible), and that the features and models used are covered.", "Correct. Retention terms vary by platform, model and feature, so check them."],
    ["Nothing. Prompts are never stored anywhere.", "Retention depends on platform terms and your own logging."],
    ["Only your own application logs.", "Your logs matter too, but the vendor's retention is the policy question here."],
    ["That the system prompt says 'do not store this'.", "Prompts don't change vendor data handling."]
  ],
  "a": [0],
  "why": "Compliance includes vendor data handling: retention, ZDR eligibility, residency and the features covered."
},
{
  "id": "p2-47", "d": 5, "s": "Regulatory compliance",
  "stem": "A bank's model risk management function (following guidance such as SR 11-7) must approve a new AI credit-decisioning aid. What will they expect from the architect?",
  "o": [
    ["Documentation of purpose, design and limitations, validation results (the eval set and outcomes by segment), ongoing monitoring, change control, and an inventory entry with an owner.", "Correct. Model risk management covers inventory, validation, monitoring and documentation."],
    ["The vendor's marketing materials.", "Not independent validation for the bank's use."],
    ["A screenshot of a good demo answer.", "A single example isn't validation."],
    ["Nothing, because the model is from a third party.", "Third-party models used in decisions still fall under model risk management."]
  ],
  "a": [0],
  "why": "Governance in financial services includes model risk management: document, validate, monitor and control changes."
},
{
  "id": "p2-48", "d": 5, "s": "Ethical AI",
  "stem": "A small-business lending assistant doesn't receive race or gender, but it does use the applicant's postcode and business name. What fairness risk remains, and what do you do?",
  "o": [
    ["Postcode and names can act as proxies for protected attributes. Test outcomes by group (directly or through inferred or proxy analysis), justify every input's relevance, and remove or constrain proxies that drive disparity.", "Correct. Excluding protected attributes doesn't remove proxy discrimination."],
    ["No risk, since protected attributes aren't used.", "Proxies can recreate them."],
    ["Add race and gender so the model can be fair.", "Using protected attributes in decisions raises legal problems; the job is to test outcomes, not add inputs."],
    ["Let the model decide which inputs are fair.", "Self-assessment isn't a fairness control."]
  ],
  "a": [0],
  "why": "Bias work includes proxy analysis, outcome testing by group, and documented justification for inputs."
},
{
  "id": "p2-49", "d": 5, "s": "Guardrails and safety controls",
  "stem": "A research agent with web search and code execution once ran 400 steps and spent $90 on a single task. Which controls address this failure mode?",
  "o": [
    ["Step caps, per-task token or cost budgets, timeouts, and alerts on unusual spend, with the task ending gracefully when a limit is reached.", "Correct. Runaway loops need hard limits and monitoring."],
    ["A prompt asking it to be efficient.", "Helpful, but not a limit."],
    ["Remove web search.", "That may break the task without addressing loops in general."],
    ["Bill the cost to the user who asked.", "That moves the cost without controlling it."]
  ],
  "a": [0],
  "why": "Agent failure modes include runaway loops and cost spikes. Use step limits, budgets, timeouts and monitoring."
},
{
  "id": "p2-50", "d": 5, "s": "Human-in-the-loop",
  "stem": "Which human-in-the-loop design is best for wires over $250,000 initiated through an AI assistant?",
  "o": [
    ["Four-eyes approval: two authorized people approve in a separate system after reviewing the evidence and policy checks, with the assistant only preparing the request.", "Correct. High-value irreversible actions warrant dual approval outside the AI's control."],
    ["The assistant approves if its confidence is high.", "Self-confidence isn't calibrated, and it removes human ownership."],
    ["One reviewer approves in the chat window.", "Weaker than dual control, and inside the AI's own interface."],
    ["A post-transfer review the next day.", "Too late for an irreversible transfer."]
  ],
  "a": [0],
  "why": "Scale human oversight to the impact: single approval for moderate risk, dual approval for high-value irreversible actions."
},
{
  "id": "p2-51", "d": 6, "s": "Discovery and requirements",
  "stem": "At kickoff, a sponsor says 'use AI to improve collections.' What should structured discovery produce before any design work?",
  "o": [
    ["A stakeholder map, the current process and its pain points, a target metric (for example right-party contact rate), volumes, regulatory constraints (such as collections rules), the cost of errors, data sources, and acceptance criteria.", "Correct. Discovery turns a vague goal into a measurable, constrained problem."],
    ["A model choice and a prompt.", "Those are design decisions that come after understanding the problem."],
    ["A demo built over the weekend.", "Demos without requirements optimize the wrong thing."],
    ["A list of every AI feature available.", "Features aren't requirements."]
  ],
  "a": [0],
  "why": "Structured discovery establishes the problem, value, stakeholders, constraints and acceptance before design."
},
{
  "id": "p2-52", "d": 6, "s": "Communicating decisions",
  "stem": "You're presenting an AI underwriting aid to the Chief Risk Officer. What should the presentation focus on?",
  "o": [
    ["The controls and evidence: what the system decides and what humans decide, validation results by segment, failure modes and mitigations, residual risk, and the audit trail.", "Correct. Risk audiences need controls, evidence and residual risk."],
    ["Token cost per request and model architecture.", "That's the engineering audience's focus."],
    ["How exciting the technology is.", "That doesn't address risk acceptance."],
    ["Only the accuracy headline.", "Accuracy alone hides segment and failure-mode risks."]
  ],
  "a": [0],
  "why": "Tailor architectural communication to each audience. Risk and Compliance need controls, evidence and residual risk."
},
{
  "id": "p2-53", "d": 6, "s": "Documentation and guidance",
  "stem": "Which element makes an architecture decision record most useful a year later?",
  "o": [
    ["The options considered with their measured trade-offs, the reason for the choice, and explicit triggers for revisiting it (for example 'if a smaller model passes the routing gate').", "Correct. Future readers need the reasoning and when it stops applying."],
    ["The names of everyone who attended the meeting.", "Useful, but it doesn't explain the decision."],
    ["The final configuration only.", "Without the alternatives and reasons, the decision can't be re-evaluated."],
    ["A copy of the full chat transcript.", "Too long, and not structured as a decision."]
  ],
  "a": [0],
  "why": "Document decisions as ADRs: context, options, decision, consequences and revisit triggers."
},
{
  "id": "p2-54", "d": 6, "s": "Lifecycle management",
  "stem": "A pilot of an AI claims assistant is about to start with 20 adjusters. What should be agreed before it begins?",
  "o": [
    ["Pilot scope and duration, success and stop criteria tied to the SLA, how feedback is captured, who decides to expand or stop, and the rollback plan.", "Correct. A pilot needs go/no-go criteria agreed up front."],
    ["Nothing. See how it goes.", "Without criteria, the outcome of the pilot is a matter of opinion."],
    ["A commitment to roll out company-wide afterwards.", "That pre-empts the pilot's purpose."],
    ["The adjusters' performance targets for next year.", "Not a pilot design element."]
  ],
  "a": [0],
  "why": "Support each lifecycle phase with explicit decisions. Pilots need success and stop criteria, owners and a rollback plan."
},
{
  "id": "p2-55", "d": 6, "s": "Stakeholder expectations and SLAs",
  "stem": "The business wants an SLA of 99% classification accuracy, and the current system reaches 94% on the eval. What's the right way to set the commitment?",
  "o": [
    ["Agree an SLA the system can meet with headroom (an internal objective stricter than the promise), present the gap to 99% with options and what each would cost, and revisit as the system improves.", "Correct. Commitments should rest on measured performance, with a plan for the stretch goal."],
    ["Promise 99% to keep the business happy.", "That commits to a number the system doesn't reach."],
    ["Refuse to set any SLA.", "Stakeholders need agreed expectations."],
    ["Set 94% and never revisit it.", "Expectations should evolve as the system improves."]
  ],
  "a": [0],
  "why": "Align SLAs with measured capability and keep internal headroom. Make the gaps and their costs visible."
},
{
  "id": "p2-56", "d": 6, "s": "Documentation and guidance",
  "stem": "Three product teams will build on your shared retrieval and guardrail components. What implementation guidance helps them most?",
  "o": [
    ["Interface docs with examples, conventions (prompt versioning, logging fields, data rules), required tests and evals for any change, and a contact for design questions.", "Correct. Teams need clear interfaces and the quality bar every change must meet."],
    ["A one-hour demo recording.", "Useful context, but it isn't a reference to build against."],
    ["Read access to your source code and nothing else.", "Code without guidance leads to inconsistent use."],
    ["A rule that they must ask you before every change.", "That makes the architect a bottleneck."]
  ],
  "a": [0],
  "why": "Provide implementation guidance: interfaces, conventions and the required eval and test gates."
},
{
  "id": "p2-57", "d": 6, "s": "Lifecycle management",
  "stem": "A new prompt version passes the release gate. How should it reach all customers?",
  "o": [
    ["A staged rollout (canary, then a larger share, then everyone) with dashboards watching guardrail metrics, and a one-step rollback.", "Correct. Staged rollouts limit the impact of issues the eval didn't catch."],
    ["Switch everyone at once on Friday evening.", "Maximum blast radius with minimum attention."],
    ["Wait for complaints before moving more traffic.", "Complaints are a lagging signal; monitor metrics instead."],
    ["Ask each customer to opt in.", "Not a practical rollout strategy for a backend change."]
  ],
  "a": [0],
  "why": "The iteration phase uses staged rollouts, monitoring and fast rollback, even after offline evals pass."
},
{
  "id": "p2-58", "d": 6, "s": "Communicating decisions",
  "stem": "Executives ask how confident you are that the new assistant will hit its 90% target in production. The eval shows 91% on 400 cases. How do you communicate this?",
  "o": [
    ["Give the measured result with its uncertainty (91% on 400 representative cases, roughly ±3 points) and the segments that are weaker, and explain how production will be monitored against the target.", "Correct. Honest uncertainty plus a monitoring plan builds trust."],
    ["'It's guaranteed to hit 90%.'", "That overstates what an eval can promise."],
    ["'We can't know until it's live.'", "That ignores the evidence you have."],
    ["Present only the strongest segment.", "Selective reporting misleads."]
  ],
  "a": [0],
  "why": "Communicate trade-offs and expectations with measured evidence, uncertainty and a plan."
},
{
  "id": "p2-59", "d": 6, "s": "Stakeholder expectations and SLAs",
  "stem": "An executive asks you to commit to cutting response time from 3.5 seconds to under 1 second by next week. What's the best response?",
  "o": [
    ["Explain what it would take (lower effort, a smaller model, less context, possible quality loss), measure the options on the eval, and come back with the trade-off and a recommendation before committing.", "Correct. Don't commit to unmeasured numbers; bring options with their costs."],
    ["Agree immediately.", "That's a commitment without evidence."],
    ["Refuse because it's impossible.", "It may be possible with trade-offs; measure first."],
    ["Quietly switch to the smallest model.", "An unevaluated change risks quality and trust."]
  ],
  "a": [0],
  "why": "Manage expectations by measuring options and making trade-offs explicit before committing."
},
{
  "id": "p2-60", "d": 7, "s": "Configuring Claude tools for teams",
  "stem": "A developer's personal Claude Code setting conflicts with the team's shared project setting for the same repository. A local project setting (`.claude/settings.local.json`) also exists. Which takes precedence, assuming no managed settings or command-line flags?",
  "o": [
    ["The local project setting, then the shared project setting, then the user setting.", "Correct. Local project settings override shared project settings, which override user settings."],
    ["The user setting always wins.", "User settings have the lowest precedence of these three."],
    ["The shared project setting always wins over local.", "Local project settings override shared ones, so individuals can adjust within the team's setup."],
    ["Whichever file was edited most recently.", "Precedence is by scope, not edit time."]
  ],
  "a": [0],
  "why": "Claude Code precedence: managed > command line > local project > shared project > user."
},
{
  "id": "p2-61", "d": 7, "s": "Configuring Claude tools for teams",
  "stem": "A team wants every edit Claude Code makes to be formatted with gofmt, every time, without relying on Claude remembering. What's the right mechanism?",
  "o": [
    ["A PostToolUse hook on Write and Edit that runs the formatter.", "Correct. Hooks run deterministically on events."],
    ["A line in CLAUDE.md asking Claude to run gofmt.", "Guidance isn't guaranteed to run every time."],
    ["A Skill named 'format'.", "Skills load when relevant; they aren't triggered on every edit."],
    ["A weekly reminder in the team channel.", "Not automated."]
  ],
  "a": [0],
  "why": "Use hooks for things that must always happen; use CLAUDE.md and Skills for guidance and procedures."
},
{
  "id": "p2-62", "d": 7, "s": "Configuring Claude tools for teams",
  "stem": "A platform team standardizes on Amazon Bedrock. What configures Claude Code to use it?",
  "o": [
    ["Set `CLAUDE_CODE_USE_BEDROCK=1` and `AWS_REGION`, with AWS credentials from the developer's environment or SSO, ideally in managed settings for the organization.", "Correct. Environment settings point Claude Code at Bedrock, and AWS identity handles authentication."],
    ["Put an Anthropic API key in each repository.", "That points at the first-party API and commits a secret."],
    ["Add 'use Bedrock' to CLAUDE.md.", "CLAUDE.md doesn't configure the provider."],
    ["Install a separate Bedrock-only version of Claude Code.", "The same Claude Code is configured through settings and environment."]
  ],
  "a": [0],
  "why": "Configure team environments centrally: provider settings and credentials through managed settings and cloud identity, not committed keys."
},
{
  "id": "p2-63", "d": 7, "s": "Debugging and operational issues",
  "stem": "A service sees bursts of 429 errors during month-end. The SDK already retries with backoff. Besides honouring retry-after, what reduces the 429s?",
  "o": [
    ["Smooth or queue traffic, cache stable prefixes so each request sends fewer uncached tokens, move non-urgent work to batch where the platform supports it, and request higher limits or quotas.", "Correct. Reduce demand peaks and request size, and raise capacity."],
    ["Add a second retry loop around the SDK.", "That multiplies attempts and makes the bursts worse."],
    ["Treat 429 as a permanent failure and skip the work.", "429s are retryable; dropping work isn't a fix."],
    ["Switch to a different API key per request.", "That's an evasion pattern, not a capacity plan, and it may breach terms."]
  ],
  "a": [0],
  "why": "Operational issue resolution: classify errors, rely on SDK retries, and address rate limits through traffic shaping, caching, batching and capacity."
}
);
