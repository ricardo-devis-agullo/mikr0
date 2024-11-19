import { decode } from "turbo-stream";
import type { BrowserComponent } from "../dev/index.js";
import { acceptCompressedHeader, compressedDataKey } from "../shared.js";

class Mikr0 extends HTMLElement {
	static observedAttributes = ["src", "data"];
	static config = {
		verbose: window.mikr0?.verbose ?? false,
	};
	static log = (msg: string) => Mikr0.config.verbose && console.log(msg);
	#connected = false;
	#unmount?: (element: HTMLElement) => void;

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

	disconnectedCallback() {
		this.#connected = false;
		this.#unmount?.(this);
	}

	async #compress(input: string) {
		const encoder = new TextEncoder();
		const inputData = encoder.encode(input);

		const cs = new CompressionStream("deflate-raw");
		const compressedStream = new Blob([inputData]).stream().pipeThrough(cs);

		const compressedBlob = await new Response(compressedStream).blob();
		const compressedArray = new Uint8Array(await compressedBlob.arrayBuffer());
		return btoa(String.fromCharCode(...compressedArray));
	}

	async #render(src: string) {
		Mikr0.log(`Fetching component:, ${src}`);
		let finalUrl = src;
		const headers: Record<string, string> = {};
		const compress = this.getAttribute("compress");
		if (typeof compress === "string") {
			const minimumLength = Number(compress) || 1000;

			const url = new URL(src);
			const search = url.search.replace(/^\?/, "");
			if (search.length > minimumLength) {
				const compressedSearch = await this.#compress(search);
				finalUrl = `${url.origin}${url.pathname}?${compressedDataKey}=${encodeURIComponent(compressedSearch)}`;
				headers.Accept = acceptCompressedHeader;
			}
		}
		const response = await fetch(finalUrl, { headers });
		const decoded = await decode(response.body!);
		const { src: templateSrc, data, component, version } = decoded.value as any;
		const { origin } = new URL(src);

		try {
			const template: { default: BrowserComponent } = await import(templateSrc);
			Mikr0.log(`Rendering component: ${src}`);
			this.innerHTML = "";
			this.#unmount = template.default.unmount;
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
			newScript.textContent = script.textContent;
			for (const attribute of Array.from(script.attributes)) {
				newScript.setAttribute(attribute.name, attribute.value);
			}
			script.parentNode?.replaceChild(newScript, script);
		}
	}
}

if (!window.mikr0?.loaded) {
	window.mikr0 = window.mikr0 ?? {};
	window.mikr0.loaded = true;
	window.mikr0.getAction = async ({
		action,
		baseUrl,
		name,
		version,
		parameters,
	}) => {
		const url = `${baseUrl}/r/action/${name}/${version}`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ action, parameters }),
		});
		if (!response.ok) {
			throw new Error(`Failed to fetch action: ${action}`);
		}
		const json = await response.json();

		return json.data;
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
