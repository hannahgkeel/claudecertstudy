package rag

import "testing"

func TestBM25PrefersRareTerms(t *testing.T) {
	ix := NewIndex([]Chunk{
		{ID: "a", Text: "the wire limit is fifteen thousand"},
		{ID: "b", Text: "the the the overdraft fee"},
	})
	got := ix.Search("overdraft", 2, nil)
	if len(got) != 1 || got[0].Chunk.ID != "b" {
		t.Fatalf("want only chunk b, got %+v", got)
	}
}

func TestSearchFilter(t *testing.T) {
	ix := NewIndex([]Chunk{{ID: "old", Version: 2, Text: "wire limit"}, {ID: "new", Version: 3, Text: "wire limit"}})
	got := ix.Search("wire limit", 5, func(c Chunk) bool { return c.Version == 3 })
	if len(got) != 1 || got[0].Chunk.ID != "new" {
		t.Fatalf("filter should drop the old version, got %+v", got)
	}
}

// The naive baseline is the thing to beat; it shouldn't get everything right.
func TestNaiveBaselineMisses(t *testing.T) {
	ix := NewIndex(FixedChunks(Corpus, 400))
	naive := func(q, _ string, k int) []Chunk {
		var out []Chunk
		for _, s := range ix.Search(q, k, nil) {
			out = append(out, s.Chunk)
		}
		return out
	}
	if hits, _ := Eval(naive, 3); hits == len(Questions) {
		t.Fatal("fixed-size chunks with no metadata filter shouldn't pass every question")
	}
}
