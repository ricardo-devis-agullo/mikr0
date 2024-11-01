import { readFileSync } from "node:fs";
import path from "node:path";
import fastifyBasicAuth from "@fastify/basic-auth";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import Fastify, { type FastifyInstance } from "fastify";

import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { type Config, parseConfig } from "./config.js";
import { Database } from "./database/index.js";
import * as routes from "./routes/index.js";
import { Repository } from "./storage/repository.js";
import { StaticStorage } from "./storage/storage.js";
import type { Options, PackageJson } from "./types.js";

export async function createServer({
	config,
}: {
	config: Config;
}) {
	const server = Fastify({
		logger: config.verbose,
	}).withTypeProvider<TypeBoxTypeProvider>();
	const database = new Database(config.database);
	await database.init();

	await server.register(cors, config.cors);

	const html = readFileSync(
		path.join(import.meta.dirname, "/ui-dist/index.html"),
		"utf-8",
	);

	server.register(fastifyMultipart);
	server.register(fastifyBasicAuth, {
		validate(username, password, _req, _reply, done) {
			if (
				username === config.auth.username &&
				password === config.auth.password
			) {
				done();
			} else {
				done(new Error("Not authenticated"));
			}
		},
		authenticate: { realm: "Mikr0" },
	});

	server.decorate("conf", config);
	server.decorate("database", database);
	server.decorate(
		"repository",
		Repository({ storage: StaticStorage(config.storage) }),
	);

	server.register(routes.component, { prefix: "/r" });
	server.register(routes.static, { prefix: "/r" });
	server.register(routes.ui, { prefix: "/ui" });

	return server;
}

export async function createRegistry(
	opts: Options,
	cb?: (server: FastifyInstance) => void | Promise<void>,
) {
	const pkg: PackageJson = JSON.parse(
		readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
	);
	const config = parseConfig(opts, pkg);
	const server = await createServer({ config });

	try {
		await cb?.(server);
		if (
			!server.hasRoute({
				url: "/",
				method: "GET",
			})
		) {
			server.get("/", async (req, reply) => {
				reply.redirect("/ui", 302);
			});
		}
		const address = await server.listen({
			port: config.port as number,
			host: "0.0.0.0",
		});

		console.log(`Server listening at ${address}`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}
