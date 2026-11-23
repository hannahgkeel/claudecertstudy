// CCAR-P mock exam 5 (written by Chris Hanson as his exam 2). Question format: see architect-professional/mock-exams/README.md.
MOCK.exams[5].push(
{
  "id": "p5-01",
  "d": 1,
  "s": "Translate business problems into Claude-based AI solutions",
  "stem": "During storm season an electric utility's call center is overwhelmed: 70% of calls ask 'when will my power be back?'. The answer already exists in the outage management system (OMS) as an estimated restoration time per circuit. Leadership asks for 'an autonomous AI agent to handle storm calls'. What should the architect propose?",
  "o": [
    [
      "Fine-tune a model on past storm-call transcripts so it learns how experienced agents phrase restoration updates to anxious customers.",
      "Phrasing isn't the bottleneck; access to live OMS data is. Fine-tuning can't supply a restoration time that changes hour by hour."
    ],
    [
      "An assistant that looks up the caller's circuit in the OMS through a read-only tool and states the current estimate in plain language.",
      "Correct. The data already exists; the gap is delivering it conversationally at scale. A grounded lookup solves the stated problem with minimal risk and no autonomy that isn't needed."
    ],
    [
      "An autonomous agent with OMS write access that can re-prioritize crews when callers report hazards, so storm calls actually change outcomes.",
      "Re-prioritizing crews is a safety-critical dispatch decision nobody asked to automate. It adds large risk to a problem that is about answering a status question."
    ],
    [
      "Have Claude predict restoration times from weather data and call history, since the OMS estimates are often revised during large storms.",
      "Replacing the system of record with model predictions makes answers inconsistent with what crews and the website say, and it isn't the stated problem."
    ]
  ],
  "a": [
    1
  ],
  "why": "Translate the ask into the underlying need: a fast, accurate answer from an existing system of record. An augmented LLM with a read-only lookup fits. Autonomy and prediction add risk without addressing the call-volume problem."
},
{
  "id": "p5-02",
  "d": 1,
  "s": "Translate business problems into Claude-based AI solutions",
  "stem": "An insurer wants Claude to answer policyholders' questions about a pending property claim. The deductible and coverage limit come from the policy engine's rules table, claims above $25,000 need an adjuster's sign-off, and customers want a clear plain-language explanation. The architect splits the work into what Claude does, what existing systems do, and what humans do. Which split is right?",
  "o": [
    [
      "Claude computes the deductible and coverage from the policy text, drafts the explanation, and approves the claims it judges to be routine.",
      "Claude would be forcing language work onto precise computation the policy engine already does reliably, and approving claims removes the human judgment the sign-off rule requires."
    ],
    [
      "The policy engine supplies deductible and coverage, Claude drafts the explanation, and the adjuster approves claims above $25,000.",
      "Correct. Existing systems keep what the partner already paid to make reliable, Claude takes the language work, and humans keep the approvals where being right matters more than being fast."
    ],
    [
      "Claude does the whole interaction, and an adjuster reviews a sample of the conversations afterward for quality and compliance.",
      "Sampling after the fact doesn't gate a claim above the threshold before it takes effect, and it still has Claude doing the computation the policy engine owns."
    ],
    [
      "The policy engine writes the explanation from fixed templates, Claude only classifies the question, and the adjuster approves every claim.",
      "This gives away the language task Claude is good at, and sending every claim to an adjuster ignores the stated threshold and floods the queue."
    ]
  ],
  "a": [
    1
  ],
  "why": "Decompose before choosing a pattern: split the work into what Claude handles, what existing systems handle, and what humans handle. Claude's strengths are language understanding and drafting, existing systems own reliable computation, and humans own judgment calls and approvals. Designs that skip this step force Claude into work another system does at lower cost."
},
{
  "id": "p5-03",
  "d": 1,
  "s": "Design multi-agent systems and orchestration strategies",
  "stem": "A telecom's network-fault root-cause system has an orchestrator and four subagents (radio, transport, core, power). Subagents return full raw log excerpts, so the orchestrator's context fills up after a few incidents and it starts contradicting earlier findings. Subagents also sometimes re-open tickets in the ticketing system on their own. Which TWO changes address the root causes?",
  "o": [
    [
      "Move the orchestrator to the largest model with the biggest context window so it can hold all four subagents' raw logs at once.",
      "A bigger window postpones the overflow but leaves the orchestrator wading through raw logs and still lets subagents change tickets."
    ],
    [
      "Let subagents message each other directly so they can reconcile hypotheses before reporting, reducing the orchestrator's workload.",
      "Peer chatter adds coordination paths that are hard to trace and doesn't stop subagents writing to tickets."
    ],
    [
      "Add a nightly job that detects and reverts ticket changes made by subagents during the previous day's incidents.",
      "Cleaning up after the fact leaves wrong ticket states live during the incident, when they matter most."
    ],
    [
      "Have subagents return condensed, structured findings with evidence references, not raw logs.",
      "Correct. Subagents exist partly to absorb exploration in their own context. Returning distilled findings keeps the orchestrator's context focused."
    ],
    [
      "Make the orchestrator the only writer to tickets; subagents get read-only tools.",
      "Correct. Shared state should have a single owner. Letting workers mutate tickets independently creates conflicting updates the orchestrator can't track."
    ]
  ],
  "a": [
    3,
    4
  ],
  "why": "In orchestrator-worker designs, workers should return compact results, and side effects on shared systems should be owned by one component. Bigger contexts and cleanup jobs treat symptoms."
},
{
  "id": "p5-04",
  "d": 1,
  "s": "Apply decomposition techniques for complex problem solving",
  "stem": "A semiconductor fab wants Claude to help engineers investigate yield excursions. Evidence comes from tool sensor logs, metrology data, maintenance records and lot-history tables. A single prompt containing everything produces plausible but shallow explanations that ignore most of the metrology data. What decomposition should the architect use?",
  "o": [
    [
      "Keep one prompt but add 'Consider ALL data sources carefully, especially metrology' at the top and in bold.",
      "Emphasis doesn't fix an overloaded context. The model still has to reason across four large, heterogeneous sources at once."
    ],
    [
      "Run a separate summarization of each source over the full date range, then ask Claude to explain the excursion from the four summaries.",
      "Generic summaries written without the excursion in mind tend to drop exactly the anomalies that matter."
    ],
    [
      "Analyze each source separately against the excursion window, emit structured anomalies, then correlate them.",
      "Correct. Focused per-source analysis with a shared question and structured outputs gives the synthesis step comparable evidence to correlate."
    ],
    [
      "Switch to a model with a larger context window and include two more years of lot history so the model has fuller context.",
      "More data in one context worsens the dilution problem; the issue is how the reasoning is structured, not window size."
    ]
  ],
  "a": [
    2
  ],
  "why": "Decompose by evidence source when inputs are large and heterogeneous, keep each step tied to the same question, and synthesize from structured intermediate results."
},
{
  "id": "p5-05",
  "d": 1,
  "s": "Design end-to-end architectures (input → processing → output → feedback loops)",
  "stem": "A state tax agency uses Claude to draft plain-language explanations that accompany balance-due notices. Caseworkers review and edit every draft before it is mailed. Six months in, the edit rate hasn't improved and nobody can say which kinds of notices produce bad drafts. What is missing from the architecture?",
  "o": [
    [
      "Let caseworkers only approve or reject drafts, so results are easier to count.",
      "Removing edits throws away the detailed signal and slows caseworkers down."
    ],
    [
      "Capture caseworker edits by notice type, categorize them, and turn recurring ones into eval cases and fixes.",
      "Correct. The edits are the richest quality signal available. Capturing and categorizing them closes the loop from output back to design."
    ],
    [
      "A second Claude call that reviews each draft for tone before the caseworker sees it, so caseworkers receive cleaner drafts to approve.",
      "This adds a processing step without learning from the edits; it can't tell you which notice types fail or why."
    ],
    [
      "A switch from Sonnet 5.5 to Opus 5.5 for all notice types, since higher capability should reduce the number of edits.",
      "Without knowing why drafts are edited, a model change is a guess, and it raises cost on every notice."
    ]
  ],
  "a": [
    1
  ],
  "why": "End-to-end designs need a feedback path: capture human corrections in structured form, analyze them by segment, and feed them into evals and iteration."
},
{
  "id": "p5-06",
  "d": 1,
  "s": "Align solutions to business value pillars (efficiency, transformation, productivity, cost, performance SLAs)",
  "stem": "A payroll SaaS vendor's support volume triples during the year-end W-2 season, and its contracts promise first response within 4 business hours. The VP of support wants to justify a Claude assistant that drafts replies for agents. Which value framing and success measure fit best?",
  "o": [
    [
      "Productivity: count drafts generated per agent per day, since a higher number shows the assistant is being used.",
      "Draft volume is an activity metric; it can rise while response times and quality fall."
    ],
    [
      "Performance SLA: first-response attainment and backlog at peak versus last season, with quality checks.",
      "Correct. The pain is a contractual SLA under seasonal load. Measuring attainment against a baseline ties the tool to the outcome the business cares about."
    ],
    [
      "Transformation: measure how many new product lines the support org can launch with the time saved during year-end.",
      "Launching new products isn't what this tool does; the framing doesn't match the outcome the VP needs to show."
    ],
    [
      "Cost: success means monthly model spend stays under the tooling budget.",
      "Spend is a constraint, not the value. Low spend tells you nothing about whether the SLA was met during the peak."
    ]
  ],
  "a": [
    1
  ],
  "why": "Pick the value pillar that matches the business pain and measure the outcome, with a baseline. Activity counts and spend caps don't show value on their own."
},
{
  "id": "p5-07",
  "d": 1,
  "s": "Apply decomposition techniques for complex problem solving",
  "stem": "A real-estate brokerage generates listing descriptions from agent notes and property data. Compliance found that some descriptions include phrases that violate fair-housing rules (e.g., describing an ideal buyer's family status). One prompt currently does extraction, writing and compliance at once. What change best addresses this?",
  "o": [
    [
      "Chain the steps: generate the draft, then run a separate compliance check that blocks or flags drafts before an agent can publish.",
      "Correct. Separating writing from checking gives the compliance step a focused task and a gate in code that stops non-compliant text from shipping."
    ],
    [
      "Have brokers sign an attestation that they reviewed every description, shifting responsibility for violations to the listing agent.",
      "This moves liability without reducing violations; rushed reviewers will miss subtle phrasing."
    ],
    [
      "Retrain listing agents to write shorter notes so the model has less material that could lead to problematic phrasing.",
      "The problem is in generation, not input length; short notes can still yield discriminatory language."
    ],
    [
      "Add a longer list of banned fair-housing phrases to the existing prompt and tell the model that compliance is its highest priority.",
      "Prompt emphasis in a multi-purpose prompt is still probabilistic, and the list will never be exhaustive."
    ]
  ],
  "a": [
    0
  ],
  "why": "Prompt chaining splits a task into focused steps and lets you insert programmatic gates between them. A dedicated check step is easier to test and enforce than one prompt doing everything."
},
{
  "id": "p5-08",
  "d": 1,
  "s": "Translate business problems into Claude-based AI solutions",
  "stem": "A municipal transit agency wants a rider assistant that answers 'When is the next 42 bus at Main & 5th?' and 'How do I get to the stadium?'. A prototype answered from the model's own knowledge and gave confident but wrong times. What should the solution look like?",
  "o": [
    [
      "Call the GTFS-realtime feed and the trip planner as tools, and have Claude explain their results to the rider in plain language.",
      "Correct. Arrival times and routes are live, structured data. Claude's job is to interpret the request and explain tool results, not recall schedules."
    ],
    [
      "Load the full static timetable into the system prompt each request so the model can read off departures accurately.",
      "Static timetables miss delays and detours, and stuffing them into every request is costly and still error-prone."
    ],
    [
      "Add an instruction telling the model not to guess times, and to say 'about' before any time it is unsure of.",
      "Hedging wording doesn't make answers correct; without live data the model has nothing reliable to report."
    ],
    [
      "Fine-tune a model monthly on the latest schedule so the times it has memorized stay current between service changes.",
      "Real-time delays change by the minute; no training cadence can keep memorized times accurate."
    ]
  ],
  "a": [
    0
  ],
  "why": "When answers depend on live, structured data, connect the model to the system of record through tools. Prompt wording and training can't substitute for current data."
},
{
  "id": "p5-09",
  "d": 1,
  "s": "Design multi-agent systems and orchestration strategies",
  "stem": "A food & beverage manufacturer reformulates recipes to cut sugar. A proposal uses seven agents in a chain: nutrition, allergen, cost, supplier, labeling, shelf-life and a final approver, each waiting on the previous one. Most checks don't depend on each other, and a run takes 40 minutes. What should the architect recommend?",
  "o": [
    [
      "Add a retry loop around each agent so that a slow or failing step is re-run before the chain continues to the next one.",
      "Retries add time and don't change the serial structure that causes the 40-minute runtime."
    ],
    [
      "Keep the chain but switch every agent to Haiku 5.5 so each step finishes faster and the whole run completes sooner.",
      "Faster steps help a little, but the run is still serial, and a smaller model may hurt checks like allergen analysis."
    ],
    [
      "Merge everything into one agent with all tools to avoid handoffs.",
      "One context doing seven specialized analyses risks dilution, and it doesn't use the fact that the checks are independent."
    ],
    [
      "Run the independent checks in parallel, then run labeling and final approval on the combined results.",
      "Correct. Parallelizing work with no dependencies cuts latency, while keeping dependent steps such as labeling after the inputs they need."
    ]
  ],
  "a": [
    3
  ],
  "why": "Structure orchestration by dependencies: parallelize independent subtasks and sequence only what truly depends on earlier output."
},
{
  "id": "p5-10",
  "d": 1,
  "s": "Design end-to-end architectures (input → processing → output → feedback loops)",
  "stem": "A K-12 school district wants Claude to draft Individualized Education Program (IEP) goal sections from assessment results and teacher notes. Special-education coordinators must approve every IEP, and parents can contest them. Which end-to-end design is most appropriate?",
  "o": [
    [
      "Let teachers paste any notes they have into a general chat assistant and copy the answer into the IEP document by hand.",
      "No access control, no grounding in assessments, no audit trail and no feedback loop."
    ],
    [
      "Generate drafts with Opus 5.5 at high effort so they are accurate enough that coordinator review can be made optional.",
      "IEPs are legal documents; the approval requirement is policy, not a quality workaround a stronger model removes."
    ],
    [
      "Ingest records through the student information system's API, generate drafts on a schedule and email them directly to parents for comment.",
      "Sending unreviewed drafts to parents skips the required professional approval and exposes errors to families."
    ],
    [
      "Pull data through a scoped tool, draft goals that cite source assessments, require coordinator approval, and log edits for evals.",
      "Correct. It covers controlled input, grounded processing, an approval gate before output, and a feedback path from coordinator edits."
    ]
  ],
  "a": [
    3
  ],
  "why": "A complete design spans scoped input, grounded processing with citations, a human gate before consequential output, and a feedback loop from reviewer edits."
},
{
  "id": "p5-11",
  "d": 1,
  "s": "Align solutions to business value pillars (efficiency, transformation, productivity, cost, performance SLAs)",
  "stem": "An energy trading company's compliance team spends two weeks each quarter assembling regulatory filings from trade data and policies. A Claude workflow could cut this to two days. The CFO asks how to present the value. Which framing is most defensible?",
  "o": [
    [
      "Cost: model API spend is lower than the analysts' salaries, so the project pays for itself on day one.",
      "This compares the wrong things; analysts still review, and the claim ignores build and run costs."
    ],
    [
      "Efficiency: hours saved per filing cycle, error rate versus the manual baseline, and staff time redirected to review.",
      "Correct. It quantifies the realistic gain against a baseline and keeps quality in view instead of claiming savings that won't materialize."
    ],
    [
      "Performance SLA: guarantee that every quarterly filing will be submitted within 24 hours of the quarter closing.",
      "The bottleneck may include data availability and sign-off; promising an SLA the workflow alone can't control is risky."
    ],
    [
      "Transformation: the filing team can be eliminated entirely because the workflow will produce filings on its own going forward.",
      "Filings carry legal liability and still need human sign-off; overclaiming headcount removal undermines credibility."
    ]
  ],
  "a": [
    1
  ],
  "why": "Frame value in the pillar that matches the change, measure it against a baseline, and avoid overclaims like eliminating accountable humans."
},
{
  "id": "p5-12",
  "d": 2,
  "s": "Select appropriate Claude models based on trade-offs",
  "stem": "A telecom classifies 600,000 bill-dispute messages a month into 12 categories. Haiku 5.5 is 96% accurate on simple categories but 81% on 'roaming' and 'promotional credit' disputes, which need reading the plan terms. Sonnet 5.5 is 95% on those but costs far more per call. What configuration fits?",
  "o": [
    [
      "Use Sonnet 5.5 for all messages so accuracy is consistent across categories and only one model needs monitoring.",
      "It pays the higher price on the large majority of messages that Haiku already handles well."
    ],
    [
      "Use Haiku 5.5 for all messages and add a prompt instruction to read plan terms carefully for roaming and credit disputes.",
      "Instructions don't close a capability gap shown on measured evals; accuracy on the hard categories will stay low."
    ],
    [
      "Run both models and keep whichever answer reports higher confidence.",
      "This doubles cost on every call, and self-reported confidence is not a reliable arbiter."
    ],
    [
      "Use Haiku 5.5 by default, routing roaming, promotional-credit and low-confidence cases to Sonnet 5.5.",
      "Correct. Tiered routing spends the larger model's cost only where the evals show it's needed."
    ]
  ],
  "a": [
    3
  ],
  "why": "Choose models per task segment based on measured accuracy, cost and latency. Tiered routing with escalation often beats one model for everything."
},
{
  "id": "p5-13",
  "d": 2,
  "s": "Design system prompts, templates, and guardrails",
  "stem": "A state tax agency's public chatbot explains filing rules. Counsel requires that it never give individualized advice such as 'you should claim this deduction' and that it always link to the governing publication. Testing shows the system prompt alone is followed about 97% of the time. What should the architect add?",
  "o": [
    [
      "Add a disclaimer at the bottom of every answer saying the chatbot doesn't give individualized tax advice.",
      "A disclaimer doesn't stop the advice from being given; it just labels the violation."
    ],
    [
      "Repeat the no-advice rule three times in the system prompt and add 'CRITICAL' before it so the model gives it more weight.",
      "Emphasis may nudge compliance slightly but stays probabilistic; counsel's requirement needs enforcement that can be tested."
    ],
    [
      "Code checks for the required publication link, plus a screen for individualized advice that blocks failures.",
      "Correct. Keep the rule in the prompt, but back it with deterministic checks and a focused screen so violations can't reach the public."
    ],
    [
      "Switch to Opus 5.5, which follows instructions more reliably than smaller models, and re-run the original tests.",
      "A stronger model may raise the rate but can't guarantee it, and nothing enforces the link requirement."
    ]
  ],
  "a": [
    2
  ],
  "why": "System prompts set behavior; hard requirements need guardrails in code: structural checks for things you can verify deterministically and focused screening for the rest."
},
{
  "id": "p5-14",
  "d": 2,
  "s": "Apply prompt engineering techniques (zero-shot, few-shot, chain-of-thought)",
  "stem": "A semiconductor company uses Claude to assign one of 35 defect codes to wafer-inspection notes written by technicians. Zero-shot accuracy is 74%; most errors are between look-alike codes (e.g., 'particle' vs 'residue'), and downstream parsing occasionally breaks on malformed output. Which TWO changes are most effective?",
  "o": [
    [
      "Tell the model it is a senior yield engineer with 20 years of experience classifying defects.",
      "A persona doesn't teach the specific code boundaries causing the errors."
    ],
    [
      "Add few-shot examples contrasting the confusable code pairs, with borderline cases.",
      "Correct. Contrastive examples teach the boundaries the model is getting wrong, which zero-shot descriptions don't convey."
    ],
    [
      "Use structured outputs with an enum of the 35 valid codes.",
      "Correct. Schema-constrained output removes parsing failures and invalid codes deterministically."
    ],
    [
      "Prefill the assistant turn with an opening brace so the model is pushed to start its reply in JSON format.",
      "Assistant prefill is rejected on current models; structured outputs are the supported way to guarantee format."
    ],
    [
      "Force the classification tool with tool_choice set to that tool so the model must always return a code.",
      "Forcing a named tool returns a 400 on current models; use structured outputs or strict tools with auto instead."
    ]
  ],
  "a": [
    1,
    2
  ],
  "why": "Few-shot examples, especially contrastive ones, fix boundary confusion; structured outputs fix format. Prefill and forced tool choice aren't available on current models."
},
{
  "id": "p5-15",
  "d": 2,
  "s": "Optimize context windows and manage token usage",
  "stem": "A retailer's support assistant forgets everything when a customer returns the next day, so the customer has to repeat the order number and the problem. A team member proposes buying a larger context window so Claude 'remembers' returning customers, and also wants the assistant to quote live order status from its memory of earlier chats. What should the architect recommend?",
  "o": [
    [
      "Choose a larger window, since the model retains earlier conversations with customers for as long as they still fit inside it.",
      "The context window resets between calls unless the application manages continuity. A bigger window changes how much fits in one call, not what persists across calls."
    ],
    [
      "Index each customer's order data into the retrieval corpus every night, and let Claude answer status questions from the index.",
      "Retrieval over a snapshot gives stale answers for live state. If an order shipped after the last refresh, the answer is wrong."
    ],
    [
      "Fine-tune on past conversations so the model learns each customer's history.",
      "Fine-tuning doesn't give per-customer continuity, and it doesn't make live order status available. It adds cost without addressing where each kind of information lives."
    ],
    [
      "The application stores a summary of each session and passes it into the next call, and order status comes from a tool call.",
      "Correct. The model has no native memory between calls, so continuity is an application-managed summary or memory layer, and order status is persistent application state that needs a tool call to retrieve."
    ]
  ],
  "a": [
    3
  ],
  "why": "Keep the terms distinct. The context window is the model's active attention space and resets between calls. Retrieval augments it from a corpus. Persistent application state, such as order status, is owned by your system and reached with a tool call. Summaries and memory layers are application-managed continuity: an architectural choice, not a model capability."
},
{
  "id": "p5-16",
  "d": 2,
  "s": "Implement prompt reuse strategies (caching, modular prompts, Skills)",
  "stem": "A payroll SaaS company's support agent must handle withholding and filing rules for 50 US states. Putting all 50 states' rules in the system prompt costs ~90k tokens per request, though a typical conversation touches one or two states. Rules are maintained by a separate tax-content team. What approach fits?",
  "o": [
    [
      "Package each state's rules as a Skill, loaded only when a conversation actually needs that state.",
      "Correct. Skills keep a lightweight index in context and load full content on demand, and the content team can update each one independently."
    ],
    [
      "Keep all 50 states in the system prompt and enable prompt caching so the repeated 90k tokens cost less on each call.",
      "Caching cuts price but still fills most of the context with irrelevant states and can dilute attention on the relevant one."
    ],
    [
      "Fine-tune on all 50 states' rules so no prompt tokens are needed.",
      "Tax rules change every year; retraining for each update is slow, and memorized rules can't be cited or audited."
    ],
    [
      "Ask users which state they are in at the start and build a separate agent deployment for each of the 50 states.",
      "Fifty deployments multiply maintenance, and multi-state employees would need several agents."
    ]
  ],
  "a": [
    0
  ],
  "why": "Use modular, on-demand content (Skills) when a large body of knowledge is only partially relevant to any one request. Caching helps repeated content that is always needed."
},
{
  "id": "p5-17",
  "d": 2,
  "s": "Apply prompt engineering techniques (zero-shot, few-shot, chain-of-thought)",
  "stem": "A gas and electric utility uses Claude to analyze intervenor testimony in rate cases, which requires multi-step reasoning about cost allocation. Answers are often superficial. A developer proposes setting thinking with budget_tokens: 32000. What should the architect recommend on current models?",
  "o": [
    [
      "Enable adaptive thinking and set effort high for these analyses, then compare depth and cost on an eval set.",
      "Correct. Adaptive thinking with an effort setting is the current way to trade cost and latency for reasoning depth."
    ],
    [
      "Use budget_tokens as proposed, since a fixed budget is the most predictable control.",
      "Fixed thinking budgets are the older mechanism; current models use adaptive thinking controlled by effort."
    ],
    [
      "Add 'think step by step' to the user message and turn thinking off so the reasoning is visible in the answer text.",
      "This can help a little but gives up the model's native reasoning, which is better suited to multi-step analysis."
    ],
    [
      "Prefill the assistant turn with 'Let me reason through each cost category:' to force a structured chain of thought.",
      "Assistant prefill is rejected on current models."
    ]
  ],
  "a": [
    0
  ],
  "why": "On current models, extended reasoning is adaptive thinking plus effort, not budget_tokens. Validate the setting against evals because higher effort costs more."
},
{
  "id": "p5-18",
  "d": 2,
  "s": "Design system prompts, templates, and guardrails",
  "stem": "A commercial real-estate firm extracts 40 fields (rent schedule, escalations, renewal options, CAM caps) from leases into its portfolio system. The current prompt asks for JSON, but about 2% of responses have missing keys or prose around the JSON, which breaks the import job. What is the right fix?",
  "o": [
    [
      "Retry failed parses up to three times, then send the lease to manual review.",
      "Retries mask the problem, add latency and cost, and still fail sometimes."
    ],
    [
      "Prefill the assistant turn with an opening brace and the first key so the model continues in valid JSON.",
      "Assistant prefill is rejected on current models."
    ],
    [
      "Force the extraction tool with tool_choice set to the tool name so the model must always call it with arguments.",
      "Forced tool choice returns a 400 on current models."
    ],
    [
      "Define the 40 fields as a JSON schema and use structured outputs (output_config.format) for every lease.",
      "Correct. Structured outputs constrain decoding to the schema, removing missing keys and stray prose deterministically."
    ]
  ],
  "a": [
    3
  ],
  "why": "For guaranteed structure, use structured outputs or strict tool definitions with auto tool choice. Retries treat symptoms; prefill and forced tool choice aren't supported on current models."
},
{
  "id": "p5-19",
  "d": 2,
  "s": "Implement prompt reuse strategies (caching, modular prompts, Skills)",
  "stem": "A transit agency's rider assistant sends each request as: the current timestamp and rider location, then a 6k-token system prompt with fare policies, then 20 tool definitions, then the conversation. Prompt caching is enabled, but the cache hit rate is near zero. What is the most likely fix?",
  "o": [
    [
      "Shorten the fare-policy section so the cacheable portion is smaller and therefore more likely to be reused.",
      "Size isn't the issue. Any change before the cache breakpoint invalidates everything after it."
    ],
    [
      "Put the tools and system prompt first, and the per-request timestamp and location after them.",
      "Correct. Caching matches on an exact prefix. Putting volatile data at the start changes the prefix every time."
    ],
    [
      "Move the 20 tool definitions into the user message so they're no longer part of the cached system prefix.",
      "That makes the tools vary with each turn and does nothing about the timestamp at the front."
    ],
    [
      "Increase the cache TTL so cached prefixes survive between requests.",
      "A longer TTL can't help when the prefix differs on every request; nothing matching is ever stored."
    ]
  ],
  "a": [
    1
  ],
  "why": "Prompt caching reuses exact prefixes. Put static content first and dynamic content after the cache breakpoint."
},
{
  "id": "p5-20",
  "d": 3,
  "s": "Evaluate tool/agent configuration for capability bloat",
  "stem": "A food distributor's ordering agent helps restaurant customers place and change orders. It was built from a shared toolkit and has 40 tools, including price override, credit-limit change, supplier payment and warehouse-transfer tools. Tool-selection errors are rising. What should the architect do?",
  "o": [
    [
      "Rewrite all 40 tool descriptions to be clearer so the model picks the right tool more often in each conversation.",
      "Clearer descriptions help selection but leave financial-control tools reachable by customer traffic."
    ],
    [
      "Add a classifier in front of the agent that blocks messages that seem to ask for price overrides or credit changes.",
      "A classifier is a probabilistic filter around tools that shouldn't be exposed to this agent at all."
    ],
    [
      "Move the agent to Opus 5.5 so it can reason better about which of the 40 tools fits each customer request.",
      "A stronger model doesn't remove the risk or the noise of irrelevant, high-privilege tools."
    ],
    [
      "Limit the agent to the ordering tools its role needs, and keep pricing and credit actions in a staff-only workflow.",
      "Correct. Scoping tools to the role cuts selection errors and removes high-impact capabilities customers should never trigger."
    ]
  ],
  "a": [
    3
  ],
  "why": "Give each agent only the tools its job requires. Fewer tools improve selection accuracy and shrink the blast radius."
},
{
  "id": "p5-21",
  "d": 3,
  "s": "Analyze authentication and authorization requirements to identify security gaps",
  "stem": "A K-12 district's parent-portal assistant answers questions about grades and attendance. It calls the student information system through an MCP server that authenticates with one district-wide service account. In testing, a parent who typed another child's name got that child's attendance. Which TWO changes close the gap?",
  "o": [
    [
      "Log every SIS query made by the assistant so the district can audit cross-family access after the fact.",
      "Logging is useful but detects the breach afterwards; it doesn't prevent it."
    ],
    [
      "Ask the parent to confirm their child's date of birth before the assistant answers any question about a student.",
      "A date of birth is easy to learn and the service account would still return any student's data."
    ],
    [
      "Call the SIS with the signed-in parent's delegated, scoped credentials.",
      "Correct. Authorization should be evaluated against the end user's identity, not a privileged shared account."
    ],
    [
      "Enforce a parent-student link check in the MCP server, failing closed.",
      "Correct. A deterministic relationship check at the data layer blocks cross-family access regardless of what the model asks."
    ],
    [
      "Add a system prompt rule telling the assistant to only discuss the parent's own children and refuse other names.",
      "Prompt instructions can be bypassed or misapplied; access control must be enforced outside the model."
    ]
  ],
  "a": [
    2,
    3
  ],
  "why": "Agents acting for users should carry the user's identity and permissions, and the data layer should enforce authorization deterministically. Prompt rules and audit logs aren't access control."
},
{
  "id": "p5-22",
  "d": 3,
  "s": "Evaluate accuracy-latency trade-offs and justify configuration decisions",
  "stem": "An airline's gate-agent assistant suggests seat reassignments during boarding. Agents abandon it if a suggestion takes longer than 2 seconds. Evals show Opus 5.5 at high effort is 2% more accurate than Sonnet 5.5 at low effort but takes 9 seconds. Every suggestion is confirmed by the agent. What should the architect choose?",
  "o": [
    [
      "Sonnet 5.5 at low effort with the seat map preloaded, documenting the small accuracy trade-off.",
      "Correct. It meets the hard latency budget, the human confirms each suggestion, and the 2% gap is a documented, acceptable trade-off."
    ],
    [
      "Run both and show whichever answer arrives first, then replace it if the slower model disagrees a few seconds later.",
      "Changing a suggestion after the agent has acted causes confusion and doubles cost."
    ],
    [
      "Opus 5.5 at high effort, because accuracy should always take priority over speed in customer-facing airline systems.",
      "A 9-second answer won't be used, so its extra accuracy delivers no value in this workflow."
    ],
    [
      "Opus 5.5 at high effort, streamed so the wait feels shorter.",
      "A seat suggestion is only useful once complete; streaming partial text doesn't help the agent act sooner."
    ]
  ],
  "a": [
    0
  ],
  "why": "Justify configuration against the real constraint. When a human verifies output under a strict latency budget, a faster configuration with slightly lower accuracy is often the right call."
},
{
  "id": "p5-23",
  "d": 3,
  "s": "Analyze observability challenges and select monitoring strategies at scale",
  "stem": "A telecom's support assistant handles 1 million conversations a day. Leadership wants to know weekly whether answer quality is slipping and to be alerted quickly to sudden problems. Human review covers about 300 conversations a week. What monitoring strategy fits?",
  "o": [
    [
      "Alert on operational metrics for all traffic; judge-grade a sample, calibrated by humans.",
      "Correct. Cheap signals cover everything for fast alerting, while sampled judge scoring tracks quality and human review keeps the judge honest."
    ],
    [
      "Run an Opus 5.5 judge on every one of the million daily conversations so no quality issue goes undetected.",
      "Grading everything with the largest model is costly, and an uncalibrated judge can still be wrong at scale."
    ],
    [
      "Use customer thumbs-up/down ratings as the primary quality signal.",
      "Explicit feedback is sparse and biased toward angry users; it is a useful input but not a quality measure on its own."
    ],
    [
      "Have the support team read as many conversations as they can and report anything unusual in a weekly meeting.",
      "300 ad hoc reads out of 7 million a week can't detect trends or segment-level problems reliably."
    ]
  ],
  "a": [
    0
  ],
  "why": "At scale, combine full-coverage operational metrics with sampled automated grading, calibrated by a small amount of human review."
},
{
  "id": "p5-24",
  "d": 3,
  "s": "Design a RAG pipeline with appropriate chunking and indexing strategies",
  "stem": "A utility is building RAG over 4,000 engineering standards and outage procedures. Documents have numbered sections and tables of clearances, and several revisions of each standard are in force for different service territories. Fixed 500-token chunks return outdated revisions and split tables. What indexing approach fits?",
  "o": [
    [
      "Increase the chunk size to 2,000 tokens so tables and their surrounding sections usually end up in the same chunk.",
      "Bigger chunks dilute relevance and still split some tables; they do nothing about revision mix-ups."
    ],
    [
      "Re-embed the corpus with a newer embedding model that captures numeric and tabular content more accurately.",
      "Better embeddings don't tell retrieval which revision applies to which territory."
    ],
    [
      "Add an instruction telling the model to always prefer the most recent revision of any standard it retrieves.",
      "The newest revision isn't always the one in force for a territory, and the model can't see what wasn't retrieved."
    ],
    [
      "Chunk by section, keep tables whole, and index revision, effective date and territory as metadata for filtering.",
      "Correct. Structure-aware chunks preserve meaning, and metadata filters retrieve the revision that applies."
    ]
  ],
  "a": [
    3
  ],
  "why": "Chunk along the document's own structure, keep tables intact, and attach metadata like version and applicability so retrieval can filter, not just rank."
},
{
  "id": "p5-25",
  "d": 3,
  "s": "Apply retrieval strategies matched to data shape and query pattern",
  "stem": "A payroll SaaS vendor's customer assistant gets questions like 'How many employees in Ohio had overtime last quarter?' and 'What was our total 401(k) match in March?'. The current design embeds payroll exports into a vector store, and totals are frequently wrong. What should change?",
  "o": [
    [
      "Switch to Opus 5.5 so arithmetic over the retrieved rows is more reliable when it adds up the totals.",
      "The error comes from incomplete retrieval, not arithmetic; a stronger model can't add rows it never saw."
    ],
    [
      "Give it a read-only, tenant-scoped query tool that computes aggregates in the database.",
      "Correct. Aggregations over structured records need a query engine; semantic search returns similar rows, not correct totals."
    ],
    [
      "Re-chunk the exports so each chunk holds a full month of one tenant's payroll, which keeps related rows together.",
      "Larger chunks still leave the model summing numbers from text, and many queries span months."
    ],
    [
      "Add a reranker so the most relevant payroll rows rank first.",
      "Reranking improves ranking, but a total requires all matching rows, not the most similar few."
    ]
  ],
  "a": [
    1
  ],
  "why": "Match retrieval to data shape: structured, aggregate questions go to a query tool; semantic search is for unstructured text."
},
{
  "id": "p5-26",
  "d": 3,
  "s": "Evaluate connection protocols and select the appropriate integration mechanism (MCP, API/CLI, agent-to-agent)",
  "stem": "A chip-design team wants Claude Code to run the company's internal EDA command-line tools (lint, timing reports) during development. Separately, three production agents across the company need the same design-rule database with consistent permissions. Which integration choices fit?",
  "o": [
    [
      "Have each production agent query the design-rule database through Claude Code sessions running on a shared server.",
      "Routing production agents through developer sessions adds latency and fragility and blurs access control."
    ],
    [
      "Use an agent-to-agent protocol for both, so a dedicated EDA agent serves lint, timing and design-rule requests.",
      "Agent-to-agent delegation adds a model hop where plain tool or data access is all that's needed."
    ],
    [
      "Build an MCP server for the EDA CLIs; agents call the database API directly.",
      "This is reversed: the CLI tools already work from Claude Code, while the shared database is where a reusable, permissioned integration pays off."
    ],
    [
      "Claude Code runs the EDA CLIs directly; the agents share one MCP server for the database.",
      "Correct. Existing CLIs are simplest for a developer tool, and MCP gives several agents one consistent, permissioned interface."
    ]
  ],
  "a": [
    3
  ],
  "why": "Use direct CLI/API for single-client or scripted use, MCP when multiple AI clients share a capability, and agent-to-agent only when delegating to an autonomous agent."
},
{
  "id": "p5-27",
  "d": 3,
  "s": "Evaluate progressive discovery vs. monolithic context strategy",
  "stem": "A state revenue department's staff assistant must answer questions about any of 2,000 tax forms and their instructions. The team proposes loading all form instructions into a 1M-token context on every request. What is the better strategy?",
  "o": [
    [
      "Load only the 50 most-used forms and tell the assistant to refuse questions about the remaining forms.",
      "This drops coverage for the long tail that staff often find hardest."
    ],
    [
      "Fine-tune on the instructions and refresh each season.",
      "Forms change yearly; a fine-tuned model can't cite current text and is costly to keep updated."
    ],
    [
      "Give it a form index and a tool to fetch one form's instructions on demand.",
      "Correct. Progressive discovery keeps context small and relevant while reaching all 2,000 forms on demand."
    ],
    [
      "Load all instructions, since a 1M-token window can hold them and the model will find what it needs in context.",
      "Even if they fit, every request pays for all 2,000 forms, latency rises, and relevant text is diluted."
    ]
  ],
  "a": [
    2
  ],
  "why": "When a corpus is large and each request needs a small part of it, an index plus on-demand loading beats putting everything in context."
},
{
  "id": "p5-28",
  "d": 3,
  "s": "Design a RAG pipeline with appropriate chunking and indexing strategies",
  "stem": "A law firm builds RAG over 8,000 master services agreements. Clauses depend on their position: a sentence such as 'liability is capped at the amount in Section 12.1' means little without its section, and attorneys ask questions at the level of a clause, a section, or a whole agreement. Early testing returns clauses that are accurate but missing the context needed to answer. Which chunking approach fits?",
  "o": [
    [
      "Fixed-size chunks of about 500 tokens with overlap, since the simplest approach is the easiest to operate.",
      "Fixed-size splitting ignores structure. It suits homogeneous, unstructured text and cuts agreements across clause and section boundaries."
    ],
    [
      "Semantic chunking on topic shifts, so every chunk is a self-contained passage.",
      "Semantic splitting reduces mid-idea cuts in prose, but it doesn't preserve a contract's section hierarchy or let the system retrieve at the level that fits the question."
    ],
    [
      "One very large chunk per agreement, so every clause arrives with all of its context.",
      "Whole-agreement chunks retrieve poorly for clause-level questions and spend most of the context window on irrelevant text."
    ],
    [
      "Hierarchical chunking that keeps sections and subsections, retrieving at the level the question needs.",
      "Correct. For structured documents such as contracts, manuals and policies, where section context carries meaning, preserving the hierarchy and retrieving at the fitting level answers both clause and section questions."
    ]
  ],
  "a": [
    3
  ],
  "why": "Choose chunking by the structure of the source material, not by a default size. Fixed-size fits homogeneous unstructured text, semantic suits prose that must be self-contained, and hierarchical fits structured documents where section context carries meaning."
},
{
  "id": "p5-29",
  "d": 3,
  "s": "Evaluate connection protocols and select the appropriate integration mechanism (MCP, API/CLI, agent-to-agent)",
  "stem": "A regional transit agency's trip-planning agent must coordinate with a neighboring city's independently operated transit agent to plan cross-border journeys. The partner's agent decides its own routing and fares, and the partner won't expose its internal databases. What integration mechanism fits?",
  "o": [
    [
      "Load the partner's published timetable PDF into the system prompt so the agency's agent can plan both legs itself.",
      "Static timetables miss real-time changes and the partner's fare rules, and they bloat every request."
    ],
    [
      "Ask the partner for direct read access to its scheduling database.",
      "The partner has declined to expose internals, and direct access would bypass its own routing and fare logic."
    ],
    [
      "Use an agent-to-agent protocol to delegate the cross-border leg to the partner's agent.",
      "Correct. The partner runs an autonomous agent that owns its decisions, so delegating a task to it is the natural boundary."
    ],
    [
      "Scrape the partner's public trip-planner website on each request and pass the HTML to Claude to interpret.",
      "Scraping is brittle, slow and likely against the partner's terms, and it ignores the agent they offer."
    ]
  ],
  "a": [
    2
  ],
  "why": "Agent-to-agent protocols fit when another organization runs an autonomous agent that owns its domain. MCP and APIs fit when you need tools or data you're allowed to access directly."
},
{
  "id": "p5-30",
  "d": 3,
  "s": "Evaluate tool/agent configuration for capability bloat",
  "stem": "A beverage maker's recall-response agent gathers lot data and drafts notices. Its tools include read access to the ERP, write access to inventory holds, bulk email to all retailers, and the ability to post on the public website. A tabletop exercise showed it could email every retailer about the wrong lot. What should change?",
  "o": [
    [
      "Lower the model temperature so the agent is less likely to make mistakes with lot numbers and recipient lists.",
      "Lower randomness doesn't make wrong lot selection impossible or add an approval step."
    ],
    [
      "Remove all write tools so the agent can only answer lot questions.",
      "This throws away the value; drafting and proposing actions is safe when execution is gated."
    ],
    [
      "Keep read and drafting tools; holds, emails and posts need coordinator approval in code.",
      "Correct. The agent still does the research and drafting, but irreversible, high-impact actions require explicit human approval."
    ],
    [
      "Add a final self-check step where the agent re-reads the lot numbers before sending any email or posting to the website.",
      "A self-check by the same model is still probabilistic and leaves high-impact actions fully autonomous."
    ]
  ],
  "a": [
    2
  ],
  "why": "Separate proposing from executing. Keep capabilities that create value and gate irreversible or broad-impact actions behind code-enforced human approval."
},
{
  "id": "p5-31",
  "d": 3,
  "s": "Analyze authentication and authorization requirements to identify security gaps",
  "stem": "A utility gives field crews a tablet assistant that can read work orders and close them in the asset system. To work in areas with poor coverage, the app stores a 90-day API key with full asset-system rights on each tablet. A tablet was stolen last month. What is the main gap to fix?",
  "o": [
    [
      "Issue short-lived, revocable tokens bound to the crew member and their work orders.",
      "Correct. User-bound, narrowly scoped, short-lived credentials limit what a stolen device can do and for how long."
    ],
    [
      "Add a system prompt instruction that the assistant must only close work orders assigned to the current crew.",
      "The key itself grants full rights; anyone with it can call the API without going through the assistant."
    ],
    [
      "Log every work-order closure and review the logs weekly.",
      "Weekly review detects misuse long after damage is done and doesn't reduce what the key can access."
    ],
    [
      "Encrypt the API key on disk and require a PIN to open the app, keeping the same 90-day key for offline work.",
      "Encryption and a PIN help, but a long-lived, over-privileged key is still exposed if the device or PIN is compromised."
    ]
  ],
  "a": [
    0
  ],
  "why": "Credentials for agents should be bound to the acting user, scoped to the task and short-lived. Prompt rules and after-the-fact logging don't constrain a leaked key."
},
{
  "id": "p5-32",
  "d": 4,
  "s": "Define evaluation metrics (accuracy, latency, cost, safety, security)",
  "stem": "An airline is launching a Claude assistant that handles refund and compensation requests under its contract of carriage and consumer-protection rules. The project's only acceptance metric so far is 'customer satisfaction score above 4.2'. Which metric set should the architect add before launch?",
  "o": [
    [
      "Satisfaction score broken down by route and fare class, plus the number of conversations handled per agent per day.",
      "Satisfaction can be high precisely when the assistant over-grants refunds; volume adds no view of correctness or safety."
    ],
    [
      "Policy-correct decision rate, rate of commitments outside policy, p95 latency, and cost per resolved request, all segmented by route.",
      "Correct. It covers accuracy, the key safety risk (unauthorized commitments), user-facing latency and unit cost."
    ],
    [
      "Average response length and readability score, since clear answers drive satisfaction for travelers in disruption.",
      "Style metrics say nothing about whether the refund decision was right or within policy."
    ],
    [
      "Model perplexity on airline policy documents and the total token count consumed per month across all traffic.",
      "Perplexity isn't a task metric, and total tokens doesn't reflect per-resolution cost or correctness."
    ]
  ],
  "a": [
    1
  ],
  "why": "Acceptance metrics should cover task accuracy, the specific safety risk, latency at the percentile users feel, and unit cost. Satisfaction alone can reward the wrong behavior."
},
{
  "id": "p5-33",
  "d": 4,
  "s": "Design evaluation datasets and test frameworks using mixed methodologies",
  "stem": "A K-12 district is evaluating a math tutoring assistant for grades 3–8. It must give correct hints, not reveal final answers, and pitch explanations at grade level. The team has 50 questions written by one developer and plans to grade with an LLM judge. Which TWO improvements matter most?",
  "o": [
    [
      "Switch the judge to Opus 5.5 at high effort, since a stronger judge removes the need for any human calibration.",
      "Judge strength doesn't guarantee its ratings match teachers' standards; calibration is still required."
    ],
    [
      "Grow the original 50 questions to 500 by asking Claude to paraphrase each one ten times in different words.",
      "Paraphrases add volume but not coverage; the set still reflects one developer's view of what students ask."
    ],
    [
      "Report a single average score across all questions so the school board gets one simple number to approve.",
      "A single average hides failures in specific grades or the answer-leak behavior that matters most."
    ],
    [
      "Stratify real student questions by grade and topic, including answer-extraction attempts.",
      "Correct. Coverage of real inputs and adversarial cases across grades is what makes results meaningful."
    ],
    [
      "Use code checks for answer leaks and calibrate the judge against teacher ratings.",
      "Correct. Mix deterministic checks with a judge whose subjective ratings are validated against expert humans."
    ]
  ],
  "a": [
    3,
    4
  ],
  "why": "Good eval frameworks combine representative and adversarial data with mixed graders: code checks for objective criteria and calibrated LLM or human judgment for subjective ones."
},
{
  "id": "p5-34",
  "d": 4,
  "s": "Conduct A/B testing and iterative improvements",
  "stem": "A telecom ran a one-week test of a new retention prompt. The team looked at several metrics afterward and found that variant B improved the 'offer accepted' rate, while its cost per conversation was higher. They propose declaring B the winner on acceptance. Which flaw most undermines the conclusion?",
  "o": [
    [
      "The test ran for only one week rather than a full month, which is too short for any retention result to be trusted.",
      "Duration matters only relative to the sample needed. A week could be enough if the sample was calculated, and the described flaw is more basic."
    ],
    [
      "Variant B should have been compared with a second variant C rather than with the current prompt, to isolate the effect.",
      "A control group running the current version is the standard comparison. A third variant isn't required."
    ],
    [
      "Responses come from a probabilistic model, so A/B testing of LLM prompts is unreliable in principle and shouldn't be used.",
      "Probabilistic output makes results noisier and calls for larger samples, but a well-structured test is still valid."
    ],
    [
      "No hypothesis or primary metric was fixed before the run, so picking the metric afterward is outcome-shopping.",
      "Correct. Without a pre-stated hypothesis, treatment, metric, threshold and constraint, any result that moved in a good direction can be read as a win, and the experiment becomes a retrospective correlation."
    ]
  ],
  "a": [
    3
  ],
  "why": "A structured test names a specific, falsifiable hypothesis with the treatment, the expected direction of the primary metric, a threshold and a constraint such as cost or latency. It also fixes the primary metric before the run and calculates the sample size from the minimum detectable effect, the baseline and the confidence level. Choosing the metric afterward is outcome-shopping."
},
{
  "id": "p5-35",
  "d": 4,
  "s": "Diagnose system issues (prompt failure, hallucinations, model mismatch)",
  "stem": "A tax agency's staff assistant sometimes cites form line numbers that don't exist on the current year's form (e.g., 'Line 27b'). Traces show retrieval returned the correct form, but the answer cites a line from a prior-year version the model seems to remember. What is the best fix?",
  "o": [
    [
      "Require citing only lines in the retrieved form, and verify citations in code.",
      "Correct. Grounding in the retrieved text plus a deterministic check stops answers drawn from memory."
    ],
    [
      "Lower the temperature to zero so the model gives the same line number every time it answers this question.",
      "Consistent output can be consistently wrong; temperature doesn't anchor answers to retrieved text."
    ],
    [
      "Retrieve the five prior years of the form as well, so the model can see how line numbers changed over time.",
      "More versions in context increases the chance of citing the wrong year."
    ],
    [
      "Switch to a larger model that has memorized more forms.",
      "Memorized knowledge is exactly the problem; a newer model still has stale or wrong form layouts."
    ]
  ],
  "a": [
    0
  ],
  "why": "When retrieval is right but answers aren't, the model is drawing on parametric memory. Require grounding in provided sources and verify citations programmatically."
},
{
  "id": "p5-36",
  "d": 4,
  "s": "Diagnose system issues (prompt failure, hallucinations, model mismatch)",
  "stem": "A payroll SaaS company's support assistant suddenly starts giving answers without the required 'consult your tax advisor' note on about 30% of tax questions. No model change was made. A developer edited the shared prompt template the same week, and prompts aren't versioned. What should the architect do first?",
  "o": [
    [
      "Add the note to the template three more times in capitals so the model can't miss it in future answers.",
      "This guesses at a cause without confirming it and makes the template harder to maintain."
    ],
    [
      "Switch to Opus 5.5 to see whether the stronger model includes the note more reliably than the current one.",
      "No model changed; swapping models adds a new variable before the actual change is understood."
    ],
    [
      "Diff the old and new templates, run evals on both, and version templates.",
      "Correct. Compare the known-good and current versions on evals to isolate the cause, then prevent untracked changes."
    ],
    [
      "Add a post-processing step that appends the advisor note to every answer about any topic.",
      "This hides the symptom, adds the note where it doesn't belong, and leaves the regression unexplained."
    ]
  ],
  "a": [
    2
  ],
  "why": "Diagnose regressions by isolating what changed and testing it on evals. Version prompts like code so changes are traceable and reversible."
},
{
  "id": "p5-37",
  "d": 4,
  "s": "Optimize token usage, latency, and cost-performance trade-offs",
  "stem": "A property-management company runs a nightly job that drafts renewal-offer letters for 30,000 leases. Each request includes the tenant's full 10-year payment and maintenance history (~25k tokens), although the letter template only uses the last 12 months and a rent figure. Nobody needs the letters before morning. Which change cuts cost most without hurting quality?",
  "o": [
    [
      "Summarize each tenant's 10-year history with Claude first, then pass the summary into the letter-drafting call.",
      "An extra call over the full history adds cost and latency to produce context the letters don't need."
    ],
    [
      "Send only the last 12 months and the rent inputs, and run the job through the Message Batches API.",
      "Correct. Trimming context to what the task uses removes most tokens, and batch pricing fits a job with no real-time need."
    ],
    [
      "Keep the full history but switch to the cheaper Haiku 5.5.",
      "The bulk of the spend is unused context; a model change may also reduce letter quality without addressing that waste."
    ],
    [
      "Enable prompt caching on the tenant history so repeated reads of the same lease are cheaper on each run.",
      "Each lease's history is read once per night, so there is little reuse to cache, and the tokens are still unnecessary."
    ]
  ],
  "a": [
    1
  ],
  "why": "The cheapest token is the one you don't send. Fit context to the task, and use batch processing for latency-tolerant workloads."
},
{
  "id": "p5-38",
  "d": 4,
  "s": "Diagnose system issues (prompt failure, hallucinations, model mismatch)",
  "stem": "A semiconductor fab's failure-analysis assistant drafts reports from a prompt template filled with each lot's tool history and inspection data. Since Tuesday, drafts cite equipment IDs that don't exist and read generically, though no model or prompt text changed. Tuesday's data-platform release renamed several fields. What should the team do?",
  "o": [
    [
      "Compare rendered prompts in traces before and after Tuesday, then fail closed when a required template variable renders empty.",
      "Correct. The renamed fields most likely left the tool-history variable blank, so the model improvised. Rendered-prompt traces confirm it, and a render-time check stops recurrence."
    ],
    [
      "Lower the temperature to zero so the drafts stop varying and the invented equipment IDs become easier to spot.",
      "Deterministic output from an empty input is still wrong; temperature doesn't restore the missing data."
    ],
    [
      "Move to Opus 5.5, since inventing equipment IDs suggests the current model can't handle the reasoning these reports need.",
      "Nothing about the model changed, and a stronger model given empty inputs will still fill gaps with plausible detail."
    ],
    [
      "Add an instruction telling the model never to mention equipment IDs that it can't verify from the lot data.",
      "This treats the symptom. The model has no lot data to verify against, so drafts would just become emptier."
    ]
  ],
  "a": [
    0
  ],
  "why": "When output degrades with no model or prompt change, inspect the fully rendered prompt. Upstream data changes can silently empty template variables, and the model fills the gap with plausible inventions. Validate required inputs before calling the model."
},
{
  "id": "p5-39",
  "d": 4,
  "s": "Monitor system performance using logging and observability tools",
  "stem": "A transit agency's trip-planning assistant uses five tools. After the agency changed its GTFS feed format, riders started getting 'no routes found' for some trips, but the overall error dashboard stayed green because the model replied politely instead of failing. What monitoring change would have caught this?",
  "o": [
    [
      "Lower the alert threshold on the overall HTTP 5xx error rate so that smaller error spikes are noticed sooner.",
      "The requests succeeded at the HTTP level; the failure was in tool results, which this metric never sees."
    ],
    [
      "Ask riders to rate each answer and alert if the weekly average rating falls below a set target for the agency.",
      "Ratings are slow and sparse; a broken feed affects riders for days before a weekly average moves."
    ],
    [
      "Log every conversation so engineers can search transcripts.",
      "Raw logs help investigations but don't alert anyone; this still depends on complaints arriving first."
    ],
    [
      "Alert on per-tool error and empty-result rates, not just overall errors.",
      "Correct. Tool-level metrics surface a broken dependency even when the model gracefully covers it in conversation."
    ]
  ],
  "a": [
    3
  ],
  "why": "Monitor each component, not just end-to-end success. Agents mask tool failures with fluent text, so tool error and empty-result rates need their own metrics and alerts."
},
{
  "id": "p5-40",
  "d": 4,
  "s": "Optimize token usage, latency, and cost-performance trade-offs",
  "stem": "A utility's customer assistant answers 'Why is my bill so high?'. It calls usage history, rate plan, weather and billing-adjustment tools one after another, then writes a long explanation. Median response time is 14 seconds and customers abandon the chat. Which TWO changes reduce perceived and actual latency without lowering quality?",
  "o": [
    [
      "Stream the explanation so customers see text as soon as generation starts.",
      "Correct. Streaming cuts time-to-first-token, which is what users perceive as responsiveness."
    ],
    [
      "Switch to Opus 5.5 at high effort so the explanation is right the first time and customers don't ask follow-up questions.",
      "A larger model at high effort is slower per response, making the abandonment problem worse."
    ],
    [
      "Drop the weather and adjustment tools to save two calls, since most customers only want to see their usage history.",
      "Weather and adjustments often explain high bills; removing them lowers answer quality."
    ],
    [
      "Add a retry with exponential backoff to each tool call so occasional slow responses are retried automatically.",
      "Retries add time on slow calls; they don't change the sequential structure that causes the delay."
    ],
    [
      "Allow the four independent lookups to run as parallel tool calls instead of one at a time.",
      "Correct. The lookups don't depend on each other, so running them in parallel removes most of the sequential wait."
    ]
  ],
  "a": [
    0,
    4
  ],
  "why": "Parallelize independent tool calls and stream output. Both cut latency without trading away the information that makes the answer correct."
},
{
  "id": "p5-41",
  "d": 4,
  "s": "Optimize token usage, latency, and cost-performance trade-offs",
  "stem": "A proof of concept for an invoice-dispute assistant worked well on 50 hand-picked cases. The team now plans to commit to the architecture and launch at 200,000 disputes a month. Which TWO actions should come before the commitment?",
  "o": [
    [
      "Estimate cost and latency at production volume, not from the proof of concept's sample runs.",
      "Correct. A design that works on 50 cases can break a budget or an SLA at scale, so the production-volume estimate has to come before the architecture is committed."
    ],
    [
      "Move the assistant to the largest model, since quality problems at scale are best prevented by capability.",
      "The largest model raises cost and latency and may breach a budget. Model choice should follow the estimate and the evals."
    ],
    [
      "Build retries, fallback chains and circuit breakers into the initial design.",
      "Correct. Provider errors, rate limits and slow dependencies show up at volume, and adding failure handling after launch is more expensive than designing it in."
    ],
    [
      "Plan to add logging and fallback behavior after launch, once real failures show what is needed.",
      "Failure handling added after the first incident is more costly than designing it in, and it leaves the first failures unhandled."
    ]
  ],
  "a": [
    0,
    2
  ],
  "why": "Moving from proof of concept to production means estimating cost and latency at production volume before committing to the architecture, building retries, fallback chains and circuit breakers into the first design, and naming the failure mode specific to the architecture type with a documented mitigation."
},
{
  "id": "p5-42",
  "d": 5,
  "s": "Implement guardrails and safety controls",
  "stem": "A utility's collections agent can schedule service disconnections for overdue accounts. Some customers are on a medical-baseline program (life-support equipment), and state rules bar disconnection during extreme heat advisories. The current safeguard is a paragraph in the system prompt. What should the architect implement?",
  "o": [
    [
      "A classifier that reviews the agent's reasoning and alerts a supervisor if it seems about to disconnect a protected customer.",
      "Monitoring reasoning is indirect and probabilistic; the action itself must be blocked."
    ],
    [
      "Daily reports of disconnections so compliance can reconnect any protected customers who were disconnected in error.",
      "Restoring service after the fact doesn't undo the harm to someone on life support."
    ],
    [
      "A stronger system prompt that lists every protected situation and tells the agent never to disconnect in those cases.",
      "A prompt rule is still probabilistic, and a single error here can endanger life and break state law."
    ],
    [
      "Blocking checks in the disconnection tool, plus human approval for each disconnection.",
      "Correct. Code-enforced eligibility checks fail closed, and a human confirms each irreversible, high-harm action."
    ]
  ],
  "a": [
    3
  ],
  "why": "For irreversible, high-harm actions, enforce rules in the tool layer with fail-closed checks and require human approval. Prompts and monitoring complement, not replace, hard controls."
},
{
  "id": "p5-43",
  "d": 5,
  "s": "Ensure compliance with regulations (e.g., GDPR, HIPAA, FedRAMP)",
  "stem": "A US school district wants a Claude-based homework helper for students aged 8–17, connected to the student information system. Counsel flags FERPA (student education records) and COPPA (children under 13). Which TWO design decisions best support compliance?",
  "o": [
    [
      "Ask each student to check a box confirming they are over 13 before using the helper for the first time.",
      "Self-attestation by children isn't verifiable and doesn't satisfy consent requirements."
    ],
    [
      "Include each student's full record in every request so answers are personalized and data is never stored separately.",
      "Sending full records maximizes exposure; personalization doesn't justify data the task doesn't need."
    ],
    [
      "Add a system prompt rule telling the helper never to repeat a student's personal information in its answers.",
      "Output wording doesn't address what data is collected, shared or retained, which is what the laws regulate."
    ],
    [
      "Minimize student data sent and govern its use and retention by agreement.",
      "Correct. Data minimization plus contractual controls on how records are used and retained are core to FERPA-aligned deployments."
    ],
    [
      "Obtain verifiable parental consent for under-13s, with parental review and deletion.",
      "Correct. COPPA requires parental consent and parental rights over children's data."
    ]
  ],
  "a": [
    3,
    4
  ],
  "why": "Compliance is mostly about data flows: collect and share the minimum, govern retention by agreement, and implement required consent and access rights. Prompt rules don't change data handling."
},
{
  "id": "p5-44",
  "d": 5,
  "s": "Address ethical AI considerations (bias, fairness, transparency)",
  "stem": "An airline uses Claude to pre-assess delay-compensation claims before an agent decides. An audit finds that claims written in Spanish or Tagalog are recommended for denial more often than English claims with similar facts. What should the architect do?",
  "o": [
    [
      "Tell the model in the system prompt to treat all languages equally and not to let language affect its recommendation.",
      "An instruction doesn't show whether the disparity is fixed; without measurement the bias may persist."
    ],
    [
      "Accept claims only in English so all are assessed alike.",
      "This excludes passengers and shifts the unfairness rather than removing it."
    ],
    [
      "Measure the gap with paired cross-language cases, fix it, and gate releases on it.",
      "Correct. Counterfactual testing quantifies the bias, guides the fix, and keeps it from coming back."
    ],
    [
      "Let agents ignore the recommendation for non-English claims, so they decide those claims entirely without AI help.",
      "This hides the problem for some users and gives them a worse, slower process instead of a fair one."
    ]
  ],
  "a": [
    2
  ],
  "why": "Address bias with measurement: counterfactual pairs that vary only the sensitive attribute, a fix tied to the cause, and a regression gate so it stays fixed."
},
{
  "id": "p5-45",
  "d": 5,
  "s": "Ensure compliance with regulations (e.g., GDPR, HIPAA, FedRAMP)",
  "stem": "A federal tax-administration office wants to use Claude to help examiners summarize taxpayer correspondence. Its security office requires that the service operate within a FedRAMP High authorized boundary. What should the architect do?",
  "o": [
    [
      "Host an open-weight model on agency servers instead, because any self-hosted model is automatically FedRAMP compliant.",
      "Self-hosting doesn't confer authorization, and it changes the solution rather than meeting the requirement with Claude."
    ],
    [
      "Use the public API with a signed BAA, since a business associate agreement covers federal data protection requirements.",
      "A BAA is a HIPAA instrument; it doesn't establish a FedRAMP authorization."
    ],
    [
      "Use Claude via a FedRAMP High authorized cloud region, keeping all data flows inside it.",
      "Correct. Use a deployment path with the required authorization and design every data flow, including logs, to stay in scope."
    ],
    [
      "Redact taxpayer names, removing the need for FedRAMP.",
      "Redaction lowers risk but doesn't satisfy an authorization requirement set for the system handling the data."
    ]
  ],
  "a": [
    2
  ],
  "why": "Regulatory requirements dictate the deployment path. Choose a platform and region with the required authorization and keep all data flows within the authorized boundary."
},
{
  "id": "p5-46",
  "d": 5,
  "s": "Ensure compliance with regulations (e.g., GDPR, HIPAA, FedRAMP)",
  "stem": "A payroll and HR SaaS vendor is adding a Claude assistant that answers employees' questions about their own pay and leave. Many customers are in the EU. The current design logs every conversation, including salary details, to a US analytics store indefinitely. What should change?",
  "o": [
    [
      "Stop all logging, including the audit trail.",
      "Removing logs eliminates debugging and audit capability; GDPR asks for proportionate handling, not none."
    ],
    [
      "Limit purpose and retention, minimize fields, keep EU data in-region, honor erasure.",
      "Correct. Purpose limitation, minimization, residency and data-subject rights are the core GDPR obligations here."
    ],
    [
      "Keep the logs but add a privacy notice telling EU employees their conversations are stored for product improvement.",
      "A notice doesn't provide a lawful basis for indefinite retention or address cross-border transfer requirements."
    ],
    [
      "Anonymize the employee names in logs but keep salary figures and the indefinite retention for trend analysis.",
      "Salary plus context often re-identifies people; this remains personal data with no retention limit."
    ]
  ],
  "a": [
    1
  ],
  "why": "GDPR compliance for AI features comes down to data handling: purpose, minimization, retention limits, lawful transfers and data-subject rights."
},
{
  "id": "p5-47",
  "d": 5,
  "s": "Implement guardrails and safety controls",
  "stem": "A telecom's billing assistant can apply account credits through a tool. The team's safety plan says: 'Claude is trained to behave safely, and our system prompt forbids credits above $50 without supervisor approval, so we're covered.' What is the gap in this plan?",
  "o": [
    [
      "Training doesn't cover this company's policy and a prompt instruction isn't enforcement, so the limit needs tool-call authorization.",
      "Correct. No layer enforces the rule: trained behavior never saw the policy, and a system-prompt instruction can be talked around by adversarial or unusual input. Authorization decides whether this caller may take this action in this context."
    ],
    [
      "The system prompt isn't long enough, so it should restate the $50 rule several times, each time with stronger wording and an example.",
      "Restating an instruction doesn't turn it into enforcement. Unusual input can still talk the model out of it."
    ],
    [
      "Only input screening is missing, so adding a classifier on user messages closes the gap.",
      "Input screening answers whether a request should reach the model. It doesn't authorize an action with a side effect."
    ],
    [
      "Only output screening is missing, so screening the text of responses for credit approvals closes the gap.",
      "Output screening judges generated content. A credit applied through a tool is an action with a side effect that screening doesn't authorize."
    ]
  ],
  "a": [
    0
  ],
  "why": "Safety is a stack of layers, not a setting. Trained behavior is Anthropic's and doesn't cover your domain policy. System-prompt instructions steer but don't enforce. Runtime screening checks content, not side-effecting actions. A rule that no layer holds is the dangerous silent failure, and deterministic authorization is the layer that holds this one."
},
{
  "id": "p5-48",
  "d": 5,
  "s": "Apply human-in-the-loop validation strategies",
  "stem": "A real-estate lender uses Claude to draft property valuation reviews. Appraisers can't review all 3,000 monthly drafts in depth. Errors on large loans are costly and errors on unusual properties (rural, mixed-use) are common. How should human review be allocated?",
  "o": [
    [
      "Review a random 10% of drafts each month so the review load is fair and predictable for the appraisal team.",
      "Random sampling treats a $40M mixed-use loan like a routine condo and spends review where risk is lowest."
    ],
    [
      "Fully review large-loan, unusual and low-confidence drafts; spot-check the rest.",
      "Correct. Review effort follows the cost of an error and the likelihood of one, with sampling to watch routine cases."
    ],
    [
      "Review every draft, capped at two minutes each.",
      "Two-minute reviews of everything become rubber-stamping, especially on the complex cases that need time."
    ],
    [
      "Skip human review for drafts where Claude reports high confidence, regardless of loan size or property type.",
      "Self-reported confidence alone isn't reliable, and large-loan errors are too costly to leave unchecked."
    ]
  ],
  "a": [
    1
  ],
  "why": "Allocate human review by consequence and uncertainty: route high-cost, unusual and low-confidence cases to full review and sample the rest to detect drift."
},
{
  "id": "p5-49",
  "d": 5,
  "s": "Ensure compliance with regulations (e.g., GDPR, HIPAA, FedRAMP)",
  "stem": "A hospital group is deploying a Claude assistant that touches protected health information. In the security review, the architect's design document states that the deployment is HIPAA-ready and that a business associate agreement is in place. The reviewer replies that this is a claim, not proof. What should the architect add?",
  "o": [
    [
      "A control register mapping each obligation to a technical control, a named owner and an evidence artifact, such as the signed agreement.",
      "Correct. Obligations become a specific control, an owner and a living evidence artifact the reviewer accepts as proof the control is live. A control named in a design document with no artifact is only a claim."
    ],
    [
      "A longer narrative section in the design document that explains in detail how each safeguard works, how it was designed, and why the team chose it.",
      "More narrative is still assertion. The reviewer asked for proof that each control is live."
    ],
    [
      "A statement from the delivery team confirming that it follows the organization's security policy and the applicable regulations.",
      "A general statement doesn't map any obligation to a control, an owner or evidence."
    ],
    [
      "A plan to gather the evidence if and when an auditor asks for it, rather than keeping it current in the meantime.",
      "A control with no owner and no evidence eventually goes non-operational and fails at the audit. Evidence has to exist and be revalidated over time."
    ]
  ],
  "a": [
    0
  ],
  "why": "A regulation states an outcome and leaves the control to you. Turn each obligation into a specific control, a named owner and a living evidence artifact, held together in a control register. What a reviewer accepts is proof the control is live, not the control itself."
},
{
  "id": "p5-50",
  "d": 5,
  "s": "Identify risks, limitations, and failure modes of LLM systems",
  "stem": "A city's public complaint portal uses Claude to draft replies. Over a weekend, a few users submit messages padded to enormous length. Spend triples, and some legitimate drafts come back truncated. Which risk category is this, and what control addresses it?",
  "o": [
    [
      "Direct prompt injection, addressed by a system-prompt instruction telling the model to ignore any unusually long messages it receives.",
      "Nothing here overrides the system's instructions. The problem is the size of the inputs, and an instruction isn't a limit."
    ],
    [
      "Data exposure, addressed by removing personal information from the application logs and from the drafted replies sent to residents.",
      "No sensitive data left its boundary. The effect is cost and truncation."
    ],
    [
      "Token-budget exhaustion, handled by size checks in code before the call and per-user rate and spend caps.",
      "Correct. Oversized or padded inputs consume the context or output budget, truncating work and inflating cost. Deterministic size limits and caps stop them without relying on the model."
    ],
    [
      "Indirect prompt injection, addressed by screening retrieved documents.",
      "The inputs come directly from users and nothing was retrieved. The harm is volume rather than hidden instructions."
    ]
  ],
  "a": [
    2
  ],
  "why": "Token-budget exhaustion is one of the recurring risk categories: oversized or adversely padded inputs use up the context or output budget, truncating work or inflating cost. Check the risk against the category, then put a deterministic control, such as size checks and rate and spend caps, in front of the model."
},
{
  "id": "p5-51",
  "d": 6,
  "s": "Conduct structured discovery and requirement gathering",
  "stem": "A frozen-food maker wants Claude to review supplier certificates of analysis (CoAs) against specifications. The QA director estimates reviewers miss 'maybe 5%' of out-of-spec values. In discovery, what should the architect do to set measurable requirements?",
  "o": [
    [
      "Shadow reviewers and measure the real miss rate on past CoAs first.",
      "Correct. Observing the real process and measuring a baseline gives targets grounded in evidence."
    ],
    [
      "Skip the baseline and start a pilot so the team can learn requirements from how users react to the tool.",
      "Without a baseline, the pilot can't show whether the tool improved anything."
    ],
    [
      "Ask the vendor for its standard accuracy figures on document extraction and use those as the requirements.",
      "Generic benchmarks don't reflect this company's documents, specs or definition of a miss."
    ],
    [
      "Accept the 5% estimate as the baseline and set a target of fewer than 1% misses for the new system.",
      "An unverified estimate makes a shaky baseline; the target may be unreachable or trivially easy."
    ]
  ],
  "a": [
    0
  ],
  "why": "Structured discovery observes the real process and measures a baseline so requirements and success criteria rest on evidence, not estimates."
},
{
  "id": "p5-52",
  "d": 6,
  "s": "Communicate architectural decisions and trade-offs",
  "stem": "A telecom CTO asks why the architect recommends retrieval over the knowledge base plus prompt engineering instead of fine-tuning a model on 200,000 past support tickets, which 'would make it really know our business'. How should the architect explain the decision?",
  "o": [
    [
      "Fine-tuning is never useful for enterprise systems, so the team should avoid it in all future projects as a firm rule.",
      "Absolute claims are inaccurate and undermine credibility; fine-tuning has niche uses."
    ],
    [
      "Plans and policies change weekly; retrieval stays current and citable, and evals will show if anything more is needed.",
      "Correct. It ties the choice to the business's needs (freshness, traceability) and commits to evidence for revisiting it."
    ],
    [
      "Fine-tuning is too technical a topic for executives, so the decision is best left entirely to the engineering team.",
      "Dismissing the question damages trust; executives need the trade-off in business terms, not a deferral."
    ],
    [
      "Fine-tuning costs more upfront, so retrieval wins on cost, and cost is the only factor worth considering in this decision.",
      "Cost matters, but presenting it as the sole factor ignores the stronger reasons of freshness and auditability."
    ]
  ],
  "a": [
    1
  ],
  "why": "Explain decisions in terms of the stakeholder's goals, be honest about trade-offs and say what evidence would change the decision."
},
{
  "id": "p5-53",
  "d": 6,
  "s": "Manage stakeholder feedback loops and expectation alignment (including SLAs)",
  "stem": "An airline's operations VP wants the new Claude-based crew-swap assistant to 'auto-approve every swap request instantly with zero errors'. Some swaps affect duty-time legality and union rules. How should the architect align expectations?",
  "o": [
    [
      "Agree tiers: auto-approve swaps that pass hard legality checks, route the rest to schedulers, and set latency and error targets for each tier.",
      "Correct. Tiered SLAs make the trade-off explicit and give stakeholders measurable, realistic commitments."
    ],
    [
      "Agree to the goal publicly and plan to explain the limitations later once the system is live and has some results.",
      "Deferring the conversation sets up a broken promise and a loss of trust when errors occur."
    ],
    [
      "Refuse to auto-approve anything, since any error in crew scheduling is unacceptable for a regulated airline.",
      "Blanket refusal ignores the large share of low-risk swaps where automation is safe and valuable."
    ],
    [
      "Promise 99.9% accuracy for all swaps based on early prototype results and revisit the target after launch.",
      "Prototype figures rarely hold in production, and one number for all swap types hides the risk differences."
    ]
  ],
  "a": [
    0
  ],
  "why": "Turn absolute expectations into explicit, tiered commitments: what is automated, under what checks, and with which measurable latency and accuracy targets."
},
{
  "id": "p5-54",
  "d": 6,
  "s": "Document architectures and provide implementation guidance",
  "stem": "An architect is handing a Claude-based IEP drafting assistant to a school district's small IT team, which has never operated an LLM system. Which TWO items are most important in the handoff documentation?",
  "o": [
    [
      "Marketing material describing the assistant's benefits that the district can share with parents and teachers.",
      "Communication material has its place, but it isn't implementation or operational guidance."
    ],
    [
      "A runbook: failure modes, monitoring signals, escalation and rollback steps.",
      "Correct. Operators need to recognize problems and recover from them without the original builders."
    ],
    [
      "The eval suite with instructions for running it before any prompt, model or retrieval change, and the pass thresholds.",
      "Correct. The eval suite is the acceptance gate that keeps future changes from silently degrading quality."
    ],
    [
      "A full transcript of every design meeting so the team can see how each decision was reached over the project.",
      "Raw meeting transcripts are hard to use; a concise decision record is what operators need."
    ],
    [
      "A general tutorial on how transformer models work so the IT team understands the underlying technology.",
      "Background education is nice to have but doesn't help the team run or change this system."
    ]
  ],
  "a": [
    1,
    2
  ],
  "why": "Handoff documentation should let the receiving team operate (runbooks, monitoring, rollback) and change the system safely (evals with thresholds)."
},
{
  "id": "p5-55",
  "d": 6,
  "s": "Support lifecycle phases (discovery, design, handoff, monitoring, iteration)",
  "stem": "A lender's loan-summary assistant launched with a review in week 1. From week 4 the eval score drifted down each week while the error rate stayed flat, so no hard alert fired. No review was held until the quarterly review in week 12, when a stakeholder said the output was 'less useful lately.' What should the feedback loop have included?",
  "o": [
    [
      "A monthly stakeholder meeting instead of a quarterly one, so complaints would be heard sooner.",
      "A shorter calendar helps a little but would still have taken weeks, and it leaves the loop dependent on people noticing the problem."
    ],
    [
      "A hard alert on error rate, so any decline in the assistant's output triggers an investigation.",
      "Error rate was flat. The signal that moved was the eval score, so an error-rate alert would not have fired."
    ],
    [
      "A request that stakeholders email the team whenever the output seems worse, with the team triaging the messages in the order they arrive each week.",
      "This relies on stakeholders to detect drift. The observability stack had already recorded it for weeks."
    ],
    [
      "A quality-drift trigger on the eval score that escalates to an Architect review, then to a stakeholder review once the drift is confirmed.",
      "Correct. The decision layer should map signals to trigger actions and owners. A review calendar that is separate from the observability signals lets drift sit unnoticed until the next scheduled meeting."
    ]
  ],
  "a": [
    3
  ],
  "why": "A feedback loop is a decision layer that maps signals to trigger actions and to owners, with SLA thresholds taken from real sources. A calendar alone isn't enough. A quality-drift trigger should escalate to an Architect review early and then to a stakeholder review once the drift is confirmed."
},
{
  "id": "p5-56",
  "d": 6,
  "s": "Conduct structured discovery and requirement gathering",
  "stem": "In discovery for a Claude tool that drafts tax-delinquency notices, the agency's operations team describes the workflow and volumes. The architect hasn't yet spoken with the legal division. Why does that matter most?",
  "o": [
    [
      "Legal may have a preference for which model vendor the agency uses, which affects procurement timelines.",
      "Vendor preference is a procurement detail, not the main risk of skipping legal stakeholders."
    ],
    [
      "Notices may require statutory wording and appeal-rights language the drafts must keep.",
      "Correct. Missing a legal constraint in discovery can invalidate notices; these requirements shape the whole design."
    ],
    [
      "Legal will want to review the system prompt for tone, so meeting them early speeds up the style review.",
      "Tone review is minor compared to statutory content requirements that the design must enforce."
    ],
    [
      "The legal team will be the main users of the tool, so their workflow is the one that should be automated.",
      "Operations staff produce the notices; legal sets constraints rather than running the workflow."
    ]
  ],
  "a": [
    1
  ],
  "why": "Structured discovery covers all stakeholders, especially those who own non-negotiable constraints such as statutory requirements."
},
{
  "id": "p5-57",
  "d": 6,
  "s": "Manage stakeholder feedback loops and expectation alignment (including SLAs)",
  "stem": "At a payroll SaaS company, the support director says the Claude reply assistant is 'too cautious', while the finance director says it 'gives away too many fee waivers'. Both want the prompt changed their way this week. How should the architect handle it?",
  "o": [
    [
      "Escalate to the CEO and pause all changes.",
      "Escalating before establishing facts wastes leadership time and stalls improvement."
    ],
    [
      "Agree shared metrics, test candidate changes on evals, and review results with both.",
      "Correct. Shared, measurable criteria turn opposing opinions into a trade-off both can see and agree on."
    ],
    [
      "Implement the support director's change first, because customer experience should take priority over cost.",
      "Picking a side without data leaves the other stakeholder's concern unaddressed and likely to return."
    ],
    [
      "Alternate between the two prompts weekly so each director gets their preferred behavior half the time.",
      "Oscillating behavior confuses customers and produces no evidence about the right balance."
    ]
  ],
  "a": [
    1
  ],
  "why": "Resolve conflicting feedback with shared metrics and evidence: define what both sides care about, test changes, and decide on results."
},
{
  "id": "p5-58",
  "d": 6,
  "s": "Document architectures and provide implementation guidance",
  "stem": "A semiconductor company chose to access Claude through its existing cloud provider's private networking rather than the public API, after weeks of debate about IP protection, latency and feature availability. Engineers joining next year will ask why. How should the decision be documented?",
  "o": [
    [
      "Add a comment to the deployment script that says the cloud provider route was chosen for security reasons.",
      "A one-line comment loses the options weighed and the trade-offs accepted, such as feature lag."
    ],
    [
      "Create a diagram of the final deployment and store it in the wiki, since the diagram shows how the system works.",
      "A diagram shows the result but not the reasoning or the conditions that would change it."
    ],
    [
      "Rely on the project chat channel history, which contains the full discussion and can be searched when needed.",
      "Chat history is scattered and hard to interpret; the reasoning will be effectively lost."
    ],
    [
      "Write an ADR: context, options, decision, trade-offs and revisit triggers.",
      "Correct. An ADR captures why, not just what, and states when the decision should be reconsidered."
    ]
  ],
  "a": [
    3
  ],
  "why": "Architecture decision records preserve context, alternatives, trade-offs and revisit criteria so future teams can understand and revisit decisions."
},
{
  "id": "p5-59",
  "d": 6,
  "s": "Support lifecycle phases (discovery, design, handoff, monitoring, iteration)",
  "stem": "A real-estate firm's lease-abstraction system runs on Sonnet 5.5. A newer model version is announced with better extraction benchmarks, and the business asks to switch over this weekend. What should the architect recommend?",
  "o": [
    [
      "Never upgrade a working system, because any model change introduces risk to a stable production workflow.",
      "Refusing upgrades accumulates risk from deprecation and forgoes real gains."
    ],
    [
      "Upgrade only the system prompt this weekend and leave the model version unchanged until next year's review.",
      "This doesn't answer the business request and changes the prompt without a clear reason."
    ],
    [
      "Run it on the firm's evals and shadow traffic, then cut over with rollback ready.",
      "Correct. Treat a model change like any release: evaluate on your own data, then switch with a rollback path."
    ],
    [
      "Switch this weekend based on vendor benchmarks.",
      "Public benchmarks don't measure this firm's leases, schema or edge cases; regressions are possible."
    ]
  ],
  "a": [
    2
  ],
  "why": "Model upgrades are lifecycle events. Validate on the system's own evals and representative traffic, then migrate in a controlled, reversible way."
},
{
  "id": "p5-60",
  "d": 7,
  "s": "Configure Claude tools and environments for teams (e.g., Claude Code)",
  "stem": "A telecom's platform team is rolling out Claude Code to 400 engineers. Security requires that no one can connect unapproved MCP servers, that production credentials files are never read, and that individual developers can't override these rules. What should the team configure?",
  "o": [
    [
      "A CLAUDE.md file in each repository telling Claude not to read credentials or connect to unknown MCP servers.",
      "CLAUDE.md guides behavior but isn't an enforced control, and users can change it."
    ],
    [
      "Enterprise managed settings that users can't override, with deny rules for credential paths and an allowlist of approved MCP servers.",
      "Correct. Managed settings take precedence over user and project settings, so the controls are enforced centrally."
    ],
    [
      "Ask each engineer to add the deny rules to their personal user settings during onboarding and verify by survey.",
      "User settings can be edited by the user, so this doesn't meet the 'can't override' requirement."
    ],
    [
      "Run a weekly scan of developer machines to detect unapproved MCP servers and notify the engineers involved.",
      "Detection after the fact doesn't prevent credential reads or unapproved connections in the meantime."
    ]
  ],
  "a": [
    1
  ],
  "why": "For organization-wide requirements, use managed settings, which users can't override. CLAUDE.md and user settings are for guidance and personal preferences."
},
{
  "id": "p5-61",
  "d": 7,
  "s": "Configure Claude tools and environments for teams (e.g., Claude Code)",
  "stem": "A payments company's 60 developers each configured Claude Code their own way. Generated code follows different conventions from person to person, a few developers use the most expensive model for every task, and monthly spend has become unpredictable. Which TWO changes address this?",
  "o": [
    [
      "Agree a project-level baseline of a shared CLAUDE.md, an agreed set of tools and MCP servers, and a permission posture, kept under version control.",
      "Correct. A shared baseline is something the team can review, version and improve once for everyone, so people start from the same place instead of drifting apart."
    ],
    [
      "Let each developer tune their own setup, and share tips in a team channel.",
      "Personal setups are the source of the drift, and tips don't create a reviewed, versioned baseline."
    ],
    [
      "Set a spend posture in the team configuration: model defaults and an allowlist, effort guidance, and spend, rate and per-user caps.",
      "Correct. Model defaults, restrictions, effort guidance and caps keep consumption within bounds in a way a reminder can't."
    ],
    [
      "Review the monthly invoice and message the heaviest users about their spend.",
      "A review after the money is spent doesn't set limits in advance, and it doesn't address the inconsistent setups."
    ]
  ],
  "a": [
    0,
    2
  ],
  "why": "A team environment is a shared baseline: a project CLAUDE.md, agreed tools and MCP servers, and a permission posture. Spend posture is part of the same configuration: model defaults and allowlists, effort guidance, and spend, rate and per-user caps."
},
{
  "id": "p5-62",
  "d": 7,
  "s": "Support debugging and operational issue resolution",
  "stem": "During a weekday-morning incident, a transit agency's real-time arrival API starts returning stale predictions. The on-call engineer wants Claude Code's help to investigate across logs, recent deploys and the feed-ingestion code, without risk of changing production. What is the best setup?",
  "o": [
    [
      "Read-only access to logs, deploy history and code to correlate and form hypotheses.",
      "Correct. Read-only access gives Claude the evidence to investigate while the engineer stays in control of changes."
    ],
    [
      "Have Claude Code rewrite the feed-ingestion service from scratch on a branch, since the old code is likely at fault.",
      "Rewriting before diagnosing is slow and risky and may not address the actual cause."
    ],
    [
      "Give Claude Code production write access so it can roll back the last deploy itself if it finds the cause.",
      "Write access to production during an incident adds risk; rollbacks should be a deliberate human action."
    ],
    [
      "Paste error messages into a chat window and ask for likely causes, without giving access to logs or code.",
      "Without the evidence, suggestions are generic and the engineer does all the correlation manually."
    ]
  ],
  "a": [
    0
  ],
  "why": "In incidents, give Claude read access to evidence so it can correlate and hypothesize, and keep production changes with the human."
},
{
  "id": "p5-63",
  "d": 7,
  "s": "Improve developer workflows using AI-assisted tooling",
  "stem": "A law firm gave 200 staff Claude seats three months ago. Usage is steady, but almost all of it is asking questions in chat. Nobody uses tools, document-aware workflows or packaged firm procedures. Which statement describes the problem and the right response?",
  "o": [
    [
      "More seats are needed, because usage is steady and the gap will close naturally as more people at the firm start using it.",
      "Seats aren't the constraint. Providing access is not adoption, and adding seats repeats the same pattern."
    ],
    [
      "Stalling at basic chat: configure real enablement within current workflows, such as connected tools and packaged Skills, with champions.",
      "Correct. A team that uses Claude as a question-answering box never advances to tool use, repository-aware assistance or packaged Skills unless someone enables them. Access without configuration for real enablement doesn't produce adoption."
    ],
    [
      "The model is too weak for legal work, so the firm should move everyone to the largest model for all of their work, including routine drafting.",
      "Nothing suggests the model is the limit. Usage is stuck at the first step because nobody enabled the higher-value workflows."
    ],
    [
      "A daily-use quota would raise usage, so each person should be required to run a set number of chats every day, whatever the task.",
      "A quota raises the number of chats, not the kind of work. It doesn't move anyone past basic Q&A."
    ]
  ],
  "a": [
    1
  ],
  "why": "Stalling at basic chat is one of the two recurring adoption failure modes, alongside lumpy adoption. Access is not adoption: the team has to be configured for real enablement within its current workflows, with tool use, repository or document awareness and packaged Skills turned on."
}
);
