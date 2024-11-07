const r = {
  baseUrl: "",
  name: "",
  version: "",
  serialized: !1
};
function u(e) {
  const n = (s, l, a) => {
    var i;
    r.baseUrl = a.baseUrl, r.name = a.name, r.version = a.version, r.serialized = a.serialized, (i = e.mount) == null || i.call(e, s, l, a.ssr);
  };
  return {
    serialized: e.serialized ?? !1,
    actions: e.actions,
    plugins: e.plugins,
    parameters: e.parameters,
    loader: e.loader,
    ssr: e.ssr,
    mount: e.mount ? n : void 0,
    unmount: e.unmount
  };
}
new Proxy({}, {
  get(e, n) {
    return (s) => window.mikr0.getAction({
      action: n,
      baseUrl: r.baseUrl,
      name: r.name,
      version: r.version,
      serialized: r.serialized,
      parameters: s
    });
  }
});
const d = u({});
export {
  d as default
};
