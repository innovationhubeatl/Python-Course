/* =====================================================================
   গেম ইঞ্জিন — প্রতিটা পাঠ এই ৫ ধরনের গেম ব্যবহার করতে পারে।
   পাঠের ফাইলে mission-এর type দিয়ে বেছে নাও:
     'sequence' → ধাপগুলো সঠিক ক্রমে সাজাও
     'predict'  → কোডের আউটপুট আগে থেকে অনুমান করো
     'match'    → প্রতিটা জিনিস সঠিক ঘরে মেলাও
     'bug'      → কোন লাইনে বাগ আছে খুঁজে বের করো
     'fix'      → ভাঙা কোড ঠিক করো (+ চাইলে মিনি চ্যালেঞ্জ)
   প্রতিটার config কেমন হয় তা lessons/_template.js-এ দেখানো আছে।
   ===================================================================== */
(() => {
const G = PC.games;
const { $, $$, bn, esc, icon, hl, sleep, shuffle, reduced, makeEditor, runPython, say, mood, sound } = PC.h;

/* ---------- 1. sequence ---------- */
G.sequence = (ctx, m) => {
  const R = m.rounds;
  const g = ctx.shell(`<div class="gprog" id="gp">${R.map(() => '<i></i>').join('')}</div>`);
  let r = 0, mistakes = 0;
  const prog = () => $$('#gp i').forEach((el, k) => { el.className = k < r ? 'ok' : k === r ? 'on' : ''; });
  const round = () => {
    prog();
    const X = R[r]; let placed = [], locked = 0, hint = 0;
    const pool = shuffle(X.steps.map((s, i) => i));
    g.body.innerHTML = `<p class="task">${X.title}</p><p class="muted" style="margin:-6px 0 12px">কার্ডে চাপ দিলে সেটা পরের খালি ঘরে বসবে। ঘরে বসা কার্ডে চাপ দিলে ফেরত যাবে।</p>
      <div class="seq"><div class="pool" id="pool"></div><div class="slots" id="slots"></div></div>
      <div class="robot-out"><div class="robot" id="bot">${icon(m.actorIcon || 'robot')}</div><div id="botSay" style="flex:1">সাজানো হলে “চালাও” চাপো।</div><button class="btn primary small" id="runBot" disabled>${icon('play')}${m.runLabel || 'রোবট চালাও'}</button></div><div id="fb"></div>`;
    const draw = () => {
      const left = pool.filter(i => !placed.includes(i));
      $('#pool').innerHTML = '<h4>এলোমেলো ধাপ</h4>' + (left.length ? left.map(i => `<button class="card" data-p="${i}">${icon(X.steps[i][0])}${X.steps[i][1]}</button>`).join('') : '<p class="muted">সব কার্ড বসানো হয়েছে</p>');
      $('#slots').innerHTML = '<h4>সঠিক ক্রম</h4>' + X.steps.map((_, k) => `<div class="slot" data-s="${k}"><span class="sn">${bn(k + 1)}</span>${placed[k] !== undefined ? `<button class="card" data-q="${k}" ${k < locked ? 'disabled' : ''}>${icon(X.steps[placed[k]][0])}${X.steps[placed[k]][1]}</button>` : '<span class="muted" style="font-size:.88rem">খালি</span>'}</div>`).join('');
      $$('[data-p]').forEach(b => b.onclick = () => { sound('pop'); placed.push(+b.dataset.p); draw(); });
      $$('[data-q]').forEach(b => b.onclick = () => { placed.splice(+b.dataset.q, 1); draw(); });
      $('#runBot').disabled = placed.length !== X.steps.length;
    };
    draw();
    $('#runBot').onclick = async () => {
      $('#runBot').disabled = true; $('#fb').innerHTML = '';
      const bot = $('#bot'); bot.classList.add('work'); let bad = -1;
      for (let k = 0; k < placed.length; k++) {
        const sl = $(`[data-s="${k}"]`); sl.classList.add('run'); sound('step');
        $('#botSay').textContent = `ধাপ ${bn(k + 1)}: “${X.steps[placed[k]][1]}” — হুবহু মানছি!`;
        await sleep(reduced ? 150 : 650); sl.classList.remove('run');
        if (placed[k] !== k) { sl.classList.add('wrong'); bad = k; break; } else sl.classList.add('right');
      }
      bot.classList.remove('work');
      if (bad < 0) {
        $('#botSay').innerHTML = `<b style="font-family:var(--font-display);font-size:1.15rem">${X.result}</b>`; mood('happy');
        if (r < R.length - 1) { $('#fb').innerHTML = ctx.feedback('good', 'একদম ঠিক ক্রম!', 'ঠিক তোমার দেওয়া ক্রমেই কাজ হয়েছে। চলো পরের রাউন্ড!') + `<button class="btn accent small" id="nextR" style="margin-top:10px">পরের রাউন্ড ${icon('arrow')}</button>`; $('#nextR').onclick = () => { r++; round(); }; }
        else { r++; prog(); $('#fb').innerHTML = ctx.winBox(m.winMsg || 'সঠিক ধাপ আর সঠিক ক্রম — এটাই প্রোগ্রামিং!'); ctx.wireWin(); ctx.win($('#bot'), mistakes === 0); }
      } else {
        mistakes++;
        $('#botSay').innerHTML = `উফ! “${X.steps[placed[bad]][1]}” এখনই? হুবহু তোমার ক্রম মেনেছি, তাই কাজটা হলো না 🤖💦`;
        const left = g.lose(); hint++;
        if (left === 0) {
          placed = X.steps.map((_, i) => i); locked = X.steps.length; draw(); $('#runBot').disabled = false;
          $('#fb').innerHTML = ctx.feedback('info', 'চিন্তা নেই, পাইথু সাজিয়ে দিল!', 'সঠিক ক্রমটা দেখো, তারপর “চালাও” চাপো। পরের বার তুমি নিজেই পারবে।'); g.refill();
        } else {
          if (hint >= 2) { locked = Math.min(X.steps.length - 1, locked + 1); placed = X.steps.slice(0, locked).map((_, i) => i); } else placed = placed.slice(0, bad);
          draw();
          $('#fb').innerHTML = ctx.feedback('bad', 'প্রায় হয়ে গেছে, আরেকবার চেষ্টা করো!', hint >= 2 ? `বড় হিন্ট: প্রথম ${bn(locked)}টা ধাপ পাইথু বসিয়ে দিয়েছে। বাকিটা তুমি সাজাও।` : `হিন্ট: ${X.hint || 'কোনটা সবার আগে লাগবে ভাবো।'} ভুল ধাপ থেকে বাকিগুলো সরিয়ে দিলাম।`);
          say('ভুল হলে কিছু হয় না! কম্পিউটারও ঠিক এমনই — যা বলা হয় হুবহু তাই করে।', 'think');
        }
      }
    };
  };
  round();
  say(m.intro || 'ধাপগুলো ঠিক ক্রমে সাজাও!', 'think');
};

/* ---------- 2. predict ---------- */
G.predict = (ctx, m) => {
  const Q = m.rounds;
  const g = ctx.shell(`<div class="gprog" id="gp">${Q.map(() => '<i></i>').join('')}</div>`);
  let q = 0, wrongs = 0; const L = 'কখগঘ';
  const show = () => {
    $$('#gp i').forEach((el, k) => { el.className = k < q ? 'ok' : k === q ? 'on' : ''; });
    const X = Q[q]; const opts = shuffle(X.opts.map((o, i) => ({ o, ok: i === 0 })));
    const lines = X.code.split('\n');
    g.body.innerHTML = `<div class="predict"><p class="task">ভাবো → অনুমান করো → দেখো: এই কোড চালালে পর্দায় কী আসবে?</p>
      <div class="stage2"><div class="file"><div class="fn">predict.py</div><div class="body">${lines.map((l, i) => `<div class="ln lit"><span class="g">${i + 1}</span><span>${hl(l)}</span></div>`).join('')}</div></div>
      <div class="screen" id="pscr"><span class="lbl2">পর্দা (আউটপুট)</span><span style="color:var(--code-dim)">?</span></div></div>
      <div class="opts">${opts.map((x, i) => `<button class="opt" data-o="${i}"><span class="k">${L[i]}</span><code>${esc(x.o)}</code></button>`).join('')}</div><div id="fb"></div></div>`;
    $$('[data-o]').forEach(b => b.onclick = async () => {
      const x = opts[+b.dataset.o];
      if (!x.ok) {
        b.classList.add('wrong', 'shake'); b.disabled = true; wrongs++;
        const left = g.lose();
        if (left > 0) { $('#fb').innerHTML = ctx.feedback('bad', 'প্রায়! আরেকবার ভাবো।', X.hint || 'হিন্ট: উদ্ধৃতিচিহ্ন আছে কি না দেখো। থাকলে লেখা, না থাকলে হিসাব।'); mood('think'); return; }
        g.refill();
      }
      $$('[data-o]').forEach(o => o.disabled = true);
      const right = $$('[data-o]').find(o => opts[+o.dataset.o].ok); right.classList.add('right');
      const tmp = document.createElement('div'); const res = await runPython(X.code, tmp);
      const scr = $('#pscr'); const out = res.out.replace(/\n$/, '');
      if (!reduced) {
        const from = right.getBoundingClientRect(), to = scr.getBoundingClientRect();
        const f = document.createElement('div'); f.className = 'fly'; f.textContent = out; f.style.left = from.left + 'px'; f.style.top = from.top + 'px';
        document.body.appendChild(f); sound('flip'); await sleep(20);
        f.style.transform = `translate(${to.left + 20 - from.left}px, ${to.top + 30 - from.top}px)`; await sleep(620); f.remove();
      }
      scr.innerHTML = `<span class="lbl2">পর্দা (আউটপুট)</span><div style="white-space:pre-wrap">${esc(out)}</div>`;
      $('#fb').innerHTML = x.ok ? ctx.feedback('good', 'দারুণ! ঠিক অনুমান।', X.ex) : ctx.feedback('info', 'এবার উত্তরটা দেখে নাও', X.ex);
      if (x.ok) mood('happy');
      if (q < Q.length - 1) { $('#fb').insertAdjacentHTML('beforeend', `<button class="btn accent small" id="nq" style="margin-top:10px">পরের কোড ${icon('arrow')}</button>`); $('#nq').onclick = () => { q++; show(); }; }
      else { q++; $$('#gp i').forEach(el => el.className = 'ok'); $('#fb').insertAdjacentHTML('beforeend', ctx.winBox(wrongs ? 'অনুমান করে তারপর মিলিয়ে দেখা — প্রোগ্রামাররা ঠিক এভাবেই শেখে।' : 'একটাও ভুল নেই! তুমি সত্যিকারের ভবিষ্যদ্বক্তা 🔮')); ctx.wireWin(); ctx.win(right, wrongs === 0); }
    });
  };
  show();
  say(m.intro || 'আগে নিজে ভাবো, তারপর উত্তর বেছে নাও। পাইথু আসল কোড চালিয়ে দেখাবে!', 'think');
};

/* ---------- 3. match ---------- */
G.match = (ctx, m) => {
  const BINS = m.bins, ITEMS = shuffle(m.items);
  const g = ctx.shell();
  let sel = null, left = ITEMS.length, wrongs = 0;
  g.body.innerHTML = `<p class="task">${m.task || 'প্রথমে বাঁ দিকের একটা জিনিস বেছে নাও, তারপর ডান দিকের সঠিক ঘরে চাপ দাও।'}</p>
    <div class="match"><div class="items">${ITEMS.map((x, i) => `<button class="item" data-i="${i}" aria-pressed="false">${x[0]}</button>`).join('')}</div>
    <div class="bins">${BINS.map(b => `<button class="bin" data-b="${b[0]}"><span class="bh"><span class="uic" style="background:${b[2]}">${icon(b[1])}</span>${b[3]}</span></button>`).join('')}</div></div><div id="fb"></div>`;
  const finish = el => { $('#fb').innerHTML = ctx.winBox(m.winMsg || 'সব মেলানো শেষ!'); ctx.wireWin(); ctx.win(el, wrongs === 0); mood('happy'); };
  $$('[data-i]').forEach(b => b.onclick = () => { $$('[data-i]').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); sel = +b.dataset.i; sound('pop'); });
  $$('[data-b]').forEach(bin => bin.onclick = () => {
    if (sel === null) { $('#fb').innerHTML = ctx.feedback('info', 'আগে একটা জিনিস বেছে নাও', 'বাঁ দিকের তালিকা থেকে একটায় চাপ দাও।'); return; }
    const it = ITEMS[sel], btn = $(`[data-i="${sel}"]`);
    if (it[1] === bin.dataset.b) {
      bin.insertAdjacentHTML('beforeend', `<span class="got">${it[0]}</span>`); btn.remove(); sel = null; left--;
      $('#fb').innerHTML = ctx.feedback('good', 'ঠিক!', 'চমৎকার মিলিয়েছ।');
      if (!left) finish(bin);
    } else {
      wrongs++; bin.classList.add('shake'); setTimeout(() => bin.classList.remove('shake'), 450);
      const l = g.lose();
      if (l === 0) {
        const right = $(`[data-b="${it[1]}"]`); right.insertAdjacentHTML('beforeend', `<span class="got">${it[0]}</span>`); btn.remove(); sel = null; left--; g.refill();
        $('#fb').innerHTML = ctx.feedback('info', 'পাইথু এটা মিলিয়ে দিল', `“${it[0]}” পড়ে ${BINS.find(b => b[0] === it[1])[3]} ঘরে। বাকিগুলো তুমি পারবে!`);
        if (!left) finish(right);
      } else $('#fb').innerHTML = ctx.feedback('bad', 'এই ঘরে না — আরেকবার ভাবো!', m.hint || 'হিন্ট: জিনিসটা আসলে কী কাজ করে, সেটা ভাবো।');
    }
  });
  say(m.intro || 'ভেবে দেখো, প্রতিটা জিনিস কোন ঘরে যাবে?', 'think');
};

/* ---------- 4. bug ---------- */
G.bug = (ctx, m) => {
  const R = m.rounds;
  const g = ctx.shell(`<div class="gprog" id="gp">${R.map(() => '<i></i>').join('')}</div>`);
  let r = 0, wrongs = 0;
  const show = () => {
    $$('#gp i').forEach((el, k) => { el.className = k < r ? 'ok' : k === r ? 'on' : ''; });
    const X = R[r];
    g.body.innerHTML = `<p class="task">কোড ডিটেকটিভ 🔍 কোন লাইনে বাগ (ভুল) লুকিয়ে আছে? লাইনে চাপ দাও।</p>
      <div class="bugcode">${X.lines.map((l, i) => `<button class="bugline" data-l="${i}"><span class="g">${i + 1}</span><span>${hl(l)}</span></button>`).join('')}</div><div id="fb"></div>`;
    $$('[data-l]').forEach(b => b.onclick = async () => {
      const hit = +b.dataset.l === X.bug;
      if (!hit) {
        wrongs++; b.classList.add('miss'); setTimeout(() => b.classList.remove('miss'), 450);
        const left = g.lose();
        if (left > 0) { $('#fb').innerHTML = ctx.feedback('bad', 'এই লাইনটা ঠিক আছে!', left === 2 ? 'হিন্ট: প্রতিটা অক্ষর, ব্র্যাকেট আর উদ্ধৃতিচিহ্ন খুব মন দিয়ে দেখো।' : `বড় হিন্ট: লাইন ${bn(X.bug + 1)}-এর দিকে ভালো করে তাকাও।`); return; }
        g.refill();
      }
      $$('[data-l]').forEach(x => x.disabled = true); $(`[data-l="${X.bug}"]`).classList.add('found');
      const tmp = document.createElement('div'); const res = await runPython(X.lines.join('\n'), tmp);
      const errLine = res.tb ? res.tb.split('\n').slice(-1)[0] : '';
      $('#fb').innerHTML = ctx.feedback(hit ? 'good' : 'info', hit ? 'বাগ ধরা পড়েছে! 🐞' : 'এই যে বাগটা!', X.why) +
        (errLine ? `<div class="realerr">আসল পাইথন যা বলে:\n${esc(errLine)}</div>` : '') + `<p style="margin-top:10px">ঠিক করা লাইন:</p><pre class="code" style="margin-top:6px">${hl(X.fix)}</pre>`;
      if (r < R.length - 1) { $('#fb').insertAdjacentHTML('beforeend', `<button class="btn accent small" id="nr" style="margin-top:12px">পরের কেস ${icon('arrow')}</button>`); $('#nr').onclick = () => { r++; show(); }; }
      else { r++; $$('#gp i').forEach(el => el.className = 'ok'); $('#fb').insertAdjacentHTML('beforeend', ctx.winBox(m.winMsg || 'সব কেস সমাধান! বাগ খুঁজে ঠিক করাকে বলে ডিবাগিং।')); ctx.wireWin(); ctx.win(b, wrongs === 0); }
      mood('happy');
    });
  };
  show();
  say(m.intro || 'ছোট্ট একটা ভুলেই পুরো প্রোগ্রাম আটকে যায়। ডিটেকটিভের চোখ দিয়ে দেখো!', 'think');
};

/* ---------- 5. fix (+ optional challenge) ---------- */
G.fix = (ctx, m) => {
  const hasCh = !!m.challenge;
  const g = ctx.shell(`<div class="gprog" id="gp"><i class="on"></i>${hasCh ? '<i></i>' : ''}</div>`);
  let hint = 0, fails = 0;
  const HINTS = m.hints || ['ছোট হিন্ট: এরর মেসেজে লাইন নম্বর থাকে। আগে সেই লাইনটা ঠিক করো।', 'বড় হিন্ট: প্রতিটা লাইনের ব্র্যাকেট আর উদ্ধৃতিচিহ্ন গুনে দেখো।', 'উত্তর দেখানো হলো (−৫ XP)। পড়ে বুঝে নাও, তারপর চালাও।'];
  const partA = () => {
    g.body.innerHTML = `<p class="task">${hasCh ? 'পার্ট ১ · ' : ''}${m.task || 'কোড ঠিক করো: ভুলগুলো সারিয়ে চালাও, যতক্ষণ না আউটপুট মেলে।'}</p>
      <div class="two" style="align-items:start"><div id="fixEd"></div><div><p style="font-weight:600;margin-bottom:6px">যে আউটপুট চাই:</p><div class="screen">${esc(m.expect)}</div>
      <div class="row" style="margin-top:12px"><button class="btn ghost small" id="hintBtn">${icon('bulb')}হিন্ট (১/৩)</button></div><div id="hintBox"></div></div></div><div id="fb"></div>`;
    const ed = makeEditor($('#fixEd'), { code: m.broken, file: m.file || 'fix_me.py', runLabel: 'চালাও ও মেলাও', onRun: r => {
      if (r.ok && r.out.trim() === m.expect.trim()) {
        if (hasCh) { $('#fb').innerHTML = ctx.feedback('good', 'আউটপুট মিলে গেছে! 🎉', 'সব বাগ ঠিক করেছ। এবার নিজের প্রোগ্রাম লেখার পালা!') + `<button class="btn accent small" id="toB" style="margin-top:10px">পার্ট ২: মিনি চ্যালেঞ্জ ${icon('arrow')}</button>`; $('#toB').onclick = partB; }
        else { $('#fb').innerHTML = ctx.winBox('আউটপুট মিলে গেছে! তুমি এখন কোড মেকানিক।'); ctx.wireWin(); ctx.win($('#fb'), fails === 0 && hint < 3); }
        mood('happy');
      } else {
        fails++; const left = g.lose();
        if (left === 0) { g.refill(); $('#fb').innerHTML = ctx.feedback('info', 'একটু কঠিন ছিল, তাই না?', 'হিন্ট বাটনে চাপলে পাইথু ধাপে ধাপে সাহায্য করবে। শেষ হিন্টে পুরো উত্তরও দেখা যাবে।'); }
        else $('#fb').innerHTML = ctx.feedback('bad', r.ok ? 'চলেছে, কিন্তু আউটপুট এখনো মেলেনি' : 'এখনো একটা বাগ বাকি', r.ok ? 'যে আউটপুট চাই তার সাথে অক্ষর ধরে ধরে মিলিয়ে দেখো।' : 'এডিটরের নিচের লাল বাক্সে কোন লাইনে কী সমস্যা তা বাংলায় লেখা আছে।');
      }
    } });
    $('#hintBtn').onclick = e => {
      if (hint >= 3) return; hint++; sound('flip');
      $('#hintBox').innerHTML = ctx.feedback('info', `হিন্ট ${bn(hint)}`, HINTS[hint - 1]);
      if (hint === 3) { ed.value = m.fixed; PC.h.award(ctx.key + ':hint-' + m.id, -5, e.currentTarget); }
      e.currentTarget.lastChild.textContent = hint < 3 ? `হিন্ট (${bn(hint + 1)}/৩)` : 'সব হিন্ট দেখা শেষ';
      if (hint >= 3) e.currentTarget.disabled = true;
    };
  };
  const partB = () => {
    const C = m.challenge;
    $$('#gp i').forEach((el, k) => el.className = k === 0 ? 'ok' : 'on'); g.refill();
    g.body.innerHTML = `<p class="task">পার্ট ২ · মিনি চ্যালেঞ্জ: ${C.title}</p>
      ${PC.h.callout('', 'target', 'কাজ', C.task)}<div id="chEd" style="margin-top:14px"></div><div id="fb"></div>`;
    makeEditor($('#chEd'), { code: C.starter || '', file: C.file || 'challenge.py', runLabel: 'চালাও ও জমা দাও', onRun: (r, code) => {
      const lines = r.out.split('\n').filter(l => l.trim());
      const prints = (code.match(/^\s*print\s*\(/gm) || []).length;
      const ph = C.placeholder && r.out.includes(C.placeholder);
      if (r.ok && lines.length >= (C.minLines || 1) && prints >= (C.minPrints || 1) && !ph) {
        $$('#gp i').forEach(el => el.className = 'ok');
        $('#fb').innerHTML = ctx.winBox(C.winMsg || 'তুমি নিজের প্রোগ্রাম লিখেছ! ✨'); ctx.wireWin();
        ctx.win($('#fb'), fails === 0 && hint < 3); if (C.badge) PC.h.giveBadge(C.badge.id); mood('happy');
      } else if (!r.ok) { $('#fb').innerHTML = ctx.feedback('bad', 'একটা এরর এসেছে', 'লাল বাক্সের ব্যাখ্যা দেখে ঠিক করো। তুমি পারবে!'); g.lose(); }
      else if (ph) $('#fb').innerHTML = ctx.feedback('info', 'প্রায় হয়ে গেছে!', `“${esc(C.placeholder)}” এর জায়গায় তোমার নিজের লেখা দাও।`);
      else $('#fb').innerHTML = ctx.feedback('info', 'আরেকটু বাকি!', `এখন আউটপুটে ${bn(lines.length)} লাইন আছে। অন্তত ${bn(C.minLines || 1)} লাইন দেখাও।`);
    } });
  };
  partA();
  say(m.intro || 'এরর মেসেজ তোমার বন্ধু! কোন লাইনে কী ভুল তা বলে দেয়।', 'think');
};
})();
