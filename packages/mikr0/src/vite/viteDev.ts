import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import FastifyExpress from "@fastify/express";
import esbuild from "esbuild";
import type Fastify from "fastify";
import { createServer } from "vite";
import { createRegistry } from "../Registry.js";
import { getEntryPoint } from "./build.js";

const require = createRequire(process.cwd());

const port = Number(process.env.PORT) || 5173;
const base = process.env.BASE || "/";
let appInstance: Fastify.FastifyInstance | undefined = undefined;
async function getPkgInfo() {
	const pkg = JSON.parse(
		await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8"),
	);

	return { name: String(pkg.name), version: String(pkg.version) };
}

let tmpServer = "";
const { relative: entryPoint, filename: entryName } = getEntryPoint();

async function cleanup(code = 0) {
	if (appInstance) {
		await appInstance.close().catch(() => {});
	}
	if (tmpServer) {
		await fs.rm(tmpServer, { recursive: true }).catch(() => {});
	}
	process.exit(code);
}

async function getServer(entry: string) {
	tmpServer = await fs.mkdtemp(
		path.join(await fs.realpath(os.tmpdir()), "mikr0-"),
	);
	await esbuild.build({
		bundle: true,
		minify: false,
		platform: "node",
		entryPoints: [entry],
		outfile: path.join(tmpServer, "server.cjs"),
		format: "cjs",
		plugins: [
			{
				name: "ignore-media",
				setup(build) {
					build.onResolve(
						{ filter: /.*\.(svg|css|jpg|png|gif|vue|svelte|jpeg)$/ },
						(args) => ({
							path: args.path,
							namespace: "media-filtered",
						}),
					);

					build.onLoad({ filter: /.*/, namespace: "media-filtered" }, () => ({
						contents: "",
					}));
				},
			},
		],
	});
	const server = await fs.readFile(path.join(tmpServer, "server.cjs"), "utf-8");
	const {
		default: { actions, loader, plugins, parameters },
	} = require(path.join(tmpServer, "server.cjs"));
	return { server, actions, loader, plugins, parameters };
}

export async function runServer() {
	function getBaseTemplate(
		name: string,
		version: string,
		parameters: Record<string, any>,
	) {
		const baseTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta name="robots" content="index, follow" />
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
    };
    </style>
  </head>
  <body>
    <script src="/r/client.js"></script>
    <mikro-component src="http://localhost:${port}/r/component/${name}/${version}?${new URLSearchParams(parameters).toString()}"></mikro-component>
  </body>
</html>`;
		return baseTemplate;
	}

	const {
		server,
		plugins,
		parameters: parametersSchema,
	} = await getServer(entryPoint);
	const vite = await createServer({
		server: { middlewareMode: true },
		appType: "custom",
		base,
	});
	const { name, version } = await getPkgInfo();

	createRegistry(
		{
			port,
			database: {
				client: "sqlite3",
				connection: {
					filename: ":memory:",
				},
			},
			plugins: Object.fromEntries(
				Object.entries(plugins ?? {}).map(([k, handler]) => [
					k,
					{ handler: handler as any },
				]),
			),
			dependencies: true,
			storage: {
				type: "memory",
			},
			verbose: false,
			auth: {
				username: "admin",
				password: "admin",
			},
		},
		async (app) => {
			appInstance = app;
			await app.register(FastifyExpress);
			app.use(vite.middlewares);

			const onHandler = async (request: any, reply: any) => {
				try {
					let url = request.originalUrl.replace(base, "");
					if (!url) url = "/";

					let template = await vite.transformIndexHtml(
						url,
						`<script type="module">
               import component from '/${entryPoint}';
                component.mount(
                  window._mikroElement,
                  window._mikroData,
                  {
                    baseUrl: 'http://localhost:${port}',
                    name: '${name}',
                    version: '${version}'
                  }
                );
             </script>`,
					);
					template = `
          export default {
            mount: (element, data) => {
              window._mikroElement = element;
              window._mikroData = data;
              element.innerHTML = \`
                ${template}
              \`
        }}
          `;
					await app.storage.saveFile(
						`${name}/${version}/template.js`,
						template,
					);
					await app.storage.saveFile(`${name}/${version}/server.cjs`, server);
					await app.storage.saveFile(
						`${name}/${version}/package.json`,
						JSON.stringify({
							name,
							version,
							mikr0: { parameters: parametersSchema, serverSize: 1 },
						}),
					);
					await app.database.insertComponent({
						name,
						version,
						client_size: 1,
						server_size: 1,
						published_at: new Date(),
					});

					reply
						.code(200)
						.type("text/html")
						.send(
							getBaseTemplate(
								name,
								version,
								(request.query as Record<string, unknown>) ?? {},
							),
						);
				} catch (e) {
					if (!(e instanceof Error)) {
						reply.code(500).send(String(e));
						return;
					}
					vite?.ssrFixStacktrace(e);
					console.log(e.stack);
					reply.code(500).send(e.stack);
				}
			};

			app.get("/", onHandler);
			app.get("*", onHandler);
		},
	);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", async (error) => {
	console.error(error);
	await cleanup(1);
});
