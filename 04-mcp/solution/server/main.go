// Solution: an MCP server (stdio) exposing support-ticket tools and a resource.
//
// Use it from Claude Code (see ../../README.md) or from the bridge:
//
//	go run ./04-mcp/bridge -server solution
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ticket struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Category string `json:"category"`
	Status   string `json:"status"`
	Priority string `json:"priority"`
}

var (
	mu      sync.Mutex
	tickets = map[string]*ticket{
		"T-1": {"T-1", "Cannot log in after password reset", "auth", "open", "high"},
		"T-2": {"T-2", "Invoice shows wrong VAT rate", "billing", "open", "medium"},
		"T-3": {"T-3", "Export to CSV times out", "data", "in_progress", "medium"},
		"T-4": {"T-4", "2FA codes not arriving by SMS", "auth", "open", "high"},
	}
)

// Reference data that rarely changes is a RESOURCE: the client can read it
// into context. Actions and queries with arguments are TOOLS.
const policyDoc = `# Ticket policy
Statuses: open -> in_progress -> resolved. A ticket can't go from open straight to resolved.
Categories: auth, billing, data.
SLA: high = 4h, medium = 1 business day, low = 3 business days.`

type searchArgs struct {
	Query  string `json:"query" jsonschema:"words to match in the ticket title; empty string matches all"`
	Status string `json:"status" jsonschema:"filter by status: open, in_progress, resolved, or empty for any"`
}

type updateArgs struct {
	ID     string `json:"id" jsonschema:"ticket ID such as T-1"`
	Status string `json:"status" jsonschema:"new status: in_progress or resolved"`
}

var transitions = map[string][]string{
	"open":        {"in_progress"},
	"in_progress": {"resolved"},
}

func textResult(v any, isErr bool) *mcp.CallToolResult {
	b, _ := json.Marshal(v)
	return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: string(b)}}, IsError: isErr}
}

func searchTickets(ctx context.Context, req *mcp.CallToolRequest, args searchArgs) (*mcp.CallToolResult, any, error) {
	mu.Lock()
	defer mu.Unlock()
	var out []*ticket
	for _, t := range tickets {
		if args.Status != "" && t.Status != args.Status {
			continue
		}
		if args.Query != "" && !strings.Contains(strings.ToLower(t.Title), strings.ToLower(args.Query)) {
			continue
		}
		out = append(out, t)
	}
	return textResult(map[string]any{"tickets": out, "count": len(out)}, false), nil, nil
}

func updateTicket(ctx context.Context, req *mcp.CallToolRequest, args updateArgs) (*mcp.CallToolResult, any, error) {
	mu.Lock()
	defer mu.Unlock()
	t, ok := tickets[args.ID]
	if !ok {
		// A tool-level failure is a normal result with IsError, so the MODEL
		// sees it and can react. A Go error here would be a protocol error.
		return textResult(map[string]any{
			"errorCategory": "not_found", "isRetryable": false,
			"message": fmt.Sprintf("no ticket %s", args.ID), "hint": "Use search_tickets to find the ID.",
		}, true), nil, nil
	}
	allowed := transitions[t.Status]
	for _, s := range allowed {
		if s == args.Status {
			t.Status = args.Status
			return textResult(t, false), nil, nil
		}
	}
	return textResult(map[string]any{
		"errorCategory": "business", "isRetryable": false,
		"message": fmt.Sprintf("cannot move %s from %s to %s", t.ID, t.Status, args.Status),
		"hint":    fmt.Sprintf("Allowed next statuses: %v", allowed),
	}, true), nil, nil
}

func main() {
	server := mcp.NewServer(&mcp.Implementation{Name: "tickets", Version: "v1.0.0"}, nil)

	mcp.AddTool(server, &mcp.Tool{
		Name: "search_tickets",
		Description: "Search support tickets by title words and/or status. Returns {tickets:[{id,title,category,status,priority}], count}. " +
			"Use this to find ticket IDs before update_ticket_status. A count of 0 means nothing matched.",
	}, searchTickets)

	mcp.AddTool(server, &mcp.Tool{
		Name: "update_ticket_status",
		Description: "Move one ticket to its next status. Allowed transitions: open -> in_progress -> resolved (no skipping). " +
			"Read the tickets://policy resource for the rules. Returns the updated ticket, or an error saying which statuses are allowed.",
	}, updateTicket)

	server.AddResource(&mcp.Resource{
		URI:         "tickets://policy",
		Name:        "ticket-policy",
		Description: "Status workflow, categories and SLA targets for support tickets",
		MIMEType:    "text/markdown",
	}, func(ctx context.Context, req *mcp.ReadResourceRequest) (*mcp.ReadResourceResult, error) {
		return &mcp.ReadResourceResult{Contents: []*mcp.ResourceContents{
			{URI: "tickets://policy", MIMEType: "text/markdown", Text: policyDoc},
		}}, nil
	})

	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		log.Printf("server stopped: %v", err)
	}
}
