#!/usr/bin/env node
// Validates every cert's question banks against its config: item counts, blueprint domain
// counts, IDs, answer indices and rationales. Run from anywhere: node mock-exams/check.js
// Exits non-zero on any problem. Exams with no questions yet are reported but not failed.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const ctx = { MOCK: { certs: {} } };
ctx.window = ctx;
vm.createContext(ctx);
const run = (file) => vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });

const certDir = path.join(root, 'certs');
for (const f of fs.readdirSync(certDir).filter((f) => f.endsWith('.js')).sort()) run(path.join(certDir, f));

// Largest-remainder split of the item count by blueprint weight: the per-exam domain counts.
function blueprint(cfg) {
  const ds = Object.keys(cfg.domains);
  const total = ds.reduce((s, d) => s + cfg.domains[d].w, 0);
  const raw = ds.map((d) => ({ d, x: (cfg.items * cfg.domains[d].w) / total }));
  raw.forEach((r) => { r.n = Math.floor(r.x); });
  let left = cfg.items - raw.reduce((s, r) => s + r.n, 0);
  [...raw].sort((a, b) => (b.x - b.n) - (a.x - a.n)).slice(0, left).forEach((r) => { r.n++; });
  return Object.fromEntries(raw.map((r) => [r.d, r.n]));
}

let errors = 0, pending = 0;
const err = (msg) => { errors++; console.log('  ✗ ' + msg); };

for (const [id, cfg] of Object.entries(ctx.MOCK.certs)) {
  const want = blueprint(cfg);
  console.log(`${cfg.code} (${id}): ${cfg.items} items, domains ${Object.values(want).join('/')}`);
  const seen = new Map();
  for (const n of [1, 2, 3]) {
    const file = path.join(root, 'data', id, `exam${n}.js`);
    if (!fs.existsSync(file)) { pending++; console.log(`  - exam ${n}: no data file yet`); continue; }
    const before = cfg.exams[n].length;
    try { run(file); } catch (e) { err(`exam ${n}: ${path.relative(root, file)} does not load: ${e.message}`); continue; }
    const qs = cfg.exams[n].slice(before);
    if (!qs.length) { pending++; console.log(`  - exam ${n}: no questions yet`); continue; }
    const start = errors;
    if (qs.length !== cfg.items) err(`exam ${n}: ${qs.length} items, expected ${cfg.items}`);
    const got = {};
    const prefix = qs[0].id.split('-')[0].replace(/\d+$/, '');
    for (const q of qs) {
      const where = `exam ${n} ${q.id || '(no id)'}`;
      if (!/^[a-z]+\d-\d{2}$/.test(q.id || '') || !q.id.startsWith(prefix + n + '-')) err(`${where}: id should look like ${prefix}${n}-01`);
      if (seen.has(q.id)) err(`${where}: duplicate id (also in exam ${seen.get(q.id)})`);
      seen.set(q.id, n);
      if (!cfg.domains[q.d]) err(`${where}: unknown domain ${q.d}`);
      got[q.d] = (got[q.d] || 0) + 1;
      for (const k of ['s', 'stem', 'why']) if (typeof q[k] !== 'string' || !q[k].trim()) err(`${where}: missing ${k}`);
      if (!Array.isArray(q.o) || q.o.length < 2) { err(`${where}: needs at least 2 options`); continue; }
      q.o.forEach((o, i) => {
        if (!Array.isArray(o) || o.length !== 2 || !String(o[0]).trim() || !String(o[1]).trim()) err(`${where}: option ${i} needs [text, rationale]`);
      });
      if (!Array.isArray(q.a) || !q.a.length) { err(`${where}: no correct answers`); continue; }
      if (new Set(q.a).size !== q.a.length || q.a.some((i) => !Number.isInteger(i) || i < 0 || i >= q.o.length)) err(`${where}: bad answer indices ${JSON.stringify(q.a)}`);
      const two = /\bTWO\b/.test(q.stem), three = /\bTHREE\b/.test(q.stem);
      if (two && q.a.length !== 2) err(`${where}: stem says TWO but has ${q.a.length} answers`);
      if (three && q.a.length !== 3) err(`${where}: stem says THREE but has ${q.a.length} answers`);
      if (!two && !three && q.a.length !== 1) err(`${where}: ${q.a.length} answers but the stem doesn't say how many to choose`);
    }
    for (const d of Object.keys(want)) {
      if ((got[d] || 0) !== want[d]) err(`exam ${n}: domain ${d} has ${got[d] || 0} items, blueprint says ${want[d]}`);
    }
    if (errors === start) console.log(`  ✓ exam ${n}: ${qs.length} items`);
  }
}

console.log(errors ? `\n${errors} problem(s) found.` : `\nAll loaded exams pass.${pending ? ` ${pending} exam(s) have no questions yet.` : ''}`);
process.exit(errors ? 1 : 0);
