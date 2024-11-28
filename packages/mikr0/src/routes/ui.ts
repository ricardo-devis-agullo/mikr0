import { readFileSync } from "node:fs";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import { type Static, Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";

export const Component = Type.Object({
	name: Type.String(),
	version: Type.String(),
});
export type Component = Static<typeof Component>;

const html = readFileSync(
  path.join(import.meta.dirname, "../ui-dist/index.html"),
  "utf-8",
);

export default async function routes(fastify: FastifyInstance) {
	fastify.register(fastifyStatic, {
		root: path.join(import.meta.dirname, "../ui-dist/assets"),
		prefix: "/assets/",
	});
	fastify.get("/logo.png", async (request, reply) => {
		reply
			.type("image/png")
			.send(
				readFileSync(path.join(import.meta.dirname, "../ui-dist/logo.png")),
			);
	});
	fastify.get("*", async (req, reply) => {
		const components = await fastify.database.getComponentsDetails();
		let dataHtml = html.replace(
			"<head>",
			`<head>
      <script type="importmap">
        ${JSON.stringify(fastify.conf.importmap)}
      </script>`,
		);
		dataHtml = dataHtml.replace(
			"<body>",
			`<body>
      <script>
        window.mikr0Data = {
          components: ${JSON.stringify(components)},
          importMap: ${JSON.stringify(fastify.conf.importmap)}
        }
      </script>`,
		);

		reply.type("text/html").send(dataHtml);
	});
}
