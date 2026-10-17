// Package corpus is a tiny fake document store the research subagent searches.
package corpus

import (
	"encoding/json"
	"strings"
)

type Doc struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Year   int    `json:"year"`
	Body   string `json:"body"`
	Source string `json:"source"`
}

var docs = []Doc{
	{"D1", "Heat pump adoption in cold climates", 2024,
		"Field trials in Maine and Norway found modern cold-climate heat pumps kept COP above 2.0 down to -15C. Installation costs averaged $14,000 per home before incentives.",
		"Regional Energy Lab report"},
	{"D2", "Heat pumps and grid peak demand", 2023,
		"Utility modelling shows winter peak demand could rise 20-35% by 2040 if heat pump adoption reaches 60% without demand response programs.",
		"Grid Operators Association"},
	{"D3", "Consumer barriers to heat pump retrofits", 2024,
		"Surveys of 3,000 homeowners list upfront cost (61%), installer availability (38%) and uncertainty about cold-weather performance (33%) as top barriers.",
		"Home Retrofit Survey"},
	{"D4", "Heat pump incentives: a policy review", 2025,
		"Rebates of $2,000-$8,000 raised adoption 2-3x in pilot regions. Income-targeted rebates reached lower-income households more effectively than flat tax credits.",
		"Policy Institute brief"},
	{"D5", "Refrigerant choices and emissions", 2023,
		"Switching from R-410A to R-290 (propane) reduces refrigerant global warming potential by over 99%, but needs updated safety codes for indoor units.",
		"Climate Tech Review"},
	{"D6", "Heat pump installer workforce", 2025,
		"Training programmes certified 12,000 new installers in 2024, still short of the estimated 30,000 needed by 2030 to meet adoption targets.",
		"Workforce Council"},
}

// Search returns docs whose title or body contains any query word (very naive).
func Search(query string) string {
	words := strings.Fields(strings.ToLower(query))
	var hits []Doc
	for _, d := range docs {
		text := strings.ToLower(d.Title + " " + d.Body)
		for _, w := range words {
			if len(w) > 3 && strings.Contains(text, w) {
				hits = append(hits, d)
				break
			}
		}
	}
	b, _ := json.Marshal(map[string]any{"query": query, "results": hits})
	return string(b)
}
