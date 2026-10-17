# 04 · MCP: building and wiring up a server

**Exam domain:** Tool design & MCP integration

## What you're building

1. An **MCP server** in Go that exposes ticket tools and a policy resource.
2. A **bridge** (`bridge/`): an MCP client that discovers the server's tools, turns them into Claude API tool definitions, loads the resource into context and runs the agent loop. Claude Code does the same work internally.
3. **Claude Code config** that registers the server for a project.

```
go run ./04-mcp/bridge -server exercise    # after filling in exercise/server
go run ./04-mcp/bridge -server solution
go run ./04-mcp/bridge -task "Move T-2 straight to resolved"   # watch the business-rule error
```

### Use it from Claude Code

```
cp 04-mcp/mcp.json.example .mcp.json     # project scope: commit this to share with your team
claude                                   # approve the server when asked; tools appear as mcp__tickets__search_tickets
```

Or from the CLI: `claude mcp add tickets --scope project -- go run ./04-mcp/solution/server`

## Concepts to know cold

**1. MCP primitives**

| Primitive | Who controls it | Use for |
|---|---|---|
| **Tools** | The model decides to call them | Actions, and queries with arguments |
| **Resources** | The app or client chooses what to load | Reference data and documents (schemas, policies, catalogs) |
| **Prompts** | The user picks them, e.g. as slash commands | Reusable prompt templates |

Resources are a good way to give an agent a catalog of what exists up front, so it doesn't spend tool calls exploring.

**2. Errors.** A tool failure the model should see goes back as a **result** with `isError: true` and a structured body. Protocol-level (JSON-RPC) errors are for broken requests, such as an unknown method.

**3. Scopes in Claude Code**

| Scope | Where it's stored | Shared? |
|---|---|---|
| **local** (default) | Your user config, for this project only | No |
| **project** | `.mcp.json` in the repo root | Yes, committed to version control |
| **user** | Your user config, for all projects | No |

Keep secrets out of `.mcp.json` by using environment-variable expansion: `${VAR}` or `${VAR:-default}`. Each teammate sets their own token.

**4. Transports.** `stdio` for local processes and Streamable HTTP for remote servers. The **Claude API's MCP connector** (`mcp_servers` + an `mcp_toolset` tool) only reaches *remote* servers by URL. A local stdio server needs a client like this bridge, or Claude Code.

**5. Tool descriptions matter even more with MCP.** An agent may see tools from several servers at once. Vague descriptions on an MCP tool can lose out to a built-in tool (for example the agent uses `Grep` when your richer search tool would have been better). Make each description say what it does better than the alternatives.

**6. Prefer existing servers.** For standard integrations such as GitHub or Jira, use a community or official MCP server. Build your own only for internal systems.

## Exam-style questions

<details><summary>Q1. Your team needs the same Jira MCP server in a repo, but each developer has their own API token. Where does the config go?</summary>

Project-scoped `.mcp.json`, committed, with `"env": {"JIRA_TOKEN": "${JIRA_TOKEN}"}`. Each developer exports their own token.
</details>

<details><summary>Q2. You have a 200-row product catalog the agent keeps re-querying through a search tool just to learn what exists. What MCP feature helps?</summary>

Expose the catalog as a resource so it's loaded as context up front. Keep the tool for targeted queries.
</details>

<details><summary>Q3. Claude keeps using built-in Grep instead of your MCP code-search tool, which understands symbols. Fix?</summary>

Improve the MCP tool's description so it says what it does better than Grep (symbol-aware, cross-repo and so on) and when to prefer it.
</details>

<details><summary>Q4. An MCP tool hits a business-rule violation. Return a JSON-RPC error, or a result with isError true?</summary>

A result with `isError: true` and a structured explanation, so the model can see it and adjust.
</details>

## Stretch goals
1. Add an MCP **prompt** (`server.AddPrompt`) called `triage` that takes a ticket ID. In Claude Code it shows up as a slash command.
2. Make the bridge prefix tool names with the server name (`tickets__search_tickets`) the way Claude Code does. Why does namespacing matter when several servers are connected?
