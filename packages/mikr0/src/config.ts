import { builtinModules } from "node:module";
import type {
	DatabaseOptions,
	Options,
	PackageJson,
	StaticStorageOptions,
} from "./types.js";

export function parseConfig(options: Options, pkg: PackageJson) {
	const databaseConfig: DatabaseOptions = options.database ?? {
		client: "sqlite3",
		connection: {
			filename: "db.sqlite",
		},
	};
	const storageConfig: StaticStorageOptions = options.storage ?? {
		type: "filesystem",
		options: {
			folder: "components",
		},
	};

	let availableDependencies: string[] | true = ["mikr0"];
	const coreModules = builtinModules.flatMap((module) => [
		module,
		`node:${module}`,
	]);

	if (options.dependencies === true) {
		availableDependencies = true;
	} else {
		for (const dependency of options.dependencies ?? []) {
			if (coreModules.includes(dependency)) {
				availableDependencies.push(
					dependency.startsWith("node:") ? dependency : `node:${dependency}`,
				);
			} else {
				if (
					!pkg.dependencies?.[dependency] &&
					!pkg.devDependencies?.[dependency]
				) {
					throw new Error(
						`Dependency "${dependency}" not found in package.json dependencies or devDependencies`,
					);
				}
				availableDependencies.push(dependency);
			}
		}
	}

	return {
		availableDependencies:
			availableDependencies === true
				? (true as const)
				: [...new Set(availableDependencies)],
		port: options.port ?? 4910,
		executionTimeout: options.executionTimeout ?? 5_000,
		auth: options.auth,
		verbose: options.verbose ?? false,
		database: databaseConfig,
		storage: storageConfig,
		cors: options.cors ?? {
			origin: "*",
		},
		importmap: options.importmap ?? { imports: {} },
		plugins: options.plugins ?? {},
		publishValidation: options.publishValidation,
	};
}

export type Config = ReturnType<typeof parseConfig>;
