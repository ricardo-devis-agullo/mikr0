import type { SuperJSON } from "superjson";
import type { BrowserComponent } from "../dev/index.js";

const superjson = (): Promise<SuperJSON> =>
	import(
		// @ts-expect-error
		"https://cdn.jsdelivr.net/npm/superjson@2/+esm"
	);

class Mikr0 extends HTMLElement {
	static observedAttributes = ["src", "data"];
	static config = {
		verbose: window.mikr0?.verbose ?? false,
	};
	static log = (msg: string) => Mikr0.config.verbose && console.log(msg);
	#connected = false;
	#unmount?: (element: HTMLElement) => void;
	#serialized = false;

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

	async #getStreamedData(response: Response) {
		if (!response.body) {
			throw new Error("ReadableStream not supported!");
		}

		function deserializeError(data: {
			message: string;
			name: string;
			stack: string;
		}) {
			const error = new Error(data.message);
			error.name = data.name;
			error.stack = data.stack;
			Object.assign(error, data); // restores any custom properties
			return error;
		}

		const decoder = new TextDecoder();
		const promises: Record<string, Promise<any>> = {};
		const promiseResolvers: Record<
			string,
			ReturnType<typeof Promise.withResolvers>
		> = {};
		const immediateData: Record<string, any> = {};

		const reader = response.body.getReader();
		let partialData = ""; // To handle partial JSON chunks
		const { promise: initialData, resolve: resolveInitialData } =
			Promise.withResolvers<void>();

		// Process each chunk as it comes in
		reader.read().then(function processStream({ done, value }): any {
			if (done) {
				return;
			}

			const chunk = decoder.decode(value, { stream: true });
			partialData += chunk;

			const lines = partialData.split("\n");
			partialData = lines.pop() ?? ""; // Keep the last incomplete line (if any) for the next chunk

			for (const line of lines) {
				if (line) {
					const [, indicator, key, response] =
						line.match(/(\w):(\w+):\s*(.+)/)!;
					const data = JSON.parse(response!);

					if (data.data) {
						Object.assign(immediateData, data);

						for (const key of data.promises) {
							promiseResolvers[key] = Promise.withResolvers();
							promises[key] = promiseResolvers[key].promise;
						}
						resolveInitialData();
					} else {
						if (indicator === "P") {
							promiseResolvers[key!]!.resolve(data);
						} else if (indicator === "E") {
							promiseResolvers[key!]!.reject(deserializeError(data));
						} else {
							promiseResolvers[key!]!.reject(data);
						}
					}
				}
			}

			return reader.read().then(processStream);
		});

		await initialData;

		return { ...immediateData, data: { ...immediateData.data, ...promises } };
	}

	async #render(src: string) {
		Mikr0.log(`Fetching component:, ${src}`);
		const response = await fetch(src);
		const contentType = response.headers.get("content-type");
		let {
			src: templateSrc,
			data,
			component,
			version,
		} = contentType === "text/x-defer"
			? await this.#getStreamedData(response)
			: await response.json();
		if (typeof data === "string") {
			this.#serialized = true;
			const { parse } = await superjson();
			data = parse(data);
		}
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
				serialized: this.#serialized,
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
	window.mikr0.getAction = async ({
		action,
		baseUrl,
		name,
		version,
		parameters,
		serialized,
	}) => {
		const url = `${baseUrl}/r/action/${name}/${version}`;
		if (serialized) {
			const { stringify } = await superjson();
			parameters = stringify(parameters);
		}
		const { parse } = await superjson();
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
		if (serialized) {
			return parse(json.data);
		}

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
