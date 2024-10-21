class Mikr0 extends HTMLElement {
	static observedAttributes = ["src"];
	static config = {
		verbose: window.mikr0?.verbose ?? false,
	};
	static log = (msg: string) => Mikr0.config.verbose && console.log(msg);
	#connected = false;

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

	async #render(src: string) {
		Mikr0.log(`Fetching component:, ${src}`);
		const { src: templateSrc, data: serializedData } = await fetch(src).then(
			(x) => x.json(),
		);
		const { parse } = await import(
			// @ts-expect-error
			"https://cdn.jsdelivr.net/npm/superjson@2.2.1/+esm"
		);
		const data = parse(serializedData);

		try {
			const template = await import(templateSrc);
			Mikr0.log(`Rendering component: ${src}`);
			this.innerHTML = "";
			template.default.render(this, data ?? {});
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
	customElements.define("mikro-component", Mikr0);
	window.mikr0 = window.mikr0 ?? {};
	window.mikr0.loaded = true;

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
}
