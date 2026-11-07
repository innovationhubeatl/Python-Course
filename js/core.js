/* =====================================================================
   Python Course — কোর ইঞ্জিন
   সাধারণত এই ফাইল বদলাতে হবে না। নতুন পাঠ যোগ করতে lessons/ দেখো।
   ===================================================================== */
window.PC = (() => {
'use strict';
/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BN = '০১২৩৪৫৬৭৮৯';
const bn = n => String(n).replace(/\d/g, d => BN[d]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pythuSVG = () => $('#tpl-pythu').innerHTML;
const pad2 = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

/* ================= storage ================= */
const KEY = 'python-course-v2';
const fresh = () => ({ name: 'নতুন কোডার', xp: 0, got: {}, badges: {}, streak: { count: 0, last: '' }, L: {}, notes: {}, drawn: {}, theme: '', sound: true });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = fresh(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: progress lasts for this visit */ } };
const LP = key => (S.L[key] = S.L[key] || { seg: {}, games: {}, quizBest: 0 });

/* ================= sound (Web Audio, no files needed) ================= */
const Sound = (() => {
  let ctx = null;
  const ac = () => {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  function tone(f, t0, dur, type = 'sine', vol = .12, f2) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05);
  }
  const fx = {
    tap: () => tone(700, 0, .05, 'triangle', .035),
    step: () => tone(520, 0, .08, 'triangle', .07, 640),
    flip: () => tone(320, 0, .14, 'sine', .07, 640),
    pop: () => tone(440, 0, .09, 'sine', .08, 880),
    correct: () => { tone(784, 0, .12, 'triangle', .13); tone(1175, .09, .24, 'triangle', .13); },
    wrong: () => tone(330, 0, .24, 'sine', .11, 200),
    heart: () => { tone(560, 0, .12, 'sine', .1, 400); tone(380, .1, .2, 'sine', .09, 240); },
    coin: () => { tone(988, 0, .08, 'square', .045); tone(1319, .07, .26, 'square', .045); },
    run: () => { tone(392, 0, .07, 'triangle', .07); tone(587, .06, .12, 'triangle', .07); },
    error: () => { tone(247, 0, .14, 'triangle', .08); tone(208, .12, .22, 'triangle', .08); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .1, .32, 'triangle', .12)),
    badge: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .08, .36, 'triangle', .1)); tone(2093, .36, .5, 'sine', .05); },
    level: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .09, .36, 'square', .05)); tone(1568, .5, .6, 'triangle', .08); }
  };
  return { play(n) { if (S.sound === false) return; try { fx[n] && fx[n](); } catch (e) { /* audio unavailable */ } } };
})();
const soundBtn = () => $('#soundBtn');
function syncSoundBtn() { const b = soundBtn(); if (b) { b.setAttribute('aria-pressed', S.sound !== false); b.title = S.sound !== false ? 'সাউন্ড বন্ধ করো' : 'সাউন্ড চালু করো'; } }
document.addEventListener('click', e => {
  const el = e.target.closest('button, a.btn, .nav a, .bottomnav a, .track');
  if (el && el.id !== 'soundBtn' && !el.disabled) Sound.play('tap');
}, true);

/* ================= gamification ================= */
const levelOf = xp => { let i = 0; LEVELS.forEach((l, k) => { if (xp >= l[0]) i = k; }); return i; };
function touchStreak() {
  const t = today(), st = S.streak;
  if (st.last === t) return;
  st.count = st.last && dayDiff(st.last, t) === 1 ? st.count + 1 : 1;
  st.last = t;
  if (st.count >= 3) giveBadge('streak-3');
  if (st.count >= 5) giveBadge('streak-5');
}
function hud() {
  $('#hudXp').textContent = bn(S.xp);
  $('#hudLvl').textContent = LEVELS[levelOf(S.xp)][1];
  $('#hudStreak').textContent = bn(S.streak.count);
}
function floatXP(n, el) {
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
  const f = document.createElement('div'); f.className = 'xpfloat';
  f.textContent = (n > 0 ? '+' : '') + bn(n) + ' XP';
  f.style.left = Math.max(10, Math.min(innerWidth - 120, r.left + r.width / 2 - 40)) + 'px';
  f.style.top = Math.max(70, r.top - 10) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 1300);
}
/* XP দাও — একই key-তে একবারই দেওয়া হয় */
function award(key, n, el) {
  if (key in S.got) return 0;
  const before = levelOf(S.xp);
  S.got[key] = n; S.xp = Math.max(0, S.xp + n);
  touchStreak(); save(); hud(); floatXP(n, el); if (n > 0) Sound.play('coin');
  const after = levelOf(S.xp);
  if (after > before) setTimeout(() => modal({ medal: '⭐', title: 'লেভেল আপ!', text: `তুমি এখন <b>${LEVELS[after][1]}</b>! দারুণ এগোচ্ছ।`, sound: 'level' }), 900);
  return n;
}
const queue = [];
function giveBadge(id) {
  if (S.badges[id] || !BADGES[id]) return;
  S.badges[id] = today(); save();
  const b = BADGES[id];
  queue.push(() => modal({ medal: b.e, title: 'নতুন ব্যাজ!', text: `<b>${b.n}</b><br>${b.d}`, sound: 'badge' }));
  if (!$('.modal-bg')) setTimeout(() => { const f = queue.shift(); f && f(); }, 500);
}
function modal({ medal, title, text, btn = 'দারুণ!', sound = 'badge' }) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal glass strong" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="medal">${medal}</div><h3 id="mt">${title}</h3><p>${text}</p><button class="btn primary">${btn}</button></div>`;
  document.body.appendChild(bg); confetti(); Sound.play(sound);
  const close = () => { bg.remove(); const f = queue.shift(); f && setTimeout(f, 250); };
  $('button', bg).onclick = close; bg.onclick = e => { if (e.target === bg) close(); };
  $('button', bg).focus();
  mood('happy');
}
function confetti() {
  const c = $('#confetti'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  if (reduced) return;
  const cols = ['#ffcf3a', '#5b3df5', '#0f9e8e', '#e5485f', '#2f63d0', '#ffffff'];
  const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 4, s: Math.random() * 7 + 4, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .3 }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (t - t0 < 2200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
  })(t0);
}

/* ================= mascot ================= */
let bubbleTimer;
function say(html, m) {
  const b = $('#bubble'); b.hidden = false; $('#bubbleText').innerHTML = html;
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  if (m) mood(m);
  clearTimeout(bubbleTimer);
  if (innerWidth < 860) bubbleTimer = setTimeout(() => { b.hidden = true; }, 7000);
}
function mood(m) {
  const p = $('#guidePythu'); p.classList.remove('happy', 'think'); void p.offsetWidth;
  if (m === 'happy' || m === 'think') p.classList.add(m);
  if (m === 'happy') setTimeout(() => p.classList.remove('happy'), 1300);
}
const TIPS = ['মনে রেখো: পাইথন Print আর print কে আলাদা ধরে!', 'ভুল হওয়াটা শেখার অংশ। প্রোগ্রামাররা প্রতিদিন বাগ ঠিক করে।', 'প্রতিদিন একটু করে শিখলে স্ট্রিক বাড়ে 🔥', 'কোড চালানোর আগে আউটপুট কী হবে ভেবে দেখো — এটাই আসল ট্রেনিং।', 'স্ট্রিং মানে উদ্ধৃতিচিহ্নের ভেতরের লেখা: "এরকম"'];

/* ================= syntax highlight ================= */
const KW = new Set(['False', 'None', 'True', 'and', 'as', 'break', 'class', 'continue', 'def', 'elif', 'else', 'for', 'from', 'if', 'import', 'in', 'is', 'not', 'or', 'pass', 'return', 'while', 'with', 'try', 'except', 'lambda', 'public', 'static', 'void']);
const BI = new Set(['print', 'input', 'int', 'float', 'str', 'bool', 'type', 'len', 'round', 'abs', 'max', 'min', 'sum', 'range', 'list']);
function hl(code) {
  const re = /(#[^\n]*)|([fFrR]?("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"?|'[^'\n]*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_ঀ-৿][\wঀ-৿]*)|([+\-*/%=<>!]+|[()\[\],:.])/g;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index)); last = re.lastIndex;
    const t = m[0];
    if (m[1]) out += `<span class="tk-com">${esc(t)}</span>`;
    else if (m[2]) out += `<span class="tk-str">${esc(t)}</span>`;
    else if (m[4]) out += `<span class="tk-num">${t}</span>`;
    else if (m[5]) out += KW.has(t) ? `<span class="tk-kw">${t}</span>` : BI.has(t) ? `<span class="tk-fn">${t}</span>` : esc(t);
    else out += `<span class="tk-op">${esc(t)}</span>`;
  }
  return out + esc(code.slice(last));
}

/* ================= code runner + editor ================= */
async function runPython(code, consoleEl, opts = {}) {
  consoleEl.innerHTML = ''; let text = '';
  const errSlot = opts.errSlot; if (errSlot) { errSlot.innerHTML = ''; errSlot.hidden = true; }
  const out = (s, kind) => {
    text += s;
    const sp = document.createElement('span'); if (kind === 'input') sp.className = 'in';
    sp.textContent = s; consoleEl.appendChild(sp); consoleEl.scrollTop = consoleEl.scrollHeight;
  };
  const input = p => new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'text'; inp.setAttribute('aria-label', p || 'ইনপুট দাও');
    inp.placeholder = 'লিখে Enter চাপো';
    consoleEl.appendChild(inp); inp.focus();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const v = inp.value; inp.remove(); res(v); } });
  });
  try {
    await PyLite.run(code, { out, input });
    if (!text) { const ph = document.createElement('span'); ph.className = 'ph'; ph.textContent = '(কোনো আউটপুট নেই — print() দিয়ে কিছু দেখাও)'; consoleEl.appendChild(ph); }
    return { ok: true, out: text };
  } catch (e) {
    if (!(e instanceof PyLite.PyErr)) { console.error(e); e = new PyLite.PyErr('SyntaxError', 'invalid syntax', 1); }
    const lines = code.split('\n');
    const tb = e.pyType === 'NotYet' ? '' : `Traceback (most recent call last):\n  File "main.py", line ${e.line}\n    ${(lines[e.line - 1] || '').trim()}\n${e.pyType}: ${e.message}`;
    if (tb) { const sp = document.createElement('span'); sp.className = 'err'; sp.textContent = (text && !text.endsWith('\n') ? '\n' : '') + tb; consoleEl.appendChild(sp); }
    const ex = PyLite.explain(e.pyType, e.message);
    if (errSlot) {
      errSlot.hidden = false;
      errSlot.innerHTML = `${icon('bulb')}<div><b>${ex.title}${e.pyType !== 'NotYet' ? ` · লাইন ${bn(e.line)}` : ''}</b><span>${ex.body}</span></div>`;
    }
    mood('think');
    return { ok: false, out: text, err: e, tb };
  }
}
function makeEditor(host, { code, file = 'main.py', onRun, runLabel = 'রান করো', extra = '' }) {
  host.innerHTML = `<div class="editor">
    <div class="ed-top"><span class="fname">${file}</span>${extra}<button class="btn ghost small" data-act="reset">${icon('refresh')}রিসেট</button><button class="btn primary small" data-act="run">${icon('play')}${runLabel}</button></div>
    <div class="ed-area"><div class="ed-gutter" aria-hidden="true">1</div><div class="ed-wrap"><pre aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="পাইথন কোড এডিটর"></textarea></div></div>
    <div class="console" aria-live="polite"><span class="ph">▶ রান করো চাপলে আউটপুট এখানে দেখাবে</span></div>
    <div class="errbox" hidden></div></div>`;
  const ta = $('textarea', host), pre = $('pre', host), gut = $('.ed-gutter', host), con = $('.console', host), errSlot = $('.errbox', host);
  const sync = () => {
    pre.innerHTML = hl(ta.value) + '\n';
    const n = ta.value.split('\n').length; gut.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
    pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop;
    ta.style.height = Math.min(340, Math.max(132, n * 22 + 26)) + 'px';
  };
  ta.value = code; sync();
  ta.addEventListener('input', sync);
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); sync(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
  const run = async () => {
    const r = await runPython(ta.value, con, { errSlot });
    Sound.play(r.ok ? 'run' : 'error');
    if (r.ok) { if (award('first-run', 10, $('[data-act=run]', host))) giveBadge('first-print'); }
    onRun && onRun(r, ta.value);
  };
  $('[data-act=run]', host).onclick = run;
  $('[data-act=reset]', host).onclick = () => { ta.value = code; sync(); con.innerHTML = '<span class="ph">▶ রান করো চাপলে আউটপুট এখানে দেখাবে</span>'; errSlot.hidden = true; };
  return { get value() { return ta.value; }, set value(v) { ta.value = v; sync(); }, console: con, run };
}

/* ================= lessons registry ================= */
const lessons = {};
function registerLesson(def) {
  if (!def || !def.key) { console.error('registerLesson: key দরকার'); return; }
  lessons[def.key] = def;
  (def.missions || []).forEach(m => { if (m.badge) BADGES[m.badge.id] = m.badge; if (m.challenge && m.challenge.badge) BADGES[m.challenge.badge.id] = m.challenge.badge; });
  if (def.lessonBadge) BADGES[def.lessonBadge.id] = def.lessonBadge;
}
const lessonHash = key => 'lesson-' + key.replace(/\./g, '-');
const keyFromHash = h => Object.keys(lessons).find(k => lessonHash(k) === h);
function trackLessons(t) { const out = []; t.modules.forEach((m, mi) => m.lessons.forEach(l => out.push(Object.assign({}, l, { key: t.prefix + '-' + l.id, mi, track: t })))); return out; }
const allLessons = () => COURSE.flatMap(trackLessons);
const findLesson = key => allLessons().find(l => l.key === key);
const lessonDone = key => !!(S.L[key] && S.L[key].seg.summary);
const isReady = key => !!lessons[key];
function unlocked(t, idx) {
  const list = trackLessons(t);
  if (idx === 0) { const ti = COURSE.indexOf(t); if (ti === 0) return true; const prev = trackLessons(COURSE[ti - 1]); return lessonDone(prev[prev.length - 1].key); }
  return lessonDone(list[idx - 1].key);
}
function nodeState(t, idx) {
  const L = trackLessons(t)[idx];
  if (lessonDone(L.key)) return 'done';
  if (!unlocked(t, idx)) return 'locked';
  return isReady(L.key) ? 'current' : 'open';
}
function currentLesson() {
  const ready = allLessons().filter(l => isReady(l.key));
  return ready.find(l => !lessonDone(l.key)) || ready[ready.length - 1] || null;
}
const lessonLabel = l => l.boss ? 'বস প্রজেক্ট' : 'পাঠ ' + bn(l.id);

/* lesson progress */
const SEGS = [
  { id: 'video', grp: 'রেকর্ডেড ভিডিও', t: 'ভিডিও', ic: 'video' },
  { id: 'material', grp: 'স্টাডি ম্যাটেরিয়াল', t: 'পড়ো ও বোঝো', ic: 'book' },
  { id: 'games', grp: 'অ্যাসেসমেন্ট', t: 'গেম জোন', ic: 'game' },
  { id: 'quiz', grp: 'অ্যাসেসমেন্ট', t: 'কুইজ', ic: 'quiz' },
  { id: 'summary', grp: 'শেষ ধাপ', t: 'সারসংক্ষেপ', ic: 'trophy' }
];
function segDone(key, id) {
  const p = S.L[key]; if (!p) return false;
  if (id === 'games') { const ms = (lessons[key] && lessons[key].missions) || []; return ms.length > 0 && ms.every(m => p.games[m.id]); }
  return !!p.seg[id];
}
const lessonPct = key => Math.round(SEGS.filter(s => segDone(key, s.id)).length / SEGS.length * 100);

/* ================= router ================= */
const app = () => $('#app');
let cleanup = null, curTrack = 'beg', curMode = 'map', curSeg = 'video', curKey = null;
function setNav(view) {
  const cl = currentLesson();
  $$('.nav-lesson').forEach(a => { a.href = cl ? '#' + lessonHash(cl.key) : '#courses'; });
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
function route() {
  const v = (location.hash || '#home').slice(1);
  if (cleanup) { cleanup(); cleanup = null; }
  const key = keyFromHash(v);
  app().innerHTML = '';
  if (key) { setNav('lesson'); if (curKey !== key) { curKey = key; curSeg = 'video'; } renderLesson(key); }
  else { const fn = { home: renderHome, courses: renderCourses, profile: renderProfile, playground: renderPlayground }[v] || renderHome; setNav({ home: 1, courses: 1, profile: 1, playground: 1 }[v] ? v : 'home'); fn(); }
  window.scrollTo(0, 0);
}

/* ================= HOME ================= */
function renderHome() {
  const cl = currentLesson(); const pct = cl ? lessonPct(cl.key) : 0;
  app().innerHTML = `<div class="view stack" style="gap:28px">
  <section class="hero glass">
    <div>
      <span class="eyebrow">ক্লাস ৬–১২ · কোনো কোডিং অভিজ্ঞতা লাগবে না</span>
      <h1>খেলতে খেলতে <span class="hl">পাইথন</span> শেখো</h1>
      <p class="lead">ছোট ছোট পাঠ, অ্যানিমেশন, গেম আর কুইজ। প্রতিটা ধাপে XP জেতো, ব্যাজ সংগ্রহ করো, আর পাইথুর সাথে নবীন কোডার থেকে পাইথন মাস্টার হয়ে ওঠো।</p>
      <div class="row cta"><a class="btn primary" href="${cl ? '#' + lessonHash(cl.key) : '#courses'}">${icon('play')}${S.xp ? 'চালিয়ে যাও' : 'শুরু করো'}</a><a class="btn ghost" href="#courses">${icon('map')}কোর্স ম্যাপ</a></div>
      <div class="facts"><span>৩টি ট্র্যাক</span><span>${bn(COURSE.reduce((a, t) => a + t.modules.length, 0))}টি মডিউল</span><span>ব্রাউজারেই কোড চলে</span><span>বাংলায় ব্যাখ্যা</span></div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="orb o1">py</div><div class="orb o2">{ }</div><div class="orb o3">#</div>
      <div class="codewin"><div class="tb"><i></i><i></i><i></i><span>hello.py</span></div><pre id="typed"></pre><div class="out" id="typedOut"></div></div>
      <div class="pythu">${pythuSVG()}</div>
    </div>
  </section>
  ${cl && pct ? `<section class="continue glass">
    <div class="ring" style="--p:${pct}"><span>${bn(pct)}%</span></div>
    <div><span class="eyebrow">চলমান পাঠ</span><h3 style="font-size:1.25rem">${lessonLabel(cl)} · ${cl.title}</h3><p class="muted" style="font-size:.9rem">${cl.track.name} · মডিউল ${bn(pad2(cl.mi + 1))}</p></div>
    <a class="btn accent" href="#${lessonHash(cl.key)}">চালিয়ে যাও ${icon('arrow')}</a></section>` : ''}
  <section>
    <div class="section-title"><div><span class="eyebrow">তোমার পথ</span><h2>তিনটি ট্র্যাক, এক যাত্রা</h2></div><a class="btn ghost small" href="#courses">সব মডিউল দেখো ${icon('arrow')}</a></div>
    <div class="tracks">${COURSE.map(t => {
      const ls = trackLessons(t); const done = ls.filter(l => lessonDone(l.key)).length; const ready = ls.filter(l => isReady(l.key)).length;
      return `<a class="track glass lift ${t.cls}" href="#courses" data-track="${t.id}"><span class="tag">${t.tag}</span><h3>${t.theme}</h3><p style="font-size:.95rem;color:var(--ink-2)">${t.blurb}</p><span class="meta">${bn(t.modules.length)}টি মডিউল · ${bn(ls.length)}টি পাঠ${ready ? ` · ${bn(ready)}টি চালু` : ' · শিগগিরই'}</span><span class="bar"><i style="width:${Math.round(done / ls.length * 100)}%"></i></span></a>`; }).join('')}</div>
  </section>
  <section>
    <div class="section-title"><div><span class="eyebrow">প্রতিটা পাঠের ভেতরে</span><h2>দেখো, পড়ো, খেলো, যাচাই করো</h2></div></div>
    <div class="anatomy">
      <div class="anat glass"><div class="icn" style="background:var(--coral)">${icon('video')}</div><h3>রেকর্ডেড ভিডিও</h3><p>অ্যানিমেশনসহ ছোট ভিডিওতে মূল ধারণা। অধ্যায় ধরে লাফ দিয়ে দেখা যায়।</p></div>
      <div class="anat glass"><div class="icn" style="background:var(--py-blue)">${icon('book')}</div><h3>স্টাডি ম্যাটেরিয়াল</h3><p>ধাপে ধাপে চলা ডায়াগ্রাম, বাস্তব উদাহরণ আর নিজে চালিয়ে দেখার কোড।</p></div>
      <div class="anat glass"><div class="icn" style="background:var(--teal)">${icon('target')}</div><h3>অ্যাসেসমেন্ট</h3><p>গেম জোনের মিশন আর কুইজ। সাথে সাথে ফিডব্যাক, ধাপে ধাপে হিন্ট।</p></div>
    </div>
  </section>
  <section class="game-feats">
    <div class="gf glass"><span style="color:var(--yellow-deep)">${icon('bolt', 'fill')}</span><div><b>XP ও লেভেল</b><span>নবীন কোডার → পাইথন মাস্টার</span></div></div>
    <div class="gf glass"><span style="color:#ff7a1a">${icon('fire', 'fill')}</span><div><b>দৈনিক স্ট্রিক</b><span>প্রতিদিন একটু শেখো</span></div></div>
    <div class="gf glass"><span style="color:var(--coral)">${icon('heart', 'fill')}</span><div><b>৩টি হার্ট</b><span>ভুল হলে হিন্ট পাবে, বকা না</span></div></div>
    <div class="gf glass"><span style="color:var(--accent)">${icon('vol')}</span><div><b>সাউন্ড ইফেক্ট</b><span>সঠিক, ভুল, ব্যাজ — সবকিছুর শব্দ</span></div></div>
  </section></div>`;
  $$('[data-track]').forEach(a => a.onclick = () => { curTrack = a.dataset.track; });
  const code = 'name = "রাফি"\nprint("হ্যালো,", name)\nprint("চলো পাইথন শিখি!")';
  const pre = $('#typed'), out = $('#typedOut'); let i = 0, alive = true;
  const tick = () => {
    if (!alive) return;
    if (reduced) { pre.innerHTML = hl(code); out.textContent = 'হ্যালো, রাফি\nচলো পাইথন শিখি!'; return; }
    i++; pre.innerHTML = hl(code.slice(0, i)) + '<span class="caret"></span>';
    if (i < code.length) setTimeout(tick, 55 + Math.random() * 50);
    else setTimeout(() => { out.style.whiteSpace = 'pre-wrap'; out.textContent = 'হ্যালো, রাফি\nচলো পাইথন শিখি!'; setTimeout(() => { if (!alive) return; i = 0; out.textContent = ''; tick(); }, 4200); }, 500);
  };
  tick(); cleanup = () => { alive = false; };
  say(S.xp ? `আবার স্বাগতম, <b>${esc(S.name)}</b>! তোমার এখন ${bn(S.xp)} XP। চলো আরেকটু এগোই!` : 'হাই! আমি <b>পাইথু</b> 🐍 তোমার কোডিং গাইড। “শুরু করো” চাপো, একসাথে পাইথন শিখি!', 'happy');
}

/* ================= COURSES ================= */
function renderCourses() {
  const t = COURSE.find(c => c.id === curTrack) || COURSE[0];
  app().innerHTML = `<div class="view stack">
    <section class="flow-head glass">
      <div class="section-title" style="margin:0"><div><span class="eyebrow">কোর্স ম্যাপ</span><h2>তোমার পাইথন যাত্রা</h2></div>
        <div class="seg" role="group" aria-label="দেখার ধরন"><button data-mode="map" aria-pressed="${curMode === 'map'}">${icon('map')}যাত্রা ম্যাপ</button><button data-mode="list" aria-pressed="${curMode === 'list'}">${icon('doc')}মডিউল তালিকা</button></div></div>
      <div class="tree" role="group" aria-label="ট্র্যাক বেছে নাও">
        <div class="root"><img src="assets/logo-python.png" alt="">PYTHON</div><div class="stem"></div>
        <div class="branches">${COURSE.map(c => `<button class="br" data-tr="${c.id}" aria-pressed="${c.id === t.id}"><b>${c.name}</b><span>${c.tag} · ${bn(c.modules.length)} মডিউল</span></button>`).join('')}</div>
      </div>
    </section><div id="cbody"></div></div>`;
  $$('[data-tr]').forEach(b => b.onclick = () => { curTrack = b.dataset.tr; renderCourses(); });
  $$('[data-mode]').forEach(b => b.onclick = () => { curMode = b.dataset.mode; renderCourses(); });
  const body = $('#cbody');
  body.innerHTML = curMode === 'map' ? mapHTML(t) : listHTML(t);
  wireCourse(body, t);
  const nxt = trackLessons(t).find((l, i) => nodeState(t, i) === 'current');
  say(nxt ? `হলুদ জ্বলজ্বলে নোডটাই তোমার পরের পাঠ: <b>${nxt.title}</b>। চাপ দাও!` : t.id === 'beg' ? 'পরের পাঠগুলো শিগগিরই আসছে! ততক্ষণ প্লেগ্রাউন্ডে প্র্যাকটিস করো।' : `${t.theme} ট্র্যাক আগের ট্র্যাক শেষ করলে খুলবে। আগে ভিত্তি মজবুত করি!`, 'happy');
}
function resChips(key, ready) {
  return [['video', 'ভিডিও', 'video'], ['assessment', 'অ্যাসেসমেন্ট', 'target'], ['material', 'ম্যাটেরিয়াল', 'book']].map(([k, n, ic]) => {
    const ok = ready && (k === 'assessment' ? segDone(key, 'games') && segDone(key, 'quiz') : segDone(key, k));
    return `<span class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : ic)}${n}</span>`;
  }).join('');
}
function mapHTML(t) {
  const list = trackLessons(t);
  const nxtIdx = list.findIndex((l, i) => nodeState(t, i) === 'current');
  const nxt = list[nxtIdx];
  let gi = 0;
  const zones = t.modules.map((m, mi) => {
    const n = m.lessons.length, H = 64 + (n - 1) * 104 + 76;
    const pts = m.lessons.map((l, i) => [l.boss ? 180 : (i % 2 ? 272 : 88), 64 + i * 104]);
    const startIdx = gi; gi += n;
    const legs = pts.slice(0, -1).map(([x1, y1], i) => { const [x2, y2] = pts[i + 1]; const cy = (y1 + y2) / 2; return `M${x1} ${y1} C ${x1} ${cy + 10}, ${x2} ${cy - 10}, ${x2} ${y2}`; });
    const states = m.lessons.map((_, i) => nodeState(t, startIdx + i));
    const anyOpen = states.some(s => s !== 'locked');
    return `<section class="zone glass ${anyOpen ? '' : 'locked-zone'}">
      <div class="zone-head"><span class="num">মডিউল ${bn(pad2(mi + 1))}</span><h3>${m.title}</h3>${anyOpen ? '' : icon('lock')}</div>
      <p class="muted" style="font-size:.9rem">${m.bn} · ${bn(n)}টি পাঠ</p>
      <div class="map" style="aspect-ratio:360/${H}">
        <svg viewBox="0 0 360 ${H}" aria-hidden="true">
          <defs><linearGradient id="tg-${t.id}-${mi}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf3a"/><stop offset="1" stop-color="#0f9e8e"/></linearGradient></defs>
          ${legs.map(d => `<path class="trail" d="${d}"/>`).join('')}
          ${legs.map((d, i) => states[i] === 'done' ? `<path class="leg" stroke="url(#tg-${t.id}-${mi})" data-leg="${t.id}-${mi}-${i}" d="${d}"/>` : '').join('')}
        </svg>
        ${m.lessons.map((l, i) => {
          const st = states[i], [x, y] = pts[i], side = x < 180 ? 'l' : 'r', key = t.prefix + '-' + l.id;
          const inner = st === 'done' ? icon('check') : st === 'locked' ? icon('lock') : l.boss ? icon('trophy') : `<span>${bn(l.id)}</span>`;
          const status = st === 'done' ? 'সম্পন্ন' : st === 'current' ? 'এখন শুরু করো' : st === 'open' ? 'আনলকড · কন্টেন্ট আসছে' : 'লকড';
          return `<button class="node ${side} ${st} ${l.boss ? 'boss' : ''}" style="left:${x / 3.6}%;top:${y / H * 100}%" data-key="${key}" data-st="${st}" aria-label="${lessonLabel(l)}: ${l.boss ? l.sub : l.title} — ${status}"><span class="dot">${inner}</span><span class="lbl"><b>${lessonLabel(l)}</b>${l.boss ? l.sub : l.title}<br><small class="muted">${status}</small></span></button>`;
        }).join('')}
      </div></section>`;
  }).join('');
  return `<div class="stack">
    <section class="nextcard glass"><div style="display:grid;gap:8px"><span class="eyebrow">পরের পাঠ</span>
      <h3 style="font-size:1.35rem">${nxt ? `${lessonLabel(nxt)} · ${nxt.title}` : 'নতুন পাঠ আসছে'}</h3>
      <p class="muted">${nxt ? nxt.sub : 'এই ট্র্যাকের চালু থাকা সব পাঠ শেষ, অথবা ট্র্যাকটা এখনো লকড। পরের পাঠ যোগ হলে এখানে দেখাবে।'}</p>
      ${nxt ? `<div class="res">${resChips(nxt.key, true)}</div>` : ''}</div>
      <a class="btn primary" href="${nxt ? '#' + lessonHash(nxt.key) : '#playground'}">${nxt ? 'পাঠ শুরু করো' : 'প্লেগ্রাউন্ডে যাও'} ${icon('arrow')}</a></section>
    <div class="zones">${zones}</div></div>`;
}
function listHTML(t) {
  let gi = 0;
  return `<div class="modlist">${t.modules.map((m, k) => {
    const start = gi; gi += m.lessons.length;
    const open = m.lessons.some((_, i) => nodeState(t, start + i) === 'current');
    return `<section class="mod glass" open-state="${open}">
    <button class="mod-h" aria-expanded="${open}"><span class="num">Module ${pad2(k + 1)}</span><div><h3>${m.title}</h3><div class="sub">${m.bn} · ${bn(m.lessons.length)}টি পাঠ</div></div>${icon('chev', 'chev')}</button>
    <div class="mod-b" ${open ? '' : 'hidden'}>
      <table class="ltable"><thead><tr><th>পাঠ</th><th>রিসোর্স</th><th></th></tr></thead><tbody>
      ${m.lessons.map((l, i) => {
        const key = t.prefix + '-' + l.id, st = nodeState(t, start + i), ready = isReady(key);
        const action = ready && st !== 'locked' ? `<a class="btn accent small" href="#${lessonHash(key)}">${st === 'done' ? 'আবার দেখো' : lessonPct(key) ? 'চালিয়ে যাও' : 'শুরু'}</a>` : `<span class="muted" style="display:inline-flex;gap:4px;align-items:center;font-size:.85rem">${icon('lock')}${ready ? 'লকড' : 'শিগগিরই'}</span>`;
        return `<tr class="${ready && st !== 'locked' ? '' : 'locked'}"><td class="lt">${lessonLabel(l)} · ${l.boss ? l.sub : l.title}<small>${l.boss ? 'পুরো মডিউলের দক্ষতা একসাথে' : l.sub}</small></td><td><div class="res">${resChips(key, ready)}</div></td><td style="text-align:right">${action}</td></tr>`;
      }).join('')}</tbody></table>
      <div class="mod-material">${icon('folder')}<span><b>মডিউল স্টাডি ম্যাটেরিয়াল:</b> প্রতিটা পাঠের “পড়ো ও বোঝো” অংশে, সাথে প্র্যাকটিস প্রশ্ন ও উত্তর।</span></div>
    </div></section>`; }).join('')}</div>`;
}
function wireCourse(body) {
  $$('.mod-h', body).forEach(h => h.onclick = () => {
    const sec = h.closest('.mod'); const open = sec.getAttribute('open-state') !== 'true';
    sec.setAttribute('open-state', open); h.setAttribute('aria-expanded', open); $('.mod-b', sec).hidden = !open;
  });
  $$('[data-key]', body).forEach(n => n.onclick = () => {
    const st = n.dataset.st, key = n.dataset.key;
    if ((st === 'current' || st === 'done') && isReady(key)) location.hash = '#' + lessonHash(key);
    else if (st === 'open') { Sound.play('pop'); say('এই পাঠ আনলক হয়েছে! কন্টেন্ট খুব শিগগিরই যোগ হবে। ততক্ষণ প্লেগ্রাউন্ডে কোড লিখে দেখো।', 'happy'); }
    else { Sound.play('wrong'); n.classList.add('shake'); setTimeout(() => n.classList.remove('shake'), 450); say('এই নোডটা এখনো লকড 🔒 আগের পাঠ শেষ করলে পথ খুলে যাবে!', 'think'); }
  });
  $$('[data-leg]', body).forEach(leg => {
    const id = leg.dataset.leg; if (S.drawn[id]) return;
    const len = leg.getTotalLength(); leg.style.setProperty('--len', len); leg.style.strokeDasharray = len; leg.classList.add('draw');
    S.drawn[id] = 1; save();
  });
}

/* ================= LESSON SHELL ================= */
function renderLesson(key) {
  const def = lessons[key], meta = findLesson(key) || { id: key, title: def.title, track: COURSE[0], mi: 0 };
  LP(key);
  if (!S.badges['first-step']) setTimeout(() => giveBadge('first-step'), 600);
  const nBadges = (def.missions || []).filter(m => m.badge).length + (def.lessonBadge ? 1 : 0);
  app().innerHTML = `<div class="view stack" style="gap:16px">
    <section class="lhead glass">
      <div><nav class="crumbs" aria-label="অবস্থান"><a href="#courses">${meta.track.name}</a><span>›</span><span>মডিউল ${bn(pad2(meta.mi + 1))} · ${meta.track.modules[meta.mi].title}</span><span>›</span><span>${lessonLabel(meta)}</span></nav>
      <h1>${def.title || meta.title}</h1>
      <div class="meta"><span>${icon('clock')}${def.minutes || '১০–১৫ মিনিট'}</span><span>${icon('bolt', 'fill')}${def.xpText || '৩০০+ XP'}</span><span>${icon('trophy')}${bn(nBadges)}টি ব্যাজ জেতার সুযোগ</span></div></div>
      <div class="ring" id="lring" style="--p:${lessonPct(key)}"><span>${bn(lessonPct(key))}%</span></div>
    </section>
    <div class="tabs glass" role="tablist" aria-label="পাঠের অংশ">${SEGS.map((s, i) => `<button class="tab ${segDone(key, s.id) ? 'done' : ''}" role="tab" id="tab-${s.id}" aria-controls="seg" aria-selected="${s.id === curSeg}" data-seg="${s.id}"><span class="tn">${segDone(key, s.id) ? icon('check') : bn(i + 1)}</span><span><span class="grp">${s.grp}</span><span class="tt">${s.t}</span></span></button>`).join('')}</div>
    <section class="glass panel" id="seg" role="tabpanel"></section></div>`;
  $$('[data-seg]').forEach(b => b.onclick = () => openSeg(b.dataset.seg));
  openSeg(curSeg, true);
}
function refreshLessonHead() {
  const r = $('#lring'); if (!r || !curKey) return;
  r.style.setProperty('--p', lessonPct(curKey)); r.firstElementChild.textContent = bn(lessonPct(curKey)) + '%';
  SEGS.forEach((s, i) => { const b = $('#tab-' + s.id); if (!b) return; b.classList.toggle('done', segDone(curKey, s.id)); $('.tn', b).innerHTML = segDone(curKey, s.id) ? icon('check') : bn(i + 1); });
}
function openSeg(id, first) {
  if (cleanup) { cleanup(); cleanup = null; }
  curSeg = id;
  $$('[data-seg]').forEach(b => b.setAttribute('aria-selected', b.dataset.seg === id));
  const host = $('#seg'); host.setAttribute('aria-labelledby', 'tab-' + id);
  ({ video: segVideo, material: segMaterial, games: segGames, quiz: segQuiz, summary: segSummary })[id](host, curKey, lessons[curKey]);
  if (!first) { const t = $('.tabs'); t && t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  const tb = $('#tab-' + id); tb && tb.scrollIntoView({ inline: 'center', block: 'nearest' });
}
const nextSegBtn = (id, label) => `<button class="btn primary" data-goto="${id}">${label} ${icon('arrow')}</button>`;
const wireGoto = host => $$('[data-goto]', host).forEach(b => b.onclick = () => openSeg(b.dataset.goto));
function markSeg(key, id, xp, el) { const p = LP(key); if (p.seg[id]) return; p.seg[id] = true; save(); if (xp) award(key + ':' + id, xp, el); refreshLessonHead(); }

/* ---- 1. video ---- */
function segVideo(host, key, def) {
  const V = def.video || {}; const p = LP(key);
  const SCENE_MS = V.sceneMs || 6500, scenes = V.scenes || [];
  const total = scenes.length * SCENE_MS;
  const doneText = () => p.seg.video ? 'ভিডিও দেখা শেষ ✓' : `পুরো ভিডিও দেখলে +${bn(V.xp || 20)} XP`;
  const useFile = !!V.src;
  host.innerHTML = `<div class="stack">
    <div class="section-title" style="margin:0"><div><span class="eyebrow">ধাপ ১ · রেকর্ডেড ভিডিও</span><h2>${V.title || 'ভিডিও'}</h2></div>${useFile ? '' : `<span class="chip">${icon('clock')}${bn(Math.round(total / 1000))} সেকেন্ড</span>`}</div>
    ${useFile ? `<div class="player"><video class="lesson-video" controls preload="metadata" ${V.poster ? `poster="${V.poster}"` : ''} src="${V.src}"></video></div>` : `
    <div class="player" id="player">
      <div class="stage">${scenes.map((s, i) => `<div class="scene ${i ? '' : 'on'}" data-sc="${i}" aria-hidden="${i ? 'true' : 'false'}"><div class="vis">${s.vis}</div><div class="caption">${s.cap}</div></div>`).join('')}</div>
      <div class="ctrls"><button id="vPrev" aria-label="আগের অধ্যায়">${icon('prev')}</button><button id="vPlay" aria-label="চালাও">${icon('play')}</button><button id="vNext" aria-label="পরের অধ্যায়">${icon('next')}</button>
        <div class="seek" id="vSeek" role="slider" aria-label="ভিডিওর অগ্রগতি" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i style="width:0"></i>${scenes.map((_, i) => i ? `<b style="left:${i / scenes.length * 100}%"></b>` : '').join('')}</div>
        <span class="time" id="vTime">0:00</span></div>
      <div class="chapters">${scenes.map((s, i) => `<button data-ch="${i}" class="${i ? '' : 'on'}">${bn(i + 1)}. ${s.ch}</button>`).join('')}</div>
    </div>`}
    ${V.note ? `<p class="muted" style="font-size:.88rem">${V.note}</p>` : ''}
    <div class="donebar glass"><div><b style="font-family:var(--font-display);font-size:1.1rem" id="vDone">${doneText()}</b><p class="muted" style="font-size:.9rem">এরপর স্টাডি ম্যাটেরিয়ালে প্রতিটা ধারণা হাতে-কলমে দেখব।</p></div>${nextSegBtn('material', 'পড়ো ও বোঝো')}</div></div>`;
  wireGoto(host);
  const finish = el => {
    if (!p.seg.video) { Sound.play('win'); markSeg(key, 'video', V.xp || 20, el); $('#vDone').textContent = doneText(); }
    say('দারুণ মনোযোগ! এবার <b>পড়ো ও বোঝো</b> অংশে প্রতিটা ধারণা নিজে চালিয়ে দেখব।', 'happy');
  };
  if (useFile) { const v = $('video', host); v.addEventListener('ended', () => finish(v)); say('▶ চাপো আর ভিডিওটা দেখো।', 'happy'); return; }
  let t = 0, playing = false, last = 0, raf, cur = 0;
  const sc = $$('.scene', host), fill = $('#vSeek i'), time = $('#vTime'), play = $('#vPlay');
  const show = i => { if (i === cur) return; cur = i; Sound.play('step'); sc.forEach((s, k) => { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k !== i); }); $$('[data-ch]', host).forEach((b, k) => b.classList.toggle('on', k === i)); };
  const draw = () => { fill.style.width = (t / total * 100) + '%'; $('#vSeek').setAttribute('aria-valuenow', Math.round(t / total * 100)); const s = Math.floor(t / 1000); time.textContent = `${Math.floor(s / 60)}:${pad2(s % 60)}`; show(Math.min(scenes.length - 1, Math.floor(t / SCENE_MS))); };
  const setPlay = on => { playing = on; play.innerHTML = icon(on ? 'pause' : 'play'); play.setAttribute('aria-label', on ? 'থামাও' : 'চালাও'); if (on) { last = performance.now(); raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf); };
  const loop = now => { if (!playing) return; t += now - last; last = now; if (t >= total) { t = total; draw(); setPlay(false); finish(play); return; } draw(); raf = requestAnimationFrame(loop); };
  const jump = i => { t = i * SCENE_MS + 1; cur = -1; draw(); if (!playing) setPlay(true); };
  play.onclick = () => { if (t >= total) { t = 0; cur = -1; } setPlay(!playing); };
  $('#vPrev').onclick = () => jump(Math.max(0, Math.floor(t / SCENE_MS) - 1));
  $('#vNext').onclick = () => { const n = Math.floor(t / SCENE_MS) + 1; if (n >= scenes.length) { t = total; draw(); setPlay(false); finish(play); } else jump(n); };
  $$('[data-ch]', host).forEach(b => b.onclick = () => jump(+b.dataset.ch));
  $('#vSeek').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); t = Math.max(0, Math.min(total - 1, (e.clientX - r.left) / r.width * total)); cur = -1; draw(); };
  $('#vSeek').onkeydown = e => { if (e.key === 'ArrowRight') { t = Math.min(total - 1, t + 3000); draw(); } if (e.key === 'ArrowLeft') { t = Math.max(0, t - 3000); draw(); } };
  cleanup = () => { playing = false; cancelAnimationFrame(raf); };
  say('▶ চাপো আর ভিডিওটা দেখো। নিচের অধ্যায়গুলোতে চাপ দিয়ে যেকোনো অংশে যাওয়া যায়।', 'happy');
}

/* ---- 2. study material ---- */
function segMaterial(host, key, def) {
  const M = def.material || {}; const p = LP(key); const toc = M.toc || [];
  const practice = M.practice || [];
  const tocAll = toc.concat(practice.length ? [['m-pq', 'প্র্যাকটিস প্রশ্ন']] : []);
  host.innerHTML = `<div class="material">
    <nav class="toc glass strong" aria-label="বিষয়সূচি">${tocAll.map(([id, t]) => `<a href="#${id}" data-toc="${id}">${t}</a>`).join('')}</nav>
    <div>${M.html ? M.html(H) : ''}
    ${practice.length ? `<article class="msec glass" id="m-pq"><h2><span class="n">${icon('pencil')}</span>প্র্যাকটিস প্রশ্ন</h2>
      <p>আগে নিজের ভাষায় লেখো, তারপর উত্তর মিলিয়ে দেখো। তোমার লেখা এই ব্রাউজারে সেভ থাকবে।</p>
      ${practice.map(([q, a], i) => `<div class="pq"><b>${q}</b><textarea class="note" id="pq${i}" placeholder="তোমার উত্তর এখানে লেখো…">${esc(S.notes[key + ':pq' + i] || '')}</textarea><div class="row"><button class="btn ghost small" data-ans="${i}">${icon('bulb')}উত্তর দেখো</button></div><div class="answer" id="ans${i}" hidden>${a}</div></div>`).join('')}</article>` : ''}
    <div class="donebar glass"><div><b style="font-family:var(--font-display);font-size:1.1rem" id="mDone">${p.seg.material ? 'পড়া শেষ ✓' : `সব পড়া হলে চাপো: +${bn(M.xp || 30)} XP`}</b><p class="muted" style="font-size:.9rem">এরপর গেম জোনে নিজেকে যাচাই করো!</p></div>
      <div class="row"><button class="btn accent" id="matDone" ${p.seg.material ? 'disabled' : ''}>${icon('check')}পড়া শেষ</button>${nextSegBtn('games', 'গেম জোন')}</div></div>
    </div></div>`;
  wireGoto(host);
  $$('[data-toc]', host).forEach(a => a.onclick = e => { e.preventDefault(); const el = $('#' + a.dataset.toc); el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); });
  practice.forEach((_, i) => { $('#pq' + i).oninput = e => { S.notes[key + ':pq' + i] = e.target.value; save(); }; });
  $$('[data-ans]', host).forEach(b => b.onclick = () => { const a = $('#ans' + b.dataset.ans); a.hidden = !a.hidden; Sound.play('flip'); b.lastChild.textContent = a.hidden ? 'উত্তর দেখো' : 'উত্তর লুকাও'; });
  $('#matDone').onclick = e => { markSeg(key, 'material', M.xp || 30, e.currentTarget); Sound.play('correct'); e.currentTarget.disabled = true; $('#mDone').textContent = 'পড়া শেষ ✓'; say('অসাধারণ! এবার <b>গেম জোনে</b> মিশনগুলো অপেক্ষা করছে। চলো খেলি!', 'happy'); };
  if (M.init) { try { const c = M.init(host, H); if (typeof c === 'function') cleanup = c; } catch (err) { console.error('material.init error', err); } }
  say(M.mascot || 'প্রতিটা ডায়াগ্রামে “পরের ধাপ ▶” আছে। চাপো আর দেখো কী ঘটে!', 'happy');
}

/* ---- 3. game zone ---- */
function segGames(host, key, def) {
  const ms = def.missions || []; const p = LP(key);
  const n = ms.filter(m => p.games[m.id]).length;
  host.innerHTML = `<div class="stack">
    <div class="section-title" style="margin:0"><div><span class="eyebrow">ধাপ ৩ · অ্যাসেসমেন্ট</span><h2>গেম জোন</h2><p class="muted">প্রতিটা মিশনে ৩টা হার্ট। ভুল হলে হার্ট কমবে, কিন্তু পাইথু হিন্ট দেবে!</p></div><span class="chip">${icon('trophy')}${bn(n)}/${bn(ms.length)} মিশন</span></div>
    <div class="missions">${ms.map((m, i) => `<button class="mission lift" data-m="${i}">${p.games[m.id] ? `<span class="stamp">${icon('check')}সম্পন্ন</span>` : ''}<span class="mic" style="background:${m.color || 'var(--accent)'}">${icon(m.icon || 'game')}</span><h3>${bn(i + 1)}. ${m.title}</h3><p>${m.desc || ''}</p><span class="reward">${icon('bolt', 'fill')}+${bn(m.xp || 25)} XP${m.badge ? ` · ${m.badge.e} ${m.badge.n}` : ''}</span></button>`).join('')}</div>
    <div class="donebar glass"><div><b style="font-family:var(--font-display);font-size:1.1rem">${n === ms.length ? 'সব মিশন শেষ! 🎉' : 'সব মিশন শেষ করলে গেম জোন সম্পন্ন'}</b><p class="muted" style="font-size:.9rem">এরপর কুইজে নিজের জ্ঞান যাচাই করো।</p></div>${nextSegBtn('quiz', 'কুইজে যাও')}</div></div>`;
  wireGoto(host);
  $$('[data-m]', host).forEach(b => b.onclick = () => playMission(host, key, ms[+b.dataset.m]));
  say(n ? `${bn(n)}টা মিশন শেষ! বাকিগুলোও পারবে।` : 'যেকোনো মিশন দিয়ে শুরু করো!', 'happy');
}
const feedback = (kind, title, body) => {
  if (kind === 'good') Sound.play('correct'); else if (kind === 'bad') Sound.play('wrong');
  return `<div class="feedback ${kind}">${icon(kind === 'good' ? 'check' : kind === 'bad' ? 'heart' : 'bulb', kind === 'bad' ? 'fill' : '')}<div><b>${title}</b><p>${body}</p></div></div>`;
};
function playMission(host, key, m) {
  const engine = PC.games[m.type];
  if (!engine) { host.innerHTML = feedback('info', 'এই মিশনের ধরন পাওয়া যায়নি', `type: "${esc(m.type)}" — games.js-এ এই নামের কোনো গেম নেই।`); return; }
  const p = LP(key);
  const ctx = {
    host, key, m, H,
    shell(extra = '') {
      host.innerHTML = `<div class="gamehead"><button class="btn ghost small" id="gBack">${icon('back')}মিশন তালিকা</button><h3>${m.title}</h3>${extra}<div class="hearts" id="hearts" aria-label="হার্ট">${icon('heart', 'fill').repeat(3)}</div></div><div id="gBody"></div>`;
      $('#gBack').onclick = () => segGames(host, key, lessons[key]);
      let hearts = 3;
      return {
        body: $('#gBody'),
        lose() { hearts = Math.max(0, hearts - 1); const h = $$('#hearts .ic')[hearts]; if (h) h.classList.add('break', 'lost'); Sound.play('heart'); return hearts; },
        get hearts() { return hearts; },
        refill() { hearts = 3; $$('#hearts .ic').forEach(h => h.classList.remove('lost', 'break')); }
      };
    },
    win(el, perfect) {
      const first = !p.games[m.id];
      p.games[m.id] = true; save(); Sound.play('win');
      award(key + ':game-' + m.id, perfect ? (m.xp || 25) : Math.ceil((m.xp || 25) / 2), el);
      if (first && m.badge) giveBadge(m.badge.id);
      refreshLessonHead();
      const ms = lessons[key].missions;
      if (ms.every(k => p.games[k.id])) setTimeout(() => say('গেম জোনের সব মিশন শেষ! তুমি সত্যিই চ্যাম্পিয়ন 🏆 এবার কুইজ!', 'happy'), 400);
    },
    winBox(msg) { return `<div class="feedback good" style="margin-top:16px">${icon('trophy')}<div><b>মিশন সম্পন্ন! দারুণ!</b><p>${msg}</p><div class="row" style="margin-top:10px"><button class="btn primary small" data-back>${icon('game')}পরের মিশন</button><button class="btn ghost small" data-again>${icon('refresh')}আবার খেলো</button></div></div></div>`; },
    wireWin() { const b = $('[data-back]', host), a = $('[data-again]', host); if (b) b.onclick = () => segGames(host, key, lessons[key]); if (a) a.onclick = () => playMission(host, key, m); },
    feedback
  };
  engine(ctx, m);
  host.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

/* ---- 4. quiz ---- */
function segQuiz(host, key, def) {
  const QUIZ = def.quiz || []; const p = LP(key);
  let i = 0, score = 0, combo = 0, best = 0;
  const order = QUIZ.map(x => Object.assign({}, x, { opts: shuffle(x.o.map((o, k) => ({ o, ok: k === 0 }))) }));
  const L = 'কখগঘঙ';
  host.innerHTML = `<div class="quiz stack">
    <div class="section-title" style="margin:0"><div><span class="eyebrow">ধাপ ৪ · অ্যাসেসমেন্ট</span><h2>কুইক কুইজ</h2></div>${p.quizBest ? `<span class="chip">${icon('star')}সেরা: ${bn(p.quizBest)}/${bn(QUIZ.length)}</span>` : ''}</div>
    <div class="qtop"><span class="muted" id="qcount" style="font-weight:600"></span><div class="qbar"><i id="qbar" style="width:0"></i></div><span class="combo" id="combo" aria-live="polite"></span></div>
    <div id="qbox"></div></div>`;
  const q = () => {
    const Q = order[i];
    $('#qcount').textContent = `প্রশ্ন ${bn(i + 1)}/${bn(QUIZ.length)}`;
    $('#qbar').style.width = (i / QUIZ.length * 100) + '%';
    $('#qbox').innerHTML = `<div class="qcard glass strong"><span class="qn">${bn(i + 1)} নম্বর প্রশ্ন</span><h3>${Q.q}</h3>${Q.code ? `<pre class="code" style="margin-bottom:14px">${hl(Q.code)}</pre>` : ''}
      <div class="opts">${Q.opts.map((x, k) => `<button class="opt" data-k="${k}"><span class="k">${L[k]}</span><span>${esc(x.o)}</span></button>`).join('')}</div><div id="qfb"></div></div>`;
    $$('[data-k]', host).forEach(b => b.onclick = () => {
      const x = Q.opts[+b.dataset.k];
      $$('[data-k]', host).forEach(o => { o.disabled = true; if (Q.opts[+o.dataset.k].ok) o.classList.add('right'); });
      if (x.ok) { score++; combo++; best = Math.max(best, combo); mood('happy'); } else { b.classList.add('wrong', 'shake'); combo = 0; mood('think'); }
      $('#combo').innerHTML = combo >= 2 ? `${icon('fire', 'fill')}${bn(combo)}x কম্বো!` : '';
      const praise = ['দারুণ!', 'একদম ঠিক!', 'অসাধারণ!', 'চমৎকার!'][Math.random() * 4 | 0];
      $('#qfb').innerHTML = (x.ok ? feedback('good', praise, Q.ex) : feedback('bad', 'প্রায় হয়ে গেছে! সঠিক উত্তরটা সবুজ রঙে দেখো।', Q.ex)) + `<button class="btn accent" id="qn" style="margin-top:14px">${i < QUIZ.length - 1 ? 'পরের প্রশ্ন' : 'ফলাফল দেখো'} ${icon('arrow')}</button>`;
      if (x.ok && combo >= 3) Sound.play('coin');
      $('#qn').onclick = () => { i++; i < QUIZ.length ? q() : end(); };
      $('#qn').focus({ preventScroll: true });
    });
  };
  const end = () => {
    $('#qbar').style.width = '100%';
    const pctScore = score / QUIZ.length;
    const stars = score === QUIZ.length ? 3 : pctScore >= .75 ? 2 : pctScore >= .5 ? 1 : 0;
    const prev = p.quizBest || 0;
    p.quizBest = Math.max(prev, score); p.seg.quiz = true; save();
    const gain = Math.max(0, score - prev) * 10;
    if (gain) { S.got[key + ':quiz-' + Date.now()] = gain; S.xp += gain; touchStreak(); save(); hud(); }
    $('#qbox').innerHTML = `<div class="result glass strong">
      <div class="stars">${[0, 1, 2].map(k => icon('star', 'fill' + (k < stars ? ' on' : ''))).join('')}</div>
      <div class="score">${bn(score)}/${bn(QUIZ.length)}</div>
      <h3>${score === QUIZ.length ? 'নিখুঁত! তুমি কুইজ চ্যাম্প! 🏆' : pctScore >= .75 ? 'দারুণ করেছ!' : pctScore >= .5 ? 'ভালো হয়েছে! আরেকবার চেষ্টা করলে আরও ভালো হবে।' : 'শুরুটা ভালো! স্টাডি ম্যাটেরিয়ালে একবার চোখ বুলিয়ে আবার চেষ্টা করো।'}</h3>
      <p class="muted">সেরা কম্বো: ${bn(best)} · ${gain ? `+${bn(gain)} XP পেয়েছ` : 'আগের সেরার চেয়ে বেশি পেলে নতুন XP মিলবে'}</p>
      <div class="row" style="justify-content:center"><button class="btn ghost" id="qre">${icon('refresh')}আবার খেলো</button>${nextSegBtn('summary', 'সারসংক্ষেপ')}</div></div>`;
    if (gain) { floatXP(gain, $('.score', host)); Sound.play('coin'); }
    Sound.play(stars >= 2 ? 'win' : 'pop');
    wireGoto(host); $('#qre').onclick = () => segQuiz(host, key, def);
    if (score === QUIZ.length) { giveBadge('quiz-champ'); award(key + ':quiz-perfect', 20, $('.score', host)); } else confetti();
    refreshLessonHead();
  };
  q();
  say('প্রতিটা সঠিক উত্তরে ১০ XP। পরপর সঠিক হলে কম্বো জ্বলবে 🔥', 'happy');
}

/* ---- 5. summary ---- */
function segSummary(host, key, def) {
  const Sm = def.summary || {}; const p = LP(key);
  const ms = def.missions || [];
  const badgeIds = ['first-step', 'first-print'].concat(ms.filter(m => m.badge).map(m => m.badge.id), ms.filter(m => m.challenge && m.challenge.badge).map(m => m.challenge.badge.id), ['quiz-champ'], def.lessonBadge ? [def.lessonBadge.id] : []);
  const missing = SEGS.filter(s => s.id !== 'summary' && !segDone(key, s.id));
  const done = !!p.seg.summary;
  const meta = findLesson(key); const list = meta ? trackLessons(meta.track) : []; const nextL = meta ? list[list.findIndex(l => l.key === key) + 1] : null;
  const g = k => (key + ':' + k) in S.got ? ((S.got[key + ':' + k] > 0 ? '+' : '') + bn(S.got[key + ':' + k])) : '—';
  host.innerHTML = `<div class="stack">
    <div class="section-title" style="margin:0"><div><span class="eyebrow">ধাপ ৫ · সারসংক্ষেপ</span><h2>আজ যা শিখলাম</h2></div></div>
    <div class="keypoints">${(Sm.points || []).map((pt, i) => `<div class="kp"><span class="n">${bn(i + 1)}</span><p>${pt}</p></div>`).join('')}</div>
    <div class="two">
      <div class="glass" style="padding:18px"><h3 style="font-size:1.1rem">XP হিসাব</h3><div class="ledger">
        <div><span>ভিডিও</span><b>${g('video')}</b></div><div><span>স্টাডি ম্যাটেরিয়াল</span><b>${g('material')}</b></div>
        ${ms.map(m => `<div><span>${m.title}</span><b>${g('game-' + m.id)}</b></div>`).join('')}
        <div><span>কুইজের উত্তর</span><b>+${bn((p.quizBest || 0) * 10)}</b></div><div><span>কুইজ ১০০% বোনাস</span><b>${g('quiz-perfect')}</b></div><div><span>পাঠ সম্পন্ন বোনাস</span><b>${g('complete')}</b></div></div></div>
      <div class="glass" style="padding:18px"><h3 style="font-size:1.1rem">এই পাঠের ব্যাজ</h3><div class="badges" style="margin-top:10px;grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${badgeIds.filter(b => BADGES[b]).map(b => `<div class="badge ${S.badges[b] ? '' : 'off'}" style="padding:10px 6px"><div class="medal" style="width:48px;height:48px;font-size:1.3rem">${BADGES[b].e}</div><b style="font-size:.8rem">${BADGES[b].n}</b></div>`).join('')}</div></div>
    </div>
    <div class="donebar glass" style="margin-top:0">
      <div><b style="font-family:var(--font-display);font-size:1.15rem">${done ? `${def.title} সম্পন্ন! 🎓` : missing.length ? `বাকি আছে: ${missing.map(s => s.t).join(', ')}` : 'সব ধাপ শেষ! পাঠ সম্পন্ন করো (+৫০ XP)'}</b>
      <p class="muted" style="font-size:.9rem">${Sm.next || (nextL ? `পরবর্তী পাঠে শিখব: <b>${nextL.title}</b>` : '')}</p></div>
      <div class="row">${done ? (nextL && isReady(nextL.key) ? `<a class="btn primary" href="#${lessonHash(nextL.key)}">পরের পাঠ ${icon('arrow')}</a>` : `<a class="btn primary" href="#courses">${icon('map')}ম্যাপে পরের পাঠ</a>`) : `<button class="btn primary" id="finish" ${missing.length ? 'disabled' : ''}>${icon('trophy')}পাঠ সম্পন্ন করো</button>`}</div></div>
  </div>`;
  const f = $('#finish');
  if (f) f.onclick = () => {
    p.seg.summary = true; save(); award(key + ':complete', 50, f); if (def.lessonBadge) giveBadge(def.lessonBadge.id); else { Sound.play('win'); confetti(); }
    refreshLessonHead(); segSummary(host, key, def); say('অভিনন্দন! 🎉 ম্যাপে দেখো — পরের নোডের পথ খুলে গেছে!', 'happy');
  };
  say(done ? 'তুমি পাঠটা শেষ করেছ! ম্যাপে গিয়ে নতুন পথটা দেখো।' : missing.length ? 'সব ধাপ শেষ করলে “পাঠ সম্পন্ন করো” বাটন জ্বলে উঠবে।' : 'শেষ বাটনটা চাপো আর বোনাস XP নাও!', 'happy');
}

/* ================= PROFILE ================= */
function renderProfile() {
  const lv = levelOf(S.xp), cur = LEVELS[lv][0], nxt = LEVELS[lv + 1] ? LEVELS[lv + 1][0] : null;
  const pct = nxt ? Math.round((S.xp - cur) / (nxt - cur) * 100) : 100;
  const nBadges = Object.keys(S.badges).length;
  const ready = allLessons().filter(l => isReady(l.key));
  app().innerHTML = `<div class="view prof">
    <section class="pcard glass">
      <div class="pythu">${pythuSVG()}</div>
      <label class="sr" for="pname">তোমার নাম</label><input id="pname" value="${esc(S.name)}" maxlength="30">
      <span class="lvlname">${LEVELS[lv][1]}</span>
      <div style="width:100%"><div class="xpbar"><i style="width:${pct}%"></i></div><p class="muted" style="font-size:.85rem;margin-top:6px">${nxt ? `পরের লেভেল “${LEVELS[lv + 1][1]}” পর্যন্ত আর ${bn(nxt - S.xp)} XP` : 'সর্বোচ্চ লেভেল!'}</p></div>
      <div class="levels" style="width:100%">${LEVELS.map((l, k) => `<div class="${k <= lv ? 'on' : ''}">${l[1]}<br>${bn(l[0])}</div>`).join('')}</div>
    </section>
    <div class="stack">
      <div class="stats">
        <div class="stat glass"><span class="v">${bn(S.xp)}</span><span class="k">মোট XP</span></div>
        <div class="stat glass"><span class="v" style="color:#ff7a1a">${bn(S.streak.count)}</span><span class="k">দিনের স্ট্রিক</span></div>
        <div class="stat glass"><span class="v">${bn(allLessons().filter(l => lessonDone(l.key)).length)}</span><span class="k">পাঠ সম্পন্ন</span></div>
        <div class="stat glass"><span class="v">${bn(nBadges)}</span><span class="k">ব্যাজ</span></div>
      </div>
      <section class="glass" style="padding:20px"><div class="section-title"><h2 style="font-size:1.3rem">ব্যাজ সংগ্রহ</h2><span class="muted">${bn(nBadges)}/${bn(Object.keys(BADGES).length)}</span></div>
        <div class="badges">${Object.entries(BADGES).map(([k, b]) => `<div class="badge ${S.badges[k] ? '' : 'off'}"><div class="medal">${b.e}</div><b>${b.n}</b><small>${b.d}</small></div>`).join('')}</div></section>
      <section class="glass" style="padding:20px"><div class="section-title"><h2 style="font-size:1.3rem">পাঠের অগ্রগতি</h2></div>
        <div class="ledger">${ready.map(l => `<div><a href="#${lessonHash(l.key)}" style="color:inherit">${l.track.name} · ${lessonLabel(l)} · ${l.title}</a><b style="color:${lessonDone(l.key) ? 'var(--teal)' : 'var(--ink-3)'}">${lessonDone(l.key) ? 'সম্পন্ন' : bn(lessonPct(l.key)) + '%'}</b></div>`).join('')}</div>
        <div style="margin-top:16px"><button class="btn ghost small" id="resetBtn">${icon('refresh')}অগ্রগতি মুছে নতুন করে শুরু</button><div id="resetBox"></div></div></section>
    </div></div>`;
  $('#pname').onchange = e => { S.name = e.target.value.trim() || 'নতুন কোডার'; save(); say(`সুন্দর নাম, <b>${esc(S.name)}</b>!`, 'happy'); };
  $('#resetBtn').onclick = () => {
    $('#resetBox').innerHTML = `<div class="confirm"><span>সব XP, ব্যাজ আর অগ্রগতি মুছে যাবে। নিশ্চিত?</span><button class="btn small" style="background:var(--coral);color:#fff" id="yesReset">হ্যাঁ, মুছে দাও</button><button class="btn ghost small" id="noReset">না</button></div>`;
    $('#noReset').onclick = () => { $('#resetBox').innerHTML = ''; };
    $('#yesReset').onclick = () => { const th = S.theme, snd = S.sound; S = fresh(); S.theme = th; S.sound = snd; save(); hud(); curSeg = 'video'; renderProfile(); say('নতুন করে শুরু! চলো আবার যাত্রা শুরু করি।', 'happy'); };
  };
  say(`${esc(S.name)}, তোমার ${bn(nBadges)}টা ব্যাজ আছে। পরেরটা কোনটা হবে?`, 'happy');
}

/* ================= PLAYGROUND ================= */
const EXAMPLES = [
  ['হ্যালো ঢাকা', 'প্রথম print()', 'print("হ্যালো, ঢাকা!")\nprint("আজ আমি পাইথন শিখছি")'],
  ['নাম জিজ্ঞেস করো', 'input() দিয়ে কথা বলা', 'name = input("তোমার নাম কী? ")\nprint("স্বাগতম,", name, "!")'],
  ['ক্রিকেট রান-রেট', 'হিসাব আর f-string', 'runs = 186\novers = 20\nrate = runs / overs\nprint(f"রান-রেট: {rate:.2f}")'],
  ['বয়স হিসাব', 'int() দিয়ে সংখ্যা বানানো', 'birth = int(input("জন্মসাল লেখো: "))\nage = 2026 - birth\nprint("এ বছর তোমার বয়স", age)'],
  ['ডেটা টাইপ', 'type() দিয়ে দেখো', 'print(type(10))\nprint(type(3.5))\nprint(type("পাইথন"))\nprint(type(True))']
];
function renderPlayground() {
  app().innerHTML = `<div class="view stack">
    <div class="section-title" style="margin:0"><div><span class="eyebrow">প্লেগ্রাউন্ড</span><h2>নিজের মতো কোড লেখো</h2><p class="muted">মডিউল ১-এর পাইথন এখানে চলে: print, input, ভেরিয়েবল, হিসাব, ডেটা টাইপ। Ctrl + Enter চাপলেও রান হয়।</p></div></div>
    <div class="pg"><div id="pgEd"></div>
    <aside class="glass" style="padding:16px"><h3 style="font-size:1.1rem;margin-bottom:10px">উদাহরণ দিয়ে শুরু করো</h3><div class="examples">${EXAMPLES.map((e, i) => `<button data-ex="${i}"><b>${e[0]}</b><span>${e[1]}</span></button>`).join('')}</div></aside></div></div>`;
  const ed = makeEditor($('#pgEd'), { code: S.notes.pg || EXAMPLES[0][2], file: 'playground.py' });
  $('#pgEd textarea').addEventListener('input', e => { S.notes.pg = e.target.value; save(); });
  $$('[data-ex]').forEach(b => b.onclick = () => { ed.value = EXAMPLES[+b.dataset.ex][2]; S.notes.pg = ed.value; save(); ed.run(); });
  say('যা খুশি লিখে দেখো! ভুল হলে পাইথু বাংলায় বুঝিয়ে দেবে।', 'happy');
}

/* ================= helpers exposed to lesson files ================= */
const H = {
  $, $$, bn, esc, icon, hl, sleep, shuffle, reduced, pythuSVG, makeEditor, runPython, say, mood, sound: n => Sound.play(n), award, giveBadge, confetti,
  /* ছোট HTML বানানোর সহায়ক */
  section: (id, n, title, body) => `<article class="msec glass" id="${id}"><h2><span class="n">${n}</span>${title}</h2>${body}</article>`,
  callout: (kind, ic, title, body) => `<div class="callout ${kind || ''}">${icon(ic || 'bulb')}<div><b>${title}</b><p>${body}</p></div></div>`,
  code: src => `<pre class="code">${hl(src)}</pre>`
};

/* ================= boot ================= */
function boot() {
  if (S.theme) document.documentElement.dataset.theme = S.theme;
  $('#themeBtn').onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    S.theme = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; save();
  };
  syncSoundBtn();
  soundBtn().onclick = () => { S.sound = S.sound === false; save(); syncSoundBtn(); if (S.sound) Sound.play('correct'); say(S.sound ? 'সাউন্ড চালু 🔊' : 'সাউন্ড বন্ধ 🔇', 'happy'); };
  $('#guidePythu').innerHTML = pythuSVG();
  $('#guidePythu').onclick = () => { Sound.play('pop'); say(TIPS[Math.random() * TIPS.length | 0], 'happy'); };
  $('#bubbleX').onclick = () => { $('#bubble').hidden = true; };
  addEventListener('hashchange', route);
  hud(); route();
}

return { boot, registerLesson, games: {}, h: H, lessons };
})();
