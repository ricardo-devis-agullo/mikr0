import assert from "node:assert";
import test from "node:test";
import { parseConfig } from "../src/config.ts";

test("will parse config", () => {
	const result = parseConfig(
		{
			port: 4910,
			executionTimeout: 5000,
			auth: {
				username: "admin",
				password: "password",
			},
			verbose: false,
			database: {
				client: "sqlite3",
				connection: {
					filename: ".mikr0/db.sqlite",
				},
			},
			storage: {
				type: "filesystem",
				options: {
					folder: ".mikr0/components",
				},
			},
			cors: {
				origin: "*",
			},
			dependencies: [],
			importmap: {
				imports: {},
			},
			plugins: {},
		},
		{
			name: "mikr0",
			version: "1.0.0",
			dependencies: { foo: "2.2.2" },
		},
	);

	assert(result.port === 4910);
	assert(result.executionTimeout === 5000);
	assert(result.auth.username, "admin");
	assert(result.auth.password, "password");
	assert(result.verbose === false);
	assert(result.database.client === "sqlite3");
	assert(result.database.connection.filename === ".mikr0/db.sqlite");
	assert(result.storage.type === "filesystem");
	assert(result.storage.options.folder === ".mikr0/components");
	assert(result.cors.origin === "*");
	assert(result.importmap.imports);
	assert(result.plugins);
	assert(result.availableDependencies);
});

test("will throw error if dependency not found", () => {
	assert.throws(
		() => {
			parseConfig(
				{
					auth: {
						username: "admin",
						password: "password",
					},
					verbose: false,
					dependencies: ["foo"],
				},
				{
					name: "mikr0",
					version: "1.0.0",
					dependencies: {},
				},
			);
		},
		{
			message:
				'Dependency "foo" not found in package.json dependencies or devDependencies',
		},
	);
});

test("will not throw error if dependency is found in devDependencies", () => {
	assert.doesNotThrow(
		() => {
			parseConfig(
				{
					auth: {
						username: "admin",
						password: "password",
					},
					dependencies: ["foo"],
				},
				{
					name: "mikr0",
					version: "1.0.0",
					dependencies: { foo: "2.2.2" },
				},
			);
		},
		{
			message:
				'Dependency "foo" not found in package.json dependencies or devDependencies',
		},
	);
});

test("will allow any node built-in module as a dependency", () => {
	const config = parseConfig(
		{
			auth: {
				username: "admin",
				password: "password",
			},
			dependencies: ["fs"],
		},
		{
			name: "mikr0",
			version: "1.0.0",
			dependencies: {},
		},
	);
	assert(config.availableDependencies.includes("node:fs"));
});
