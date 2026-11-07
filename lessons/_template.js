/* =====================================================================
   নতুন পাঠের টেমপ্লেট
   ---------------------------------------------------------------------
   ব্যবহারের নিয়ম:
   ১. এই ফাইলটা কপি করে নাম দাও, যেমন:  lessons/lesson-b-1-2.js
   ২. নিচে key বদলাও (js/course-data.js-এর পাঠের সাথে মিলিয়ে), যেমন 'b-1.2'
   ৩. কনটেন্ট লেখো (ভিডিও, ম্যাটেরিয়াল, মিশন, কুইজ, সারসংক্ষেপ)
   ৪. index.html-এ এই লাইনটা যোগ করো (অন্য lesson লাইনের নিচে):
        <script src="lessons/lesson-b-1-2.js"></script>
   ব্যস! ম্যাপে পাঠটা নিজে থেকেই চালু হয়ে যাবে।

   টিপস:
   • যেকোনো অংশ বাদ দিতে চাইলে সেটা মুছে দাও বা খালি রাখো।
   • আইকনের নাম: home map code user play book target game quiz trophy lock
     check star fire heart bolt video monitor doc gear globe chart robot tv
     flask kettle leaf cup search pencil bug sparkle clock wrench mobile plus folder vol
   • h.icon('নাম'), h.hl('কোড'), h.code('কোড'), h.callout(...), h.section(...)
     এগুলো HTML বানাতে সাহায্য করে। নিচে উদাহরণ আছে।
   ===================================================================== */
(() => {
const h = PC.h;
const { icon, $ } = h;

PC.registerLesson({
  key: 'b-1.2',                       // ← অবশ্যই বদলাও
  title: 'Syntax ও Comments',
  minutes: '১০–১২ মিনিট',
  xpText: '২৫০+ XP',
  lessonBadge: { id: 'lesson-b-1.2', e: '🎓', n: 'পাঠ ১.২ সম্পন্ন', d: 'Syntax ও Comments শেষ' },

  /* ১. ভিডিও
     — রেকর্ড করা ভিডিও থাকলে videos/ ফোল্ডারে রেখে src দাও।
     — না থাকলে scenes দিয়ে অ্যানিমেটেড স্লাইড-ভিডিও বানাও। */
  video: {
    title: 'পাইথনের লেখার নিয়ম',
    src: '',                          // যেমন 'videos/lesson-b-1-2.mp4'
    poster: '',                       // ঐচ্ছিক থাম্বনেইল ছবি
    xp: 20,
    scenes: [
      { ch: 'Syntax কী?', cap: 'প্রতিটা ভাষার লেখার নিয়ম আছে। পাইথনের নিয়মকে বলে Syntax।',
        vis: `<div class="scode pop" style="--d:0"><span class="f">print</span>(<span class="s">"নিয়ম মেনে লিখি"</span>)</div>` },
      { ch: 'Comment', cap: '# দিয়ে শুরু করা লাইন পাইথন চালায় না — এটা মানুষের জন্য নোট।',
        vis: `<div class="scode pop" style="--d:0"># এটা একটা কমেন্ট</div>` }
    ]
  },

  /* ২. স্টাডি ম্যাটেরিয়াল */
  material: {
    xp: 30,
    toc: [['s1', 'Syntax কী?'], ['s2', 'Comment কী?']],   // [section id, শিরোনাম]
    html: () => `
      ${h.section('s1', '১', 'Syntax কী?', `
        <p>Syntax মানে কোড লেখার নিয়ম। নিয়ম ভাঙলে পাইথন <b>SyntaxError</b> দেখায়।</p>
        ${h.code('print("সঠিক")\nprint("ভুল"')}
        ${h.callout('yellow', 'bulb', 'মনে রাখো', 'প্রতিটা খোলা ব্র্যাকেটের একটা বন্ধ ব্র্যাকেট লাগে।')}`)}
      ${h.section('s2', '২', 'Comment কী?', `
        <p># চিহ্নের পরের লেখা পাইথন উপেক্ষা করে। নিচে চালিয়ে দেখো:</p>
        <div id="ed1" style="margin-top:12px"></div>`)}
    `,
    /* html বসানোর পর চালু হয় — এডিটর বা অ্যানিমেশন এখানে চালু করো */
    init: (host) => {
      h.makeEditor($('#ed1'), { code: '# এটা কমেন্ট, চলবে না\nprint("এটা চলবে")', file: 'comment.py' });
    },
    practice: [
      ['১. কমেন্ট কেন লিখি?', '<p>কোড অন্যদের (আর ভবিষ্যতের নিজেকে) বোঝানোর জন্য।</p>']
    ]
  },

  /* ৩. গেম জোন — ৫ ধরনের মিশন। যতগুলো চাও রাখো। */
  missions: [
    { id: 'order', type: 'sequence', title: 'ধাপ সাজাও', icon: 'robot', color: '#2f63d0', xp: 25,
      desc: 'ধাপগুলো সঠিক ক্রমে সাজাও।',
      badge: { id: 'b12-order', e: '🧩', n: 'ক্রম মাস্টার', d: 'ধাপ সঠিক ক্রমে সাজিয়েছ' },
      rounds: [
        { title: 'প্রোগ্রাম চালানোর ধাপ', steps: [['pencil', 'কোড লেখো'], ['play', 'রান করো'], ['monitor', 'আউটপুট দেখো']], result: 'প্রোগ্রাম চলেছে!', hint: 'আগে তো লিখতে হবে!' }
      ] },
    { id: 'guess', type: 'predict', title: 'আউটপুট অনুমান', icon: 'search', color: '#7c3aed', xp: 25,
      desc: 'চালানোর আগে বলো কী আসবে।',
      rounds: [
        // opts[0] = সঠিক উত্তর
        { code: '# print("লুকানো")\nprint("দেখা যাবে")', opts: ['দেখা যাবে', 'লুকানো\nদেখা যাবে', 'কিছুই না'], ex: 'প্রথম লাইনটা কমেন্ট, তাই চলে না।' }
      ] },
    { id: 'sort', type: 'match', title: 'মেলাও', icon: 'globe', color: '#0f9e8e', xp: 20,
      desc: 'প্রতিটা লাইন সঠিক ঘরে রাখো।',
      bins: [['ok', 'check', '#0f9e8e', 'ঠিক আছে'], ['err', 'bug', '#e5485f', 'এরর হবে']],   // [id, icon, রং, নাম]
      items: [['print("হাই")', 'ok'], ['print("হাই"', 'err'], ['# নোট', 'ok']] },          // [লেখা, কোন ঘর]
    { id: 'hunt', type: 'bug', title: 'বাগ শিকারি', icon: 'bug', color: '#e5485f', xp: 20,
      desc: 'কোন লাইনে ভুল?',
      rounds: [
        { lines: ['print("এক")', 'print("দুই)', 'print("তিন")'], bug: 1, fix: 'print("দুই")', why: 'শেষের উদ্ধৃতিচিহ্ন নেই।' }   // bug = লাইনের index (০ থেকে)
      ] },
    { id: 'mend', type: 'fix', title: 'কোড ঠিক করো', icon: 'wrench', color: '#d99500', xp: 30,
      desc: 'ভাঙা কোড সারাও।',
      broken: 'print("হ্যালো"\nPrint("বিদায়")',
      fixed: 'print("হ্যালো")\nprint("বিদায়")',
      expect: 'হ্যালো\nবিদায়',
      // challenge ঐচ্ছিক — না চাইলে মুছে দাও
      challenge: { title: 'নিজের কমেন্টসহ প্রোগ্রাম', task: 'একটা কমেন্ট আর ২টা print() লেখো।', starter: '# আমার প্রোগ্রাম\n', minLines: 2, minPrints: 2 } }
  ],

  /* ৪. কুইজ — o[0] সবসময় সঠিক উত্তর (দেখানোর সময় এলোমেলো হয়) */
  quiz: [
    { q: 'পাইথনে কমেন্ট কোন চিহ্ন দিয়ে শুরু হয়?', o: ['#', '//', '<!--', '%'], ex: 'পাইথনে # দিয়ে কমেন্ট লেখা হয়।' },
    { q: 'নিচের কোডের আউটপুট কী?', code: '# print(1)\nprint(2)', o: ['2', '1\n2', '1', 'কিছুই না'], ex: 'কমেন্টের লাইন চলে না।' }
  ],

  /* ৫. সারসংক্ষেপ */
  summary: {
    points: ['Syntax = লেখার নিয়ম।', '# দিয়ে কমেন্ট লেখা হয়, পাইথন তা চালায় না।', 'এরর এলে লাইন নম্বর দেখে ঠিক করো।'],
    next: 'পরবর্তী পাঠে শিখব: <b>Output ও Input</b>'
  }
});
})();
