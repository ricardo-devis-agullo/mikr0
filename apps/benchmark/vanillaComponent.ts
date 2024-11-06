const rawServer = `"use strict";const t={baseUrl:"",name:"",version:"",serialized:!1};function i(e){return{serialized:e.serialized??!1,actions:e.actions,plugins:e.plugins,parameters:e.parameters,loader:e.loader,mount:(n,a,r)=>{t.baseUrl=r.baseUrl,t.name=r.name,t.version=r.version,t.serialized=r.serialized,e.mount(n,a)},unmount:e.unmount}}new Proxy({},{get(e,n){return a=>window.mikr0.getAction({action:n,baseUrl:t.baseUrl,name:t.name,version:t.version,serialized:t.serialized,parameters:a})}});const o=i({parameters:{name:{type:"string",mandatory:!0,example:"Mikr0",description:"Name of the component"}},async loader({parameters:{name:e},headers:n}){var r;const a=((r=n["accept-language"])==null?void 0:r.split(",")[0])??"en";return{name:e,lang:a}},mount(e,n){e.innerHTML=\`
    <div
      style="
        display: flex;
        border: 1px solid #ccc;
        padding: 1rem;
        gap: 1rem;
        align-items: center;
      "
    >
      <button
        style="
          background-color: #eee;
          color: #111;
          border: 0;
          text-align: center;
          padding: 1rem;
          cursor: pointer;
        "
        type="button"
      >
        Hi, \${n.name}! Click me! The count is 
        <span>0</span>
      </button>
    </div>
\`;let a=0;e.querySelector("button").addEventListener("click",()=>{const r=new Intl.NumberFormat(n.lang,{maximumSignificantDigits:3}).format(++a);e.querySelector("span").textContent=r})},unmount(e){e.innerHTML=""}});module.exports=o;
`;

const rawTemplate = `const t = {
  baseUrl: "",
  name: "",
  version: "",
  serialized: !1
};
function i(e) {
  return {
    serialized: e.serialized ?? !1,
    actions: e.actions,
    plugins: e.plugins,
    parameters: e.parameters,
    loader: e.loader,
    mount: (n, a, r) => {
      t.baseUrl = r.baseUrl, t.name = r.name, t.version = r.version, t.serialized = r.serialized, e.mount(n, a);
    },
    unmount: e.unmount
  };
}
new Proxy({}, {
  get(e, n) {
    return (a) => window.mikr0.getAction({
      action: n,
      baseUrl: t.baseUrl,
      name: t.name,
      version: t.version,
      serialized: t.serialized,
      parameters: a
    });
  }
});
const o = i({
  parameters: {
    name: {
      type: "string",
      mandatory: !0,
      example: "Mikr0",
      description: "Name of the component"
    }
  },
  async loader({ parameters: { name: e }, headers: n }) {
    var r;
    const a = ((r = n["accept-language"]) == null ? void 0 : r.split(",")[0]) ?? "en";
    return { name: e, lang: a };
  },
  mount(e, n) {
    e.innerHTML = /* html */
    \`
    <div
      style="
        display: flex;
        border: 1px solid #ccc;
        padding: 1rem;
        gap: 1rem;
        align-items: center;
      "
    >
      <button
        style="
          background-color: #eee;
          color: #111;
          border: 0;
          text-align: center;
          padding: 1rem;
          cursor: pointer;
        "
        type="button"
      >
        Hi, \${n.name}! Click me! The count is 
        <span>0</span>
      </button>
    </div>
\`;
    let a = 0;
    e.querySelector("button").addEventListener("click", () => {
      const r = new Intl.NumberFormat(n.lang, {
        maximumSignificantDigits: 3
      }).format(++a);
      e.querySelector("span").textContent = r;
    });
  },
  unmount(e) {
    e.innerHTML = "";
  }
});
export {
  o as default
};
`;

const pkg = {
	name: "vanilla-component",
	private: true,
	version: "0.0.0",
	type: "module",
	scripts: {
		dev: "mikr0 dev",
		build: "tsc -b && mikr0 build",
		"publish-component": "tsc -b && mikr0 publish",
	},
	devDependencies: {
		mikr0: "0.0.12",
		typescript: "~5.6.2",
		vite: "^5.4.9",
	},
	description: "A sample component written in vanilla",
	mikr0: {
		parameters: {
			name: {
				type: "string",
				mandatory: true,
				example: "Mikr0",
				description: "Name of the component",
			},
		},
		serverSize: 1611,
		clientSize: 1992,
		serialized: false,
	},
};

export default { pkg, rawServer, rawTemplate };
