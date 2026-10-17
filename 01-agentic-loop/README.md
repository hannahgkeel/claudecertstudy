# 01 · The agentic loop and enforcing policy in code

**Exam domain:** Agentic architecture & orchestration

## What you're building

A support agent that verifies a customer, looks up an order and issues a refund, plus a policy gate that blocks refunds over $500.

```
go run ./01-agentic-loop/exercise   # your version
go run ./01-agentic-loop/solution   # reference
```

## Concepts to know cold

**1. The loop is driven by `stop_reason`.**

| stop_reason | Meaning | What your loop does |
|---|---|---|
| `tool_use` | Claude wants one or more tools run | Run them, send the results back, call again |
| `end_turn` | Claude is finished | Exit |
| `max_tokens` | Output was cut off | Exit or retry with a higher limit. Don't treat it as finished. |
| `refusal` | The request was declined | Exit and surface `stop_details` |
| `pause_turn` | A *server* tool (such as web search) paused a long turn | Send the conversation back unchanged so it continues |

Anti-patterns that show up as wrong answers:
- Deciding the agent is done by parsing its text ("if it says 'done'...").
- Using an iteration cap as the **main** way to stop. A cap is a backstop only.
- Stopping as soon as there is *any* text block. Claude often writes text **and** calls tools in the same turn.

**2. Conversation history is your job.** The API is stateless. Append the full assistant content (`resp.ToParam()`), not just the text, because the `tool_use` blocks must be there for the `tool_result` blocks to match by `tool_use_id`.

**3. Parallel tool calls.** One assistant turn can contain several `tool_use` blocks. Return **all** of their `tool_result`s in **one** user message.

**4. Errors go back as results.** A blocked or failed tool returns `is_error: true` with a message Claude can act on. Don't drop it, and don't crash the loop.

**5. Prompts are probabilistic and code is deterministic.** "Always verify the customer first" in a system prompt works most of the time. When a mistake would cost money or break compliance, enforce the rule in code (a gate or a hook) **and** keep the prompt instruction. The prompt gives the model the right plan, and the code catches the rare miss. This is one of the most heavily tested ideas on the exam.

> In Claude Code and the Agent SDK, the same idea is a **`PreToolUse` hook**: it runs before a tool and can deny the call. See module 05.

## Exam-style questions

<details><summary>Q1. An agent sometimes refunds an order before it has verified the customer. The system prompt already says to verify first. What is the most reliable fix?</summary>

Add a programmatic check (a tool-call gate or a `PreToolUse` hook) that blocks `process_refund` until verification has succeeded. Rewording the prompt, adding few-shot examples or adding "IMPORTANT" still leaves the rule up to the model.
</details>

<details><summary>Q2. Your loop exits whenever the response contains a text block. Some tasks finish half-done. Why?</summary>

Claude can say "Let me look that up" and call a tool in the same turn. Check `stop_reason == "tool_use"`, not whether text is present.
</details>

<details><summary>Q3. Claude asks for 3 tools in one turn. You send back 3 separate user messages, one result each. What's wrong?</summary>

All `tool_result` blocks for one turn belong in a single user message. Splitting them breaks the turn structure and teaches the model to stop making parallel calls.
</details>

<details><summary>Q4. A refund over the limit is blocked. What should the tool result contain?</summary>

`is_error: true` and a clear reason: it's a policy rejection, retrying won't help, and the next step is to escalate. Structured, actionable errors let the agent recover instead of looping.
</details>

## Stretch goals
1. Add a 3rd scenario where the customer asks for a human straight away. Does the agent escalate without trying to solve it first?
2. Log `resp.Usage.InputTokens` each iteration and watch history grow. This is the setup for module 07.
3. Rewrite the solution with the SDK's tool runner (`client.Beta.Messages.NewToolRunner`) and put the gate inside the tool function. What do you lose or gain compared with the manual loop?
