// CCDV-F mock exam runner. Plain JS, no build step. Question data lives in data/*.js.
(function () {
  'use strict';

  var DOMAINS = {
    1: { name: 'Agents and Workflows', w: 14.7 },
    2: { name: 'Applications and Integration', w: 33.1 },
    3: { name: 'Claude Code', w: 3.1 },
    4: { name: 'Eval, Testing, and Debugging', w: 2.6 },
    5: { name: 'Model Selection and Optimization', w: 16.8 },
    6: { name: 'Prompt and Context Engineering', w: 11.0 },
    7: { name: 'Security and Safety', w: 8.1 },
    8: { name: 'Tools and MCPs', w: 10.6 }
  };
  var EXAMS = [1, 2, 3];
  var TIME_MS = 120 * 60 * 1000;
  var KEY = 'ccdvf-mock-v1';
  var LETTERS = 'ABCDEFGH';
  var CUT = 720;
  var WEAK = 0.7;

  var bank = window.CCDVF.exams;
  var app = document.getElementById('app');
  var state = null;
  var ui = { confirm: null, guide: { mode: 'all', domain: 0 }, guideOk: {}, jump: null, focus: null, scroll: false, copied: false, notice: null };

  // ---------- deterministic ordering (stable numbering across attempts and the guide) ----------
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(arr, seedStr) {
    var a = arr.slice(), r = rng(hash(seedStr));
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var built = {};
  function exam(n) {
    if (!built[n]) {
      built[n] = shuffled(bank[n], 'ccdvf-exam-' + n).map(function (q, i) {
        return { q: q, num: i + 1, order: shuffled(q.o.map(function (_, j) { return j; }), q.id) };
      });
    }
    return built[n];
  }
  function letterOf(item, oi) { return LETTERS[item.order.indexOf(oi)]; }
  function lettersOf(item, arr) { return arr.map(function (oi) { return letterOf(item, oi); }).sort().join(', '); }
  function isCorrect(item, got) {
    if (!got || got.length !== item.q.a.length) return false;
    return item.q.a.every(function (oi) { return got.indexOf(oi) >= 0; });
  }

  // ---------- storage (per-browser convenience; the page works without it) ----------
  function blank() { return { status: 'new', answers: {}, flags: {}, remaining: TIME_MS, current: 0, result: null }; }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || s.v !== 1 || !s.exams) s = { v: 1, exams: {} };
    EXAMS.forEach(function (n) { if (!s.exams[n]) s.exams[n] = blank(); });
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function fmt(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); }
  function clock(ms) {
    var t = Math.max(0, Math.round(ms / 1000));
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function pct(c, t) { return t ? Math.round((c / t) * 100) : 0; }
  function scaled(c, t) { return Math.round(100 + 900 * (t ? c / t : 0)); }
  function answeredCount(n) { return Object.keys(state.exams[n].answers).length; }
  function band(correct) {
    if (correct >= 45) return { label: 'Strong', cls: 'ok', note: 'Comfortably above the estimated cut. Keep your weak domains warm and book the exam.' };
    if (correct >= 40) return { label: 'Likely pass', cls: 'ok', note: 'Above the estimated cut with a small margin. Shore up any domain under 70%.' };
    if (correct >= 37) return { label: 'Borderline', cls: 'flag', note: 'Right around the estimated cut. One bad day could tip it. Target your weakest domains first.' };
    return { label: 'Not yet', cls: 'bad', note: 'Below the estimated cut. Work through the answer guide, then retake after studying.' };
  }
  function domainCounts(n) {
    var c = {};
    bank[n].forEach(function (q) { c[q.d] = (c[q.d] || 0) + 1; });
    return c;
  }

  // ---------- routing ----------
  function route() {
    var h = (location.hash || '').replace('#', '');
    var m = /^(exam|review|results|guide)([123])$/.exec(h);
    return m ? { view: m[1], n: +m[2] } : { view: 'home', n: 0 };
  }
  function go(h) {
    ui.scroll = true;
    if ((location.hash || '').replace('#', '') === h) render();
    else location.hash = h;
  }

  // ---------- timer ----------
  var tick = null, last = 0, beats = 0;
  function startTimer(n) {
    if (tick) return;
    last = Date.now();
    tick = setInterval(function () {
      var st = state.exams[n], now = Date.now();
      st.remaining = Math.max(0, st.remaining - (now - last));
      last = now;
      paintTimer(st.remaining);
      if (++beats % 5 === 0) save();
      if (st.remaining <= 0) { stopTimer(); ui.notice = 'timeout'; submit(n, true); }
    }, 1000);
  }
  function stopTimer() { if (tick) { clearInterval(tick); tick = null; save(); } }
  function paintTimer(ms) {
    var el = document.getElementById('timer');
    if (!el) return;
    el.textContent = clock(ms);
    el.className = 'timer' + (ms <= 0 ? ' out' : ms <= 10 * 60 * 1000 ? ' low' : '');
  }

  // ---------- actions ----------
  function submit(n, timedOut) {
    var st = state.exams[n], items = exam(n), dom = {}, correct = 0;
    items.forEach(function (it) {
      var ok = isCorrect(it, st.answers[it.q.id]);
      if (ok) correct++;
      dom[it.q.d] = dom[it.q.d] || { c: 0, t: 0 };
      dom[it.q.d].t++;
      if (ok) dom[it.q.d].c++;
    });
    st.result = { correct: correct, total: items.length, domains: dom, timedOut: !!timedOut, usedMs: TIME_MS - st.remaining, at: Date.now() };
    st.status = 'submitted';
    ui.confirm = null;
    save();
    go('results' + n);
  }

  function pick(n, oi) {
    var st = state.exams[n], item = exam(n)[st.current], id = item.q.id, need = item.q.a.length;
    var cur = (st.answers[id] || []).slice();
    if (need === 1) cur = [oi];
    else {
      var i = cur.indexOf(oi);
      if (i >= 0) cur.splice(i, 1);
      else if (cur.length < need) cur.push(oi);
      else return;
    }
    if (cur.length) st.answers[id] = cur; else delete st.answers[id];
    save();
    ui.focus = 'opt-' + id + '-' + oi;
    render();
  }

  function act(a, d) {
    var r = route(), n = +(d.n || r.n), st = n ? state.exams[n] : null;
    switch (a) {
      case 'home': go(''); break;
      case 'start':
        state.exams[n] = blank(); state.exams[n].status = 'in_progress'; save(); go('exam' + n); break;
      case 'resume': go('exam' + n); break;
      case 'goto': st.current = +d.i; save(); if (r.view === 'exam') { ui.scroll = true; render(); } else go('exam' + n); break;
      case 'prev': if (st.current > 0) { st.current--; save(); ui.scroll = true; render(); } break;
      case 'next':
        if (st.current < exam(n).length - 1) { st.current++; save(); ui.scroll = true; render(); } else go('review' + n);
        break;
      case 'flag':
        var fid = exam(n)[st.current].q.id;
        if (st.flags[fid]) delete st.flags[fid]; else st.flags[fid] = true;
        save(); render(); break;
      case 'to-review': go('review' + n); break;
      case 'exit': stopTimer(); go(''); break;
      case 'ask': ui.confirm = d.what + '-' + n; render(); break;
      case 'cancel': ui.confirm = null; render(); break;
      case 'submit': submit(n, false); break;
      case 'reset': stopTimer(); state.exams[n] = blank(); ui.confirm = null; save(); go(''); break;
      case 'guide': go('guide' + n); break;
      case 'guide-show': ui.guideOk[n] = true; render(); break;
      case 'guide-mode': ui.guide.mode = d.mode; render(); break;
      case 'results': go('results' + n); break;
      case 'jump': ui.guideOk[n] = true; ui.guide = { mode: 'all', domain: 0 }; ui.jump = +d.i; go('guide' + n); break;
      case 'copy': copyResults(n); break;
    }
  }

  function copyResults(n) {
    var box = document.getElementById('copybox');
    var text = box ? box.value : resultText(n);
    var done = function () { ui.copied = true; render(); setTimeout(function () { ui.copied = false; if (route().view === 'results') render(); }, 2500); };
    var fallback = function () { if (box) { box.focus(); box.select(); } };
    try {
      navigator.clipboard.writeText(text).then(done, fallback);
    } catch (e) { fallback(); }
  }

  // ---------- views ----------
  function viewHome() {
    var counts = EXAMS.map(domainCounts);
    var cards = EXAMS.map(function (n) {
      var st = state.exams[n], chip, detail, actions;
      if (st.status === 'submitted') {
        var r = st.result, b = band(r.correct);
        chip = '<span class="chip ' + b.cls + '">' + b.label + '</span>';
        detail = '<p><span class="mono">' + scaled(r.correct, r.total) + '</span> estimated · ' + r.correct + ' of ' + r.total + ' correct</p>';
        actions = '<button class="btn primary" data-act="results" data-n="' + n + '">Score report</button>' +
          '<button class="btn" data-act="guide" data-n="' + n + '">Answer guide</button>' +
          '<button class="btn ghost danger" data-act="ask" data-what="reset" data-n="' + n + '">Retake</button>';
      } else if (st.status === 'in_progress') {
        chip = '<span class="chip live">In progress</span>';
        detail = '<p>' + answeredCount(n) + ' of 53 answered · <span class="mono">' + clock(st.remaining) + '</span> left</p>';
        actions = '<button class="btn primary" data-act="resume" data-n="' + n + '">Resume</button>' +
          '<button class="btn" data-act="guide" data-n="' + n + '">Answer guide</button>' +
          '<button class="btn ghost danger" data-act="ask" data-what="reset" data-n="' + n + '">Reset</button>';
      } else {
        chip = '<span class="chip">Not started</span>';
        detail = '<p class="muted">53 questions · 120 minutes</p>';
        actions = '<button class="btn primary" data-act="start" data-n="' + n + '">Start exam</button>' +
          '<button class="btn" data-act="guide" data-n="' + n + '">Answer guide</button>';
      }
      var confirm = ui.confirm === 'reset-' + n
        ? '<div class="confirm"><p>' + (st.status === 'submitted' ? 'Clear this score and start over?' : 'Clear your answers and timer for this exam?') + '</p>' +
          '<div class="row"><button class="btn small danger" data-act="reset" data-n="' + n + '">Yes, clear it</button><button class="btn small" data-act="cancel">Keep it</button></div></div>'
        : '';
      return '<article class="panel exam-card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Mock exam ' + n + '</span>' + chip + '</div>' +
        '<h2>Exam ' + n + '</h2>' + detail + confirm + '<div class="actions">' + actions + '</div></article>';
    }).join('');

    var rows = Object.keys(DOMAINS).map(function (d) {
      return '<tr><td>' + d + '. ' + esc(DOMAINS[d].name) + '</td><td class="num">' + DOMAINS[d].w.toFixed(1) + '%</td><td class="num">' +
        counts.map(function (c) { return c[d] || 0; }).join(' / ') + '</td></tr>';
    }).join('');

    return '<div class="wrap">' +
      '<header class="masthead"><span class="eyebrow">Claude Certified Developer – Foundations · practice</span>' +
      '<h1>CCDV-F Mock Exams</h1>' +
      '<p>Three timed practice exams built from the public CCDV-F exam guide. Each one matches the real format: 53 multiple-choice and multiple-response items in 120 minutes, spread across the eight domains by blueprint weight. Every answer comes with an explanation of why each option is right or wrong.</p>' +
      '<div class="facts"><span><b>53</b> items</span><span><b>120</b> minutes</span><span>scaled <b>100–1,000</b></span><span>pass <b>720</b></span><span><b>8</b> domains</span></div></header>' +
      '<section class="exams">' + cards + '</section>' +
      '<h2 class="section-title">How each exam is built</h2>' +
      '<div class="table-wrap"><table><thead><tr><th>Domain</th><th class="num">Blueprint weight</th><th class="num">Items in exam 1 / 2 / 3</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<h2 class="section-title">Scoring rubric</h2>' + rubricHtml() +
      '<p class="muted" style="margin-top:28px;font-size:14px;max-width:72ch">Unofficial practice material, written for study from the public CCDV-F exam guide (v1.0, July 2026). These are not questions from the real exam. Your answers and timer are saved in this browser only. The timer pauses when you choose Save and exit; the real exam does not pause.</p>' +
      '</div>';
  }

  function rubricHtml() {
    return '<div class="rubric">' +
      '<div class="panel"><h3>How items are scored</h3><ul>' +
      '<li>Each item is worth 1 point. 53 points in total.</li>' +
      '<li>Multiple-response items say how many to choose. You get the point only if you pick exactly the right set. No partial credit.</li>' +
      '<li>Unanswered items score 0. There is no penalty for guessing, so answer everything.</li></ul></div>' +
      '<div class="panel"><h3>Estimated scaled score</h3><p>The real exam converts raw scores to a 100–1,000 scale with a cut of 720, and doesn\'t publish the conversion. This page estimates it linearly: <span class="mono">100 + 900 × (correct ÷ 53)</span>. On that estimate, 720 is about 69%, so <b>37 of 53</b> passes.</p></div>' +
      '<div class="panel"><h3>Readiness bands</h3>' +
      '<div class="band"><span>Strong</span><span class="mono">45–53</span></div>' +
      '<div class="band"><span>Likely pass</span><span class="mono">40–44</span></div>' +
      '<div class="band"><span>Borderline</span><span class="mono">37–39</span></div>' +
      '<div class="band"><span>Not yet</span><span class="mono">0–36</span></div></div>' +
      '<div class="panel"><h3>Using the score report</h3><ul>' +
      '<li>Any domain under 70% is a study target. Weight your study by blueprint weight: domain 2 alone is a third of the exam.</li>' +
      '<li>Read the explanation for every missed and every flagged question, including the ones you guessed right.</li>' +
      '<li>Use "Copy results for Claude" and paste it into your Claude Code session to go through your misses together.</li></ul></div>' +
      '</div>';
  }

  function viewExam(n) {
    var st = state.exams[n], items = exam(n), item = items[st.current], q = item.q, need = q.a.length;
    var got = st.answers[q.id] || [], flagged = !!st.flags[q.id], multi = need > 1, full = multi && got.length >= need;
    var opts = item.order.map(function (oi, k) {
      var on = got.indexOf(oi) >= 0, locked = full && !on, id = 'opt-' + q.id + '-' + oi;
      return '<label class="opt' + (multi ? ' multi' : '') + (on ? ' on' : '') + (locked ? ' locked' : '') + '" for="' + id + '">' +
        '<input type="' + (multi ? 'checkbox' : 'radio') + '" name="opt-' + q.id + '" id="' + id + '" data-oi="' + oi + '"' + (on ? ' checked' : '') + (locked ? ' disabled' : '') + '>' +
        '<span class="letter">' + LETTERS[k] + '</span><span>' + fmt(q.o[oi][0]) + '</span></label>';
    }).join('');
    var done = answeredCount(n);
    var notice = st.current === 0 && done === 0
      ? '<div class="notice">The timer is running. Use the navigator to jump between questions and flag any you want to revisit. Keys: <span class="mono">A–E</span> choose, <span class="mono">N</span>/<span class="mono">P</span> next and previous, <span class="mono">F</span> flag.</div>'
      : '';
    var last = st.current === items.length - 1;
    return topbar(n, 'Question ' + item.num + ' of ' + items.length, done / items.length) +
      '<div class="wrap" style="padding-top:0"><div class="console">' +
      '<main class="panel stack" aria-labelledby="stem">' + notice +
      '<div class="qhead"><span class="qnum">Question ' + item.num + '</span>' + (flagged ? '<span class="chip flag">Flagged for review</span>' : '') + '</div>' +
      '<div class="stem" id="stem"><p>' + fmt(q.stem) + '</p></div>' +
      '<p class="select-note">Choose ' + need + '.' + (multi ? ' <span class="muted" style="font-weight:400">(' + got.length + ' of ' + need + ' selected)</span>' : '') + '</p>' +
      '<fieldset class="options"><legend class="muted" style="position:absolute;left:-9999px">Answer options</legend>' + opts + '</fieldset>' +
      '<div class="qnav"><button class="btn" data-act="prev" data-n="' + n + '"' + (st.current === 0 ? ' disabled' : '') + '>Previous</button>' +
      '<button class="btn flagbtn' + (flagged ? ' on' : '') + '" data-act="flag" data-n="' + n + '">' + (flagged ? 'Unflag' : 'Flag for review') + '</button>' +
      '<button class="btn primary" data-act="next" data-n="' + n + '">' + (last ? 'Review answers' : 'Next') + '</button></div>' +
      '</main>' + rail(n, false) + '</div></div>';
  }

  function topbar(n, label, frac) {
    var st = state.exams[n];
    return '<header class="topbar"><div class="topbar-inner">' +
      '<div class="title"><span class="eyebrow">CCDV-F · Mock exam ' + n + '</span><strong>' + label + '</strong></div>' +
      '<div class="row"><span id="timer" class="timer" aria-label="Time remaining">' + clock(st.remaining) + '</span>' +
      '<button class="btn small" data-act="to-review" data-n="' + n + '">Review and submit</button>' +
      '<button class="btn small ghost" data-act="exit" data-n="' + n + '">Save and exit</button></div>' +
      '</div><div class="progress"><span style="width:' + Math.round(frac * 100) + '%"></span></div></header>';
  }

  function rail(n, wide) {
    var st = state.exams[n], items = exam(n), done = answeredCount(n), flags = Object.keys(st.flags).length;
    var cells = items.map(function (it, i) {
      var c = 'cell' + (st.answers[it.q.id] ? ' answered' : '') + (st.flags[it.q.id] ? ' flagged' : '') + (!wide && i === st.current ? ' current' : '');
      return '<button class="' + c + '" data-act="goto" data-n="' + n + '" data-i="' + i + '" aria-label="Question ' + it.num + (st.answers[it.q.id] ? ', answered' : ', not answered') + (st.flags[it.q.id] ? ', flagged' : '') + '">' + it.num + '</button>';
    }).join('');
    return '<aside class="' + (wide ? '' : 'rail ') + 'panel stack" aria-label="Question navigator">' +
      '<div class="row" style="justify-content:space-between"><strong>Navigator</strong><span class="mono muted">' + done + '/53</span></div>' +
      '<div class="legend"><span><i class="sw answered"></i>Answered</span><span><i class="sw"></i>Not answered</span><span><i class="sw flagged"></i>Flagged (' + flags + ')</span></div>' +
      '<div class="grid">' + cells + '</div></aside>';
  }

  function viewReview(n) {
    var st = state.exams[n], items = exam(n), done = answeredCount(n);
    var open = items.filter(function (it) { return !st.answers[it.q.id]; }).map(function (it) { return it.num; });
    var flagged = items.filter(function (it) { return st.flags[it.q.id]; }).map(function (it) { return it.num; });
    var confirm = ui.confirm === 'submit-' + n
      ? '<div class="confirm"><p><b>Submit exam ' + n + '?</b> You can\'t change answers after submitting.' + (open.length ? ' ' + open.length + ' question' + (open.length === 1 ? ' is' : 's are') + ' still unanswered and will score 0.' : '') + '</p>' +
        '<div class="row"><button class="btn primary" data-act="submit" data-n="' + n + '">Submit now</button><button class="btn" data-act="cancel">Keep working</button></div></div>'
      : '<div class="row"><button class="btn primary" data-act="ask" data-what="submit" data-n="' + n + '">Submit exam</button><button class="btn" data-act="goto" data-n="' + n + '" data-i="' + st.current + '">Back to question ' + exam(n)[st.current].num + '</button></div>';
    return topbar(n, 'Review before submitting', done / items.length) +
      '<div class="wrap"><div class="stack" style="max-width:820px">' +
      '<div class="panel stack"><h1 style="font-size:26px">Review your answers</h1>' +
      '<div class="facts"><span><b>' + done + '</b> answered</span><span><b>' + open.length + '</b> unanswered</span><span><b>' + flagged.length + '</b> flagged</span></div>' +
      (open.length ? '<p>Unanswered: <span class="mono">' + open.join(', ') + '</span></p>' : '<p>Every question has an answer.</p>') +
      (flagged.length ? '<p>Flagged: <span class="mono">' + flagged.join(', ') + '</span></p>' : '') +
      confirm + '</div>' + rail(n, true) + '</div></div>';
  }

  function resultText(n) {
    var st = state.exams[n], r = st.result, items = exam(n), lines = [];
    var when = new Date(r.at);
    lines.push('CCDV-F mock exam ' + n + ', submitted ' + when.toISOString().slice(0, 16).replace('T', ' ') + ' UTC');
    lines.push('Score: ' + r.correct + '/' + r.total + ' correct (' + pct(r.correct, r.total) + '%), estimated scaled score ' + scaled(r.correct, r.total) + ' (cut ' + CUT + '), band: ' + band(r.correct).label);
    lines.push('Time used: ' + clock(r.usedMs) + (r.timedOut ? ' (ran out of time)' : ''));
    lines.push('By domain:');
    Object.keys(DOMAINS).forEach(function (d) {
      var x = r.domains[d] || { c: 0, t: 0 };
      lines.push('- D' + d + ' ' + DOMAINS[d].name + ': ' + x.c + '/' + x.t + ' (' + pct(x.c, x.t) + '%)');
    });
    var missed = items.filter(function (it) { return !isCorrect(it, st.answers[it.q.id]); });
    lines.push('Missed (' + missed.length + '):');
    missed.forEach(function (it) {
      var got = st.answers[it.q.id];
      lines.push('- Q' + it.num + ' [' + it.q.id + ', D' + it.q.d + ' ' + it.q.s + ']: answered ' + (got ? lettersOf(it, got) : 'nothing') + '; correct ' + lettersOf(it, it.q.a));
    });
    var flagged = items.filter(function (it) { return st.flags[it.q.id]; });
    lines.push('Flagged: ' + (flagged.length ? flagged.map(function (it) { return 'Q' + it.num + ' [' + it.q.id + ']' + (isCorrect(it, st.answers[it.q.id]) ? ' (right)' : ' (wrong)'); }).join(', ') : 'none'));
    return lines.join('\n');
  }

  function viewResults(n) {
    var st = state.exams[n], r = st.result, items = exam(n), sc = scaled(r.correct, r.total), b = band(r.correct);
    var fillPct = ((sc - 100) / 900) * 100, cutPct = ((CUT - 100) / 900) * 100;
    var pass = sc >= CUT;
    var drows = Object.keys(DOMAINS).map(function (d) {
      var x = r.domains[d] || { c: 0, t: 0 }, p = pct(x.c, x.t), weak = x.t && x.c / x.t < WEAK;
      return '<tr><td>' + d + '. ' + esc(DOMAINS[d].name) + (weak ? ' <span class="chip flag">Study</span>' : '') + '</td>' +
        '<td class="num">' + DOMAINS[d].w.toFixed(1) + '%</td><td class="num">' + x.c + '/' + x.t + '</td><td class="num">' + p + '%</td>' +
        '<td style="width:30%"><div class="dbar' + (weak ? ' weak' : '') + '"><span style="width:' + p + '%"></span></div></td></tr>';
    }).join('');
    var cells = items.map(function (it, i) {
      var got = st.answers[it.q.id], c = 'cell ' + (isCorrect(it, got) ? 'ok' : 'bad') + (st.flags[it.q.id] ? ' flagged' : '');
      return '<button class="' + c + '" data-act="jump" data-n="' + n + '" data-i="' + i + '" aria-label="Question ' + it.num + (isCorrect(it, got) ? ', correct' : ', incorrect') + '">' + it.num + '</button>';
    }).join('');
    var timeout = r.timedOut ? '<div class="notice">Time ran out, so the exam was submitted automatically.</div>' : '';
    var confirm = ui.confirm === 'reset-' + n
      ? '<div class="confirm"><p>Clear this score and start exam ' + n + ' again?</p><div class="row"><button class="btn small danger" data-act="reset" data-n="' + n + '">Yes, clear it</button><button class="btn small" data-act="cancel">Keep it</button></div></div>'
      : '';
    return '<div class="wrap stack">' +
      '<div class="row" style="justify-content:space-between"><span class="eyebrow">CCDV-F · Mock exam ' + n + ' · score report</span><button class="btn small ghost" data-act="home">All exams</button></div>' +
      timeout +
      '<section class="panel score-head"><div class="stack" style="gap:8px">' +
      '<div class="big">' + sc + '</div><p class="muted">estimated scaled score (100–1,000)</p>' +
      '<div class="row"><span class="chip ' + (pass ? 'ok' : 'bad') + '">' + (pass ? 'Above' : 'Below') + ' the 720 cut</span><span class="chip ' + b.cls + '">' + b.label + '</span></div>' +
      '<p><b>' + r.correct + ' of ' + r.total + '</b> correct (' + pct(r.correct, r.total) + '%) · time used <span class="mono">' + clock(r.usedMs) + '</span></p></div>' +
      '<div class="stack" style="gap:8px"><div class="scale" aria-hidden="true"><span class="end" style="left:0">100</span><span class="end" style="right:0">1,000</span>' +
      '<div class="track"><div class="fill" style="width:' + fillPct.toFixed(1) + '%"></div></div>' +
      '<div class="cut" style="left:' + cutPct.toFixed(1) + '%"></div><span class="cut-label" style="left:' + cutPct.toFixed(1) + '%">pass 720</span></div>' +
      '<p class="muted" style="font-size:15px">' + esc(b.note) + '</p></div></section>' +
      '<h2 class="section-title" style="margin-top:12px">Percent correct by domain</h2>' +
      '<div class="table-wrap"><table><thead><tr><th>Domain</th><th class="num">Weight</th><th class="num">Correct</th><th class="num">%</th><th>Result</th></tr></thead><tbody>' + drows + '</tbody></table></div>' +
      '<section class="panel stack"><div class="row" style="justify-content:space-between"><strong>Question by question</strong><span class="muted" style="font-size:14px">Select a number to open its explanation</span></div>' +
      '<div class="legend"><span><i class="sw" style="background:var(--ok-soft)"></i>Correct</span><span><i class="sw" style="background:var(--bad-soft)"></i>Incorrect or unanswered</span><span><i class="sw flagged"></i>You flagged it</span></div>' +
      '<div class="grid">' + cells + '</div></section>' +
      '<section class="panel stack"><strong>Go through it with Claude</strong><p class="muted" style="font-size:15px">Copy this summary and paste it into your Claude Code session. It lists each missed question by number and ID, so Claude can open the explanation and coach you on the concept.</p>' +
      '<textarea id="copybox" class="copybox" readonly>' + esc(resultText(n)) + '</textarea>' +
      '<div class="row"><button class="btn primary" data-act="copy" data-n="' + n + '">' + (ui.copied ? 'Copied' : 'Copy results for Claude') + '</button>' +
      '<button class="btn" data-act="guide" data-n="' + n + '">Open answer guide</button>' +
      '<button class="btn ghost danger" data-act="ask" data-what="reset" data-n="' + n + '">Retake exam</button></div>' + confirm + '</section>' +
      '</div>';
  }

  function viewGuide(n) {
    var st = state.exams[n], items = exam(n), submitted = st.status === 'submitted';
    var head = '<div class="row" style="justify-content:space-between"><span class="eyebrow">CCDV-F · Mock exam ' + n + ' · answer guide</span>' +
      '<div class="row">' + (submitted ? '<button class="btn small" data-act="results" data-n="' + n + '">Score report</button>' : '') + '<button class="btn small ghost" data-act="home">All exams</button></div></div>';
    if (!submitted && !ui.guideOk[n]) {
      return '<div class="wrap stack" style="max-width:760px">' + head +
        '<div class="panel stack"><h1 style="font-size:26px">Answers ahead</h1><p>This guide shows the correct answer and the reasoning for every question in exam ' + n + '. Take the exam first if you want an honest score.</p>' +
        '<div class="row"><button class="btn primary" data-act="' + (st.status === 'in_progress' ? 'resume' : 'start') + '" data-n="' + n + '">' + (st.status === 'in_progress' ? 'Resume exam' : 'Take the exam first') + '</button>' +
        '<button class="btn" data-act="guide-show" data-n="' + n + '">Show the answers</button></div></div></div>';
    }
    var g = ui.guide;
    if (!submitted && g.mode !== 'all') g.mode = 'all';
    var shown = items.filter(function (it) {
      if (g.domain && it.q.d !== g.domain) return false;
      if (g.mode === 'missed') return !isCorrect(it, st.answers[it.q.id]);
      if (g.mode === 'flagged') return !!st.flags[it.q.id];
      return true;
    });
    var dc = domainCounts(n);
    var dopts = '<option value="0">All domains</option>' + Object.keys(DOMAINS).map(function (d) {
      return '<option value="' + d + '"' + (g.domain === +d ? ' selected' : '') + '>' + d + '. ' + esc(DOMAINS[d].name) + ' (' + (dc[d] || 0) + ')</option>';
    }).join('');
    var seg = submitted
      ? '<div class="seg" role="group" aria-label="Show">' + [['all', 'All'], ['missed', 'Missed'], ['flagged', 'Flagged']].map(function (m) {
          return '<button data-act="guide-mode" data-mode="' + m[0] + '" class="' + (g.mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>';
        }).join('') + '</div>'
      : '';
    var list = shown.map(function (it) {
      var q = it.q, got = st.answers[q.id] || [], ok = isCorrect(it, got);
      var status = submitted ? (got.length ? (ok ? '<span class="chip ok">Correct</span>' : '<span class="chip bad">Incorrect</span>') : '<span class="chip bad">Unanswered</span>') : '';
      var opts = it.order.map(function (oi, k) {
        var right = q.a.indexOf(oi) >= 0, mine = got.indexOf(oi) >= 0;
        var cls = 'gopt' + (right ? ' correct' : '') + (submitted && mine && !right ? ' picked-wrong' : '');
        var tags = (right ? '<span class="chip ok">Correct answer</span>' : '') + (submitted && mine ? '<span class="chip ' + (right ? 'ok' : 'bad') + '">Your answer</span>' : '');
        return '<div class="' + cls + '"><span class="letter">' + LETTERS[k] + '</span><div><div>' + fmt(q.o[oi][0]) + '</div>' +
          (tags ? '<div class="tags">' + tags + '</div>' : '') + '<div class="why">' + fmt(q.o[oi][1]) + '</div></div></div>';
      }).join('');
      return '<article class="panel gq" id="g-' + it.num + '">' +
        '<div class="qhead"><span class="qnum">Question ' + it.num + ' · <span class="mono">' + esc(q.id) + '</span></span><div class="row">' + status +
        (submitted && st.flags[q.id] ? '<span class="chip flag">Flagged</span>' : '') + '<span class="chip">D' + q.d + ' · ' + esc(q.s) + '</span></div></div>' +
        '<div class="stem" style="font-size:18px"><p>' + fmt(q.stem) + '</p></div>' +
        '<p class="select-note">Choose ' + q.a.length + '. Answer: ' + lettersOf(it, q.a) + '</p>' +
        '<div class="gopts">' + opts + '</div>' +
        '<div class="explain"><strong>Why</strong>' + fmt(q.why) + '</div></article>';
    }).join('');
    var c = domainCounts(n);
    var rubric = '<details class="panel"><summary style="cursor:pointer;font-weight:700">Scoring rubric for this exam</summary><div class="stack" style="margin-top:14px">' +
      rubricHtml() +
      '<div class="table-wrap"><table><thead><tr><th>Domain</th><th class="num">Weight</th><th class="num">Items</th></tr></thead><tbody>' +
      Object.keys(DOMAINS).map(function (d) { return '<tr><td>' + d + '. ' + esc(DOMAINS[d].name) + '</td><td class="num">' + DOMAINS[d].w.toFixed(1) + '%</td><td class="num">' + (c[d] || 0) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div></details>';
    return '<div class="wrap stack">' + head +
      '<h1 style="font-size:clamp(26px,4vw,34px)">Exam ' + n + ' answer guide</h1>' + rubric +
      '<div class="filters">' + seg + '<label class="muted" for="domain-filter" style="font-size:14px">Domain</label><select id="domain-filter">' + dopts + '</select>' +
      '<span class="muted mono" style="font-size:13px">Showing ' + shown.length + ' of ' + items.length + '</span></div>' +
      (list || '<div class="panel"><p>No questions match this filter.</p></div>') + '</div>';
  }

  // ---------- render ----------
  function render() {
    var r = route(), html, st = r.n ? state.exams[r.n] : null;
    if ((r.view === 'exam' || r.view === 'review') && st.status !== 'in_progress') r = st.status === 'submitted' ? { view: 'results', n: r.n } : { view: 'home', n: 0 };
    if (r.view === 'results' && st && st.status !== 'submitted') r = { view: 'home', n: 0 };
    if (r.view === 'home') html = viewHome();
    else if (r.view === 'exam') html = viewExam(r.n);
    else if (r.view === 'review') html = viewReview(r.n);
    else if (r.view === 'results') html = viewResults(r.n);
    else html = viewGuide(r.n);
    if (r.view === 'exam' || r.view === 'review') startTimer(r.n); else stopTimer();
    app.innerHTML = html;
    if (ui.jump) {
      var target = document.getElementById('g-' + ui.jump);
      ui.jump = null; ui.scroll = false;
      if (target) target.scrollIntoView();
    } else if (ui.scroll) { ui.scroll = false; window.scrollTo(0, 0); }
    if (ui.focus) {
      var f = document.getElementById(ui.focus);
      ui.focus = null;
      if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
    }
  }

  function onKey(e) {
    var r = route();
    if (r.view !== 'exam' || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'TEXTAREA' || tag === 'SELECT') return;
    var st = state.exams[r.n];
    if (!st || st.status !== 'in_progress') return;
    var k = e.key.toLowerCase(), item = exam(r.n)[st.current];
    var idx = 'abcde'.indexOf(k);
    if (idx < 0 && /^[1-5]$/.test(k)) idx = +k - 1;
    if (idx >= 0 && idx < item.order.length) { e.preventDefault(); pick(r.n, item.order[idx]); return; }
    if (k === 'n') { e.preventDefault(); act('next', { n: r.n }); }
    else if (k === 'p') { e.preventDefault(); act('prev', { n: r.n }); }
    else if (k === 'f') { e.preventDefault(); act('flag', { n: r.n }); }
  }

  function start(data) {
    state = data && data.state ? data.state : load();
    app.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      act(b.getAttribute('data-act'), b.dataset);
    });
    app.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('input[data-oi]')) { var r = route(); pick(r.n, +t.getAttribute('data-oi')); }
      else if (t.id === 'domain-filter') { ui.guide.domain = +t.value; render(); }
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', function () { ui.confirm = null; ui.scroll = true; render(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
    window.addEventListener('pagehide', save);
    try {
      if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(function () { return { state: state }; });
    } catch (e) { /* hot reload unavailable */ }
    render();
  }

  var hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start);
  else start((hot && hot.data) || {});
})();
