import { readFileSync } from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";

import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { parseConfig } from "./config.js";
import * as routes from "./routes/index.js";
import { Repository } from "./storage/repository.js";
import type { Options } from "./types.js";

export async function createRegistry(
	opts: Options,
	cb?: (server: FastifyInstance) => void | Promise<void>,
) {
	const server = Fastify({
		logger: opts.verbose,
	}).withTypeProvider<TypeBoxTypeProvider>();
	await server.register(cors, opts.cors);
	const config = parseConfig(opts);
	await config.database.init();
	const html = readFileSync(
		path.join(import.meta.dirname, "/ui-dist/index.html"),
		"utf-8",
	);

	server.register(fastifyMultipart);
	server.decorate("conf", config);
	server.decorate("repository", Repository({ storage: config.storage }));

	server.register(routes.component, { prefix: "/r" });
	server.register(routes.static, { prefix: "/r" });
	server.register(fastifyStatic, {
		root: path.join(import.meta.dirname, "ui-dist"),
		prefix: "/ui/",
	});
	server.get("/ui", async (req, reply) => {
		const components = await server.conf.database.getComponentsDetails();
		const dataHtml = html.replace(
			"<body>",
			`<body>
      <script>
        window.mikr0Data = {
          components: ${JSON.stringify(components)},
          importMap: ${JSON.stringify(server.conf.importmap)}
        }
      </script>`,
		);

		reply.type("text/html").send(dataHtml);
	});

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
		const address = await server.listen({ port: config.port as number });

		console.log(`Server listening at ${address}`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}
