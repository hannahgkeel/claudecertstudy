// Solution: a coordinator agent that hands research to subagents in parallel.
//
//	go run ./02-multi-agent/solution
//	FAIL_SUBAGENT=1 go run ./02-multi-agent/solution   # make one subagent fail on purpose
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"claudecertstudy/02-multi-agent/corpus"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// ---------- Coordinator ----------

const coordinatorPrompt = `You coordinate a research team. Given a research question:
1. Break it into 3-4 subtopics that TOGETHER cover the whole question (technology, economics,
   policy, infrastructure, people). Check that nothing important falls between subtopics.
2. Call delegate_research once per subtopic, all in the same turn, so they run in parallel.
3. Subagents cannot see this conversation. Put everything they need in "context".
4. When results come back, write a short report. Cite every claim as [doc_id].
   Call out conflicts and gaps. If a subagent failed, say which part of the report is
   missing; do not invent it.`

var delegateTool = anthropic.ToolParam{
	Name: "delegate_research",
	Description: anthropic.String("Send one subtopic to a research subagent. The subagent starts with " +
		"NO knowledge of this conversation: give it the overall question, its exact scope, and what to " +
		"leave to others. Returns JSON findings, each tied to a source document ID."),
	InputSchema: anthropic.ToolInputSchemaParam{
		Properties: map[string]any{
			"subtopic":     map[string]any{"type": "string"},
			"instructions": map[string]any{"type": "string", "description": "What to find, and what is out of scope"},
			"context":      map[string]any{"type": "string", "description": "The overall research question and anything else the subagent needs"},
		},
		Required:    []string{"subtopic", "instructions", "context"},
		ExtraFields: map[string]any{"additionalProperties": false},
	},
	Strict: anthropic.Bool(true),
}

type delegateInput struct {
	Subtopic     string `json:"subtopic"`
	Instructions string `json:"instructions"`
	Context      string `json:"context"`
}

// ---------- Subagent ----------

const researcherPrompt = `You are a research subagent. Use search_corpus to find evidence for your
assigned subtopic only. Every finding must cite the document ID it came from.
List anything you could not find under "gaps". Do not use outside knowledge.`

// The subagent gets ONLY the tool it needs (least privilege). It cannot
// delegate, and it cannot see the coordinator's tools.
var searchTool = anthropic.ToolParam{
	Name:        "search_corpus",
	Description: anthropic.String("Keyword search over the research document store. Returns matching documents with id, title, year, body, source."),
	InputSchema: anthropic.ToolInputSchemaParam{
		Properties: map[string]any{"query": map[string]any{"type": "string"}},
		Required:   []string{"query"},
	},
}

// Structured output keeps attribution intact on the way back to the
// coordinator: claim -> source_id survives synthesis.
var findingsSchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"subtopic": map[string]any{"type": "string"},
		"findings": map[string]any{
			"type": "array",
			"items": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"claim":     map[string]any{"type": "string"},
					"source_id": map[string]any{"type": "string"},
					"source":    map[string]any{"type": "string"},
					"year":      map[string]any{"type": "integer"},
				},
				"required":             []string{"claim", "source_id", "source", "year"},
				"additionalProperties": false,
			},
		},
		"gaps": map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
	},
	"required":             []string{"subtopic", "findings", "gaps"},
	"additionalProperties": false,
}

func runSubagent(ctx context.Context, client anthropic.Client, in delegateInput) (string, error) {
	if os.Getenv("FAIL_SUBAGENT") == "1" && in.Subtopic != "" && in.Subtopic[0]%2 == 0 {
		return "", fmt.Errorf("search backend timed out after 30s")
	}

	ctx, cancel := context.WithTimeout(ctx, 3*time.Minute)
	defer cancel()

	// Context is passed EXPLICITLY. The subagent's history starts here.
	task := fmt.Sprintf("Overall context:\n%s\n\nYour subtopic: %s\n\nInstructions:\n%s",
		in.Context, in.Subtopic, in.Instructions)
	messages := []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(task))}

	for i := 0; i < 8; i++ {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:        claude.Model,
			MaxTokens:    16000,
			System:       []anthropic.TextBlockParam{{Text: researcherPrompt}},
			Tools:        []anthropic.ToolUnionParam{{OfTool: &searchTool}},
			OutputConfig: anthropic.OutputConfigParam{Format: anthropic.JSONOutputFormatParam{Schema: findingsSchema}},
			Messages:     messages,
		})
		if err != nil {
			return "", err
		}
		messages = append(messages, resp.ToParam())
		if resp.StopReason != anthropic.StopReasonToolUse {
			if resp.StopReason != anthropic.StopReasonEndTurn {
				return "", fmt.Errorf("subagent stopped early: %s", resp.StopReason)
			}
			return claude.Text(resp), nil
		}
		var results []anthropic.ContentBlockParamUnion
		for _, block := range resp.Content {
			if tu, ok := block.AsAny().(anthropic.ToolUseBlock); ok {
				var q struct{ Query string }
				_ = json.Unmarshal([]byte(tu.JSON.Input.Raw()), &q)
				fmt.Printf("    [%s] search: %q\n", in.Subtopic, q.Query)
				results = append(results, anthropic.NewToolResultBlock(tu.ID, corpus.Search(q.Query), false))
			}
		}
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
	return "", fmt.Errorf("subagent hit its iteration limit")
}

// ---------- Coordinator loop ----------

func main() {
	ctx := context.Background()
	client := claude.NewClient()
	question := "What is holding back residential heat pump adoption, and what would speed it up?"

	messages := []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(question))}
	for i := 0; i < 6; i++ {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     claude.Model,
			MaxTokens: 16000,
			System:    []anthropic.TextBlockParam{{Text: coordinatorPrompt}},
			Tools:     []anthropic.ToolUnionParam{{OfTool: &delegateTool}},
			Messages:  messages,
		})
		if err != nil {
			log.Fatal(err)
		}
		messages = append(messages, resp.ToParam())
		if resp.StopReason != anthropic.StopReasonToolUse {
			claude.Banner("Final report")
			fmt.Println(claude.Text(resp))
			return
		}

		// Collect every delegation in this turn, then run them concurrently.
		var calls []anthropic.ToolUseBlock
		for _, block := range resp.Content {
			if tu, ok := block.AsAny().(anthropic.ToolUseBlock); ok {
				calls = append(calls, tu)
			}
		}
		claude.Banner(fmt.Sprintf("Coordinator delegated %d subtopics (running in parallel)", len(calls)))

		results := make([]anthropic.ContentBlockParamUnion, len(calls))
		var wg sync.WaitGroup
		for idx, tu := range calls {
			wg.Add(1)
			go func(idx int, tu anthropic.ToolUseBlock) {
				defer wg.Done()
				var in delegateInput
				if err := json.Unmarshal([]byte(tu.JSON.Input.Raw()), &in); err != nil {
					results[idx] = anthropic.NewToolResultBlock(tu.ID, "invalid delegation input: "+err.Error(), true)
					return
				}
				fmt.Println("  subagent start:", in.Subtopic)
				out, err := runSubagent(ctx, client, in)
				if err != nil {
					// Fail loudly but usefully: say what was attempted and that the
					// gap must be reported, so the coordinator can decide what to do.
					errJSON, _ := json.Marshal(map[string]any{
						"status":    "failed",
						"subtopic":  in.Subtopic,
						"error":     err.Error(),
						"retryable": true,
						"guidance":  "Report this subtopic as not covered, or re-delegate it once.",
					})
					results[idx] = anthropic.NewToolResultBlock(tu.ID, string(errJSON), true)
					fmt.Println("  subagent FAILED:", in.Subtopic, "-", err)
					return
				}
				results[idx] = anthropic.NewToolResultBlock(tu.ID, out, false)
				fmt.Println("  subagent done:", in.Subtopic)
			}(idx, tu)
		}
		wg.Wait()
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
	fmt.Println("coordinator hit its iteration limit")
}
