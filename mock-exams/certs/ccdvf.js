// CCDV-F config. Blueprint from the public exam guide (v1.0, July 2026).
// storageKey and seedPrefix must not change: they keep saved progress and question order stable.
MOCK.certs.ccdvf = {
  code: 'CCDV-F',
  name: 'Claude Certified Developer – Foundations',
  guide: 'v1.0, July 2026',
  items: 53,
  minutes: 120,
  cut: 720,
  storageKey: 'ccdvf-mock-v1',
  seedPrefix: 'ccdvf-exam-',
  domains: {
    1: { name: 'Agents and Workflows', w: 14.7 },
    2: { name: 'Applications and Integration', w: 33.1 },
    3: { name: 'Claude Code', w: 3.1 },
    4: { name: 'Eval, Testing, and Debugging', w: 2.6 },
    5: { name: 'Model Selection and Optimization', w: 16.8 },
    6: { name: 'Prompt and Context Engineering', w: 11.0 },
    7: { name: 'Security and Safety', w: 8.1 },
    8: { name: 'Tools and MCPs', w: 10.6 }
  },
  // Highest first. A score lands in the first band whose min it reaches.
  bands: [
    { min: 45, label: 'Strong', cls: 'ok', note: 'Comfortably above the estimated cut. Keep your weak domains warm and book the exam.' },
    { min: 40, label: 'Likely pass', cls: 'ok', note: 'Above the estimated cut with a small margin. Shore up any domain under 70%.' },
    { min: 37, label: 'Borderline', cls: 'flag', note: 'Right around the estimated cut. One bad day could tip it. Target your weakest domains first.' },
    { min: 0, label: 'Not yet', cls: 'bad', note: 'Below the estimated cut. Work through the answer guide, then retake after studying.' }
  ],
  studyTip: 'Weight your study by blueprint weight: domain 2 alone is a third of the exam.',
  blurb: 'For engineers who build with the Claude API, Claude Code and MCP.',
  exams: { 1: [], 2: [], 3: [] }
};
