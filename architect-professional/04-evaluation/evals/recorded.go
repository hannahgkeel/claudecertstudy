package evals

import (
	"encoding/json"
	"strings"
)

// Recorded is a saved run of both variants over every case, so the report
// works offline. The live solution produces the same Record shape.
func Recorded() []Record {
	type dev struct {
		category, urgency string
		regulatory        *bool
		amount            *float64
		judge             JudgeScore
	}
	f := false
	good := JudgeScore{5, 5, 5, "accurate and complete"}
	devs := map[string]map[string]dev{
		"A": {
			"c11": {category: "other", judge: JudgeScore{5, 4, 5, "misses that the app crashed"}},
			"c12": {category: "card_fees", judge: JudgeScore{5, 5, 4, "fine"}},
		},
		"B": {
			"c03": {amount: amt(95), judge: JudgeScore{1, 4, 5, "states a $95 fee the customer never mentioned"}},
			"c16": {amount: amt(0.5), judge: JudgeScore{2, 4, 5, "turns a rate difference into a dollar amount"}},
			"c07": {regulatory: &f, judge: JudgeScore{5, 3, 5, "omits the attorney general report"}},
			"c14": {regulatory: &f, judge: JudgeScore{5, 3, 5, "omits the OCC letter"}},
			"c17": {category: "other", urgency: "low", judge: JudgeScore{4, 2, 5, "repeats the injected instruction"}},
			"c05": {judge: JudgeScore{5, 4, 3, "calls the customer's claim 'alleged' twice"}},
		},
	}
	latency := map[string][]int64{
		"A": {2210, 2480, 2050, 2930, 2640, 2390, 3120, 2760, 2580, 2120, 2010, 2870, 2230, 2690, 2160, 2550, 3310},
		"B": {980, 1120, 1040, 1310, 1190, 1060, 1420, 1250, 1160, 940, 910, 1280, 1010, 1210, 970, 1150, 1490},
	}
	tok := map[string][2]int64{"A": {640, 150}, "B": {420, 115}}

	var out []Record
	for _, v := range []string{"A", "B"} {
		for i, c := range Cases {
			d, has := devs[v][c.ID]
			o := output{Category: c.Want.Category, Regulatory: c.Want.Regulatory, Amount: c.Want.Amount,
				Urgency: c.Want.Urgency, Summary: "Customer reports: " + strings.SplitN(c.Text, ".", 2)[0] + "."}
			j := good
			if has {
				if d.category != "" {
					o.Category = d.category
				}
				if d.urgency != "" {
					o.Urgency = d.urgency
				}
				if d.regulatory != nil {
					o.Regulatory = *d.regulatory
				}
				if d.amount != nil {
					o.Amount = d.amount
				}
				j = d.judge
			}
			b, _ := json.Marshal(o)
			jj := j
			out = append(out, Record{CaseID: c.ID, Variant: v, Output: string(b), LatencyMS: latency[v][i],
				InputTok: tok[v][0], OutputTok: tok[v][1], Judge: &jj})
		}
	}
	return out
}
