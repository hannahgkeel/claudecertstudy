// CCAR-P config. Blueprint from the public exam guide (v1.0, July 2026).
// Items per exam (largest remainder of 63): D1 11, D2 8, D3 12, D4 10, D5 9, D6 9, D7 4.
// storageKey and seedPrefix must not change once people have saved progress.
MOCK.certs.ccarp = {
  code: 'CCAR-P',
  name: 'Claude Certified Architect – Professional',
  guide: 'v1.0, July 2026',
  items: 63,
  minutes: 120,
  cut: 720,
  storageKey: 'ccarp-mock-v1',
  seedPrefix: 'ccarp-exam-',
  domains: {
    1: { name: 'Solution Design & Architecture', w: 17 },
    2: { name: 'Claude Models, Prompting & Context Engineering', w: 13 },
    3: { name: 'Integration', w: 19 },
    4: { name: 'Evaluation, Testing & Optimization', w: 16 },
    5: { name: 'Governance, Safety & Risk Management', w: 14 },
    6: { name: 'Stakeholder Communication & Lifecycle Management', w: 14 },
    7: { name: 'Developer Productivity & Operational Enablement', w: 7 }
  },
  // Same proportions as CCDV-F's bands. 44 of 63 is the estimated pass mark.
  bands: [
    { min: 54, label: 'Strong', cls: 'ok', note: 'Comfortably above the estimated cut. Keep your weak domains warm and book the exam.' },
    { min: 48, label: 'Likely pass', cls: 'ok', note: 'Above the estimated cut with a small margin. Shore up any domain under 70%.' },
    { min: 44, label: 'Borderline', cls: 'flag', note: 'Right around the estimated cut. One bad day could tip it. Target your weakest domains first.' },
    { min: 0, label: 'Not yet', cls: 'bad', note: 'Below the estimated cut. Work through the answer guide, then retake after studying.' }
  ],
  studyTip: 'Weight your study by blueprint weight: Integration (domain 3) is the largest at 19%, and domains 1 and 4 together are another third.',
  blurb: 'For architects who design, integrate and govern production Claude systems end to end.',
  exams: { 1: [], 2: [], 3: [] }
};
