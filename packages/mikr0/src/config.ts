import { builtinModules } from "node:module";
import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { Database } from "./database/index.js";
import { StaticStorage } from "./storage/storage.js";
import type {
	DatabaseOptions,
	Options,
	StaticStorageOptions,
} from "./types.js";

const Sqlite3Database = Type.Object({
	client: Type.Literal("sqlite3"),
	connection: Type.Object({
		filename: Type.String(),
	}),
});
const MssqlDatabase = Type.Object({
	client: Type.Literal("mssql"),
	connection: Type.Object({
		host: Type.String(),
		user: Type.String(),
		password: Type.String(),
		database: Type.String(),
		port: Type.Optional(Type.Number()),
		options: Type.Optional(
			Type.Object({ encrypt: Type.Optional(Type.Boolean()) }),
		),
	}),
});
const DatabaseOpts = Type.Union([Sqlite3Database, MssqlDatabase]);

const MemoryStorage = Type.Object({
	type: Type.Literal("memory"),
});
const FilesystemStorage = Type.Object({
	type: Type.Literal("filesystem"),
	options: Type.Object({
		folder: Type.String(),
	}),
});
const AzureStorage = Type.Object({
	type: Type.Literal("azure"),
	options: Type.Object({
		publicContainerName: Type.String(),
		privateContainerName: Type.String(),
		accountName: Type.String(),
		accountKey: Type.Optional(Type.String()),
	}),
});

const BaseS3Options = Type.Object({
	componentsDir: Type.String(),
	path: Type.String(),
	verbosity: Type.Optional(Type.Boolean()),
	refreshInterval: Type.Optional(Type.Number()),
	bucket: Type.String(),
	region: Type.String(),
	sslEnabled: Type.Optional(Type.Boolean()),
	s3ForcePathStyle: Type.Optional(Type.Boolean()),
	timeout: Type.Optional(Type.Number()),
	agentProxy: Type.Optional(Type.Union([Type.Any(), Type.Any()])),
	endpoint: Type.Optional(Type.String()),
	debug: Type.Optional(Type.Boolean()),
});
const S3Storage = Type.Object({
	type: Type.Literal("s3"),
	options: Type.Union([
		BaseS3Options,
		Type.Intersect([
			BaseS3Options,
			Type.Object({
				key: Type.String(),
				secret: Type.String(),
			}),
		]),
	]),
});

const StaticStorageOpts = Type.Union([
	FilesystemStorage,
	MemoryStorage,
	AzureStorage,
	S3Storage,
]);

export const OptionsSchema = Type.Object({
	port: Type.Optional(Type.Union([Type.String(), Type.Number()])),
	storage: Type.Optional(StaticStorageOpts),
	database: Type.Optional(DatabaseOpts),
	auth: Type.Object({
		username: Type.String(),
		password: Type.String(),
	}),
	importmap: Type.Optional(
		Type.Object({
			imports: Type.Record(Type.String(), Type.String()),
		}),
	),
	availableDependencies: Type.Optional(Type.Array(Type.String())),
	cors: Type.Optional(Type.Record(Type.String(), Type.String())),
	plugins: Type.Optional(
		Type.Record(
			Type.String(),
			Type.Object({
				description: Type.Optional(Type.String()),
				handler: Type.Any(),
			}),
		),
	),
	executionTimeout: Type.Optional(Type.Number()),
	verbose: Type.Optional(Type.Boolean()),
});
type OptionsSchema = Static<typeof OptionsSchema>;

type AssertEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <
	V,
>() => V extends U ? 1 : 2
	? true
	: false;
type Assert<T extends true> = T;

type AssertOptionsAreEqual = Assert<
	// Omitting cors because I don't want to create a type for every possible option from the fastify cors library
	// Omitting plugins because TypeBox doesnt support yet variadic any types on functions
	// https://github.com/sinclairzx81/typebox/issues/931
	AssertEqual<
		Omit<Options, "plugins" | "cors" | "availableDependencies" | "storage">,
		Omit<
			OptionsSchema,
			"plugins" | "cors" | "availableDependencies" | "storage"
		>
	>
>;
type AssertPlugins = Assert<
	AssertEqual<
		Omit<Exclude<Options["plugins"], undefined>[string], "handler">,
		Omit<Exclude<OptionsSchema["plugins"], undefined>[string], "handler">
	>
>;

export function parseConfig(options: Options) {
	Value.Assert(OptionsSchema, options);

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
	for (const dependency of options.availableDependencies ?? []) {
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
