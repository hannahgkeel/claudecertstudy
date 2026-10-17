// Bridge: an MCP *client* that starts the tickets server, turns its MCP tools
// into Claude API tools, loads its resource into the system prompt, and runs
// an agent loop. Claude Code does this same work internally whenever you
// configure an MCP server.
//
// Run from the repo root:
//
//	go run ./04-mcp/bridge -server solution
//	go run ./04-mcp/bridge -server exercise
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os/exec"
	"strings"

	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func main() {
	which := flag.String("server", "solution", "which server to run: solution or exercise")
	task := flag.String("task", "Find the open auth tickets and resolve the login one.", "what to ask Claude")
	flag.Parse()
	ctx := context.Background()

	// 1. Connect to the MCP server over stdio.
	cmd := exec.Command("go", "run", "./04-mcp/"+*which+"/server")
	mcpClient := mcp.NewClient(&mcp.Implementation{Name: "study-bridge", Version: "v1.0.0"}, nil)
	session, err := mcpClient.Connect(ctx, &mcp.CommandTransport{Command: cmd}, nil)
	if err != nil {
		log.Fatalf("connect (run this from the repo root): %v", err)
	}
	defer session.Close()

	// 2. Discover tools and translate MCP tool -> Claude tool definition.
	var tools []anthropic.ToolUnionParam
	for t, err := range session.Tools(ctx, nil) {
		if err != nil {
			log.Fatal(err)
		}
		raw, _ := json.Marshal(t.InputSchema)
		var schema struct {
			Properties map[string]any `json:"properties"`
			Required   []string       `json:"required"`
		}
		_ = json.Unmarshal(raw, &schema)
		tp := anthropic.ToolParam{
			Name:        t.Name,
			Description: anthropic.String(t.Description),
			InputSchema: anthropic.ToolInputSchemaParam{Properties: schema.Properties, Required: schema.Required},
		}
		tools = append(tools, anthropic.ToolUnionParam{OfTool: &tp})
		fmt.Printf("tool: %s\n  %s\n", t.Name, t.Description)
	}

	// 3. Read resources into context (the client decides what to load).
	var system strings.Builder
	system.WriteString("You manage support tickets using the tools provided.\n")
	if session.InitializeResult().Capabilities.Resources != nil {
		for r, err := range session.Resources(ctx, nil) {
			if err != nil {
				log.Fatal(err)
			}
			res, err := session.ReadResource(ctx, &mcp.ReadResourceParams{URI: r.URI})
			if err != nil {
				log.Fatal(err)
			}
			fmt.Println("resource loaded:", r.URI)
			for _, c := range res.Contents {
				fmt.Fprintf(&system, "\n<resource uri=%q>\n%s\n</resource>\n", c.URI, c.Text)
			}
		}
	} else {
		fmt.Println("server exposes no resources")
	}

	// 4. Agent loop: tool_use -> session.CallTool -> tool_result.
	client := claude.NewClient()
	messages := []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(*task))}
	claude.Banner("Agent")
	for i := 0; i < 10; i++ {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     claude.Model,
			MaxTokens: 16000,
			System:    []anthropic.TextBlockParam{{Text: system.String()}},
			Tools:     tools,
			Messages:  messages,
		})
		if err != nil {
			log.Fatal(err)
		}
		messages = append(messages, resp.ToParam())
		if resp.StopReason != anthropic.StopReasonToolUse {
			fmt.Println("AGENT:", claude.Text(resp))
			return
		}
		var results []anthropic.ContentBlockParamUnion
		for _, b := range resp.Content {
			tu, ok := b.AsAny().(anthropic.ToolUseBlock)
			if !ok {
				continue
			}
			res, err := session.CallTool(ctx, &mcp.CallToolParams{Name: tu.Name, Arguments: json.RawMessage(tu.JSON.Input.Raw())})
			var text string
			isErr := true
			if err != nil {
				text = "MCP protocol error: " + err.Error()
			} else {
				isErr = res.IsError
				for _, c := range res.Content {
					if tc, ok := c.(*mcp.TextContent); ok {
						text += tc.Text
					}
				}
			}
			fmt.Printf("  -> %s %s\n     <- (error=%v) %s\n", tu.Name, tu.JSON.Input.Raw(), isErr, text)
			results = append(results, anthropic.NewToolResultBlock(tu.ID, text, isErr))
		}
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
}
