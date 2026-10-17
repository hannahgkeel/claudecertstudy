// guard is a Claude Code PreToolUse hook. Claude Code runs it before every
// Write, Edit or Bash call (see ../../settings.json) and sends the pending
// tool call as JSON on stdin.
//
//	exit 0            -> allow the call
//	exit 2 + stderr   -> BLOCK the call; stderr is shown to Claude so it can adjust
//
// Build it (from 05-claude-code/solution) before starting Claude Code:
//
//	go build -o .claude/hooks/bin/guard ./.claude/hooks/guard
//
// Use the compiled binary, not `go run`: `go run` reports ANY failing
// program as exit 1, which Claude Code treats as a non-blocking error, so
// the block would silently not happen.
//
// Test it without Claude Code:
//
//	echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | .claude/hooks/bin/guard; echo "exit=$?"
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
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

var secretPattern = regexp.MustCompile(`sk-ant-[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----`)

var dangerousCommands = []string{"rm -rf /", "git push --force", "git push -f", "git reset --hard", "DROP TABLE"}

func check(in hookInput) string {
	switch in.ToolName {
	case "Write", "Edit":
		base := filepath.Base(in.ToolInput.FilePath)
		if base == ".env" || strings.HasPrefix(base, ".env.") {
			return "Editing .env files is blocked. Ask the user to change secrets themselves."
		}
		if strings.Contains(filepath.ToSlash(in.ToolInput.FilePath), "/migrations/") && in.ToolName == "Edit" {
			return "Applied migrations are immutable. Create a new migration file instead."
		}
		if secretPattern.MatchString(in.ToolInput.Content + in.ToolInput.NewString) {
			return "This change contains what looks like a secret key. Read it from an environment variable instead."
		}
	case "Bash":
		for _, bad := range dangerousCommands {
			if strings.Contains(in.ToolInput.Command, bad) {
				return fmt.Sprintf("%q is blocked by project policy. Explain to the user what you wanted to do.", bad)
			}
		}
	}
	return ""
}

func main() {
	var in hookInput
	if err := json.NewDecoder(os.Stdin).Decode(&in); err != nil {
		// Fail open on bad input so a hook bug doesn't wedge the session,
		// but say so on stderr.
		fmt.Fprintln(os.Stderr, "guard: could not parse hook input:", err)
		os.Exit(0)
	}
	if reason := check(in); reason != "" {
		fmt.Fprintln(os.Stderr, reason)
		os.Exit(2)
	}
}
