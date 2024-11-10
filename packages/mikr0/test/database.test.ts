import assert from "node:assert";
import test from "node:test";
import { Database } from "../src/database/index.ts";

function setup() {
	const database = new Database({
		client: "sqlite3",
		connection: {
			filename: ":memory:",
		},
	});
	return database;
}

const now = new Date();

test("it gets all versions of a component", async () => {
	const database = setup();
	await database.init();
	await database.insertComponent({
		name: "name",
		version: "1.0.0",
		client_size: 0,
		server_size: 0,
		published_at: now,
	});
	await database.insertComponent({
		name: "name",
		version: "1.0.1",
		client_size: 0,
		server_size: 0,
		published_at: now,
	});
	await database.insertComponent({
		name: "name",
		version: "1.0.2",
		client_size: 0,
		server_size: 0,
		published_at: now,
	});
	const versions = await database.getComponentVersions("name");
	assert.deepStrictEqual(versions, ["1.0.0", "1.0.1", "1.0.2"]);
	await database.close();
});

test("checks if a component exists", async () => {
	const database = setup();
	await database.init();
	await database.insertComponent({
		name: "name",
		version: "1.0.0",
		client_size: 0,
		server_size: 0,
		published_at: now,
	});
	let exists = await database.versionExists("name", "1.0.0");
	assert.strictEqual(exists, true);

	exists = await database.versionExists("name", "1.0.1");
	assert.strictEqual(exists, false);
	await database.close();
});

test("gets no versions if components does not exist", async () => {
	const database = setup();
	await database.init();
	const versions = await database.getComponentVersions("name");
	assert.deepStrictEqual(versions, []);
	await database.close();
});

test("gets the component info", async () => {
	const database = setup();
	await database.init();
	await database.insertComponent({
		name: "name",
		version: "1.0.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
		description: "Hi my description",
	});
	await database.insertComponent({
		name: "name",
		version: "1.1.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
		description: "Hi my description",
	});

	const component = await database.getComponent("name", "1.0.0");

	assert.deepStrictEqual(component, {
		name: "name",
		version: "1.0.0",
		client_size: 10,
		server_size: 20,
		published_at: now.getTime(),
		description: "Hi my description",
	});
	await database.close();
});

test("gets all component names", async () => {
	const database = setup();
	await database.init();
	await database.insertComponent({
		name: "name",
		version: "1.0.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
	});

	const components = await database.getComponents();
	assert.deepStrictEqual(components, { name: ["1.0.0"] });
	await database.close();
});

test("gets all components details", async () => {
	const database = setup();
	await database.init();
	await database.insertComponent({
		name: "aaa",
		version: "1.0.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
		description: "Aaa description",
	});

	await database.insertComponent({
		name: "name",
		version: "1.0.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
		description: "First description",
	});
	await database.insertComponent({
		name: "name",
		version: "1.11.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
		description: "Third description",
	});
	await database.insertComponent({
		name: "name",
		version: "1.100.0",
		client_size: 10,
		server_size: 20,
		published_at: now,
		description: "Second description",
	});

	const components = await database.getComponentsDetails();
	assert.deepStrictEqual(components, {
		aaa: {
			"1.0.0": {
				publishedAt: now.getTime(),
				description: "Aaa description",
			},
		},
		name: {
			"1.0.0": {
				publishedAt: now.getTime(),
				description: "First description",
			},
			"1.100.0": {
				publishedAt: now.getTime(),
				description: "Second description",
			},
			"1.11.0": {
				publishedAt: now.getTime(),
				description: "Third description",
			},
		},
	});
	const names = Object.keys(components);
	assert.deepStrictEqual(names, ["aaa", "name"]);

	const versions = Object.keys(components.name);
	assert.deepStrictEqual(versions, ["1.100.0", "1.11.0", "1.0.0"]);
	await database.close();
});
