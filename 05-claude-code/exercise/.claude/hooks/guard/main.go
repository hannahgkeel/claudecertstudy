// Exercise: a Claude Code PreToolUse hook. Claude Code sends the pending tool
// call as JSON on stdin. Exit 0 to allow it; exit 2 with a message on stderr
// to BLOCK it (Claude sees the message).
//
// Build:  go build -o .claude/hooks/bin/guard ./.claude/hooks/guard   (from 05-claude-code/exercise)
// Test:   echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | .claude/hooks/bin/guard; echo "exit=$?"
//
// TODO(5a): Wire this into .claude/settings.json as a PreToolUse hook with a
// matcher for Write|Edit|Bash that runs "$CLAUDE_PROJECT_DIR"/.claude/hooks/bin/guard.
// Also allow `go test`, `go build` and `go vet` without prompting, and deny
// reading .env.
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

type hookInput struct {
	ToolName  string `json:"tool_name"`
	ToolInput struct {
		FilePath  string `json:"file_path"`
		Content   string `json:"content"`    // Write
		NewString string `json:"new_string"` // Edit
		Command   string `json:"command"`    // Bash
	} `json:"tool_input"`
}

// TODO(5b): Return a reason to block, or "" to allow. Block:
//   - Write/Edit to any .env or .env.* file
//   - Edit of anything under /migrations/
//   - Write/Edit content containing a secret (sk-ant-..., AKIA..., PRIVATE KEY)
//   - Bash commands containing: git push --force, git reset --hard, rm -rf /
//
// Write each reason for Claude: say what's blocked and what to do instead.
func check(in hookInput) string {
	return ""
}

func main() {
	var in hookInput
	if err := json.NewDecoder(os.Stdin).Decode(&in); err != nil {
		fmt.Fprintln(os.Stderr, "guard: could not parse hook input:", err)
		os.Exit(0)
	}
	if reason := check(in); reason != "" {
		fmt.Fprintln(os.Stderr, reason)
		os.Exit(2)
	}
}
