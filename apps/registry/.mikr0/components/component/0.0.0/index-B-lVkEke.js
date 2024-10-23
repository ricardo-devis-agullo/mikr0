import { sharedConfig as h, createRoot as T, createRenderEffect as x, lazy as E, createSignal as N, createComponent as $, Suspense as G } from "solid-js";
function B(i, t, e) {
  let s = e.length, l = t.length, f = s, d = 0, o = 0, n = t[l - 1].nextSibling, r = null;
  for (; d < l || o < f; ) {
    if (t[d] === e[o]) {
      d++, o++;
      continue;
    }
    for (; t[l - 1] === e[f - 1]; )
      l--, f--;
    if (l === d) {
      const c = f < s ? o ? e[o - 1].nextSibling : e[f - o] : n;
      for (; o < f; ) i.insertBefore(e[o++], c);
    } else if (f === o)
      for (; d < l; )
        (!r || !r.has(t[d])) && t[d].remove(), d++;
    else if (t[d] === e[f - 1] && e[o] === t[l - 1]) {
      const c = t[--l].nextSibling;
      i.insertBefore(e[o++], t[d++].nextSibling), i.insertBefore(e[--f], c), t[l] = e[f];
    } else {
      if (!r) {
        r = /* @__PURE__ */ new Map();
        let a = o;
        for (; a < f; ) r.set(e[a], a++);
      }
      const c = r.get(t[d]);
      if (c != null)
        if (o < c && c < f) {
          let a = d, b = 1, C;
          for (; ++a < l && a < f && !((C = r.get(t[a])) == null || C !== c + b); )
            b++;
          if (b > c - o) {
            const A = t[d];
            for (; o < c; ) i.insertBefore(e[o++], A);
          } else i.replaceChild(e[o++], t[d++]);
        } else d++;
      else t[d++].remove();
    }
  }
}
const m = "_$DX_DELEGATE";
function M(i, t, e, s = {}) {
  let l;
  return T((f) => {
    l = f, t === document ? i() : y(t, i(), t.firstChild ? null : void 0, e);
  }, s.owner), () => {
    l(), t.textContent = "";
  };
}
function g(i, t, e) {
  let s;
  const l = () => {
    const d = document.createElement("template");
    return d.innerHTML = i, d.content.firstChild;
  }, f = () => (s || (s = l())).cloneNode(!0);
  return f.cloneNode = f, f;
}
function U(i, t = window.document) {
  const e = t[m] || (t[m] = /* @__PURE__ */ new Set());
  for (let s = 0, l = i.length; s < l; s++) {
    const f = i[s];
    e.has(f) || (e.add(f), t.addEventListener(f, O));
  }
}
function L(i, t, e) {
  _(i) || i.setAttribute(t, e);
}
function y(i, t, e, s) {
  if (e !== void 0 && !s && (s = []), typeof t != "function") return u(i, t, s, e);
  x((l) => u(i, t(), l, e), s);
}
function _(i) {
  return !!h.context && !h.done && (!i || i.isConnected);
}
function O(i) {
  if (h.registry && h.events && h.events.find(([n, r]) => r === i))
    return;
  let t = i.target;
  const e = `$$${i.type}`, s = i.target, l = i.currentTarget, f = (n) => Object.defineProperty(i, "target", {
    configurable: !0,
    value: n
  }), d = () => {
    const n = t[e];
    if (n && !t.disabled) {
      const r = t[`${e}Data`];
      if (r !== void 0 ? n.call(t, r, i) : n.call(t, i), i.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(i.target) && f(t.host), !0;
  }, o = () => {
    for (; d() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  if (Object.defineProperty(i, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  }), h.registry && !h.done && (h.done = _$HY.done = !0), i.composedPath) {
    const n = i.composedPath();
    f(n[0]);
    for (let r = 0; r < n.length - 2 && (t = n[r], !!d()); r++) {
      if (t._$host) {
        t = t._$host, o();
        break;
      }
      if (t.parentNode === l)
        break;
    }
  } else o();
  f(s);
}
function u(i, t, e, s, l) {
  const f = _(i);
  if (f) {
    !e && (e = [...i.childNodes]);
    let n = [];
    for (let r = 0; r < e.length; r++) {
      const c = e[r];
      c.nodeType === 8 && c.data.slice(0, 2) === "!$" ? c.remove() : n.push(c);
    }
    e = n;
  }
  for (; typeof e == "function"; ) e = e();
  if (t === e) return e;
  const d = typeof t, o = s !== void 0;
  if (i = o && e[0] && e[0].parentNode || i, d === "string" || d === "number") {
    if (f || d === "number" && (t = t.toString(), t === e))
      return e;
    if (o) {
      let n = e[0];
      n && n.nodeType === 3 ? n.data !== t && (n.data = t) : n = document.createTextNode(t), e = p(i, e, s, n);
    } else
      e !== "" && typeof e == "string" ? e = i.firstChild.data = t : e = i.textContent = t;
  } else if (t == null || d === "boolean") {
    if (f) return e;
    e = p(i, e, s);
  } else {
    if (d === "function")
      return x(() => {
        let n = t();
        for (; typeof n == "function"; ) n = n();
        e = u(i, n, e, s);
      }), () => e;
    if (Array.isArray(t)) {
      const n = [], r = e && Array.isArray(e);
      if (S(n, t, e, l))
        return x(() => e = u(i, n, e, s, !0)), () => e;
      if (f) {
        if (!n.length) return e;
        if (s === void 0) return e = [...i.childNodes];
        let c = n[0];
        if (c.parentNode !== i) return e;
        const a = [c];
        for (; (c = c.nextSibling) !== s; ) a.push(c);
        return e = a;
      }
      if (n.length === 0) {
        if (e = p(i, e, s), o) return e;
      } else r ? e.length === 0 ? w(i, n, s) : B(i, e, n) : (e && p(i), w(i, n));
      e = n;
    } else if (t.nodeType) {
      if (f && t.parentNode) return e = o ? [t] : t;
      if (Array.isArray(e)) {
        if (o) return e = p(i, e, s, t);
        p(i, e, null, t);
      } else e == null || e === "" || !i.firstChild ? i.appendChild(t) : i.replaceChild(t, i.firstChild);
      e = t;
    }
  }
  return e;
}
function S(i, t, e, s) {
  let l = !1;
  for (let f = 0, d = t.length; f < d; f++) {
    let o = t[f], n = e && e[i.length], r;
    if (!(o == null || o === !0 || o === !1)) if ((r = typeof o) == "object" && o.nodeType)
      i.push(o);
    else if (Array.isArray(o))
      l = S(i, o, n) || l;
    else if (r === "function")
      if (s) {
        for (; typeof o == "function"; ) o = o();
        l = S(
          i,
          Array.isArray(o) ? o : [o],
          Array.isArray(n) ? n : [n]
        ) || l;
      } else
        i.push(o), l = !0;
    else {
      const c = String(o);
      n && n.nodeType === 3 && n.data === c ? i.push(n) : i.push(document.createTextNode(c));
    }
  }
  return l;
}
function w(i, t, e = null) {
  for (let s = 0, l = t.length; s < l; s++) i.insertBefore(t[s], e);
}
function p(i, t, e, s) {
  if (e === void 0) return i.textContent = "";
  const l = s || document.createTextNode("");
  if (t.length) {
    let f = !1;
    for (let d = t.length - 1; d >= 0; d--) {
      const o = t[d];
      if (l !== o) {
        const n = o.parentNode === i;
        !f && !d ? n ? i.replaceChild(l, o) : i.insertBefore(l, e) : n && o.remove();
      } else f = !0;
    }
  } else i.insertBefore(l, e);
  return [l];
}
const P = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20166%20155.3'%3e%3cpath%20d='M163%2035S110-4%2069%205l-3%201c-6%202-11%205-14%209l-2%203-15%2026%2026%205c11%207%2025%2010%2038%207l46%209%2018-30z'%20fill='%2376b3e1'/%3e%3clinearGradient%20id='a'%20gradientUnits='userSpaceOnUse'%20x1='27.5'%20y1='3'%20x2='152'%20y2='63.5'%3e%3cstop%20offset='.1'%20stop-color='%2376b3e1'/%3e%3cstop%20offset='.3'%20stop-color='%23dcf2fd'/%3e%3cstop%20offset='1'%20stop-color='%2376b3e1'/%3e%3c/linearGradient%3e%3cpath%20d='M163%2035S110-4%2069%205l-3%201c-6%202-11%205-14%209l-2%203-15%2026%2026%205c11%207%2025%2010%2038%207l46%209%2018-30z'%20opacity='.3'%20fill='url(%23a)'/%3e%3cpath%20d='M52%2035l-4%201c-17%205-22%2021-13%2035%2010%2013%2031%2020%2048%2015l62-21S92%2026%2052%2035z'%20fill='%23518ac8'/%3e%3clinearGradient%20id='b'%20gradientUnits='userSpaceOnUse'%20x1='95.8'%20y1='32.6'%20x2='74'%20y2='105.2'%3e%3cstop%20offset='0'%20stop-color='%2376b3e1'/%3e%3cstop%20offset='.5'%20stop-color='%234377bb'/%3e%3cstop%20offset='1'%20stop-color='%231f3b77'/%3e%3c/linearGradient%3e%3cpath%20d='M52%2035l-4%201c-17%205-22%2021-13%2035%2010%2013%2031%2020%2048%2015l62-21S92%2026%2052%2035z'%20opacity='.3'%20fill='url(%23b)'/%3e%3clinearGradient%20id='c'%20gradientUnits='userSpaceOnUse'%20x1='18.4'%20y1='64.2'%20x2='144.3'%20y2='149.8'%3e%3cstop%20offset='0'%20stop-color='%23315aa9'/%3e%3cstop%20offset='.5'%20stop-color='%23518ac8'/%3e%3cstop%20offset='1'%20stop-color='%23315aa9'/%3e%3c/linearGradient%3e%3cpath%20d='M134%2080a45%2045%200%2000-48-15L24%2085%204%20120l112%2019%2020-36c4-7%203-15-2-23z'%20fill='url(%23c)'/%3e%3clinearGradient%20id='d'%20gradientUnits='userSpaceOnUse'%20x1='75.2'%20y1='74.5'%20x2='24.4'%20y2='260.8'%3e%3cstop%20offset='0'%20stop-color='%234377bb'/%3e%3cstop%20offset='.5'%20stop-color='%231a336b'/%3e%3cstop%20offset='1'%20stop-color='%231a336b'/%3e%3c/linearGradient%3e%3cpath%20d='M114%20115a45%2045%200%2000-48-15L4%20120s53%2040%2094%2030l3-1c17-5%2023-21%2013-34z'%20fill='url(%23d)'/%3e%3c/svg%3e";
var j = /* @__PURE__ */ g('<div>The folder is <a href=https://vitejs.dev target=_blank rel=noreferrer></a><a href=https://solidjs.com target=_blank rel=noreferrer><img class="logo solid"alt="Solid logo">'), H = /* @__PURE__ */ g("<h1>Vite + Solid"), V = /* @__PURE__ */ g("<div class=card><button>count is </button><p>Edit <code>src/App.tsx</code> and save to test HMR"), v = /* @__PURE__ */ g("<p class=read-the-docs>Click on the Vite and Solid logos to learn more"), D = /* @__PURE__ */ g("<div>Loading...");
const R = E(() => import("./Component-BJPbmXNv.js"));
function z(i) {
  const [t, e] = N(0);
  return [(() => {
    var s = j(), l = s.firstChild, f = l.nextSibling, d = f.nextSibling, o = d.firstChild;
    return y(s, $(G, {
      get fallback() {
        return D();
      },
      get children() {
        return $(R, {});
      }
    }), l), y(s, () => i.folder, f), L(o, "src", P), s;
  })(), H(), (() => {
    var s = V(), l = s.firstChild;
    return l.firstChild, l.$$click = () => e((f) => f + 1), y(l, t, null), s;
  })(), v()];
}
U(["click"]);
function I(i) {
  return {
    plugins: i.plugins,
    parameters: i.parameters,
    loader: i.loader,
    render: i.render
  };
}
const X = I({
  parameters: {
    position: {
      type: "number",
      default: 0
    }
  },
  plugins: {
    defaultPosition: () => 5
  },
  render: (i, t) => {
    M(() => $(z, t), i);
  }
});
export {
  X as i,
  g as t
};
