import Domain from "node:domain";
import vm from "node:vm";
import requireWrapper from "./require-wrapper.js";
import type { Repository } from "./storage/repository.js";
import { LRUCache } from "lru-cache";

type Loader = (...args: unknown[]) => Promise<void>;

export default function getServerData(opts: {
	repository: Repository;
	dependencies: string[];
}) {
	const cache = new LRUCache<string, Loader>({ max: 500 });

	const getLoader = async (name: string, version: string) => {
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
			require: requireWrapper(opts.dependencies),
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
		if (!loader) throw new Error("Missing loader");

		cache.set(`${name}/${version}`, loader);

		return loader;
	};

	return async (
		name: string,
		version: string,
		parameters: unknown,
		plugins: Record<string, (...params: any[]) => any>,
	) => {
		const domain = Domain.create();
		const loader = await getLoader(name, version);

		const serverContext = {
			parameters,
			plugins,
		};

		const { promise, resolve, reject } = Promise.withResolvers();

		domain.on("error", (err) => reject(err));
		domain.run(async () => {
			try {
				const data = await loader(serverContext);
				resolve(data);
				// setCallbackTimeout();
			} catch (err) {
				reject(err);
			}
		});

		return promise;
	};
}
