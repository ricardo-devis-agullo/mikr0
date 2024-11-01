import { type Static, Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import path from "path";
import { readFileSync } from "fs";
import fastifyStatic from "@fastify/static";

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
  // TODO: Find a better way where we don't have to serve
  // individual files from public folder
  fastify.get("/prism-tomorrow.css", async (request, reply) => {
    reply.type("text/css").send(
      readFileSync(
        path.join(import.meta.dirname, "../ui-dist/prism-tomorrow.css"),
        "utf-8",
      ),
    );
  });
  fastify.get("/prism-solarizedlight.css", async (request, reply) => {
    reply.type("text/css").send(
      readFileSync(
        path.join(import.meta.dirname, "../ui-dist/prism-solarizedlight.css"),
        "utf-8",
      ),
    );
  });
  fastify.get("/logo.png", async (request, reply) => {
    reply.type("image/png").send(
      readFileSync(
        path.join(import.meta.dirname, "../ui-dist/logo.png"),
      ),
    );
  });
	fastify.get("*", async (req, reply) => {
		const components = await fastify.database.getComponentsDetails();
		const dataHtml = html.replace(
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
