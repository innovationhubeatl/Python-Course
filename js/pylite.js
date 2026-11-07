/* PyLite — a small, safe Python-subset interpreter for Module 1 lessons.
   Supports: print/input, variables, + - * / // % **, strings, f-strings,
   int/float/str/bool/type/len/round/abs/min/max, string methods, simple lists.
   Real Python error names & messages, so learners see what real Python shows. */
const PyLite = (() => {
  class PyFloat { constructor(v) { this.v = v; } }
  class PyErr extends Error {
    constructor(type, msg, line) { super(msg); this.pyType = type; this.line = line; }
  }
  const NOT_YET = ['if','elif','else','for','while','def','class','import','from','return','try','except','with','lambda','break','continue','pass','global','del','assert','raise','yield','finally','async','await','nonlocal'];
  const OPS = ['**=','//=','**','//','==','!=','<=','>=','+=','-=','*=','/=','%=','+','-','*','/','%','<','>','=','(',')',',','.','[',']',':'];

  function tokenize(src, line) {
    const toks = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '#') break;
      const isQ = ch => ch === '"' || ch === "'";
      if (isQ(c) || (/[fFrR]/.test(c) && isQ(src[i + 1]))) {
        let prefix = '';
        if (!isQ(c)) { prefix = c.toLowerCase(); i++; }
        const q = src[i]; let s = '';
        if (src.substr(i, 3) === q + q + q) {
          const end = src.indexOf(q + q + q, i + 3);
          if (end < 0) throw new PyErr('SyntaxError', 'unterminated triple-quoted string literal (detected at line ' + line + ')', line);
          s = src.slice(i + 3, end); i = end + 3;
        } else {
          let j = i + 1;
          while (j < src.length && src[j] !== q) {
            if (src[j] === '\\' && prefix !== 'r' && j + 1 < src.length) {
              const n = src[j + 1];
              const map = { n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"' };
              s += (n in map) ? map[n] : '\\' + n; j += 2;
            } else { s += src[j]; j++; }
          }
          if (j >= src.length) throw new PyErr('SyntaxError', 'unterminated string literal (detected at line ' + line + ')', line);
          i = j + 1;
        }
        toks.push({ t: prefix === 'f' ? 'fstr' : 'str', v: s });
        continue;
      }
      let m = /^(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (m) {
        const txt = m[0].replace(/_/g, '');
        const after = src[i + m[0].length];
        if (after && /[A-Za-z_]/.test(after)) throw new PyErr('SyntaxError', 'invalid decimal literal', line);
        toks.push(/[.eE]/.test(txt) ? { t: 'num', v: new PyFloat(parseFloat(txt)) } : { t: 'num', v: parseInt(txt, 10) });
        i += m[0].length; continue;
      }
      m = /^[A-Za-z_ঀ-৿][A-Za-z0-9_ঀ-৿]*/.exec(src.slice(i));
      if (m) { toks.push({ t: 'name', v: m[0] }); i += m[0].length; continue; }
      const op = OPS.find(o => src.startsWith(o, i));
      if (op) { toks.push({ t: 'op', v: op }); i += op.length; continue; }
      const code = c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      throw new PyErr('SyntaxError', "invalid character '" + c + "' (U+" + code + ')', line);
    }
    return toks;
  }

  // ---------- Parser ----------
  function Parser(toks, line) { this.toks = toks; this.p = 0; this.line = line; }
  Parser.prototype = {
    peek(o = 0) { return this.toks[this.p + o]; },
    isOp(v, o = 0) { const t = this.peek(o); return t && t.t === 'op' && t.v === v; },
    isName(v, o = 0) { const t = this.peek(o); return t && t.t === 'name' && t.v === v; },
    next() { return this.toks[this.p++]; },
    expectOp(v) {
      if (!this.isOp(v)) {
        if (v === ')' && !this.peek()) throw new PyErr('SyntaxError', "'(' was never closed", this.line);
        throw new PyErr('SyntaxError', 'invalid syntax', this.line);
      }
      this.p++;
    },
    expr() { return this.or(); },
    or() { let l = this.and(); while (this.isName('or')) { this.p++; l = { k: 'or', l, r: this.and() }; } return l; },
    and() { let l = this.not(); while (this.isName('and')) { this.p++; l = { k: 'and', l, r: this.not() }; } return l; },
    not() { if (this.isName('not')) { this.p++; return { k: 'not', e: this.not() }; } return this.cmp(); },
    cmp() {
      const first = this.sum(); const parts = [];
      while (true) {
        const t = this.peek();
        if (t && t.t === 'op' && ['==','!=','<','>','<=','>='].includes(t.v)) { this.p++; parts.push([t.v, this.sum()]); }
        else if (this.isName('in')) { this.p++; parts.push(['in', this.sum()]); }
        else break;
      }
      return parts.length ? { k: 'cmp', first, parts } : first;
    },
    sum() { let l = this.term(); while (this.isOp('+') || this.isOp('-')) { const op = this.next().v; l = { k: 'bin', op, l, r: this.term() }; } return l; },
    term() { let l = this.unary(); while (['*','/','//','%'].some(o => this.isOp(o))) { const op = this.next().v; l = { k: 'bin', op, l, r: this.unary() }; } return l; },
    unary() { if (this.isOp('-') || this.isOp('+')) { const op = this.next().v; return { k: 'un', op, e: this.unary() }; } return this.power(); },
    power() { const b = this.postfix(); if (this.isOp('**')) { this.p++; return { k: 'bin', op: '**', l: b, r: this.unary() }; } return b; },
    postfix() {
      let e = this.atom();
      while (true) {
        if (this.isOp('(')) {
          this.p++; const args = [], kw = {};
          while (!this.isOp(')')) {
            if (!this.peek()) throw new PyErr('SyntaxError', "'(' was never closed", this.line);
            if (this.peek().t === 'name' && this.isOp('=', 1)) { const n = this.next().v; this.p++; kw[n] = this.expr(); }
            else args.push(this.expr());
            if (this.isOp(',')) this.p++;
            else if (!this.isOp(')')) {
              if (!this.peek()) throw new PyErr('SyntaxError', "'(' was never closed", this.line);
              throw new PyErr('SyntaxError', 'invalid syntax. Perhaps you forgot a comma?', this.line);
            }
          }
          this.p++; e = { k: 'call', f: e, args, kw };
        } else if (this.isOp('.')) {
          this.p++; const n = this.next();
          if (!n || n.t !== 'name') throw new PyErr('SyntaxError', 'invalid syntax', this.line);
          e = { k: 'attr', o: e, n: n.v };
        } else if (this.isOp('[')) {
          this.p++; let a = null, b = null, slice = false;
          if (!this.isOp(':')) a = this.expr();
          if (this.isOp(':')) { slice = true; this.p++; if (!this.isOp(']')) b = this.expr(); }
          this.expectOp(']'); e = { k: 'index', o: e, a, b, slice };
        } else break;
      }
      return e;
    },
    atom() {
      const t = this.next();
      if (!t) throw new PyErr('SyntaxError', 'invalid syntax', this.line);
      if (t.t === 'num') return { k: 'lit', v: t.v };
      if (t.t === 'str' || t.t === 'fstr') {
        const parts = [t];
        while (this.peek() && (this.peek().t === 'str' || this.peek().t === 'fstr')) parts.push(this.next());
        return { k: 'strs', parts };
      }
      if (t.t === 'name') {
        if (t.v === 'True') return { k: 'lit', v: true };
        if (t.v === 'False') return { k: 'lit', v: false };
        if (t.v === 'None') return { k: 'lit', v: null };
        if (NOT_YET.includes(t.v)) throw new PyErr('NotYet', t.v, this.line);
        return { k: 'name', n: t.v };
      }
      if (t.t === 'op' && t.v === '(') {
        if (this.isOp(')')) { this.p++; return { k: 'list', items: [] }; }
        const e = this.expr();
        if (!this.peek()) throw new PyErr('SyntaxError', "'(' was never closed", this.line);
        this.expectOp(')'); return e;
      }
      if (t.t === 'op' && t.v === '[') {
        const items = [];
        while (!this.isOp(']')) {
          if (!this.peek()) throw new PyErr('SyntaxError', "'[' was never closed", this.line);
          items.push(this.expr()); if (this.isOp(',')) this.p++;
        }
        this.p++; return { k: 'list', items };
      }
      if (t.t === 'op' && t.v === ')') throw new PyErr('SyntaxError', "unmatched ')'", this.line);
      throw new PyErr('SyntaxError', 'invalid syntax', this.line);
    }
  };

  // ---------- Values ----------
  const isNum = x => typeof x === 'number' || typeof x === 'boolean' || x instanceof PyFloat;
  const nv = x => typeof x === 'boolean' ? (x ? 1 : 0) : (x instanceof PyFloat ? x.v : x);
  const isFloat = x => x instanceof PyFloat;
  function typeName(x) {
    if (x === null) return 'NoneType';
    if (typeof x === 'boolean') return 'bool';
    if (typeof x === 'number') return 'int';
    if (x instanceof PyFloat) return 'float';
    if (typeof x === 'string') return 'str';
    if (Array.isArray(x)) return 'list';
    if (x && x.pytype) return 'type';
    if (x && x.builtin) return 'builtin_function_or_method';
    return 'object';
  }
  function fmtFloat(v) {
    if (!isFinite(v)) return isNaN(v) ? 'nan' : (v > 0 ? 'inf' : '-inf');
    if (Number.isInteger(v) && Math.abs(v) < 1e16) return v.toFixed(1);
    let s = String(v);
    if (/e/.test(s)) s = s.replace(/e\+?(-?)(\d)$/, 'e$10$2').replace('e+', 'e+');
    return s;
  }
  function repr(x) {
    if (typeof x === 'string') {
      const q = x.includes("'") && !x.includes('"') ? '"' : "'";
      return q + x.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + q;
    }
    return str(x);
  }
  function str(x) {
    if (x === null) return 'None';
    if (x === true) return 'True';
    if (x === false) return 'False';
    if (typeof x === 'number') return String(x);
    if (x instanceof PyFloat) return fmtFloat(x.v);
    if (typeof x === 'string') return x;
    if (Array.isArray(x)) return '[' + x.map(repr).join(', ') + ']';
    if (x && x.pytype) return "<class '" + x.pytype + "'>";
    if (x && x.builtin) return '<built-in function ' + x.name + '>';
    if (x && x.method) return '<built-in method ' + x.name + " of str object>";
    return '<object>';
  }
  const truthy = x => !(x === null || x === false || x === 0 || x === '' || (x instanceof PyFloat && x.v === 0) || (Array.isArray(x) && !x.length));
  const mkNum = (v, f) => f ? new PyFloat(v) : v;

  function binop(op, a, b, line) {
    const bad = () => new PyErr('TypeError', "unsupported operand type(s) for " + op + ": '" + typeName(a) + "' and '" + typeName(b) + "'", line);
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      if (typeof a === 'string') throw new PyErr('TypeError', 'can only concatenate str (not "' + typeName(b) + '") to str', line);
      if (isNum(a) && isNum(b)) return mkNum(nv(a) + nv(b), isFloat(a) || isFloat(b));
      throw bad();
    }
    if (op === '*') {
      if (typeof a === 'string' && (typeof b === 'number' || typeof b === 'boolean')) return nv(b) > 0 ? a.repeat(nv(b)) : '';
      if (typeof b === 'string' && (typeof a === 'number' || typeof a === 'boolean')) return nv(a) > 0 ? b.repeat(nv(a)) : '';
      if ((typeof a === 'string' && isFloat(b)) || (typeof b === 'string' && isFloat(a))) throw new PyErr('TypeError', "can't multiply sequence by non-int of type 'float'", line);
      if (typeof a === 'string' && typeof b === 'string') throw new PyErr('TypeError', "can't multiply sequence by non-int of type 'str'", line);
      if (isNum(a) && isNum(b)) return mkNum(nv(a) * nv(b), isFloat(a) || isFloat(b));
      throw bad();
    }
    if (!(isNum(a) && isNum(b))) {
      if (op === '%' && typeof a === 'string') throw new PyErr('TypeError', 'not all arguments converted during string formatting', line);
      throw bad();
    }
    const x = nv(a), y = nv(b), f = isFloat(a) || isFloat(b);
    switch (op) {
      case '-': return mkNum(x - y, f);
      case '/':
        if (y === 0) throw new PyErr('ZeroDivisionError', 'division by zero', line);
        return new PyFloat(x / y);
      case '//':
        if (y === 0) throw new PyErr('ZeroDivisionError', f ? 'float floor division by zero' : 'integer division or modulo by zero', line);
        return mkNum(Math.floor(x / y), f);
      case '%':
        if (y === 0) throw new PyErr('ZeroDivisionError', f ? 'float modulo' : 'integer modulo by zero', line);
        return mkNum(((x % y) + y) % y, f);
      case '**':
        if (!f && y >= 0) return Math.pow(x, y);
        return new PyFloat(Math.pow(x, y));
    }
    throw bad();
  }
  function compare(op, a, b, line) {
    if (op === 'in') {
      if (typeof b === 'string') {
        if (typeof a !== 'string') throw new PyErr('TypeError', "'in <string>' requires string as left operand, not " + typeName(a), line);
        return b.includes(a);
      }
      if (Array.isArray(b)) return b.some(x => compare('==', x, a, line));
      throw new PyErr('TypeError', "argument of type '" + typeName(b) + "' is not iterable", line);
    }
    if (op === '==' || op === '!=') {
      let eq;
      if (isNum(a) && isNum(b)) eq = nv(a) === nv(b);
      else if (Array.isArray(a) && Array.isArray(b)) eq = a.length === b.length && a.every((x, i) => compare('==', x, b[i], line));
      else eq = a === b;
      return op === '==' ? eq : !eq;
    }
    let x, y;
    if (isNum(a) && isNum(b)) { x = nv(a); y = nv(b); }
    else if (typeof a === 'string' && typeof b === 'string') { x = a; y = b; }
    else throw new PyErr('TypeError', "'" + op + "' not supported between instances of '" + typeName(a) + "' and '" + typeName(b) + "'", line);
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
  }

  function pyRound(x, n) {
    const m = Math.pow(10, n || 0); const v = x * m;
    let r = Math.round(v);
    if (Math.abs(v % 1) === 0.5 && r % 2 !== 0) r -= 1; // banker's rounding
    return r / m;
  }

  function formatSpec(v, spec, line) {
    if (!spec) return str(v);
    let m = /^([<>^]?)(\d*)(?:\.(\d+))?([fdse%]?)$/.exec(spec);
    if (!m) throw new PyErr('ValueError', "Invalid format specifier '" + spec + "'", line);
    let [, align, width, prec, type] = m; let s;
    if (type === 'f' || (prec && isNum(v) && !type)) {
      if (!isNum(v)) throw new PyErr('ValueError', "Unknown format code 'f' for object of type '" + typeName(v) + "'", line);
      s = nv(v).toFixed(prec ? +prec : 6);
    } else if (type === '%') { s = (nv(v) * 100).toFixed(prec ? +prec : 6) + '%'; }
    else s = str(v);
    if (width && s.length < +width) {
      const pad = ' '.repeat(+width - s.length);
      const def = isNum(v) ? '>' : '<';
      const a = align || def;
      s = a === '>' ? pad + s : a === '<' ? s + pad : pad.slice(0, pad.length >> 1) + s + pad.slice(pad.length >> 1);
    }
    return s;
  }

  // ---------- Interpreter ----------
  async function run(code, io) {
    const out = io.out, inputFn = io.input;
    let steps = 0;
    const env = Object.create(null);
    const B = (name, fn) => ({ builtin: true, name, fn });
    const conv = {
      int: { pytype: 'int' }, float: { pytype: 'float' }, str: { pytype: 'str' }, bool: { pytype: 'bool' }
    };
    const builtins = {
      print: B('print', async (args, kw) => {
        const sep = 'sep' in kw ? (kw.sep === null ? ' ' : kw.sep) : ' ';
        const end = 'end' in kw ? (kw.end === null ? '\n' : kw.end) : '\n';
        out(args.map(str).join(sep) + end);
        return null;
      }),
      input: B('input', async (args) => {
        const p = args.length ? str(args[0]) : '';
        if (p) out(p);
        const v = await inputFn(p);
        out(v + '\n', 'input');
        return v;
      }),
      int: B('int', async (args, kw, line) => {
        if (!args.length) return 0;
        const x = args[0];
        if (typeof x === 'string') {
          const t = x.trim();
          if (!/^[+-]?\d+$/.test(t)) throw new PyErr('ValueError', "invalid literal for int() with base 10: " + repr(x), line);
          return parseInt(t, 10);
        }
        if (isNum(x)) return Math.trunc(nv(x));
        throw new PyErr('TypeError', "int() argument must be a string, a bytes-like object or a real number, not '" + typeName(x) + "'", line);
      }),
      float: B('float', async (args, kw, line) => {
        if (!args.length) return new PyFloat(0);
        const x = args[0];
        if (typeof x === 'string') {
          const t = x.trim();
          if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) throw new PyErr('ValueError', 'could not convert string to float: ' + repr(x), line);
          return new PyFloat(parseFloat(t));
        }
        if (isNum(x)) return new PyFloat(nv(x));
        throw new PyErr('TypeError', "float() argument must be a string or a real number, not '" + typeName(x) + "'", line);
      }),
      str: B('str', async (args) => args.length ? str(args[0]) : ''),
      bool: B('bool', async (args) => args.length ? truthy(args[0]) : false),
      type: B('type', async (args) => ({ pytype: typeName(args[0]) })),
      len: B('len', async (args, kw, line) => {
        const x = args[0];
        if (typeof x === 'string') return [...x].length;
        if (Array.isArray(x)) return x.length;
        throw new PyErr('TypeError', "object of type '" + typeName(x) + "' has no len()", line);
      }),
      abs: B('abs', async (args) => { const x = args[0]; return mkNum(Math.abs(nv(x)), isFloat(x)); }),
      round: B('round', async (args, kw, line) => {
        const x = args[0], n = args[1];
        if (!isNum(x)) throw new PyErr('TypeError', "type " + typeName(x) + " doesn't define __round__ method", line);
        if (n === undefined || n === null) return pyRound(nv(x), 0);
        return mkNum(pyRound(nv(x), nv(n)), isFloat(x));
      }),
      max: B('max', async (args, kw, line) => { const a = args.length === 1 && Array.isArray(args[0]) ? args[0] : args; return a.reduce((m, x) => compare('>', x, m, line) ? x : m); }),
      min: B('min', async (args, kw, line) => { const a = args.length === 1 && Array.isArray(args[0]) ? args[0] : args; return a.reduce((m, x) => compare('<', x, m, line) ? x : m); }),
      sum: B('sum', async (args, kw, line) => args[0].reduce((s, x) => binop('+', s, x, line), 0)),
    };
    const strMethods = {
      upper: s => s.toUpperCase(), lower: s => s.toLowerCase(),
      title: s => s.toLowerCase().replace(/(^|[^A-Za-z])([a-z])/g, (m, a, b) => a + b.toUpperCase()),
      capitalize: s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
      strip: s => s.trim(), lstrip: s => s.replace(/^\s+/, ''), rstrip: s => s.replace(/\s+$/, ''),
      replace: (s, a, b) => s.split(a).join(b),
      count: (s, a) => a === '' ? s.length + 1 : s.split(a).length - 1,
      startswith: (s, a) => s.startsWith(a), endswith: (s, a) => s.endsWith(a),
      find: (s, a) => s.indexOf(a), split: (s, a) => a === undefined ? s.trim().split(/\s+/).filter(Boolean) : s.split(a),
      join: (s, arr) => arr.map(str).join(s), isdigit: s => /^\d+$/.test(s), isalpha: s => /^[A-Za-z]+$/.test(s),
    };

    function lookup(n, line) {
      if (n in env) return env[n];
      if (n in builtins) return builtins[n];
      const all = Object.keys(env).concat(Object.keys(builtins));
      const sug = all.find(k => k.toLowerCase() === n.toLowerCase());
      throw new PyErr('NameError', "name '" + n + "' is not defined" + (sug ? ". Did you mean: '" + sug + "'?" : ''), line);
    }

    async function fstring(s, line) {
      let res = '', i = 0;
      while (i < s.length) {
        const c = s[i];
        if (c === '{' && s[i + 1] === '{') { res += '{'; i += 2; continue; }
        if (c === '}' && s[i + 1] === '}') { res += '}'; i += 2; continue; }
        if (c === '{') {
          const end = s.indexOf('}', i);
          if (end < 0) throw new PyErr('SyntaxError', "f-string: expecting '}'", line);
          let inner = s.slice(i + 1, end), spec = '';
          const ci = inner.lastIndexOf(':');
          if (ci > 0 && !/['"]/.test(inner.slice(ci))) { spec = inner.slice(ci + 1); inner = inner.slice(0, ci); }
          let debug = false;
          if (/=\s*$/.test(inner) && !/[=!<>]=\s*$/.test(inner)) { debug = true; inner = inner.replace(/=\s*$/, ''); }
          if (!inner.trim()) throw new PyErr('SyntaxError', 'f-string: valid expression required before \'}\'', line);
          const ps = new Parser(tokenize(inner, line), line);
          const v = await ev(ps.expr(), line);
          res += (debug ? inner + '=' : '') + (debug && !spec ? repr(v) : formatSpec(v, spec, line));
          i = end + 1; continue;
        }
        if (c === '}') throw new PyErr('SyntaxError', "f-string: single '}' is not allowed", line);
        res += c; i++;
      }
      return res;
    }

    async function ev(n, line) {
      if (++steps > 20000) throw new PyErr('TimeoutError', 'program took too long', line);
      switch (n.k) {
        case 'lit': return n.v;
        case 'strs': { let s = ''; for (const p of n.parts) s += p.t === 'fstr' ? await fstring(p.v, line) : p.v; return s; }
        case 'name': return lookup(n.n, line);
        case 'list': { const a = []; for (const it of n.items) a.push(await ev(it, line)); return a; }
        case 'or': { const l = await ev(n.l, line); return truthy(l) ? l : ev(n.r, line); }
        case 'and': { const l = await ev(n.l, line); return !truthy(l) ? l : ev(n.r, line); }
        case 'not': return !truthy(await ev(n.e, line));
        case 'un': {
          const v = await ev(n.e, line);
          if (!isNum(v)) throw new PyErr('TypeError', "bad operand type for unary " + n.op + ": '" + typeName(v) + "'", line);
          return n.op === '-' ? mkNum(-nv(v), isFloat(v)) : mkNum(nv(v), isFloat(v));
        }
        case 'bin': return binop(n.op, await ev(n.l, line), await ev(n.r, line), line);
        case 'cmp': {
          let a = await ev(n.first, line);
          for (const [op, e] of n.parts) { const b = await ev(e, line); if (!compare(op, a, b, line)) return false; a = b; }
          return true;
        }
        case 'attr': {
          const o = await ev(n.o, line);
          if (typeof o === 'string' && strMethods[n.n]) return { method: true, name: n.n, self: o };
          if (Array.isArray(o) && n.n === 'append') return { method: true, name: 'append', self: o };
          throw new PyErr('AttributeError', "'" + typeName(o) + "' object has no attribute '" + n.n + "'", line);
        }
        case 'index': {
          const o = await ev(n.o, line);
          if (typeof o !== 'string' && !Array.isArray(o)) throw new PyErr('TypeError', "'" + typeName(o) + "' object is not subscriptable", line);
          const arr = typeof o === 'string' ? [...o] : o;
          const L = arr.length;
          const toIdx = async (e, d) => { if (!e) return d; const v = await ev(e, line); if (typeof v !== 'number') throw new PyErr('TypeError', (typeof o === 'string' ? 'string' : 'list') + ' indices must be integers', line); return v; };
          if (n.slice) {
            let a = await toIdx(n.a, 0), b = await toIdx(n.b, L);
            if (a < 0) a = Math.max(0, L + a); if (b < 0) b = Math.max(0, L + b);
            const r = arr.slice(a, b); return typeof o === 'string' ? r.join('') : r;
          }
          let i = await toIdx(n.a, 0);
          if (i < 0) i += L;
          if (i < 0 || i >= L) throw new PyErr('IndexError', (typeof o === 'string' ? 'string' : 'list') + ' index out of range', line);
          return arr[i];
        }
        case 'call': {
          const f = await ev(n.f, line);
          const args = []; for (const a of n.args) args.push(await ev(a, line));
          const kw = {}; for (const k in n.kw) kw[k] = await ev(n.kw[k], line);
          if (f && f.builtin) return f.fn(args, kw, line);
          if (f && f.method) {
            if (f.name === 'append') { f.self.push(args[0]); return null; }
            for (const a of args) if (typeof a !== 'string' && !Array.isArray(a) && f.name !== 'join') throw new PyErr('TypeError', "must be str, not " + typeName(a), line);
            return strMethods[f.name](f.self, ...args);
          }
          if (f && f.pytype) return builtins[f.pytype].fn(args, kw, line);
          throw new PyErr('TypeError', "'" + typeName(f) + "' object is not callable", line);
        }
      }
      throw new PyErr('SyntaxError', 'invalid syntax', line);
    }

    const lines = code.replace(/\r/g, '').split('\n');
    const parenDepth = toks => toks.reduce((d, t) => t.t === 'op' ? d + ('(['.includes(t.v) ? 1 : ')]'.includes(t.v) ? -1 : 0) : d, 0);
    const ASSIGN = ['=','+=','-=','*=','/=','//=','%=','**='];
    // Pass 1: compile everything (Python reports syntax errors before running anything)
    const prog = [];
    for (let i = 0; i < lines.length; i++) {
      const lineNo = i + 1;
      let raw = lines[i];
      if (!raw.trim() || raw.trim().startsWith('#')) continue;
      if (/^[ \t]+/.test(raw)) throw new PyErr('IndentationError', 'unexpected indent', lineNo);
      let toks = tokenize(raw, lineNo);
      while (parenDepth(toks) > 0 && i + 1 < lines.length) { i++; raw += ' ' + lines[i]; toks = tokenize(raw, lineNo); }
      if (!toks.length) continue;
      const t0 = toks[0];
      if (t0.t === 'name' && NOT_YET.includes(t0.v)) throw new PyErr('NotYet', t0.v, lineNo);
      if (t0.t === 'name' && t0.v === 'print' && toks[1] && toks[1].t !== 'op') throw new PyErr('SyntaxError', "Missing parentheses in call to 'print'. Did you mean print(...)?", lineNo);
      let assignAt = -1, depth = 0;
      for (let k = 0; k < toks.length; k++) {
        const t = toks[k];
        if (t.t === 'op' && '(['.includes(t.v)) depth++;
        else if (t.t === 'op' && ')]'.includes(t.v)) depth--;
        else if (depth === 0 && t.t === 'op' && ASSIGN.includes(t.v)) { assignAt = k; break; }
      }
      if (assignAt === 0) throw new PyErr('SyntaxError', 'invalid syntax', lineNo);
      if (assignAt > 0) {
        const targets = toks.slice(0, assignAt);
        const op = toks[assignAt].v;
        const names = targets.filter(t => !(t.t === 'op' && t.v === ','));
        const valid = targets.every((t, k) => k % 2 === 0 ? t.t === 'name' : (t.t === 'op' && t.v === ','));
        if (!valid) {
          if (targets.length === 1 && (targets[0].t === 'num' || targets[0].t === 'str')) throw new PyErr('SyntaxError', "cannot assign to literal here. Maybe you meant '==' instead of '='?", lineNo);
          throw new PyErr('SyntaxError', "cannot assign to expression here. Maybe you meant '==' instead of '='?", lineNo);
        }
        for (const t of names) if (['True','False','None'].includes(t.v)) throw new PyErr('SyntaxError', 'cannot assign to ' + t.v, lineNo);
        const ps = new Parser(toks.slice(assignAt + 1), lineNo);
        if (!ps.peek()) throw new PyErr('SyntaxError', 'invalid syntax', lineNo);
        const exprs = [ps.expr()];
        while (ps.isOp(',')) { ps.p++; exprs.push(ps.expr()); }
        if (ps.peek()) throw new PyErr('SyntaxError', 'invalid syntax', lineNo);
        prog.push({ lineNo, assign: true, op, names: names.map(t => t.v), exprs });
      } else {
        const ps = new Parser(toks, lineNo);
        const e = ps.expr();
        if (ps.peek()) {
          const t = ps.peek();
          if (t.t === 'str' || t.t === 'name' || t.t === 'num') throw new PyErr('SyntaxError', 'invalid syntax. Perhaps you forgot a comma?', lineNo);
          throw new PyErr('SyntaxError', 'invalid syntax', lineNo);
        }
        prog.push({ lineNo, e });
      }
    }
    // Pass 2: run
    for (const st of prog) {
      const lineNo = st.lineNo;
      if (io.onLine) await io.onLine(lineNo);
      if (!st.assign) { await ev(st.e, lineNo); continue; }
      const vals = []; for (const e of st.exprs) vals.push(await ev(e, lineNo));
      const names = st.names;
      if (st.op === '=') {
        if (names.length === 1) env[names[0]] = vals.length === 1 ? vals[0] : vals;
        else {
          const src = vals.length === 1 && Array.isArray(vals[0]) ? vals[0] : vals;
          if (src.length !== names.length) throw new PyErr('ValueError', (src.length > names.length ? 'too many values to unpack (expected ' + names.length + ')' : 'not enough values to unpack (expected ' + names.length + ', got ' + src.length + ')'), lineNo);
          names.forEach((n, k) => { env[n] = src[k]; });
        }
      } else {
        env[names[0]] = binop(st.op.slice(0, -1), lookup(names[0], lineNo), vals[0], lineNo);
      }
    }
    return env;
  }

  // Bangla explanations of errors
  function explain(type, msg) {
    if (type === 'NotYet') return { title: 'এটা আমরা সামনে শিখব!', body: '“' + msg + '” ব্যবহার করে লেখা কোড পরের মডিউলগুলোতে শিখব। এই প্লেগ্রাউন্ড এখন মডিউল ১-এর কোড (print, input, ভেরিয়েবল, ডেটা টাইপ) চালাতে পারে।' };
    if (type === 'NameError') return { title: 'পাইথন নামটা চেনে না', body: 'বানানটা আবার দেখো। পাইথন বড় হাতের আর ছোট হাতের অক্ষর আলাদা ধরে — Print আর print এক না। ভেরিয়েবল হলে আগে সেটা তৈরি করেছ কি না দেখো। স্ট্রিং লিখতে চাইলে উদ্ধৃতিচিহ্ন " " দিতে ভুলো না।' };
    if (type === 'IndentationError') return { title: 'লাইনের শুরুতে বাড়তি ফাঁকা জায়গা', body: 'পাইথনে লাইনের শুরুর ফাঁকা জায়গার (space) বিশেষ অর্থ আছে। আপাতত প্রতিটা লাইন একদম বাঁ দিক থেকে শুরু করো।' };
    if (type === 'SyntaxError') {
      if (/unterminated/.test(msg)) return { title: 'উদ্ধৃতিচিহ্ন বন্ধ করা হয়নি', body: 'স্ট্রিং যে চিহ্ন দিয়ে শুরু করেছ (" বা \'), শেষেও ঠিক সেই চিহ্ন দাও। যেমন: print("হ্যালো")' };
      if (/never closed/.test(msg)) return { title: 'ব্র্যাকেট খোলা রয়ে গেছে', body: 'একটা ( খুলেছ, কিন্তু ) দিয়ে বন্ধ করোনি। প্রতিটা খোলা ব্র্যাকেটের একটা জোড়া লাগে।' };
      if (/unmatched/.test(msg)) return { title: 'বাড়তি ব্র্যাকেট', body: 'একটা ) আছে যার কোনো খোলা ( নেই। বাড়তি ব্র্যাকেটটা মুছে দাও।' };
      if (/Missing parentheses/.test(msg)) return { title: 'print-এর ব্র্যাকেট নেই', body: 'Python 3-এ print একটা ফাংশন, তাই ব্র্যাকেট লাগে: print("তোমার লেখা")' };
      if (/invalid character/.test(msg)) return { title: 'অচেনা চিহ্ন', body: 'কোডে এমন চিহ্ন আছে যা পাইথন চেনে না। প্রায়ই Word বা মোবাইল থেকে কপি করা বাঁকা উদ্ধৃতিচিহ্ন “ ” এর কারণে হয়। কিবোর্ডের সোজা " চিহ্ন ব্যবহার করো।' };
      if (/forgot a comma/.test(msg)) return { title: 'কমা বাদ পড়েছে?', body: 'দুটো জিনিস পাশাপাশি লিখলে মাঝে কমা (,) দিতে হয়। যেমন: print("বয়স", 12)' };
      if (/assign/.test(msg)) return { title: 'ভুল জায়গায় = চিহ্ন', body: '= চিহ্নের বাঁ দিকে শুধু ভেরিয়েবলের নাম থাকে। যেমন: name = "রাফি"। তুলনা করতে চাইলে == ব্যবহার করো।' };
      return { title: 'লেখার নিয়মে ভুল (Syntax)', body: 'লাইনটা আবার দেখো — কোনো কমা, ব্র্যাকেট বা উদ্ধৃতিচিহ্ন বাদ পড়েছে বা বেশি হয়ে গেছে কি না।' };
    }
    if (type === 'TypeError') {
      if (/concatenate/.test(msg) || /unsupported operand/.test(msg)) return { title: 'লেখা আর সংখ্যা মেশানো যায় না', body: 'স্ট্রিং (লেখা) আর সংখ্যাকে সরাসরি + দিয়ে জোড়া যায় না। সংখ্যাকে str() দিয়ে লেখায় বদলাও, অথবা print-এ কমা দিয়ে আলাদা করো: print("বয়স:", 12)' };
      if (/not callable/.test(msg)) return { title: 'এটা ফাংশন না', body: 'যে জিনিসের পরে ( ) দিয়েছ সেটা কোনো ফাংশন না। হয়তো কোনো ভেরিয়েবলের নাম ফাংশনের নামের মতো রেখেছ।' };
      return { title: 'ভুল ধরনের মান (Type)', body: 'যে কাজটা করতে চাইছ, এই ধরনের মান দিয়ে সেটা করা যায় না। মানগুলোর টাইপ type() দিয়ে দেখে নাও।' };
    }
    if (type === 'ValueError') return { title: 'মানটা ঠিক রূপে নেই', body: 'যেমন "abc" কে int() দিয়ে সংখ্যা বানানো যায় না — শুধু "12" এর মতো অঙ্ক থাকলে যায়।' };
    if (type === 'ZeroDivisionError') return { title: 'শূন্য দিয়ে ভাগ!', body: 'কোনো সংখ্যাকে ০ দিয়ে ভাগ করা যায় না। ভাজক (/ এর ডান পাশের সংখ্যা) বদলাও।' };
    if (type === 'AttributeError') return { title: 'এই মেথড নেই', body: 'এই ধরনের মানের এমন কোনো মেথড নেই। বানান দেখো, আর মানটার টাইপ ঠিক আছে কি না দেখো।' };
    if (type === 'IndexError') return { title: 'ইনডেক্স সীমার বাইরে', body: 'মনে রেখো, গোনা শুরু হয় ০ থেকে। ৫ অক্ষরের লেখার শেষ ইনডেক্স ৪।' };
    if (type === 'TimeoutError') return { title: 'প্রোগ্রাম অনেক সময় নিচ্ছে', body: 'পেজ যেন আটকে না যায়, তাই প্রোগ্রামটা থামিয়ে দেওয়া হয়েছে।' };
    return { title: 'একটা সমস্যা হয়েছে', body: 'এরর মেসেজটা পড়ে দেখো, পাইথু সাহায্য করবে!' };
  }

  return { run, explain, PyErr };
})();
if (typeof module !== 'undefined') module.exports = PyLite;
