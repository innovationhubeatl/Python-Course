/* =====================================================================
   কোর্সের কাঠামো (Course structure)
   ---------------------------------------------------------------------
   এখানে শুধু ট্র্যাক → মডিউল → পাঠের নাম আর ক্রম থাকে।
   পাঠের আসল কনটেন্ট থাকে lessons/ ফোল্ডারের ফাইলে।

   • প্রতিটা পাঠের "key" = ট্র্যাকের prefix + "-" + পাঠের id
       Beginner → b,  Intermediate → i,  Advanced → a
     যেমন Beginner-এর পাঠ 1.2  →  key: "b-1.2"
   • lessons/ ফোল্ডারে ওই key-র ফাইল যোগ হলে পাঠটা নিজে থেকেই
     "চালু" হয়ে যায়। এখানে কিছু বদলাতে হয় না।
   • নতুন মডিউল বা পাঠের নাম যোগ/বদল করতে চাইলে শুধু এই ফাইল এডিট করো।
   ===================================================================== */
window.COURSE = [
  { id: 'beg', prefix: 'b', tag: 'বিগিনার', name: 'Beginner', theme: 'Python Explorers', cls: 't-beg',
    blurb: 'একদম শূন্য থেকে শুরু: print, input, ভেরিয়েবল, সিদ্ধান্ত আর লুপ।',
    modules: [
      { title: 'Meet Python', bn: 'পাইথনের সাথে পরিচয়', lessons: [
        { id: '1.1', title: 'পাইথন পরিচিতি', sub: 'প্রোগ্রামিং কী, পাইথন কী ও কোথায় লাগে' },
        { id: '1.2', title: 'Syntax ও Comments', sub: 'পাইথনের লেখার নিয়ম আর মন্তব্য' },
        { id: '1.3', title: 'Output ও Input', sub: 'print() আর input() দিয়ে কথা বলা' },
        { id: '1.4', title: 'Variables', sub: 'তথ্য রাখার লেবেল লাগানো বাক্স' },
        { id: '1.5', title: 'Data Types', sub: 'int, float, str, bool' },
        { id: 'boss1', title: 'বস প্রজেক্ট', sub: 'Student Digital ID Card Generator', boss: true } ] },
      { title: 'Operators ও Calculations', bn: 'অপারেটর ও হিসাব', lessons: [
        { id: '2.1', title: 'Arithmetic Operators', sub: '+ − × ÷ আর আরও কিছু' },
        { id: '2.2', title: 'Comparison Operators', sub: 'বড়, ছোট, সমান' },
        { id: '2.3', title: 'Logical Operators', sub: 'and, or, not' },
        { id: '2.4', title: 'Assignment ও Math', sub: '+=, round(), abs()' },
        { id: 'boss2', title: 'বস প্রজেক্ট', sub: 'স্কুল ক্যান্টিন বিল ক্যালকুলেটর', boss: true } ] },
      { title: 'Decisions', bn: 'সিদ্ধান্ত নেওয়া', lessons: [
        { id: '3.1', title: 'if', sub: 'শর্ত সত্য হলে কাজ করো' },
        { id: '3.2', title: 'if – else', sub: 'দুই পথের একটা' },
        { id: '3.3', title: 'elif', sub: 'অনেক পথ থেকে বেছে নেওয়া' },
        { id: '3.4', title: 'Nested if', sub: 'শর্তের ভেতরে শর্ত' },
        { id: 'boss3', title: 'বস প্রজেক্ট', sub: 'রেজাল্ট গ্রেড চেকার', boss: true } ] },
      { title: 'Loops', bn: 'লুপ — বারবার করা', lessons: [
        { id: '4.1', title: 'for loop', sub: 'নির্দিষ্ট বার ঘোরা' },
        { id: '4.2', title: 'range()', sub: 'সংখ্যার সারি' },
        { id: '4.3', title: 'while loop', sub: 'শর্ত থাকা পর্যন্ত ঘোরা' },
        { id: '4.4', title: 'break ও continue', sub: 'লুপ থামানো ও এড়ানো' },
        { id: 'boss4', title: 'বস প্রজেক্ট', sub: 'নামতা মেশিন', boss: true } ] }
    ] },
  { id: 'int', prefix: 'i', tag: 'ইন্টারমিডিয়েট', name: 'Intermediate', theme: 'Code Builders', cls: 't-int',
    blurb: 'ডেটা সাজানো আর নিজের ফাংশন বানানো: লিস্ট, ডিকশনারি, স্ট্রিং, ফাংশন।',
    modules: [
      { title: 'Lists', bn: 'লিস্ট', lessons: [
        { id: '1.1', title: 'লিস্ট তৈরি ও ইনডেক্স', sub: 'ট্রেনের বগির মতো সারি' },
        { id: '1.2', title: 'লিস্ট মেথড', sub: 'append, remove, sort' },
        { id: '1.3', title: 'লিস্টে লুপ', sub: 'প্রতিটা উপাদান ঘুরে দেখা' } ] },
      { title: 'Tuples ও Sets', bn: 'টাপল ও সেট', lessons: [
        { id: '2.1', title: 'Tuple', sub: 'বদলানো যায় না এমন সারি' },
        { id: '2.2', title: 'Set', sub: 'ডুপ্লিকেট ছাড়া সংগ্রহ' } ] },
      { title: 'Dictionaries', bn: 'ডিকশনারি', lessons: [
        { id: '3.1', title: 'key ও value', sub: 'রোল নম্বর থেকে নাম' },
        { id: '3.2', title: 'ডিকশনারিতে লুপ', sub: 'সব তথ্য একসাথে' } ] },
      { title: 'Strings গভীরে', bn: 'স্ট্রিং', lessons: [
        { id: '4.1', title: 'স্লাইসিং', sub: 'লেখার টুকরো কাটা' },
        { id: '4.2', title: 'স্ট্রিং মেথড', sub: 'upper, split, replace' } ] },
      { title: 'Functions', bn: 'ফাংশন', lessons: [
        { id: '5.1', title: 'def দিয়ে ফাংশন', sub: 'নিজের মেশিন বানানো' },
        { id: '5.2', title: 'parameter ও return', sub: 'ইনপুট যায়, আউটপুট আসে' } ] },
      { title: 'Error Handling', bn: 'এরর সামলানো', lessons: [
        { id: '6.1', title: 'try ও except', sub: 'ভুল হলেও প্রোগ্রাম চলবে' } ] }
    ] },
  { id: 'adv', prefix: 'a', tag: 'অ্যাডভান্সড', name: 'Advanced', theme: 'Python Masters', cls: 't-adv',
    blurb: 'বড় প্রজেক্টের দক্ষতা: ফাইল, মডিউল, OOP আর মিনি গেম।',
    modules: [
      { title: 'Files', bn: 'ফাইল', lessons: [
        { id: '1.1', title: 'ফাইল পড়া', sub: 'open() আর read()' },
        { id: '1.2', title: 'ফাইলে লেখা', sub: 'নোট সেভ করা' } ] },
      { title: 'Modules ও Packages', bn: 'মডিউল', lessons: [
        { id: '2.1', title: 'import', sub: 'random, math, datetime' },
        { id: '2.2', title: 'নিজের মডিউল', sub: 'কোড ভাগ করে রাখা' } ] },
      { title: 'OOP Basics', bn: 'অবজেক্ট ওরিয়েন্টেড', lessons: [
        { id: '3.1', title: 'class ও object', sub: 'ছাঁচ আর জিনিস' },
        { id: '3.2', title: 'method', sub: 'অবজেক্টের কাজ' } ] },
      { title: 'Mini Games ও Projects', bn: 'গেম ও প্রজেক্ট', lessons: [
        { id: '4.1', title: 'সংখ্যা অনুমান গেম', sub: 'random দিয়ে খেলা' },
        { id: '4.2', title: 'কুইজ অ্যাপ', sub: 'নিজের কুইজ বানাও' } ] }
    ] }
];

/* লেভেল: [কত XP লাগবে, লেভেলের নাম] */
window.LEVELS = [[0, 'নবীন কোডার'], [120, 'এক্সপ্লোরার'], [300, 'প্রবলেম সলভার'], [600, 'কোড নিনজা'], [1000, 'পাইথন মাস্টার']];

/* সব পাঠে কাজে লাগে এমন ব্যাজ। পাঠের নিজস্ব ব্যাজ পাঠের ফাইলেই লেখা থাকে। */
window.BADGES = {
  'first-step': { e: '🚀', n: 'প্রথম পদক্ষেপ', d: 'প্রথম পাঠ শুরু করেছ' },
  'first-print': { e: '🖨️', n: 'প্রথম print()', d: 'নিজে প্রথম কোড চালিয়েছ' },
  'quiz-champ': { e: '🏆', n: 'কুইজ চ্যাম্প', d: 'কোনো কুইজে ১০০% পেয়েছ' },
  'streak-3': { e: '🔥', n: '৩ দিনের স্ট্রিক', d: 'টানা ৩ দিন শিখেছ' },
  'streak-5': { e: '☄️', n: '৫ দিনের স্ট্রিক', d: 'টানা ৫ দিন শিখেছ' },
  'loop-legend': { e: '🌀', n: 'Loop Legend', d: 'মডিউল ৪-এ আনলক হবে' }
};
