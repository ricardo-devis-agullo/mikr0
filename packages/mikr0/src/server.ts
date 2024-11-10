import Domain from "node:domain";
import vm from "node:vm";
import { LRUCache } from "lru-cache";
import createRequireWrapper from "./require-wrapper.js";
import type { Repository } from "./storage/repository.js";

type Loader = (...args: unknown[]) => Promise<{ deferred: boolean; data: any }>;
type Action = (...args: unknown[]) => Promise<any>;
type Server = { loader: Loader; actions: Record<string, Action> };

// Polyfill to support Node 20
if (typeof Promise.withResolvers === "undefined") {
	Promise.withResolvers = (() => {
		let resolve: any;
		let reject: any;
		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	}) as any;
}

export default function getServerData(opts: {
	timeout: number;
	repository: Repository;
	dependencies: string[];
}) {
	const cache = new LRUCache<string, Server>({ max: 500 });

	const getServer = async (name: string, version: string): Promise<Server> => {
		const cached = cache.get(`${name}/${version}`);
		if (cached) return cached;

		const server = await opts.repository.getServer(name, version);

		const options =
			process.env.NODE_ENV !== "production"
				? {
						displayErrors: true,
						filename: "server.js",
					}
				: {};

		const vmContext = {
			require: createRequireWrapper(opts.dependencies),
			module: {
				exports: {} as any,
			},
			exports: {} as any,
			console,
			setTimeout,
			Buffer,
      Promise,
			AbortController,
			AbortSignal,
			eval: undefined,
			fetch,
		};
		vm.runInNewContext(server, vmContext, options);

		const loader = vmContext.module.exports.loader || vmContext.exports.loader;
		const actions =
			vmContext.module.exports.actions || vmContext.exports.actions;
		if (!loader) throw new Error("Missing loader");

		const serverFns = { loader, actions };
		cache.set(`${name}/${version}`, serverFns);

		return serverFns;
	};

	return async function getServerData({
		action,
		name,
		version,
		parameters,
		plugins,
		headers,
	}: {
		action?: string;
		name: string;
		version: string;
		parameters: unknown;
		plugins: Record<string, (...params: any[]) => any>;
		headers?: Record<string, string | string[] | undefined>;
	}): Promise<any> {
		const domain = Domain.create();
		const { loader, actions } = await getServer(name, version);

		const serverContext = {
			parameters,
			plugins,
			headers: headers ?? {},
		};

		const { promise, resolve, reject } = Promise.withResolvers();

		domain.on("error", (err) => reject(err));
		domain.run(async () => {
			setTimeout(() => {
				reject(new Error("Timeout exceeded"));
			}, opts.timeout);

			try {
				let data: unknown;
				if (action && actions[action]) {
					data = await actions[action](parameters, serverContext);
				} else {
					data = await loader(serverContext);
				}
				resolve(data);
			} catch (err) {
				reject(err);
			}
		});

		return promise;
	};
}
