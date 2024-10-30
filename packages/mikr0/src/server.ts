import Domain from "node:domain";
import vm from "node:vm";
import { LRUCache } from "lru-cache";
import createRequireWrapper from "./require-wrapper.js";
import type { Repository } from "./storage/repository.js";

type Loader = (...args: unknown[]) => Promise<void>;
type Server = { loader: Loader; actions: Record<string, Loader> };

export default function getServerData(opts: {
	timeout: number;
	repository: Repository;
	dependencies: string[];
}) {
	const cache = new LRUCache<string, Server>({ max: 500 });

	const getServer = async (name: string, version: string) => {
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

		cache.set(`${name}/${version}`, loader);

		return { loader, actions };
	};

	return async ({
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
	}) => {
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
				if (action) {
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
