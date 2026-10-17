// Exercise 2: coordinator + parallel subagents (hub-and-spoke).
//
//	go run ./02-multi-agent/exercise
//
// The coordinator loop is done. You write the subagent and the parallel
// fan-out. Compare with ../solution/main.go when done.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"claudecertstudy/02-multi-agent/corpus"
	"claudecertstudy/internal/claude"

	"github.com/anthropics/anthropic-sdk-go"
)

// TODO(1): This coordinator prompt is weak. Improve it so the coordinator:
//   - splits the question into subtopics that together cover ALL of it
//     (a common exam failure: the split is too narrow and whole areas are missed)
//   - delegates them all in ONE turn so they run in parallel
//   - knows subagents can't see this conversation
//   - cites sources and reports failed subtopics as gaps instead of making them up
const coordinatorPrompt = `You are a research coordinator. Given a research question,` +
	` split it into 3-4 subtopics that together cover the whole question.` +
	` Delegate each subtopic to a research subagent in one turn. The subagent starts with zero context and must be told everything.` +
	` Use search_corpus to find evidence for its assigned subtopic only, and cite the document ID for every finding.` +
	` List anything you could not find under "gaps". Do not use outside knowledge.`

// TODO(2): Improve this tool description so the coordinator knows the
// subagent starts with zero context and must be told everything.
var delegateTool = anthropic.ToolParam{
	Name:        "delegate_research",
	Description: anthropic.String("Research a subtopic. The subagent starts with zero context and must be told everything. Returns JSON findings, each tied to a source document ID plus any gaps."),
	InputSchema: anthropic.ToolInputSchemaParam{
		Properties: map[string]any{
			"subtopic": map[string]any{
				"type":        "string",
				"description": "The subtopic to research",
			},
			"instructions": map[string]any{
				"type":        "string",
				"description": "Instructions for the subagent",
			},
			"context": map[string]any{
				"type":        "string",
				"description": "Context for the subagent",
			},
		},
		Required: []string{"subtopic", "instructions", "context"},
	},
}

type delegateInput struct {
	Subtopic     string `json:"subtopic"`
	Instructions string `json:"instructions"`
	Context      string `json:"context"`
}

const researcherPrompt = `You are a research subagent. Use search_corpus to find evidence for your
assigned subtopic only. Every finding must cite the document ID it came from.
List anything you could not find under "gaps". Do not use outside knowledge.`

var searchTool = anthropic.ToolParam{
	Name:        "search_corpus",
	Description: anthropic.String("Keyword search over the research document store. Returns matching documents with id, title, year, body, source."),
	InputSchema: anthropic.ToolInputSchemaParam{
		Properties:  map[string]any{"query": map[string]any{"type": "string"}},
		Required:    []string{"query"},
		ExtraFields: map[string]any{"additionalProperties": false},
	},
	Strict: anthropic.Bool(true),
}

// TODO(3): Define a JSON schema for the subagent's final answer so each
// finding keeps its source: {subtopic, findings:[{claim, source_id, source, year}], gaps:[]}.
// Structured outputs need "additionalProperties": false and "required" on
// every object.
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
		"gaps": map[string]any{
			"type":  "array",
			"items": map[string]any{"type": "string"},
		},
	},
	"required":             []string{"subtopic", "findings", "gaps"},
	"additionalProperties": false,
}

// TODO(4): Implement the subagent.
//   - Build the first user message from in.Context, in.Subtopic and in.Instructions.
//     (The subagent does NOT inherit the coordinator's history.)
//   - Run a tool loop with ONLY searchTool available.
//     corpus.Search(query) returns the tool result.
//   - Set OutputConfig.Format to findingsSchema so the final answer is JSON.
//   - Return the final text, or an error if it stops for any reason but end_turn.
func runSubagent(ctx context.Context, client anthropic.Client, in delegateInput) (string, error) {
	prompt := fmt.Sprintf("Context:\n%s\n\nYour subtopic:\n%s\n\nInstructions:\n%s", in.Context, in.Subtopic, in.Instructions)
	messages := []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(prompt))}
	const maxIterations = 10
	for range maxIterations {
		resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:        claude.Model,
			MaxTokens:    10000,
			System:       []anthropic.TextBlockParam{{Text: researcherPrompt}},
			Tools:        []anthropic.ToolUnionParam{{OfTool: &searchTool}},
			Messages:     messages,
			OutputConfig: anthropic.OutputConfigParam{Format: anthropic.JSONOutputFormatParam{Schema: findingsSchema}},
		})
		if err != nil {
			return "", err
		}
		messages = append(messages, resp.ToParam())

		switch resp.StopReason {
		case anthropic.StopReasonEndTurn:
			return claude.Text(resp), nil
		case anthropic.StopReasonMaxTokens:
			return "", fmt.Errorf("response was cut off at max_tokens")
		case anthropic.StopReasonRefusal:
			return "", fmt.Errorf("request was declined: %s", resp.StopDetails.Explanation)
		case anthropic.StopReasonToolUse:
			// fall through to run tools below
		default:
			return "", fmt.Errorf("unexpected stop_reason: %s", resp.StopReason)
		}

		var results []anthropic.ContentBlockParamUnion
		for _, block := range resp.Content {
			tu, ok := block.AsAny().(anthropic.ToolUseBlock)
			if !ok {
				continue
			}
			var jsonInput map[string]any
			err := json.Unmarshal([]byte(tu.JSON.Input.Raw()), &jsonInput)
			if err != nil {
				results = append(results, anthropic.NewToolResultBlock(tu.ID,
					`{"error": "invalid JSON input", "retryable": true}`, true))
				continue
			}
			query, ok := jsonInput["query"].(string)
			if !ok {
				if !ok {
					results = append(results, anthropic.NewToolResultBlock(tu.ID,
						`{"error": "query must be a non-empty string", "retryable": true}`, true))
					continue
				}
			}
			result := corpus.Search(query)
			results = append(results, anthropic.NewToolResultBlock(tu.ID, result, false))
		}
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
	return "", fmt.Errorf("subagent hit its iteration limit")
}

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

		var calls []anthropic.ToolUseBlock
		for _, block := range resp.Content {
			if tu, ok := block.AsAny().(anthropic.ToolUseBlock); ok {
				calls = append(calls, tu)
			}
		}

		// TODO(5): Run every call CONCURRENTLY (goroutines + sync.WaitGroup).
		//   - Write each result into results[idx] so the order matches calls.
		//   - When a subagent fails, DON'T log.Fatal and DON'T return an empty
		//     success. Return is_error=true with structured JSON: status,
		//     subtopic, error, retryable, guidance. The coordinator then decides
		//     whether to retry or report the gap.
		// This sequential version works but is slow, and it hides failures:
		results := make([]anthropic.ContentBlockParamUnion, len(calls))
		var wg sync.WaitGroup
		for idx, tu := range calls {
			wg.Add(1)
			var in delegateInput
			_ = json.Unmarshal([]byte(tu.JSON.Input.Raw()), &in)
			go func() {
				defer wg.Done()
				out, err := runSubagent(ctx, client, in)
				if err != nil {
					b, _ := json.Marshal(map[string]any{
						"status":    "failed",
						"subtopic":  in.Subtopic,
						"error":     err.Error(),
						"retryable": true,
						"guidance":  "Retry this subtopic once if it may be transient. If it fails again, list it under gaps in the report. Do not fill it in from general knowledge.",
					})
					results[idx] = anthropic.NewToolResultBlock(tu.ID, string(b), true)
				} else {
					results[idx] = anthropic.NewToolResultBlock(tu.ID, out, false)
				}
			}()
		}
		wg.Wait()
		messages = append(messages, anthropic.NewUserMessage(results...))
	}
	fmt.Println("coordinator hit its iteration limit")
}
