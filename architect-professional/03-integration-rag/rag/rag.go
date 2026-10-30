package rag

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"unicode"
)

// Chunk is the unit that gets indexed and retrieved.
type Chunk struct {
	ID         string
	DocID      string
	Version    int
	Section    string
	Effective  string
	Superseded string
	Text       string // what gets indexed and shown to the model
}

// FixedChunks is the naive strategy: cut every body into fixed-size pieces,
// ignoring headings, tables and document metadata.
func FixedChunks(docs []Doc, size int) []Chunk {
	var out []Chunk
	for _, d := range docs {
		body := []rune(d.Body)
		for i, n := 0, 0; i < len(body); i, n = i+size, n+1 {
			end := min(i+size, len(body))
			out = append(out, Chunk{
				ID: fmt.Sprintf("%s-v%d@%d", d.ID, d.Version, n), DocID: d.ID, Version: d.Version,
				Effective: d.Effective, Superseded: d.Superseded, Text: string(body[i:end]),
			})
		}
	}
	return out
}

// ---------- BM25: keyword retrieval, good at exact terms, IDs and numbers ----------

func Tokens(s string) []string {
	return strings.FieldsFunc(strings.ToLower(s), func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '-'
	})
}

type Index struct {
	chunks []Chunk
	tf     []map[string]int
	df     map[string]int
	length []int
	avg    float64
}

func NewIndex(chunks []Chunk) *Index {
	ix := &Index{chunks: chunks, df: map[string]int{}}
	total := 0
	for _, c := range chunks {
		tf := map[string]int{}
		toks := Tokens(c.Text)
		for _, t := range toks {
			tf[t]++
		}
		for t := range tf {
			ix.df[t]++
		}
		ix.tf = append(ix.tf, tf)
		ix.length = append(ix.length, len(toks))
		total += len(toks)
	}
	if len(chunks) > 0 {
		ix.avg = float64(total) / float64(len(chunks))
	}
	return ix
}

type Scored struct {
	Chunk Chunk
	Score float64
}

// Search ranks the chunks that pass keep (nil keeps all) and returns the top k.
func (ix *Index) Search(query string, k int, keep func(Chunk) bool) []Scored {
	const k1, b = 1.2, 0.75
	n := float64(len(ix.chunks))
	var out []Scored
	for i, c := range ix.chunks {
		if keep != nil && !keep(c) {
			continue
		}
		score := 0.0
		for _, q := range Tokens(query) {
			f := float64(ix.tf[i][q])
			if f == 0 {
				continue
			}
			df := float64(ix.df[q])
			idf := math.Log(1 + (n-df+0.5)/(df+0.5))
			score += idf * f * (k1 + 1) / (f + k1*(1-b+b*float64(ix.length[i])/ix.avg))
		}
		if score > 0 {
			out = append(out, Scored{c, score})
		}
	}
	sort.SliceStable(out, func(a, b int) bool { return out[a].Score > out[b].Score })
	if len(out) > k {
		out = out[:k]
	}
	return out
}

// ---------- offline retrieval eval ----------

// Question has a known right answer: a chunk from this doc version containing Want.
type Question struct {
	Q       string
	AsOf    string
	DocID   string
	Version int
	Want    string
}

var Questions = []Question{
	{"What's the online wire limit for a personal account?", "2026-10-20", "POL-114", 3, "$15,000"},
	{"Under POL-114, when does a wire need a callback?", "2026-10-20", "POL-114", 3, "over $5,000"},
	{"What is the cut-off time for international wires?", "2026-10-20", "POL-114", 3, "International wires received by 2:00 pm"},
	{"Can a teller refund a second overdraft fee in the same year?", "2026-10-20", "POL-207", 1, "one overdraft fee per account"},
	{"A customer wants to change their phone number. Which verification level applies?", "2026-10-20", "POL-311", 1, "Level 2"},
	{"How long does a FRM-W8 stay valid?", "2026-10-20", "FRM-W8", 1, "third calendar year"},
	{"Back in March 2025, what was the online wire limit for a personal account?", "2025-03-15", "POL-114", 2, "$25,000"},
}

// Retriever is any retrieval strategy under test.
type Retriever func(query, asOf string, k int) []Chunk

type Result struct {
	Question Question
	Hit      bool
	Got      []string // retrieved chunk IDs
	Stale    int      // retrieved chunks from a version not in force on the as-of date
}

// Eval reports recall@k: how often a correct chunk is in the top k.
func Eval(r Retriever, k int) (hits int, results []Result) {
	for _, q := range Questions {
		got := r(q.Q, q.AsOf, k)
		res := Result{Question: q}
		for _, c := range got {
			res.Got = append(res.Got, c.ID)
			if c.Effective > q.AsOf || (c.Superseded != "" && c.Superseded <= q.AsOf) {
				res.Stale++
			}
			if c.DocID == q.DocID && c.Version == q.Version && strings.Contains(c.Text, q.Want) {
				res.Hit = true
			}
		}
		if res.Hit {
			hits++
		}
		results = append(results, res)
	}
	return hits, results
}

// PrintEval prints a recall table.
func PrintEval(name string, r Retriever, k int) int {
	hits, results := Eval(r, k)
	stale := 0
	for _, res := range results {
		stale += res.Stale
	}
	fmt.Printf("%s: recall@%d = %d/%d, stale chunks retrieved = %d\n", name, k, hits, len(results), stale)
	for _, res := range results {
		mark := "ok  "
		if !res.Hit {
			mark = "MISS"
		}
		note := ""
		if res.Stale > 0 {
			note = fmt.Sprintf("  (%d stale)", res.Stale)
		}
		fmt.Printf("  %s %-80s -> %v%s\n", mark, res.Question.Q, res.Got, note)
	}
	return hits
}
