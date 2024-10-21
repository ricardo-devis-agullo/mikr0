import knex from "knex";
import type { DatabaseOptions } from "../types.js";

export class Database {
	#client: knex.Knex;

	constructor(options: DatabaseOptions) {
		this.#client = knex(options);
	}

	async init() {
		const existsComponents = await this.#client.schema.hasTable("components");
		const existsVersions = await this.#client.schema.hasTable("components");
		if (!existsComponents) {
			await this.#client.schema.createTable("components", (t) => {
				t.increments("id").primary();
				t.string("name", 255);
			});
		}
		if (!existsVersions) {
			await this.#client.schema.createTable("versions", (t) => {
				t.increments("id").primary();
				t.integer("component_id").unsigned().notNullable();
				t.foreign("component_id").references("components.id");
				t.string("version", 255).notNullable();
				t.integer("major").notNullable();
				t.integer("minor").notNullable();
				t.integer("patch").notNullable();
				t.integer("client_size").notNullable();
				t.integer("server_size").notNullable();
				t.text("description");
				t.datetime("published_at").notNullable();
			});
		}
	}

	async insertComponent(data: {
		name: string;
		version: string;
		client_size: number;
		server_size: number;
		published_at: Date;
		description?: string;
	}) {
		this.#client.transaction(async (trx) => {
			let componentId = (
				await trx("components").where("name", data.name).first()
			)?.id;
			if (!componentId) {
				[componentId] = await trx("components").insert({ name: data.name });
			}
			const [major, minor, patch] = data.version.split(".").map(Number);
			if (
				typeof major !== "number" ||
				Number.isNaN(major) ||
				typeof minor !== "number" ||
				Number.isNaN(minor) ||
				typeof patch !== "number" ||
				Number.isNaN(patch)
			) {
				throw new Error("Invalid version");
			}

			await trx("versions").insert({
				component_id: componentId,
				major,
				minor,
				patch,
				version: data.version,
				client_size: data.client_size,
				server_size: data.server_size,
				published_at: data.published_at,
				description: data.description ?? null,
			});
		});
	}

	async versionExists(name: string, version: string) {
		return this.#client("components")
			.join("versions", "components.id", "versions.component_id")
			.where("components.name", name)
			.where("versions.version", version)
			.select("versions.id")
			.first()
			.then((row) => !!row);
	}

	async getComponent(name: string, version: string) {
		return this.#client("components")
			.join("versions", "components.id", "versions.component_id")
			.where("components.name", name)
			.where("versions.version", version)
			.select(
				"versions.client_size",
				"versions.server_size",
				"versions.published_at",
				"versions.description",
			)
			.first()
			.then(
				(row: {
					client_size: number;
					server_size: number;
					published_at: Date;
					description?: string;
				}) => ({
					...row,
					name,
					version,
				}),
			);
	}

	async getComponentVersions(name: string) {
		return this.#client("components")
			.join("versions", "components.id", "versions.component_id")
			.where("components.name", name)
			.select("versions.version")
			.then((rows: Array<{ version: string }>) =>
				rows.map((row) => row.version),
			);
	}

	async getComponents() {
		return this.#client("components")
			.join("versions", "components.id", "versions.component_id")
			.select("components.name", "versions.version")
			.then((rows: Array<{ name: string; version: string }>) => {
				const components: Record<string, string[]> = {};
				for (const row of rows) {
					if (!components[row.name]) {
						components[row.name] = [];
					}
					components[row.name]?.push(row.version);
				}
				return components;
			});
	}

	async getComponentsDetails() {
		return this.#client("components")
			.join("versions", "components.id", "versions.component_id")
			.select(
				"components.name",
				"versions.version",
				"versions.published_at",
				"versions.description",
			)
			.orderBy([
				{
					column: "components.name",
					order: "asc",
				},
				{
					column: "versions.major",
					order: "desc",
				},
				{
					column: "versions.minor",
					order: "desc",
				},
				{
					column: "versions.patch",
					order: "desc",
				},
			])
			.then(
				(
					rows: Array<{
						name: string;
						version: string;
						published_at: Date;
						description: string | null;
					}>,
				) => {
					const components: Record<
						string,
						Record<string, { publishedAt: Date; description?: string }>
					> = {};
					for (const row of rows) {
						if (!components[row.name]) {
							components[row.name] = {};
						}
						// @ts-ignore
						components[row.name][row.version] = {
							publishedAt: row.published_at,
							description: row.description ?? undefined,
						};
					}
					return components;
				},
			);
	}

	async close() {
		await this.#client.destroy();
	}
}
