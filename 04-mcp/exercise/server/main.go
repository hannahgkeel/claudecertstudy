// Exercise 4: finish this MCP server.
//
// Test it with the bridge (an MCP client that hands the tools to Claude):
//
//	go run ./04-mcp/bridge -server exercise
package main

import (
	"context"
	"encoding/json"
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

// TODO(1): Implement the status update.
//   - Unknown ID -> IsError result with errorCategory "not_found" and a hint.
//   - A transition that isn't allowed (see transitions) -> IsError result with
//     errorCategory "business" that lists the allowed next statuses.
//   - Otherwise update the status and return the ticket.
//
// Question: why return an IsError RESULT instead of a Go error?
func updateTicket(ctx context.Context, req *mcp.CallToolRequest, args updateArgs) (*mcp.CallToolResult, any, error) {
	return textResult(map[string]any{"message": "not implemented"}, true), nil, nil
}

func main() {
	server := mcp.NewServer(&mcp.Implementation{Name: "tickets", Version: "v1.0.0"}, nil)

	// TODO(2): This description is too thin. Say what it returns, what a zero
	// count means, and that it's how you find IDs for update_ticket_status.
	mcp.AddTool(server, &mcp.Tool{
		Name:        "search_tickets",
		Description: "Search tickets.",
	}, searchTickets)

	// TODO(3): Register update_ticket_status with a description that spells
	// out the allowed transitions.
	_ = updateTicket

	// TODO(4): Expose policyDoc as a RESOURCE at URI "tickets://policy"
	// (server.AddResource). Why is this a resource and not a tool?
	_ = policyDoc

	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		log.Printf("server stopped: %v", err)
	}
}
