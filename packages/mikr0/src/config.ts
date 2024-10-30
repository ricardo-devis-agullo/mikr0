import { builtinModules } from "node:module";
import { Database } from "./database/index.js";
import { StaticStorage } from "./storage/storage.js";
import type {
	DatabaseOptions,
	Options,
	StaticStorageOptions,
} from "./types.js";

export function parseConfig(options: Options) {
	const databaseConfig: DatabaseOptions = options.database ?? {
		client: "sqlite3",
		connection: {
			filename: ".mikr0/db.sqlite",
		},
	};
	const storageConfig: StaticStorageOptions = options.storage ?? {
		type: "filesystem",
		options: {
			folder: ".mikr0/components",
		},
	};
	const availableDependencies: string[] = [];
	const coreModules = builtinModules.flatMap((module) => [
		module,
		`node:${module}`,
	]);
	for (const dependency of options.dependencies ?? []) {
		if (coreModules.includes(dependency)) {
			availableDependencies.push(
				dependency.startsWith("node:") ? dependency : `node:${dependency}`,
			);
		}
		availableDependencies.push(dependency);
	}

	return {
		availableDependencies: [...new Set(availableDependencies)],
		port: options.port ?? 4910,
		executionTimeout: options.executionTimeout ?? 5_000,
		auth: options.auth,
		verbose: options.verbose ?? false,
		database: new Database(databaseConfig),
		storage: StaticStorage(storageConfig),
		cors: options.cors ?? {
			origin: "*",
		},
		importmap: options.importmap ?? { imports: {} },
		plugins: options.plugins ?? {},
	};
}

export type Config = ReturnType<typeof parseConfig>;
