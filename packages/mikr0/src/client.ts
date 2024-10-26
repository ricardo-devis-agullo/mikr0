class Mikr0 extends HTMLElement {
	static observedAttributes = ["src", "data"];
	static config = {
		verbose: window.mikr0?.verbose ?? false,
	};
	static log = (msg: string) => Mikr0.config.verbose && console.log(msg);
	#connected = false;
	#parser?: (data: string) => any;

	async connectedCallback() {
		const src = this.getAttribute("src");
		if (!src) {
			throw new Error('Attribute "src" is required');
		}
		this.#connected = true;
		await this.#render(src);
	}

	async attributeChangedCallback(
		name: string,
		_oldValue: string,
		newValue: string,
	) {
		if (name === "src" && this.#connected) {
			await this.#render(newValue);
		}
	}

	async #parse(data: string) {
		if (this.#parser) {
			return this.#parser(data);
		}
		const { parse } = await import(
			// @ts-expect-error
			"https://cdn.jsdelivr.net/npm/superjson@2.2.1/+esm"
		);
		this.#parser = parse;
		return parse(data);
	}

	async #render(src: string) {
		Mikr0.log(`Fetching component:, ${src}`);
		const {
			src: templateSrc,
			data: serializedData,
			component,
			version,
		} = await fetch(src).then((x) => x.json());
		const data = this.#parse(serializedData);
		const { origin } = new URL(src);

		try {
			const template = await import(templateSrc);
			Mikr0.log(`Rendering component: ${src}`);
			this.innerHTML = "";
			template.default.mount(this, data ?? {}, {
				baseUrl: origin,
				name: component,
				version,
			});
			this.#reanimateScripts();
		} catch (err) {
			console.log("Error:", err);
		}
	}

	#reanimateScripts() {
		for (const script of Array.from(this.querySelectorAll("script"))) {
			const newScript = document.createElement("script");
			if (script.src) {
				newScript.src = script.src;
			} else {
				newScript.textContent = script.textContent;
			}
			script.parentNode?.replaceChild(newScript, script);
		}
	}
}

if (!window.mikr0?.loaded) {
	window.mikr0 = window.mikr0 ?? {};
	window.mikr0.loaded = true;
	window.mikr0.getAction = async ({ action, baseUrl, name, version, data }) => {
		const url = `${baseUrl}/r/action/${name}/${version}`;
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ action, data }),
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch action: ${action}`);
		}
		return await res.json();
	};

	window.mikr0.events = (() => {
		let listeners: Record<string, Array<(...data: any[]) => void>> = {};

		return {
			fire(key, data) {
				if (listeners[key]) {
					for (const cb of listeners[key]) {
						cb(data);
					}
				}
			},
			on(key, cb) {
				if (!cb) {
					throw new Error("Callback is required");
				}
				if (!listeners[key]) {
					listeners[key] = [];
				}
				listeners[key].push(cb);
			},
			off(events: string | string[], handler?: (...data: any[]) => void) {
				if (typeof events === "string") {
					// biome-ignore lint/style/noParameterAssign: it is fine
					events = [events];
				}
				for (const event of events) {
					if (listeners[event]) {
						if (handler) {
							listeners[event] = listeners[event].filter(
								(cb) => cb !== handler,
							);
						} else {
							delete listeners[event];
						}
					}
				}
			},
			reset() {
				listeners = {};
			},
		};
	})();
	customElements.define("mikro-component", Mikr0);
}
