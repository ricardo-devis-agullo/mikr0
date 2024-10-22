const a = {
  context: void 0,
  registry: void 0,
  effects: void 0,
  done: !1,
  getContextId() {
    return ie(this.context.count);
  },
  getNextContextId() {
    return ie(this.context.count++);
  }
};
function ie(e) {
  const t = String(e), n = t.length - 1;
  return a.context.id + (n ? String.fromCharCode(96 + n) : "") + t;
}
function A(e) {
  a.context = e;
}
const Se = (e, t) => e === t, B = {
  equals: Se
};
let Ce = ye;
const E = 1, q = 2, ue = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
}, K = {};
var d = null;
let M = null, ve = null, p = null, x = null, v = null, W = 0;
function ce(e, t) {
  const n = p, s = d, o = e.length === 0, i = t === void 0 ? s : t, r = o ? ue : {
    owned: null,
    cleanups: null,
    context: i ? i.context : null,
    owner: i
  }, l = o ? e : () => e(() => O(() => G(r)));
  d = r, p = null;
  try {
    return k(l, !0);
  } finally {
    p = n, d = s;
  }
}
function $(e, t) {
  t = t ? Object.assign({}, B, t) : B;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, s = (o) => (typeof o == "function" && (o = o(n.value)), he(n, o));
  return [pe.bind(n), s];
}
function re(e, t, n) {
  const s = ne(e, t, !0, E);
  F(s);
}
function H(e, t, n) {
  const s = ne(e, t, !1, E);
  F(s);
}
function N(e, t, n) {
  n = n ? Object.assign({}, B, n) : B;
  const s = ne(e, t, !0, 0);
  return s.observers = null, s.observerSlots = null, s.comparator = n.equals || void 0, F(s), pe.bind(s);
}
function Ae(e) {
  return e && typeof e == "object" && "then" in e;
}
function $e(e, t, n) {
  let s, o, i;
  arguments.length === 2 && typeof t == "object" || arguments.length === 1 ? (s = !0, o = e, i = {}) : (s = e, o = t, i = {});
  let r = null, l = K, f = null, c = !1, u = !1, b = "initialValue" in i, S = typeof s == "function" && N(s);
  const w = /* @__PURE__ */ new Set(), [m, C] = (i.storage || $)(i.initialValue), [T, _] = $(void 0), [j, X] = $(void 0, {
    equals: !1
  }), [se, oe] = $(b ? "ready" : "unresolved");
  a.context && (f = a.getNextContextId(), i.ssrLoadFrom === "initial" ? l = i.initialValue : a.load && a.has(f) && (l = a.load(f)));
  function U(h, g, y, L) {
    return r === h && (r = null, L !== void 0 && (b = !0), (h === l || g === l) && i.onHydrated && queueMicrotask(
      () => i.onHydrated(L, {
        value: g
      })
    ), l = K, me(g, y)), g;
  }
  function me(h, g) {
    k(() => {
      g === void 0 && C(() => h), oe(g !== void 0 ? "errored" : b ? "ready" : "unresolved"), _(g);
      for (const y of w.keys()) y.decrement();
      w.clear();
    }, !1);
  }
  function Y() {
    const h = D && de(D), g = m(), y = T();
    if (y !== void 0 && !r) throw y;
    return p && !p.user && h && re(() => {
      j(), r && (h.resolved && M && c ? M.promises.add(r) : w.has(h) || (h.increment(), w.add(h)));
    }), g;
  }
  function J(h = !0) {
    if (h !== !1 && u) return;
    u = !1;
    const g = S ? S() : s;
    if (c = M, g == null || g === !1) {
      U(r, O(m));
      return;
    }
    const y = l !== K ? l : O(
      () => o(g, {
        value: m(),
        refetching: h
      })
    );
    return Ae(y) ? (r = y, "value" in y ? (y.status === "success" ? U(r, y.value, void 0, g) : U(r, void 0, Z(y.value), g), y) : (u = !0, queueMicrotask(() => u = !1), k(() => {
      oe(b ? "refreshing" : "pending"), X();
    }, !1), y.then(
      (L) => U(y, L, void 0, g),
      (L) => U(y, void 0, Z(L), g)
    ))) : (U(r, y, void 0, g), y);
  }
  return Object.defineProperties(Y, {
    state: {
      get: () => se()
    },
    error: {
      get: () => T()
    },
    loading: {
      get() {
        const h = se();
        return h === "pending" || h === "refreshing";
      }
    },
    latest: {
      get() {
        if (!b) return Y();
        const h = T();
        if (h && !r) throw h;
        return m();
      }
    }
  }), S ? re(() => J(!1)) : J(!1), [
    Y,
    {
      refetch: J,
      mutate: C
    }
  ];
}
function O(e) {
  if (p === null) return e();
  const t = p;
  p = null;
  try {
    return e();
  } finally {
    p = t;
  }
}
function Ee(e) {
  return d === null || (d.cleanups === null ? d.cleanups = [e] : d.cleanups.push(e)), e;
}
function Te() {
  return d;
}
function _e(e) {
  v.push.apply(v, e), e.length = 0;
}
function ae(e, t) {
  const n = Symbol("context");
  return {
    id: n,
    Provider: Le(n),
    defaultValue: e
  };
}
function de(e) {
  let t;
  return d && d.context && (t = d.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function Ne(e) {
  const t = N(e), n = N(() => ee(t()));
  return n.toArray = () => {
    const s = n();
    return Array.isArray(s) ? s : s != null ? [s] : [];
  }, n;
}
let D;
function Oe() {
  return D || (D = ae());
}
function pe() {
  if (this.sources && this.state)
    if (this.state === E) F(this);
    else {
      const e = x;
      x = null, k(() => R(this), !1), x = e;
    }
  if (p) {
    const e = this.observers ? this.observers.length : 0;
    p.sources ? (p.sources.push(this), p.sourceSlots.push(e)) : (p.sources = [this], p.sourceSlots = [e]), this.observers ? (this.observers.push(p), this.observerSlots.push(p.sources.length - 1)) : (this.observers = [p], this.observerSlots = [p.sources.length - 1]);
  }
  return this.value;
}
function he(e, t, n) {
  let s = e.value;
  return (!e.comparator || !e.comparator(s, t)) && (e.value = t, e.observers && e.observers.length && k(() => {
    for (let o = 0; o < e.observers.length; o += 1) {
      const i = e.observers[o], r = M && M.running;
      r && M.disposed.has(i), (r ? !i.tState : !i.state) && (i.pure ? x.push(i) : v.push(i), i.observers && be(i)), r || (i.state = E);
    }
    if (x.length > 1e6)
      throw x = [], new Error();
  }, !1)), t;
}
function F(e) {
  if (!e.fn) return;
  G(e);
  const t = W;
  ke(
    e,
    e.value,
    t
  );
}
function ke(e, t, n) {
  let s;
  const o = d, i = p;
  p = d = e;
  try {
    s = e.fn(t);
  } catch (r) {
    return e.pure && (e.state = E, e.owned && e.owned.forEach(G), e.owned = null), e.updatedAt = n + 1, xe(r);
  } finally {
    p = i, d = o;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? he(e, s) : e.value = s, e.updatedAt = n);
}
function ne(e, t, n, s = E, o) {
  const i = {
    fn: e,
    state: s,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: d,
    context: d ? d.context : null,
    pure: n
  };
  return d === null || d !== ue && (d.owned ? d.owned.push(i) : d.owned = [i]), i;
}
function ge(e) {
  if (e.state === 0) return;
  if (e.state === q) return R(e);
  if (e.suspense && O(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < W); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === E)
      F(e);
    else if (e.state === q) {
      const s = x;
      x = null, k(() => R(e, t[0]), !1), x = s;
    }
}
function k(e, t) {
  if (x) return e();
  let n = !1;
  t || (x = []), v ? n = !0 : v = [], W++;
  try {
    const s = e();
    return Ue(n), s;
  } catch (s) {
    n || (v = null), x = null, xe(s);
  }
}
function Ue(e) {
  if (x && (ye(x), x = null), e) return;
  const t = v;
  v = null, t.length && k(() => Ce(t), !1);
}
function ye(e) {
  for (let t = 0; t < e.length; t++) ge(e[t]);
}
function R(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const s = e.sources[n];
    if (s.sources) {
      const o = s.state;
      o === E ? s !== t && (!s.updatedAt || s.updatedAt < W) && ge(s) : o === q && R(s, t);
    }
  }
}
function be(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = q, n.pure ? x.push(n) : v.push(n), n.observers && be(n));
  }
}
function G(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const n = e.sources.pop(), s = e.sourceSlots.pop(), o = n.observers;
      if (o && o.length) {
        const i = o.pop(), r = n.observerSlots.pop();
        s < o.length && (i.sourceSlots[r] = s, o[s] = i, n.observerSlots[s] = r);
      }
    }
  if (e.tOwned) {
    for (t = e.tOwned.length - 1; t >= 0; t--) G(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) G(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function Z(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function xe(e, t = d) {
  throw Z(e);
}
function ee(e) {
  if (typeof e == "function" && !e.length) return ee(e());
  if (Array.isArray(e)) {
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const s = ee(e[n]);
      Array.isArray(s) ? t.push.apply(t, s) : t.push(s);
    }
    return t;
  }
  return e;
}
function Le(e, t) {
  return function(s) {
    let o;
    return H(
      () => o = O(() => (d.context = {
        ...d.context,
        [e]: s.value
      }, Ne(() => s.children))),
      void 0
    ), o;
  };
}
function z(e, t) {
  return O(() => e(t || {}));
}
function Pe(e) {
  let t, n;
  const s = (o) => {
    const i = a.context;
    if (i) {
      const [l, f] = $();
      a.count || (a.count = 0), a.count++, (n || (n = e())).then((c) => {
        !a.done && A(i), a.count--, f(() => c.default), A();
      }), t = l;
    } else if (!t) {
      const [l] = $e(() => (n || (n = e())).then((f) => f.default));
      t = l;
    }
    let r;
    return N(
      () => (r = t()) ? O(() => {
        if (!i || a.done) return r(o);
        const l = a.context;
        A(i);
        const f = r(o);
        return A(l), f;
      }) : ""
    );
  };
  return s.preload = () => n || ((n = e()).then((o) => t = () => o.default), n), s;
}
const Me = /* @__PURE__ */ ae();
function je(e) {
  let t = 0, n, s, o, i, r;
  const [l, f] = $(!1), c = Oe(), u = {
    increment: () => {
      ++t === 1 && f(!0);
    },
    decrement: () => {
      --t === 0 && f(!1);
    },
    inFallback: l,
    effects: [],
    resolved: !1
  }, b = Te();
  if (a.context && a.load) {
    const m = a.getContextId();
    let C = a.load(m);
    if (C && (typeof C != "object" || C.status !== "success" ? o = C : a.gather(m)), o && o !== "$$f") {
      const [T, _] = $(void 0, {
        equals: !1
      });
      i = T, o.then(
        () => {
          if (a.done) return _();
          a.gather(m), A(s), _(), A();
        },
        (j) => {
          r = j, _();
        }
      );
    }
  }
  const S = de(Me);
  S && (n = S.register(u.inFallback));
  let w;
  return Ee(() => w && w()), z(c.Provider, {
    value: u,
    get children() {
      return N(() => {
        if (r) throw r;
        if (s = a.context, i)
          return i(), i = void 0;
        s && o === "$$f" && A();
        const m = N(() => e.children);
        return N((C) => {
          const T = u.inFallback(), { showContent: _ = !0, showFallback: j = !0 } = n ? n() : {};
          if ((!T || o && o !== "$$f") && _)
            return u.resolved = !0, w && w(), w = s = o = void 0, _e(u.effects), m();
          if (j)
            return w ? C : ce((X) => (w = X, s && (A({
              id: s.id + "F",
              count: 0
            }), s = void 0), e.fallback), b);
        });
      });
    }
  });
}
function Ge(e, t, n) {
  let s = n.length, o = t.length, i = s, r = 0, l = 0, f = t[o - 1].nextSibling, c = null;
  for (; r < o || l < i; ) {
    if (t[r] === n[l]) {
      r++, l++;
      continue;
    }
    for (; t[o - 1] === n[i - 1]; )
      o--, i--;
    if (o === r) {
      const u = i < s ? l ? n[l - 1].nextSibling : n[i - l] : f;
      for (; l < i; ) e.insertBefore(n[l++], u);
    } else if (i === l)
      for (; r < o; )
        (!c || !c.has(t[r])) && t[r].remove(), r++;
    else if (t[r] === n[i - 1] && n[l] === t[o - 1]) {
      const u = t[--o].nextSibling;
      e.insertBefore(n[l++], t[r++].nextSibling), e.insertBefore(n[--i], u), t[o] = n[i];
    } else {
      if (!c) {
        c = /* @__PURE__ */ new Map();
        let b = l;
        for (; b < i; ) c.set(n[b], b++);
      }
      const u = c.get(t[r]);
      if (u != null)
        if (l < u && u < i) {
          let b = r, S = 1, w;
          for (; ++b < o && b < i && !((w = c.get(t[b])) == null || w !== u + S); )
            S++;
          if (S > u - l) {
            const m = t[r];
            for (; l < u; ) e.insertBefore(n[l++], m);
          } else e.replaceChild(n[l++], t[r++]);
        } else r++;
      else t[r++].remove();
    }
  }
}
const le = "_$DX_DELEGATE";
function Fe(e, t, n, s = {}) {
  let o;
  return ce((i) => {
    o = i, t === document ? e() : V(t, e(), t.firstChild ? null : void 0, n);
  }, s.owner), () => {
    o(), t.textContent = "";
  };
}
function I(e, t, n) {
  let s;
  const o = () => {
    const r = document.createElement("template");
    return r.innerHTML = e, r.content.firstChild;
  }, i = () => (s || (s = o())).cloneNode(!0);
  return i.cloneNode = i, i;
}
function Ie(e, t = window.document) {
  const n = t[le] || (t[le] = /* @__PURE__ */ new Set());
  for (let s = 0, o = e.length; s < o; s++) {
    const i = e[s];
    n.has(i) || (n.add(i), t.addEventListener(i, Be));
  }
}
function Ve(e, t, n) {
  we(e) || e.setAttribute(t, n);
}
function V(e, t, n, s) {
  if (n !== void 0 && !s && (s = []), typeof t != "function") return Q(e, t, s, n);
  H((o) => Q(e, t(), o, n), s);
}
function we(e) {
  return !!a.context && !a.done && (!e || e.isConnected);
}
function Be(e) {
  if (a.registry && a.events && a.events.find(([f, c]) => c === e))
    return;
  let t = e.target;
  const n = `$$${e.type}`, s = e.target, o = e.currentTarget, i = (f) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: f
  }), r = () => {
    const f = t[n];
    if (f && !t.disabled) {
      const c = t[`${n}Data`];
      if (c !== void 0 ? f.call(t, c, e) : f.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && i(t.host), !0;
  }, l = () => {
    for (; r() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  if (Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  }), a.registry && !a.done && (a.done = _$HY.done = !0), e.composedPath) {
    const f = e.composedPath();
    i(f[0]);
    for (let c = 0; c < f.length - 2 && (t = f[c], !!r()); c++) {
      if (t._$host) {
        t = t._$host, l();
        break;
      }
      if (t.parentNode === o)
        break;
    }
  } else l();
  i(s);
}
function Q(e, t, n, s, o) {
  const i = we(e);
  if (i) {
    !n && (n = [...e.childNodes]);
    let f = [];
    for (let c = 0; c < n.length; c++) {
      const u = n[c];
      u.nodeType === 8 && u.data.slice(0, 2) === "!$" ? u.remove() : f.push(u);
    }
    n = f;
  }
  for (; typeof n == "function"; ) n = n();
  if (t === n) return n;
  const r = typeof t, l = s !== void 0;
  if (e = l && n[0] && n[0].parentNode || e, r === "string" || r === "number") {
    if (i || r === "number" && (t = t.toString(), t === n))
      return n;
    if (l) {
      let f = n[0];
      f && f.nodeType === 3 ? f.data !== t && (f.data = t) : f = document.createTextNode(t), n = P(e, n, s, f);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || r === "boolean") {
    if (i) return n;
    n = P(e, n, s);
  } else {
    if (r === "function")
      return H(() => {
        let f = t();
        for (; typeof f == "function"; ) f = f();
        n = Q(e, f, n, s);
      }), () => n;
    if (Array.isArray(t)) {
      const f = [], c = n && Array.isArray(n);
      if (te(f, t, n, o))
        return H(() => n = Q(e, f, n, s, !0)), () => n;
      if (i) {
        if (!f.length) return n;
        if (s === void 0) return n = [...e.childNodes];
        let u = f[0];
        if (u.parentNode !== e) return n;
        const b = [u];
        for (; (u = u.nextSibling) !== s; ) b.push(u);
        return n = b;
      }
      if (f.length === 0) {
        if (n = P(e, n, s), l) return n;
      } else c ? n.length === 0 ? fe(e, f, s) : Ge(e, n, f) : (n && P(e), fe(e, f));
      n = f;
    } else if (t.nodeType) {
      if (i && t.parentNode) return n = l ? [t] : t;
      if (Array.isArray(n)) {
        if (l) return n = P(e, n, s, t);
        P(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function te(e, t, n, s) {
  let o = !1;
  for (let i = 0, r = t.length; i < r; i++) {
    let l = t[i], f = n && n[e.length], c;
    if (!(l == null || l === !0 || l === !1)) if ((c = typeof l) == "object" && l.nodeType)
      e.push(l);
    else if (Array.isArray(l))
      o = te(e, l, f) || o;
    else if (c === "function")
      if (s) {
        for (; typeof l == "function"; ) l = l();
        o = te(
          e,
          Array.isArray(l) ? l : [l],
          Array.isArray(f) ? f : [f]
        ) || o;
      } else
        e.push(l), o = !0;
    else {
      const u = String(l);
      f && f.nodeType === 3 && f.data === u ? e.push(f) : e.push(document.createTextNode(u));
    }
  }
  return o;
}
function fe(e, t, n = null) {
  for (let s = 0, o = t.length; s < o; s++) e.insertBefore(t[s], n);
}
function P(e, t, n, s) {
  if (n === void 0) return e.textContent = "";
  const o = s || document.createTextNode("");
  if (t.length) {
    let i = !1;
    for (let r = t.length - 1; r >= 0; r--) {
      const l = t[r];
      if (o !== l) {
        const f = l.parentNode === e;
        !i && !r ? f ? e.replaceChild(o, l) : e.insertBefore(o, n) : f && l.remove();
      } else i = !0;
    }
  } else e.insertBefore(o, n);
  return [o];
}
const qe = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20166%20155.3'%3e%3cpath%20d='M163%2035S110-4%2069%205l-3%201c-6%202-11%205-14%209l-2%203-15%2026%2026%205c11%207%2025%2010%2038%207l46%209%2018-30z'%20fill='%2376b3e1'/%3e%3clinearGradient%20id='a'%20gradientUnits='userSpaceOnUse'%20x1='27.5'%20y1='3'%20x2='152'%20y2='63.5'%3e%3cstop%20offset='.1'%20stop-color='%2376b3e1'/%3e%3cstop%20offset='.3'%20stop-color='%23dcf2fd'/%3e%3cstop%20offset='1'%20stop-color='%2376b3e1'/%3e%3c/linearGradient%3e%3cpath%20d='M163%2035S110-4%2069%205l-3%201c-6%202-11%205-14%209l-2%203-15%2026%2026%205c11%207%2025%2010%2038%207l46%209%2018-30z'%20opacity='.3'%20fill='url(%23a)'/%3e%3cpath%20d='M52%2035l-4%201c-17%205-22%2021-13%2035%2010%2013%2031%2020%2048%2015l62-21S92%2026%2052%2035z'%20fill='%23518ac8'/%3e%3clinearGradient%20id='b'%20gradientUnits='userSpaceOnUse'%20x1='95.8'%20y1='32.6'%20x2='74'%20y2='105.2'%3e%3cstop%20offset='0'%20stop-color='%2376b3e1'/%3e%3cstop%20offset='.5'%20stop-color='%234377bb'/%3e%3cstop%20offset='1'%20stop-color='%231f3b77'/%3e%3c/linearGradient%3e%3cpath%20d='M52%2035l-4%201c-17%205-22%2021-13%2035%2010%2013%2031%2020%2048%2015l62-21S92%2026%2052%2035z'%20opacity='.3'%20fill='url(%23b)'/%3e%3clinearGradient%20id='c'%20gradientUnits='userSpaceOnUse'%20x1='18.4'%20y1='64.2'%20x2='144.3'%20y2='149.8'%3e%3cstop%20offset='0'%20stop-color='%23315aa9'/%3e%3cstop%20offset='.5'%20stop-color='%23518ac8'/%3e%3cstop%20offset='1'%20stop-color='%23315aa9'/%3e%3c/linearGradient%3e%3cpath%20d='M134%2080a45%2045%200%2000-48-15L24%2085%204%20120l112%2019%2020-36c4-7%203-15-2-23z'%20fill='url(%23c)'/%3e%3clinearGradient%20id='d'%20gradientUnits='userSpaceOnUse'%20x1='75.2'%20y1='74.5'%20x2='24.4'%20y2='260.8'%3e%3cstop%20offset='0'%20stop-color='%234377bb'/%3e%3cstop%20offset='.5'%20stop-color='%231a336b'/%3e%3cstop%20offset='1'%20stop-color='%231a336b'/%3e%3c/linearGradient%3e%3cpath%20d='M114%20115a45%2045%200%2000-48-15L4%20120s53%2040%2094%2030l3-1c17-5%2023-21%2013-34z'%20fill='url(%23d)'/%3e%3c/svg%3e";
var He = /* @__PURE__ */ I('<div>The folder is <a href=https://vitejs.dev target=_blank rel=noreferrer></a><a href=https://solidjs.com target=_blank rel=noreferrer><img class="logo solid"alt="Solid logo">'), De = /* @__PURE__ */ I("<h1>Vite + Solid"), Re = /* @__PURE__ */ I("<div class=card><button>count is </button><p>Edit <code>src/App.tsx</code> and save to test HMR"), ze = /* @__PURE__ */ I("<p class=read-the-docs>Click on the Vite and Solid logos to learn more"), Qe = /* @__PURE__ */ I("<div>Loading...");
const We = Pe(() => import("./Component-8gL2JGsU.js"));
function Xe(e) {
  const [t, n] = $(0);
  return [(() => {
    var s = He(), o = s.firstChild, i = o.nextSibling, r = i.nextSibling, l = r.firstChild;
    return V(s, z(je, {
      get fallback() {
        return Qe();
      },
      get children() {
        return z(We, {});
      }
    }), o), V(s, () => e.folder, i), Ve(l, "src", qe), s;
  })(), De(), (() => {
    var s = Re(), o = s.firstChild;
    return o.firstChild, o.$$click = () => n((i) => i + 1), V(o, t, null), s;
  })(), ze()];
}
Ie(["click"]);
function Ye(e) {
  return {
    plugins: e.plugins,
    parameters: e.parameters,
    loader: e.loader,
    render: e.render
  };
}
const Je = Ye({
  parameters: {
    position: {
      type: "number",
      default: 0
    }
  },
  plugins: {
    defaultPosition: () => 0
  },
  render: (e, t) => {
    Fe(() => z(Xe, t), e);
  }
});
export {
  Je as i,
  I as t
};
