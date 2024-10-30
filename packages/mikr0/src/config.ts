import { builtinModules } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import { Database } from "./database/index.js";
import { StaticStorage } from "./storage/storage.js";
import type {
	DatabaseOptions,
	Options,
	PackageJson,
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
	const pkg: PackageJson = JSON.parse(
		readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
	);
	for (const dependency of options.dependencies ?? []) {
		if (coreModules.includes(dependency)) {
			availableDependencies.push(
				dependency.startsWith("node:") ? dependency : `node:${dependency}`,
			);
		} else {
			if (
				!pkg.dependencies?.[dependency] ||
				!pkg.devDependencies?.[dependency]
			) {
				throw new Error(
					`Dependency "${dependency}" not found in package.json dependencies or devDependencies`,
				);
			}
			availableDependencies.push(dependency);
		}
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
