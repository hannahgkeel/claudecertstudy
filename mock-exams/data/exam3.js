// Mock exam 3. Question format: see mock-exams/README.md.
CCDVF.exams[3].push(
{
  "id": "e3-01",
  "d": 1,
  "s": "Agent Architecture",
  "stem": "A marketing tool writes a product description and then translates it into six languages. When the source description is missing required product specs, all six translation calls are wasted. What's the best design?",
  "o": [
    [
      "A prompt chain with a gate after step 1: code checks the required specs before any translation runs, and regenerates or fails fast if they're missing.",
      "Correct. A gate between chain steps catches problems early and cheaply."
    ],
    [
      "Generate and translate in a single prompt with all six languages, so the model can check that the specs are present before writing each translation.",
      "You lose the checkpoint, and one huge output is harder to validate and retry."
    ],
    [
      "An autonomous agent that decides on its own whether to translate.",
      "The steps are fixed and known, so letting a model decide adds unpredictability."
    ],
    [
      "Translate first, then check all six translations for the missing specs.",
      "This spends six calls before finding a problem that one check would have caught."
    ]
  ],
  "a": [
    0
  ],
  "why": "Prompt chaining breaks a task into ordered steps, and each step consumes the output of the one before. Adding programmatic gates (checks in code) between steps catches failures early, keeps costs down, and makes it easier to see where something went wrong."
},
{
  "id": "e3-02",
  "d": 1,
  "s": "Agent Architecture",
  "stem": "Which of these tasks most clearly benefits from an agent (a model-directed loop) rather than a fixed workflow?",
  "o": [
    [
      "Diagnosing why an integration test is flaky, where each next step depends on what the last log or file revealed.",
      "Correct. The path can't be predicted, so the model has to decide what to look at next."
    ],
    [
      "Converting CSV rows to JSON using a fixed column mapping.",
      "This is deterministic and doesn't need a model at all, let alone an agent."
    ],
    [
      "Classifying the sentiment of each customer review in a nightly batch, where the labels feed into a weekly dashboard.",
      "It's a single, well-defined step per item. A simple workflow or batch job is enough."
    ],
    [
      "Translating a fixed set of UI strings into five languages.",
      "The steps are known in advance, so a simple parallel workflow fits."
    ]
  ],
  "a": [
    0
  ],
  "why": "Use agents when you can't hard-code the steps: open-ended problems where the model has to choose actions based on what it finds. They cost more and are harder to predict, so give them clear tools, guardrails and stopping conditions. Use workflows (or plain code) when the path is known."
},
{
  "id": "e3-03",
  "d": 1,
  "s": "Agent Construction with Claude",
  "stem": "With the Claude Agent SDK, how do you give an agent a custom tool that queries your internal pricing service?",
  "o": [
    [
      "Define the tool (name, description, schema and handler), expose it through an MCP server such as an in-process SDK server, and allow it in the options.",
      "Correct. The SDK plugs custom tools in as MCP servers."
    ],
    [
      "Describe the pricing API's endpoints and parameters in the system prompt, and the agent will make the HTTP requests itself using its built-in web capabilities.",
      "The model can't make network calls on its own. A tool has to execute the request."
    ],
    [
      "Agents built with the SDK can only use the built-in tools.",
      "The SDK is designed to be extended with custom tools and external MCP servers."
    ],
    [
      "Fine-tune the model on the pricing service's API documentation.",
      "Knowing the API doesn't let the model execute calls against it."
    ]
  ],
  "a": [
    0
  ],
  "why": "The Agent SDK gives you Claude Code's agent loop and built-in tools as a library. You extend it with custom tools, usually defined in an in-process SDK MCP server or connected as external MCP servers. Then you control access with allowed-tools lists, permission modes and hooks."
},
{
  "id": "e3-04",
  "d": 1,
  "s": "Agent Construction with Claude",
  "stem": "A three-person startup wants to ship a feature where Claude runs long, multi-step tasks with code execution in a sandbox. They don't want to operate sandbox or agent infrastructure, and they have no constraints on where data is processed. What fits best?",
  "o": [
    [
      "An Anthropic-hosted, managed agent offering, where Anthropic runs the agent loop and the sandboxed execution environment.",
      "Correct. With no location constraints and no capacity for operations work, hosted is the faster path."
    ],
    [
      "Build their own Kubernetes cluster of sandboxes and a custom loop before launching.",
      "This means a lot of infrastructure to build and run, which is exactly what they want to avoid."
    ],
    [
      "Run the model's generated code directly on their production web servers.",
      "Running untrusted generated code without a sandbox is a serious security risk."
    ],
    [
      "Run each multi-step task as a single request through the Message Batches API.",
      "Each batch request is one Messages call. It can't run an iterative tool loop with sandboxed execution between steps."
    ]
  ],
  "a": [
    0
  ],
  "why": "Deployment models are a trade-off between control and operational load. Self-hosting (for example with the Agent SDK in your own infrastructure) maximises control over data location, networking and the sandbox. Anthropic-hosted managed agents remove the infrastructure work. Choose based on constraints and team capacity."
},
{
  "id": "e3-05",
  "d": 1,
  "s": "Agent Construction with Claude",
  "stem": "Your coding agent sometimes declares a task finished while tests are still failing. What's a deterministic way to stop it finishing too early?",
  "o": [
    [
      "A Stop hook that runs the test suite. If tests fail, it blocks the stop and returns the failure output so the agent keeps working, with a retry cap.",
      "Correct. Completion is checked in code, not left to the model's judgement."
    ],
    [
      "Add 'make sure all tests pass before finishing' to the system prompt.",
      "Good guidance, but the agent can still declare victory too early."
    ],
    [
      "A PreToolUse hook on the Read tool.",
      "This runs before file reads, which has nothing to do with deciding when the agent is done."
    ],
    [
      "Ask the agent to rate its confidence that the work is complete and correct, and allow it to finish only when it rates itself 9/10 or higher.",
      "Self-reported confidence is poorly calibrated, and it isn't a test result."
    ]
  ],
  "a": [
    0
  ],
  "why": "Hooks provide deterministic control points across the agent life cycle. PreToolUse and PostToolUse fire around tool calls. Stop and SubagentStop fire when the agent tries to finish, and they can block it with a reason. SessionStart can inject context. Use them to enforce invariants such as 'tests must pass'."
},
{
  "id": "e3-06",
  "d": 1,
  "s": "Agent Patterns and Frameworks",
  "stem": "An orchestrator delegates 'write the migration script' to a subagent. The subagent writes a script for the wrong database, even though the user told the orchestrator 'we use Postgres 15' earlier in the conversation. What's the root cause, and the fix?",
  "o": [
    [
      "Subagents start with a fresh context and don't see the parent's conversation, so the orchestrator must pass the database and constraints explicitly.",
      "Correct. Context is passed explicitly when delegating."
    ],
    [
      "The subagent's model is too small. Use a larger one.",
      "No model can know a fact it was never given."
    ],
    [
      "The temperature is too high for subagents.",
      "Sampling settings don't supply missing context."
    ],
    [
      "Subagents inherit the parent's full conversation automatically, so the subagent must have ignored the instruction. Repeat key facts in its own system prompt.",
      "They don't share it. Isolation is the whole point of a subagent."
    ]
  ],
  "a": [
    0
  ],
  "why": "Context isolation cuts both ways. Subagents avoid the parent's noise, but they also miss the parent's facts unless you pass them. Good delegation includes the goal, constraints, relevant facts, the expected output format and when to stop. Think of it as briefing a capable colleague who wasn't in the meeting."
},
{
  "id": "e3-07",
  "d": 1,
  "s": "Agent Patterns and Frameworks",
  "stem": "An agent writes SQL queries and asks itself 'Is this query correct?' before returning them. Errors still get through. What's the best improvement?",
  "o": [
    [
      "Verify with external feedback: run the query (or EXPLAIN) against a test database, check the results, and feed any errors back.",
      "Correct. Real signals beat the model judging its own work."
    ],
    [
      "Ask the self-check question twice.",
      "The same model, in the same context, mostly repeats the same judgement."
    ],
    [
      "Have the agent rate its confidence in each query on a 1–10 scale, and return the query only when the rating is above 8, regenerating it from scratch otherwise.",
      "Self-rated confidence is poorly calibrated."
    ],
    [
      "Make the prompt longer, with more SQL rules.",
      "This might help a little, but without real feedback nothing actually verifies the query."
    ]
  ],
  "a": [
    0
  ],
  "why": "Evaluator-optimizer and reflection loops work best when the evaluator has an objective signal: tests, execution results, linters, schema checks. The model reviewing its own work without new information catches far less. Design loops around feedback you can verify."
},
{
  "id": "e3-08",
  "d": 1,
  "s": "Agent Patterns and Frameworks",
  "stem": "Which TWO statements about using agent frameworks (such as LangGraph, PydanticAI or Strands) rather than a hand-written loop are most accurate?",
  "o": [
    [
      "Frameworks speed up common concerns such as state, tool wiring, retries and tracing, but their abstractions can hide the actual prompts and responses, which makes debugging harder.",
      "Correct. That's the central trade-off."
    ],
    [
      "For simple agents, it's often best to start with the API directly, and adopt a framework when you need its specific features (durable state, typed validation, integrations) and understand what it does underneath.",
      "Correct. This matches Anthropic's guidance to start simple."
    ],
    [
      "Frameworks make the same prompts more accurate than calling the API directly.",
      "A framework calls the same model. Quality comes from prompts, tools and design."
    ],
    [
      "You need a framework to use tools with Claude.",
      "The Messages API supports tool use natively."
    ],
    [
      "A framework removes the need for evals.",
      "You still need evals whatever framework you use."
    ]
  ],
  "a": [
    0,
    1
  ],
  "why": "Frameworks are tools, not requirements. They help with state, orchestration, typing and integrations, but they add layers between you and the model. Anthropic's advice is to start with simple, direct implementations, understand the underlying calls, and add complexity only when it clearly pays off."
},
{
  "id": "e3-09",
  "d": 2,
  "s": "Understanding Requirements",
  "stem": "A stakeholder's requirement for a contract-clause extractor is 'it should be really accurate'. What's the best next step?",
  "o": [
    [
      "Agree measurable success criteria with the stakeholder (for example 95% exact match on 300 labelled clauses, plus latency and cost targets) and build a test set.",
      "Correct. Specific, measurable criteria tell you what to build and how to know it's working."
    ],
    [
      "Start building, and judge accuracy by how the outputs look.",
      "Without criteria, nobody can agree on whether it's finished or improving."
    ],
    [
      "Choose the largest available model with extended thinking, since that maximises accuracy, and revisit the choice later if users report accuracy problems.",
      "Model choice should follow from the criteria and evals, not come before them."
    ],
    [
      "Add 'be really accurate' to the prompt.",
      "A vague requirement copied into the prompt is still vague."
    ]
  ],
  "a": [
    0
  ],
  "why": "Requirements analysis turns business language into measurable criteria covering task quality (accuracy, precision and recall), latency, cost, and any safety or compliance needs. Those criteria determine the eval set, the model choice and when you're done."
},
{
  "id": "e3-10",
  "d": 2,
  "s": "Understanding Requirements",
  "stem": "Requirements: about 50,000 documents a day, each result available within 1 hour of upload (a contractual SLA), and cost matters. Which approach meets them?",
  "o": [
    [
      "The real-time API with a queue sized to your rate limits, plus caching for cost. Batches only guarantee completion within 24 hours.",
      "Correct. A hard 1-hour SLA rules out relying on the batch window."
    ],
    [
      "The Batches API for the 50% discount, since most batches finish within an hour, with a fallback alert if a batch is still running after 50 minutes.",
      "'Most' isn't a guarantee. Breaching a contractual SLA on slow days is a requirements failure."
    ],
    [
      "One daily batch submitted at midnight.",
      "Documents uploaded in the morning would wait many hours."
    ],
    [
      "The smallest model, called synchronously one document at a time.",
      "Processing one at a time is unlikely to keep up with 50,000 documents a day, and the model choice should come from evals."
    ]
  ],
  "a": [
    0
  ],
  "why": "Choosing real-time or batch means reading the requirement precisely. Batches give a 50% discount and no latency guarantee (only completion within 24 hours). A hard SLA shorter than that needs the real-time API, with capacity planning, queueing and caching to control cost. Deferrable work can still go to batches."
},
{
  "id": "e3-11",
  "d": 2,
  "s": "Systems Life Cycle",
  "stem": "Your Claude feature is in production. Which TWO monitoring practices best support operating it?",
  "o": [
    [
      "Track operational metrics: latency (time to first token and total time), error rates by type (429, 5xx, 529), and token usage and cost per request.",
      "Correct. This covers health, performance and cost."
    ],
    [
      "Sample production outputs for ongoing quality review, using automated graders and human spot checks stratified by input type, and alert on drift.",
      "Correct. Quality can degrade silently, so you have to measure it."
    ],
    [
      "Monitor the server's CPU, memory and uptime, since an LLM feature that is up, responding and not crashing is working as intended for users.",
      "Infrastructure metrics miss model errors, cost spikes and quality drift."
    ],
    [
      "Check the system only when users complain.",
      "You find out late, and only about problems people bother to report."
    ],
    [
      "Log nothing at all, to protect privacy.",
      "You can't operate what you can't see. Minimise and redact what you log instead."
    ]
  ],
  "a": [
    0,
    1
  ],
  "why": "Operating an LLM system means watching two layers. The service layer covers latency, errors, throughput and spend. The quality layer covers sampled grading, user feedback and drift alerts. Stratify your samples, because a good overall accuracy number can hide one category that's failing badly."
},
{
  "id": "e3-12",
  "d": 2,
  "s": "Claude API Mechanics",
  "stem": "A legal-research app must show the exact passage in a provided document that supports each statement in an answer. Which API capability is designed for this?",
  "o": [
    [
      "Citations: send the sources as document blocks with citations enabled. Responses then point to the exact cited spans in the source.",
      "Correct. This is structured attribution produced by the API itself."
    ],
    [
      "Ask the model to put quotes in its free-text answer.",
      "This can work, but the quotes may be paraphrased or wrong, and there's no structured link to the source."
    ],
    [
      "Set the temperature to 0 so the answers are verifiable.",
      "Temperature has nothing to do with linking claims to their sources."
    ],
    [
      "Use the Batches API, which returns sources with each result.",
      "Batches change how requests are processed and billed. They don't add attribution."
    ]
  ],
  "a": [
    0
  ],
  "why": "Citations ground answers in provided documents. Responses include citation objects that point to the exact passages (character ranges, pages or content blocks), which makes answers verifiable and lets your UI link to the source. That's more reliable than asking for free-text quotes."
},
{
  "id": "e3-13",
  "d": 2,
  "s": "Claude API Mechanics",
  "stem": "Before sending a large document a user has uploaded, your app needs to check whether the full prompt will fit in the context window and to estimate its cost. What's the best approach?",
  "o": [
    [
      "Call the token counting endpoint with the same model, system prompt, messages and tools to get the input token count.",
      "Correct. It's an accurate count for that exact request, without running the model."
    ],
    [
      "Send the request and see whether it fails.",
      "This wastes a call, gives a poor user experience, and tells you nothing about cost in advance."
    ],
    [
      "Divide the document's character count by 4, which gives a close enough estimate for English text and avoids an extra API call.",
      "A rough heuristic that can be badly wrong for some languages, code and documents."
    ],
    [
      "Ask Claude how many tokens the document has.",
      "The model can't reliably count its own tokens, and asking costs tokens too."
    ]
  ],
  "a": [
    0
  ],
  "why": "The token counting endpoint takes the same structure as a Messages request (system, messages, tools, images, documents) and returns the input token count. It's free to use, subject to rate limits. Use it to enforce context limits, estimate cost, and choose a strategy, such as chunking, before you call the model."
},
{
  "id": "e3-14",
  "d": 2,
  "s": "Claude API Mechanics",
  "stem": "While streaming, your code tries to `JSON.parse` each `input_json_delta` chunk of a tool call as it arrives, and parsing fails. What's the correct handling?",
  "o": [
    [
      "Concatenate the `partial_json` strings for the block and parse once at `content_block_stop`, or use the SDK's helpers that do this.",
      "Correct. Accumulate, then parse."
    ],
    [
      "Turn off streaming whenever tools are involved.",
      "This works, but it isn't necessary, and you lose the latency benefits of streaming."
    ],
    [
      "The chunks are corrupted in transit, which happens with large tool inputs, so detect the parse failure and retry the whole request without streaming.",
      "The chunks are valid fragments by design. Retrying won't change that."
    ],
    [
      "Parse only the first chunk, which contains the full input.",
      "The full input is spread across many chunks."
    ]
  ],
  "a": [
    0
  ],
  "why": "When streaming tool use, `content_block_start` announces a `tool_use` block, then `content_block_delta` events carry `input_json_delta` fragments, and `content_block_stop` closes the block. Only the concatenated string is valid JSON. Bugs in this assembly code are a classic integration-layer issue."
},
{
  "id": "e3-15",
  "d": 2,
  "s": "Claude API Mechanics",
  "stem": "Which TWO statements about prompt caching are correct?",
  "o": [
    [
      "The cache matches a prefix in the order tools → system → messages, so changing a tool definition invalidates the cache for everything after it.",
      "Correct. Order and exact match both matter."
    ],
    [
      "Cache reads are billed at a fraction (about 10%) of the base input price, while cache writes cost more than the base input price.",
      "Correct. Writing costs more, and reading is much cheaper."
    ],
    [
      "The cache stores the model's outputs, so a repeated identical question gets the same answer back instantly without generating again.",
      "Caching stores the processed input prefix, not responses. Output is still generated fresh each time."
    ],
    [
      "Cached content is shared across organisations to improve hit rates.",
      "Caches are isolated per organisation."
    ],
    [
      "Prompt caching works only with streaming requests.",
      "Caching works with streaming and non-streaming requests alike."
    ]
  ],
  "a": [
    0,
    1
  ],
  "why": "Prompt caching reuses the computation for an identical prompt prefix, up to a breakpoint, within the TTL. Put stable content first, mark breakpoints with `cache_control` (up to four), and check `cache_read_input_tokens`. It cuts input cost and latency, but it doesn't make outputs deterministic."
},
{
  "id": "e3-16",
  "d": 2,
  "s": "Software Engineering Foundations",
  "stem": "Your API wraps a Claude agent that takes 2–8 minutes per task. Clients currently hold an HTTP request open for the whole time and often time out. What's the best REST design?",
  "o": [
    [
      "Return `202 Accepted` with a job ID, process the task in a background worker, and let clients poll `GET /jobs/{id}` or receive a webhook. Optionally stream progress.",
      "Correct. The asynchronous job pattern for long-running work."
    ],
    [
      "Raise every client's timeout to 30 minutes.",
      "Long-held connections are fragile and tie up resources, and proxies may still cut them off."
    ],
    [
      "Lower `max_tokens` so the agent finishes sooner.",
      "This makes results worse and still doesn't guarantee fast completion."
    ],
    [
      "Keep the requests synchronous and have clients retry on timeout.",
      "Each retry starts the expensive task again and can create duplicate work."
    ]
  ],
  "a": [
    0
  ],
  "why": "Long-running operations don't fit synchronous request/response. Use an async job API: accept the request, return a job resource, process in the background, and report status by polling, webhooks or a stream. Combine it with idempotency keys so client retries don't start duplicate jobs."
},
{
  "id": "e3-17",
  "d": 2,
  "s": "Software Engineering Foundations",
  "stem": "Users often close the chat tab while a long streamed response is still generating, but your backend keeps reading the stream to the end. What should you do?",
  "o": [
    [
      "When the client disconnects, cancel the upstream stream so generation stops and you don't pay for unread output.",
      "Correct. Propagate cancellation upstream."
    ],
    [
      "Nothing can be done. Once a stream starts, the API generates the full response and bills for it even if the connection closes.",
      "Closing the connection stops generation, and you're billed only for tokens generated up to that point."
    ],
    [
      "Lower the temperature so responses finish faster.",
      "Temperature doesn't control how fast or how long the output is."
    ],
    [
      "Move chat to the Batches API.",
      "Batches can't serve interactive chat."
    ]
  ],
  "a": [
    0
  ],
  "why": "Asynchronous programming fundamentals: propagate cancellation and timeouts through every layer. When the downstream consumer goes away, cancel the upstream work. For LLM streams that saves output tokens and frees up concurrency."
},
{
  "id": "e3-18",
  "d": 2,
  "s": "Software Engineering Foundations",
  "stem": "An automated Claude pull-request reviewer leaves many style nitpicks. Developers start ignoring all its comments, including the real bugs. What's the best fix?",
  "o": [
    [
      "Give it explicit criteria for a finding (for example, only incorrect behaviour or security issues; skip linter-covered style), with examples and severity.",
      "Correct. Precise criteria cut false positives and rebuild trust."
    ],
    [
      "Tell it to 'be conservative and only flag issues that are truly important to the team', and add a line asking it to keep each comment brief and polite.",
      "It's still vague. 'Important' is undefined, so the noise continues."
    ],
    [
      "Ask it to leave more comments, so the real bugs are less likely to be missed.",
      "More noise erodes trust even faster."
    ],
    [
      "Remove the AI reviewer.",
      "This throws away real value instead of fixing how it's configured."
    ]
  ],
  "a": [
    0
  ],
  "why": "Code review with an LLM succeeds or fails on precision. Vague instructions produce false positives, and false positives teach people to ignore the tool. Define exactly what to report, give examples of what not to report, add severity levels, and leave mechanical style checks to linters."
},
{
  "id": "e3-19",
  "d": 2,
  "s": "Software Engineering Foundations",
  "stem": "You add a new required field, `risk_level`, to the JSON your Claude service returns. Two downstream consumers break. Which practice would have prevented this?",
  "o": [
    [
      "Version the output schema, keep changes backward-compatible, announce deprecations, and run contract tests against consumers.",
      "Correct. Treat the output schema as a public API contract."
    ],
    [
      "Never change the schema again.",
      "This freezes the product instead of managing change properly."
    ],
    [
      "Make consumers parse the JSON with regular expressions.",
      "Regex parsing of JSON is fragile and makes breakage more likely."
    ],
    [
      "Have the model detect which consumer is calling and produce the older format for consumers that haven't been updated to the new schema yet.",
      "Output shape should be enforced by schema and versioning, not left to model behaviour."
    ]
  ],
  "a": [
    0
  ],
  "why": "A JSON schema that other systems consume is an API. Apply the usual practices: semantic versioning, additive changes, tolerant readers, deprecation periods and contract tests. Structured outputs enforce the shape on Claude's side, and versioning manages how that shape changes over time."
},
{
  "id": "e3-20",
  "d": 2,
  "s": "Claude Application Design",
  "stem": "A non-technical HR team wants a shared assistant that answers questions from their policy handbook, follows consistent instructions, and needs no software built. What's the best option?",
  "o": [
    [
      "A claude.ai Project with the handbook added as project knowledge and the instructions set as project instructions, shared with the team.",
      "Correct. Shared knowledge and instructions, with no code."
    ],
    [
      "Build a custom API application with retrieval first.",
      "That's engineering effort the requirement explicitly doesn't ask for."
    ],
    [
      "Have each person paste the handbook into every new chat.",
      "This is inconsistent, tedious and error-prone."
    ],
    [
      "Use Claude Code in a terminal.",
      "Claude Code is for development work, not a non-technical HR team's Q&A."
    ]
  ],
  "a": [
    0
  ],
  "why": "Different interfaces suit different users. claude.ai and the desktop app give non-developers Projects, with shared knowledge and instructions that apply to every chat in the project. The API and SDKs embed Claude in your own products. Claude Code is for software work. Match the interface to the audience and the requirement."
},
{
  "id": "e3-21",
  "d": 2,
  "s": "Claude Application Design",
  "stem": "Your app occasionally receives responses with `stop_reason: refusal`. How should the app handle them?",
  "o": [
    [
      "Detect it explicitly, don't treat partial output as a finished answer, show a graceful message or route it, and log it for review.",
      "Correct. Handle every stop reason deliberately."
    ],
    [
      "Retry the identical request automatically up to five times with backoff, since refusals are often transient and a later attempt usually succeeds.",
      "Sending the same request again usually gets the same outcome, while costs and latency pile up."
    ],
    [
      "Treat it like `max_tokens`, and raise the output limit.",
      "A refusal has nothing to do with the output limit."
    ],
    [
      "Show whatever text came back as if it were a complete answer.",
      "This can show users partial or confusing output."
    ]
  ],
  "a": [
    0
  ],
  "why": "Application design includes handling every `stop_reason`: `end_turn`, `tool_use`, `max_tokens`, `stop_sequence`, `pause_turn` and `refusal`. A refusal means the model declined to continue. Your UI should handle that clearly, and your logs should record it, so you can tell legitimate refusals from prompts that need redesigning."
},
{
  "id": "e3-22",
  "d": 2,
  "s": "Claude Application Design",
  "stem": "You need Claude's final answer as JSON that matches a schema, and no external actions are involved. Which design is most direct?",
  "o": [
    [
      "Use structured outputs: set a JSON schema as the output format.",
      "Correct. This is the mechanism designed for schema-conforming responses."
    ],
    [
      "Define a placeholder tool whose input schema is the output format, and force `tool_choice` to that tool.",
      "This is the classic workaround. On current models, structured outputs are the direct mechanism, and forced tool choice can conflict with features such as thinking."
    ],
    [
      "Say 'respond in JSON' in the prompt, and extract it with a regex.",
      "This is the least reliable option: nothing guarantees the output parses or matches the schema."
    ],
    [
      "Prefill the assistant turn with `{`.",
      "Newer models reject assistant prefill. Structured outputs replace it."
    ]
  ],
  "a": [
    0
  ],
  "why": "Choose the mechanism by purpose. Use structured outputs for a final answer in a guaranteed shape. Use tools (with `strict: true` when needed) when the model has to take actions or fetch data. Prompt-only JSON is the weakest option. Whichever you use, still validate the semantics in code."
},
{
  "id": "e3-23",
  "d": 2,
  "s": "Claude Application Design",
  "stem": "A developer wants to install a Claude Code plugin from an unfamiliar public marketplace. The plugin includes hooks and an MCP server. What's the best practice?",
  "o": [
    [
      "Treat it as code you'll run: use trusted marketplaces only, review its hooks, scripts and MCP config, and pin a reviewed version.",
      "Correct. Plugins can execute code and connect to external services."
    ],
    [
      "Install it. Plugins only add prompts and slash commands, and Claude Code asks for permission before any of their tools run, so there's little risk.",
      "Hooks run shell commands and MCP servers run programs. A plugin can do a lot more than prompts can."
    ],
    [
      "Turn off all your own hooks first, so they don't conflict with the plugin's.",
      "This removes your guardrails and doesn't evaluate the plugin at all."
    ],
    [
      "Install it for the whole company first, then decide whether it's useful.",
      "This maximises the blast radius before anyone has reviewed it."
    ]
  ],
  "a": [
    0
  ],
  "why": "Plugin management is partly supply-chain security. Plugins can bundle hooks (commands that run automatically), MCP servers (programs with network access), agents and skills. Use trusted sources, review what you install, pin versions, and roll out deliberately."
},
{
  "id": "e3-24",
  "d": 2,
  "s": "Configuration Management",
  "stem": "Your CLAUDE.md should reference the team's existing `docs/architecture.md` and `docs/testing.md` without copying their contents, since copies would drift out of date. How?",
  "o": [
    [
      "Use imports in CLAUDE.md, such as `@docs/architecture.md` and `@docs/testing.md`.",
      "Correct. Imports pull the files in at load time, so there's only one source of truth."
    ],
    [
      "Paste both documents into CLAUDE.md, and update them by hand whenever they change.",
      "This creates exactly the drift you're trying to avoid."
    ],
    [
      "Add an `includeDocs` key to `.claude/settings.json`.",
      "No such setting exists. Imports are done in memory files."
    ],
    [
      "Rename the docs to `CLAUDE.md` inside the `docs/` folder.",
      "This changes the docs' purpose and only loads them in some cases."
    ]
  ],
  "a": [
    0
  ],
  "why": "CLAUDE.md files can import other files with `@path/to/file` syntax, which keeps the memory file short and avoids duplication. Combine this with the memory hierarchy (enterprise, project, user) and path-scoped rules to give Claude the right context without bloating it."
},
{
  "id": "e3-25",
  "d": 2,
  "s": "Configuration Management",
  "stem": "Security requires that no developer in the company can allow Claude Code to read `.env` files or disable certain hooks, whatever their own settings say. Where should these rules go?",
  "o": [
    [
      "In enterprise managed settings deployed by IT. They have the highest precedence and user or project settings can't override them.",
      "Correct. Managed settings exist to enforce organisation-wide policy."
    ],
    [
      "In each repository's committed `.claude/settings.json`, which every developer's Claude Code loads at the start of every session in that repo.",
      "Developers can change project settings, and personal local settings sit above them."
    ],
    [
      "In every developer's `~/.claude/settings.json`.",
      "Each developer controls their own user settings and can edit them."
    ],
    [
      "As an instruction in the project CLAUDE.md.",
      "Instructions aren't enforcement, and developers can edit the file."
    ]
  ],
  "a": [
    0
  ],
  "why": "Configuration precedence in Claude Code puts managed (enterprise policy) settings first, then command-line arguments, then local project settings, then shared project settings, then user settings. For rules that must hold for everyone, use managed settings. Deny rules win over allow rules."
},
{
  "id": "e3-26",
  "d": 3,
  "s": "Claude Code Operation",
  "stem": "You want a reusable 'security-reviewer' in Claude Code that runs in its own context and can use only the Read, Grep and Glob tools. How do you set it up?",
  "o": [
    [
      "Create `.claude/agents/security-reviewer.md` with frontmatter (a name, a description, and `tools: Read, Grep, Glob`), with the review instructions as the body.",
      "Correct. A project subagent with restricted tools and its own context."
    ],
    [
      "Add a 'Security review' section to CLAUDE.md.",
      "This runs in the main context, with every tool available."
    ],
    [
      "Write a PreToolUse hook that prints security guidelines.",
      "Hooks enforce rules around tool calls. They don't define a separate agent."
    ],
    [
      "Add a custom slash command that runs `grep` for 'password'.",
      "That's a narrow check, not a reviewer with its own context and tool restrictions."
    ]
  ],
  "a": [
    0
  ],
  "why": "Claude Code's components each have a role. Subagents (`.claude/agents/*.md`) run in their own context with restricted tools and their own prompt. Skills are loaded on demand. Rules give path-scoped instructions. Commands are reusable prompts. Hooks give deterministic control. Agent memory persists what an agent has learned."
},
{
  "id": "e3-27",
  "d": 3,
  "s": "Claude Code Operation",
  "stem": "You want Claude Code to analyse a codebase and propose an implementation plan for your approval before it edits any files. Which feature is designed for this?",
  "o": [
    [
      "Plan mode: Claude can read and explore, but doesn't edit anything until you approve the plan.",
      "Correct. Read-only planning, then a deliberate switch to implementation."
    ],
    [
      "Auto mode, which lets Claude work through the whole task without stopping to ask for each individual approval.",
      "Auto mode reduces approval prompts while Claude acts. It's the opposite of 'plan first, edit later'."
    ],
    [
      "Running with `--dangerously-skip-permissions`.",
      "This removes every permission check, which is the opposite of what you want."
    ],
    [
      "Headless mode (`-p`) with edits accepted automatically.",
      "This makes edits automatically, with no review step."
    ]
  ],
  "a": [
    0
  ],
  "why": "Permission modes shape how Claude Code works. Plan mode is for read-only exploration and planning. The default mode asks before risky actions. Accept-edits applies file changes without asking. Auto mode uses automated approval decisions to reduce prompts. Bypass mode skips checks entirely, and should only be used in isolated sandboxes."
},
{
  "id": "e3-28",
  "d": 4,
  "s": "Debugging and Error Handling",
  "stem": "JSON parse errors on tool inputs happen only in your streaming code path. The same prompts sent without streaming always produce valid tool inputs. Where is the problem most likely to be?",
  "o": [
    [
      "In the integration layer: your stream-assembly code, for example parsing partial `input_json_delta` chunks, or dropping or reordering deltas.",
      "Correct. Same model and prompts, different code path, so the bug is in your code."
    ],
    [
      "In the model: streaming changes how tokens are sampled, so tool inputs are more likely to come out malformed when they're streamed.",
      "Streaming changes how output is delivered, not what's generated."
    ],
    [
      "In the API, which corrupts streamed responses under load.",
      "If streams were corrupted, everyone would see it. The difference between your two code paths points at your own code."
    ],
    [
      "In the prompt, which needs to ask for valid JSON more firmly.",
      "The same prompt works without streaming, so the prompt isn't the variable."
    ]
  ],
  "a": [
    0
  ],
  "why": "Isolating where a problem comes from works like a controlled experiment. Hold the prompt and model constant, change one integration variable (streaming or not, SDK or raw HTTP, one parameter), and see where the failure follows. Then confirm with a trace: log the raw events and the assembled result."
},
{
  "id": "e3-29",
  "d": 5,
  "s": "LLM Fundamentals",
  "stem": "You need Claude to answer questions over 2,000 pages of manuals, far more than fits in the context window. What's the best approach?",
  "o": [
    [
      "Retrieve the relevant chunks for each question (search or RAG) and include only those, summarizing in stages for whole-corpus tasks.",
      "Correct. Bring the relevant information to the model, within the window."
    ],
    [
      "Truncate the manuals to the first 200,000 tokens.",
      "Anything after the cutoff is lost, whatever the question is."
    ],
    [
      "Send the manuals across several sequential requests, one section each, and the model will build up its knowledge of them before your question.",
      "Each request is independent. Nothing is remembered between calls."
    ],
    [
      "Increase `max_tokens` to make room for the manuals.",
      "`max_tokens` controls output length. It doesn't make the window bigger."
    ]
  ],
  "a": [
    0
  ],
  "why": "Context windows are large but finite, and quality can drop when they're filled with irrelevant text. Retrieval puts the right passages in context for each request. Staged (map-reduce) summarization handles tasks that cover the whole corpus. Both respect the window and keep the signal high."
},
{
  "id": "e3-30",
  "d": 5,
  "s": "LLM Fundamentals",
  "stem": "With extended thinking enabled, a response stops with `stop_reason: max_tokens` before any final text appears. What's the explanation?",
  "o": [
    [
      "Thinking tokens count toward `max_tokens` (and are billed as output), so the model used up the limit while thinking. Raise `max_tokens` or reduce the thinking effort.",
      "Correct. Thinking and the answer share the output budget."
    ],
    [
      "Thinking tokens are free and separate, so this must be an API bug.",
      "Thinking tokens count toward the limit and are billed as output."
    ],
    [
      "The context window is too small for the input.",
      "An input that's too big causes a different error. `max_tokens` means the output budget ran out."
    ],
    [
      "Extended thinking can't produce text output.",
      "It can. The thinking blocks come first, then the final answer."
    ]
  ],
  "a": [
    0
  ],
  "why": "Extended or adaptive thinking generates reasoning tokens before the answer. Those tokens count toward `max_tokens` and are billed as output tokens. Leave enough headroom for both, and use effort settings to control how much thinking happens."
},
{
  "id": "e3-31",
  "d": 5,
  "s": "LLM Fundamentals",
  "stem": "A team wants faster output from the same top-tier model for an interactive coding workflow, and is willing to pay more per token. Which option fits?",
  "o": [
    [
      "Fast mode: the same model, generating output faster, at premium pricing.",
      "Correct. It trades price for speed without changing the model."
    ],
    [
      "Switch the workflow to a smaller model tier, which generates output faster.",
      "That's faster and cheaper, but it changes the model's capability, which the team wants to keep."
    ],
    [
      "Lower the temperature.",
      "Temperature affects randomness, not generation speed."
    ],
    [
      "Use the Batches API.",
      "Batches are cheaper but slower, with no latency guarantee."
    ]
  ],
  "a": [
    0
  ],
  "why": "Know the model options. Fast mode is faster output from the same model at a higher price. Extended or adaptive thinking adds reasoning depth. Effort levels control how many tokens the model spends. Model tiers (Opus, Sonnet, Haiku) trade capability against cost and latency. Choose by what the requirement says it values."
},
{
  "id": "e3-32",
  "d": 5,
  "s": "Technical Fundamentals",
  "stem": "In the Python SDK, which approach handles errors correctly?",
  "o": [
    [
      "Set `max_retries` and a timeout on the client, and catch specific exceptions such as `RateLimitError`, `APIStatusError` and `APIConnectionError`.",
      "Correct. Built-in retries plus typed, specific handling."
    ],
    [
      "Catch bare `Exception` and retry forever.",
      "Infinite retries hide bugs, and they keep retrying errors that can never succeed, such as 400s."
    ],
    [
      "Catch every exception, inspect the error message text for words like 'rate' or 'overloaded', and retry or fail based on what the message says each time.",
      "Message text is brittle, and the SDK gives you typed exceptions for exactly this."
    ],
    [
      "Turn off retries and let the process crash, so errors are visible.",
      "Crashing on a temporary 529 or 429 makes the service fragile for no reason."
    ]
  ],
  "a": [
    0
  ],
  "why": "SDKs that wrap REST APIs map HTTP errors to typed exceptions and retry transient failures automatically, with backoff. Configure retries and timeouts deliberately, catch specific types (rate limit, connection, status errors), and keep logging and alerting on whatever still fails after retries."
},
{
  "id": "e3-33",
  "d": 5,
  "s": "Technical Fundamentals",
  "stem": "You've submitted a Message Batch. How do you find out when the results are ready, and how do you get them?",
  "o": [
    [
      "Poll the batch until its `processing_status` is `ended`, then fetch the results and match each one to its request by `custom_id`.",
      "Correct. Results aren't returned in order, so `custom_id` is the key."
    ],
    [
      "The results stream back over the connection that submitted the batch.",
      "Submitting a batch returns straight away. Processing is asynchronous."
    ],
    [
      "Wait for the batch to finish, then download the results, which come back in the same order as your requests so you can match them by position.",
      "Order isn't guaranteed. Always use `custom_id`."
    ],
    [
      "Wait exactly 24 hours, then download everything.",
      "Most batches finish much sooner. Poll the status instead of waiting for the maximum."
    ]
  ],
  "a": [
    0
  ],
  "why": "Batch workflow: create the batch with a `custom_id` for each request, poll its status (`in_progress`, then `ended`), retrieve the results, and handle each result type (succeeded, errored, canceled, expired). Resubmit only the failures, and don't assume results arrive in submission order."
},
{
  "id": "e3-34",
  "d": 5,
  "s": "Technical Fundamentals",
  "stem": "A web service creates a new Anthropic client object for every incoming request. Under load, latency rises and connection errors appear. What's the best fix?",
  "o": [
    [
      "Create one client at startup and reuse it for all requests, so it can pool connections and reuse them with keep-alive.",
      "Correct. Clients are designed to be long-lived and shared."
    ],
    [
      "Create two clients per request, for redundancy.",
      "This doubles the overhead that's causing the problem."
    ],
    [
      "Turn off HTTP keep-alive.",
      "Then every request needs a new connection and handshake, which makes things slower."
    ],
    [
      "Move the traffic to the Batches API.",
      "That changes the product's latency characteristics. The bug is in how clients are created."
    ]
  ],
  "a": [
    0
  ],
  "why": "SDK clients manage HTTP connection pools. Reusing one client avoids repeated connection and TLS handshakes and keeps resource use bounded. This is a general practice for integrating with any REST API under load."
},
{
  "id": "e3-35",
  "d": 5,
  "s": "Model Selection and Tradeoffs",
  "stem": "A coding agent uses a top-tier model as its orchestrator, and that model spawns many subagents that do simple file searches and summarize what they find. Costs are high. What's the best adjustment?",
  "o": [
    [
      "Run the simple search-and-summarize subagents on a cheaper tier like Haiku, keep orchestration on the stronger model, and confirm with evals.",
      "Correct. Choose a tier for each role in the system."
    ],
    [
      "Downgrade everything, orchestrator included, to the smallest model.",
      "The orchestration needs complex reasoning, so quality would probably fall."
    ],
    [
      "Remove the subagents and have the top-tier orchestrator read and summarize every file itself, which avoids paying for many separate subagent calls.",
      "This bloats the expensive model's context, which costs more and works worse."
    ],
    [
      "Turn on extended thinking for the subagents.",
      "This adds cost and latency to tasks that don't need deep reasoning."
    ]
  ],
  "a": [
    0
  ],
  "why": "Model selection doesn't have to be one choice for the whole system. Give each role the tier it needs: a capable model where the reasoning is hard, and fast, cheap models for high-volume simple work. Confirm the split with evals, because the cheapest configuration that meets the quality bar wins."
},
{
  "id": "e3-36",
  "d": 5,
  "s": "Cost and Token Management",
  "stem": "A multi-turn chat app caches a long system prompt. As conversations grow, input costs keep climbing. What should you add?",
  "o": [
    [
      "Cache the conversation history too: move a cache breakpoint to the latest message each turn, so earlier turns are read from cache.",
      "Correct. Checkpoint the growing prefix, not just the static part."
    ],
    [
      "Reverse the message order, newest first.",
      "This breaks the conversation's structure and stops the prefix matching."
    ],
    [
      "Summarize the whole conversation into a short recap on every turn and send only that recap, so the input stays small as conversations grow.",
      "Rewriting history every turn invalidates the cache and loses detail."
    ],
    [
      "Add a timestamp to the top of the system prompt so the cache stays fresh.",
      "A changing prefix guarantees a cache miss."
    ]
  ],
  "a": [
    0
  ],
  "why": "Cache checkpointing: you can place up to four `cache_control` breakpoints. In multi-turn conversations, put one on the most recent message each turn, so the next request reads the whole prior conversation from the cache. Append to history and don't edit earlier turns, because edits break the prefix."
},
{
  "id": "e3-37",
  "d": 5,
  "s": "Cost and Token Management",
  "stem": "Output tokens dominate the bill for a report generator. Which TWO changes reduce output cost most directly?",
  "o": [
    [
      "Give explicit length and format limits (for example 'at most 200 words, 5 bullets'), and stop generating sections nobody reads.",
      "Correct. Less output means less output cost."
    ],
    [
      "Lower the effort setting, or avoid extended thinking where it isn't needed, since thinking tokens are billed as output.",
      "Correct. Thinking can be a large, hidden share of output tokens."
    ],
    [
      "Add prompt caching to the long system prompt, since cached tokens are billed at a fraction of the normal token price.",
      "Caching reduces input cost, not output cost."
    ],
    [
      "Raise `max_tokens` so responses don't get cut off.",
      "A higher cap allows more output. It doesn't reduce it."
    ],
    [
      "Move the instructions from the user message into the system prompt.",
      "This rearranges input tokens and does nothing for output."
    ]
  ],
  "a": [
    0,
    1
  ],
  "why": "Output tokens are usually priced several times higher than input tokens, and thinking tokens count as output. Cut output with explicit length and format constraints, a lower effort setting where quality allows, and structured formats that leave out filler. Use caching and batching for the input side and overall discounts."
},
{
  "id": "e3-38",
  "d": 6,
  "s": "Context Engineering",
  "stem": "A three-step workflow (extract → analyse → draft email) passes the full transcript of every earlier step, raw documents included, into each next step. The draft step is slow and drifts off topic. What's the best change?",
  "o": [
    [
      "Pass each step only the structured output it needs from the step before, for example the extracted fields and the analysis summary, not the whole transcript.",
      "Correct. Isolate each step's context to what it needs."
    ],
    [
      "Pass even more context, to make sure nothing is missing.",
      "That makes the bloat and the drift worse."
    ],
    [
      "Merge all three steps into one large prompt.",
      "You lose the focus, the checkpoints and the ability to debug each step."
    ],
    [
      "Raise `max_tokens` for the draft step.",
      "The problem is the input context, not the output length."
    ]
  ],
  "a": [
    0
  ],
  "why": "Multi-step workflows give you a chance to isolate context: each step gets a clean, minimal input. Passing structured intermediate results instead of raw transcripts reduces tokens, latency and drift, and it makes each step easier to test on its own."
},
{
  "id": "e3-39",
  "d": 6,
  "s": "Context Engineering",
  "stem": "A debugging agent has built up about 150,000 tokens of verbose build logs over many iterations, and its suggestions are getting worse. What's the most direct fix?",
  "o": [
    [
      "Prune the context: keep only relevant log excerpts, such as errors and failing tests, and clear old tool results.",
      "Correct. Less noise means better attention to what matters."
    ],
    [
      "Raise the temperature so the agent tries new ideas.",
      "Randomness doesn't remove the noise causing the degradation."
    ],
    [
      "Keep every log, and add a summary of the most recent build at the top of each message, so the agent has complete information plus focus.",
      "The noise stays in the context, so context rot continues even with a summary on top. The fix is to remove what doesn't matter."
    ],
    [
      "Move the logs into the system prompt.",
      "This moves the bloat somewhere else without reducing it."
    ]
  ],
  "a": [
    0
  ],
  "why": "Context rot: as context fills with low-value tokens, the model's ability to use what matters declines. Treat context as a scarce budget. Trim tool output before it enters history, clear stale tool results, summarize when needed, and keep the most important information prominent."
},
{
  "id": "e3-40",
  "d": 6,
  "s": "Prompt Engineering",
  "stem": "A prompt asks Claude to choose the best of three vendor proposals against eight weighted criteria and return only the winning vendor's name. The choices are inconsistent and poorly justified. Without changing the model, what's the best prompt change?",
  "o": [
    [
      "Have Claude score each criterion in `<analysis>` tags first, then give the winner in `<answer>` tags, and parse only the answer.",
      "Correct. Reasoning before answering improves complex judgements."
    ],
    [
      "Add 'answer quickly and decisively'.",
      "Hurrying the model works against careful multi-criteria reasoning."
    ],
    [
      "Raise the temperature to 1.",
      "More randomness makes the inconsistency worse."
    ],
    [
      "Ask for the winning vendor's name together with a confidence score from 1 to 10, and rerun the comparison whenever the score is below 7.",
      "A self-reported number doesn't add reasoning, and it's poorly calibrated."
    ]
  ],
  "a": [
    0
  ],
  "why": "Chain-of-thought prompting (or extended thinking) gives the model room to work through complex, multi-step judgements before committing to an answer. Separate the reasoning from the final answer with tags or schema fields so your code can parse the answer reliably."
},
{
  "id": "e3-41",
  "d": 6,
  "s": "Prompt Engineering",
  "stem": "A prompt written for an older model says 'CRITICAL: You MUST ALWAYS call the search tool before answering ANYTHING.' On a newer model, Claude calls search even when the user just says 'thanks!'. What's the best adjustment?",
  "o": [
    [
      "Tone it down to calm, specific guidance that explains why: 'Use the search tool when the answer depends on information you don't already have.'",
      "Correct. Newer models follow instructions closely, so emphatic absolutes cause over-triggering."
    ],
    [
      "Add more capital letters and repeat the rule.",
      "This makes the over-triggering worse."
    ],
    [
      "Remove the search tool.",
      "This removes a capability instead of fixing the instruction."
    ],
    [
      "Set `tool_choice` to `none` on every request and inject search results yourself before each call, so the model can never over-call the tool.",
      "This takes away the model's judgement about when search is needed, and you'd run a search on every message, including 'thanks!'."
    ]
  ],
  "a": [
    0
  ],
  "why": "Prompt adjustment across model generations: newer Claude models follow instructions more precisely. Shouting ('CRITICAL', 'MUST', 'ALWAYS') that once compensated for inattention now causes over-triggering. Write clear, reasoned instructions that say when a behaviour applies, then re-evaluate."
},
{
  "id": "e3-42",
  "d": 6,
  "s": "Prompt Engineering",
  "stem": "You want a consistent persona and domain behaviour ('a senior tax accountant advising UK small businesses') across every conversation in your app. Where should that go?",
  "o": [
    [
      "In the system prompt (role prompting), along with the stable rules. Per-request data goes in user messages.",
      "Correct. The system prompt is for the role and standing instructions."
    ],
    [
      "Only in the first user message of each conversation.",
      "It's easier for later turns to dilute or override it, and it mixes standing instructions with user content."
    ],
    [
      "In a prefilled assistant message.",
      "Assistant turns are the model's own replies, and newer models reject prefill."
    ],
    [
      "In the description of one of the tools.",
      "Tool descriptions explain tools. They aren't the place for the overall persona."
    ]
  ],
  "a": [
    0
  ],
  "why": "Use the system prompt for the role, the tone and the stable rules that apply to every turn. Role prompting improves domain focus and consistency. Put task-specific data and questions in user messages, so the system prompt stays stable, which also helps caching."
},
{
  "id": "e3-43",
  "d": 6,
  "s": "Output Handling",
  "stem": "A support bot tells a customer 'Your order has shipped and will arrive Thursday,' but the trace shows it never called the order-status tool in that conversation. What's the best fix?",
  "o": [
    [
      "Require order claims to be grounded in tool results, and add a code check that flags order-status claims made without a lookup.",
      "Correct. Be sceptical of confident output, and verify it against real sources."
    ],
    [
      "Trust the answer, since it was stated confidently.",
      "Confidence isn't evidence. This answer was invented."
    ],
    [
      "Lower the temperature to 0 for support conversations, so the model's answers about orders become deterministic and stop drifting.",
      "A deterministic fabrication is still a fabrication."
    ],
    [
      "Add 'be accurate' to the system prompt.",
      "This is vague, and it doesn't give the model any facts."
    ]
  ],
  "a": [
    0
  ],
  "why": "Treat fluent, confident output with healthy scepticism. Factual claims about a user's state should come from tools or data, never from the model's guess. Enforce it in two places: instructions (look it up, or say you don't know) and code (check that claims are supported by a tool result before showing them)."
},
{
  "id": "e3-44",
  "d": 7,
  "s": "AI Application Security",
  "stem": "An agent's `get_invoice(customer_id)` tool returns any invoice for whatever customer ID Claude supplies. A user asks 'show me the invoices for customer C-2', which isn't their own account. What's the right control?",
  "o": [
    [
      "Enforce authorization in the tool backend using the session's authenticated identity, not the customer ID the model supplies.",
      "Correct. Authorization comes from the session, not from model output."
    ],
    [
      "Instruct the model in the system prompt to only ever pass the logged-in user's own customer ID, and to refuse requests about other accounts.",
      "The model can be talked out of this, and it was never the right place for access control."
    ],
    [
      "Hide customer IDs from users so they can't ask for other ones.",
      "Obscurity doesn't stop someone guessing, or the model using an ID it has seen elsewhere."
    ],
    [
      "Rate-limit the tool to 10 calls a minute.",
      "Rate limits slow down abuse. They don't stop unauthorized access."
    ]
  ],
  "a": [
    0
  ],
  "why": "Never let model output decide authorization. Tool backends should derive identity from the authenticated session and enforce access control themselves, treating every model-chosen argument as untrusted input. This also defeats prompt injection that tries to target other users' data."
},
{
  "id": "e3-45",
  "d": 7,
  "s": "Guardrails and Safe Deployment",
  "stem": "You're launching a public chatbot on an education platform for teenagers. Which approach best implements content guardrails?",
  "o": [
    [
      "Layer it: a content policy in the system prompt, input and output screening, rate limits and abuse detection, and human review of flags.",
      "Correct. Several independent layers, matched to the audience's risk."
    ],
    [
      "Rely on the model's built-in safety training alone.",
      "Training is an important layer, but a sensitive audience needs more controls."
    ],
    [
      "Screen every user message against a large keyword blocklist of unsafe terms before it reaches the model, and block the message on any match.",
      "Blocklists are easy to get around, and they ignore the output side."
    ],
    [
      "Review conversations only after a complaint.",
      "Purely reactive moderation lets harm reach users first."
    ]
  ],
  "a": [
    0
  ],
  "why": "Guardrail layering: combine policy (system prompt and terms of use), preventive screening of inputs and outputs, operational controls (rate limits, authentication, abuse detection) and human oversight. Tune each layer to the risks of your audience and use case."
},
{
  "id": "e3-46",
  "d": 7,
  "s": "Claude Hooks",
  "stem": "In Claude Code, you must stop Claude from reading `.env` files. Which TWO controls achieve this deterministically?",
  "o": [
    [
      "A permission deny rule in settings, such as `Read(./.env)` (and `Read(./.env.*)`).",
      "Correct. Deny rules are enforced by Claude Code, whatever the model wants."
    ],
    [
      "A PreToolUse hook that checks the paths of file-reading tool calls (and Bash commands) and blocks matches with exit code 2.",
      "Correct. The hook runs on every matching call and can block it."
    ],
    [
      "An instruction in CLAUDE.md: 'Never read .env files.'",
      "This is guidance, not enforcement."
    ],
    [
      "Rename `.env` to `.env.secret`.",
      "The file is still readable. Only the name changed."
    ],
    [
      "Ask Claude at the start of each session to promise not to read it.",
      "A promise isn't a control."
    ]
  ],
  "a": [
    0,
    1
  ],
  "why": "For guarantees, use permissions and hooks, not instructions. Deny rules block specific tool and path patterns. PreToolUse hooks can inspect any tool input, including Bash commands such as `cat .env` that a Read rule alone wouldn't catch, and block it. Layer both, and keep real secrets out of the working tree where you can."
},
{
  "id": "e3-47",
  "d": 7,
  "s": "Identity, Secrets, and Key Management",
  "stem": "An agent calls a third-party shipping API that needs a secret token. Where should the token live?",
  "o": [
    [
      "In a secret manager, attached by your tool-execution code at call time, so it never appears anywhere in the model's context.",
      "Correct. The credential is used by your code, not handed to the model."
    ],
    [
      "In the system prompt, so the model can include it in its requests.",
      "Anything in the context can be extracted or echoed into output and logs."
    ],
    [
      "In the tool's description, which only the tool runtime reads, so the model can reference the token without it showing up in conversation text.",
      "Tool descriptions are part of the context the model sees, so it's the same exposure."
    ],
    [
      "Asked from the user at the start of each conversation.",
      "This puts the secret into the conversation history and exposes it to end users."
    ]
  ],
  "a": [
    0
  ],
  "why": "Keep credentials out of model context. The model decides that a tool should be called and with which business arguments. Your harness attaches the credentials, taken from a secret manager, when it makes the actual API request. Scope credentials narrowly, rotate them, and monitor their use."
},
{
  "id": "e3-48",
  "d": 8,
  "s": "Tool Implementation",
  "stem": "A `search_logs` tool returns up to 5 MB of matching log lines, which quickly fills the context. What's the best tool design?",
  "o": [
    [
      "Return a bounded result: limit and pagination parameters, summary counts, the top matches with a truncation note, and a way to ask for more.",
      "Correct. Design tool output for the model's context budget."
    ],
    [
      "Return everything, so the model has complete information.",
      "Complete but overwhelming output crowds out what matters."
    ],
    [
      "Compress the output with base64 to save tokens.",
      "Base64 makes text longer in tokens, and harder for the model to read."
    ],
    [
      "Write the full results to a file and return only the file path, so the context stays small and the model can open the file if it really needs to.",
      "Opening that file would pull the 5 MB straight back into context, unless the model has a way to read it in bounded pieces."
    ]
  ],
  "a": [
    0
  ],
  "why": "Tool results are part of the context. Good tools return concise, high-signal output: filtering, pagination, truncation notices, and summaries with an option to drill down. That keeps agents effective over long runs and controls cost."
},
{
  "id": "e3-49",
  "d": 8,
  "s": "Tool Implementation",
  "stem": "Your harness dispatches tool calls by name. Which approach is most robust?",
  "o": [
    [
      "Map known names to handlers, validate inputs against the schema before running, and return an `is_error` result for unknown or invalid calls.",
      "Correct. An allowlist of handlers, with validation and informative errors."
    ],
    [
      "Look up the handler dynamically with `eval()` on the tool name and arguments, so new tools work automatically without updating any registry code.",
      "This lets model output execute arbitrary code, which is a serious injection risk."
    ],
    [
      "Assume the model always sends valid names and inputs.",
      "Models usually do, but production code has to handle the cases where they don't."
    ],
    [
      "Crash the request whenever a tool name isn't recognised.",
      "The model loses the chance to correct itself, and the user gets an error instead."
    ]
  ],
  "a": [
    0
  ],
  "why": "Agentic harness dispatch: keep an explicit registry of tools and handlers, validate inputs (or use `strict: true` schemas), handle unknown or malformed calls with error results the model can learn from, and never execute model output as code without a sandbox."
},
{
  "id": "e3-50",
  "d": 8,
  "s": "Tool Implementation",
  "stem": "Your tools `create_folder` and `upload_file` must run in order, because the upload needs the folder to exist. Claude sometimes calls both in parallel in one response. What's the best fix?",
  "o": [
    [
      "Set `disable_parallel_tool_use: true` (in `tool_choice`) so Claude makes at most one tool call per turn, and mention the dependency in the tool descriptions.",
      "Correct. This removes parallel calls where ordering matters."
    ],
    [
      "Add a random delay to `upload_file`.",
      "A timing hack makes failures less frequent without guaranteeing order."
    ],
    [
      "Run both and merge their results, whatever order they finish in.",
      "The upload still fails whenever it runs before the folder exists."
    ],
    [
      "Ask Claude in the system prompt not to be parallel.",
      "Unclear guidance with no enforcement. The API parameter controls this directly."
    ]
  ],
  "a": [
    0
  ],
  "why": "By default, Claude may call several tools in one turn. When the calls depend on each other, either disable parallel tool use, or have your harness execute the calls in dependency order. Documenting dependencies in the descriptions also helps the model plan the sequence."
},
{
  "id": "e3-51",
  "d": 8,
  "s": "MCP Server Development",
  "stem": "Your stdio MCP server works when you test it on its own, but clients disconnect with protocol errors. The server prints debug logs with `print()` to stdout. What's the fix?",
  "o": [
    [
      "Send the logs to stderr or a file. With stdio, stdout carries the JSON-RPC messages, so any other output corrupts them.",
      "Correct. Keep stdout for protocol messages only."
    ],
    [
      "Switch to HTTP, since stdio can't log.",
      "stdio servers can log, as long as it's to stderr."
    ],
    [
      "Reduce logging to errors only, since heavy stdout logging uses up the bandwidth the JSON-RPC messages need and causes the disconnects.",
      "Even a single line on stdout can break message framing. It isn't about volume."
    ],
    [
      "Add a blank line after each log message.",
      "Anything non-protocol on stdout is invalid, blank lines included."
    ]
  ],
  "a": [
    0
  ],
  "why": "With the stdio transport, the client launches the server as a subprocess and exchanges JSON-RPC messages over stdin and stdout. Stdout must contain only valid protocol messages. Send diagnostics to stderr, which clients typically capture as logs. Breaking this rule is a common reason new servers fail."
},
{
  "id": "e3-52",
  "d": 8,
  "s": "Agentic Customization",
  "stem": "Which TWO pairings of a need with a customization approach are the best fit?",
  "o": [
    [
      "Live read/write access to the company CRM from Claude Code, Claude Desktop and an internal agent → an MCP server.",
      "Correct. An external system, reused across several clients."
    ],
    [
      "A repeatable 'prepare release notes' procedure with a template and a changelog script, used occasionally → a Skill.",
      "Correct. Procedural knowledge plus bundled files, loaded on demand."
    ],
    [
      "Reading and editing files in the repo during a Claude Code session → build a custom MCP file server.",
      "Built-in file tools already do this."
    ],
    [
      "A one-off calculation inside a single API app → a remote MCP server with OAuth.",
      "A custom tool defined in the app is much simpler."
    ],
    [
      "Current information from the web → paste a fresh summary into CLAUDE.md every week so every Claude Code session has it.",
      "This goes stale and bloats context. Built-in web search fits better."
    ]
  ],
  "a": [
    0,
    1
  ],
  "why": "The choices to compare: built-in tools (standard capabilities already provided), custom tools (actions specific to one app), Skills (packaged know-how, scripts and templates with progressive disclosure), and MCP servers (reusable integrations with external systems, shared across clients). Choose the lightest option that meets your reuse and access needs."
},
{
  "id": "e3-53",
  "d": 8,
  "s": "Agentic Customization",
  "stem": "A team wants Claude, in their API app, to run Python data analysis on CSV files that users upload. They don't want to build or secure an execution sandbox. What fits best?",
  "o": [
    [
      "Anthropic's server-side code execution tool, with the CSVs supplied through the Files API.",
      "Correct. A built-in, sandboxed execution environment, with no infrastructure to run."
    ],
    [
      "A custom tool that runs the model's generated code with `exec()` on the app server.",
      "Running untrusted generated code on your server without a sandbox is a serious security risk."
    ],
    [
      "A Skill with instructions for analysing CSVs, so Claude can work out the statistics itself without running code.",
      "Reliable data analysis needs real code execution, not the model estimating results."
    ],
    [
      "An MCP server running on a developer's laptop.",
      "That isn't production infrastructure, and it still needs a sandbox."
    ]
  ],
  "a": [
    0
  ],
  "why": "Built-in server tools such as code execution give Claude capabilities that Anthropic hosts and isolates. When a built-in tool meets the requirement, it beats building and securing your own equivalent. Combine it with the Files API to provide input data."
}
);
