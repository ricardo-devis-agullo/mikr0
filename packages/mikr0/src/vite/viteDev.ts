import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import FastifyExpress from "@fastify/express";
import esbuild from "esbuild";
import Fastify from "fastify";
import { createServer } from "vite";
import { createRegistry } from "../Registry.js";
import { compileClient } from "../client/compile-client.js";
import { parseParameters } from "../parameters.js";
import { MemoryStorage } from "../storage/memory.js";
import { getEntryPoint } from "./build.js";
import { ocClientPlugin } from "./plugins.js";

const port = Number(process.env.PORT) || 5173;
const base = process.env.BASE || "/";
let app: Fastify.FastifyInstance | undefined = undefined;
async function getPkgInfo() {
	const pkg = JSON.parse(
		await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8"),
	);

	return { name: String(pkg.name), version: String(pkg.version) };
}

const tmpEntryPoint = path.join(process.cwd(), "src/_entry.tsx");
let tmpServer = "";
const { relative: entryPoint, filename: entryName } = getEntryPoint();

async function cleanup() {
	if (app) {
		await app.close().catch(() => {});
	}
	await fs.rm(tmpEntryPoint).catch(() => {});
	if (tmpServer) {
		await fs.rm(tmpServer, { recursive: true }).catch(() => {});
	}
}

async function getServerParts(entry: string) {
	tmpServer = await fs.mkdtemp(
		path.join(await fs.realpath(os.tmpdir()), "mikr0-"),
	);
	await esbuild.build({
		bundle: true,
		minify: false,
		platform: "node",
		entryPoints: [entry],
		outfile: path.join(tmpServer, "server.js"),
		format: "esm",
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
	const {
		default: { actions, loader, plugins, parameters },
	} = await import(path.join(tmpServer, "server.js"));
	return { actions, loader, plugins, parameters };
}

export async function runServer() {
	const {
		actions,
		loader,
		plugins,
		parameters: parametersSchema,
	} = await getServerParts(entryPoint);
	const { name, version } = await getPkgInfo();
	const meta = { name, version, baseUrl: "/" };
	const { code: client } = compileClient();
	await fs.writeFile(
		tmpEntryPoint,
		`import component from './${entryName}';

      component.mount(document.getElementById('app'), window.__MIKR0_DATA__.data, {
        name: "${name}",
        version: "${version}",
        baseUrl: window.location.origin
      });`,
		"utf-8",
	);
	const vite = await createServer({
		server: { middlewareMode: true },
		mode: "development",
		logLevel: "silent",
		appType: "custom",
		base,
		plugins: [ocClientPlugin({ entry: entryPoint })],
	});

	app = Fastify({ logger: false });
	app.addHook("onClose", cleanup);

	await app.register(FastifyExpress);
	app.use(vite.middlewares);

	const baseTemplate = (body: string) => `
  <!DOCTYPE html>
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
      <script src="/r/client.js"></script>
    </head>
    <body>
      ${body}
    `;
	app.get("/r/client.js", (request, reply) => {
		reply.type("application/javascript").send(client);
	});
	app.post("/r/action/:name/:version", async (request, reply) => {
		const body: any = request.body;
		const action = actions[body.action];
		const parameters = body.parameters;
		const data = await action(parameters);
		return data;
	});
	app.get("*", async (request, reply) => {
		const readableStream = new Readable();
		readableStream._read = () => {};
		reply.header("content-type", "text/html; charset=utf-8");
		reply.header("transfer-encoding", "chunked");
		reply.send(readableStream);

		try {
			const url = request.originalUrl.replace(base, "");
			let data: any = {};
			const isHtmlRequest = !url || url.startsWith("?");
			if (isHtmlRequest) {
				const parameters = parseParameters(
					parametersSchema,
					(request.query as Record<string, unknown>) ?? {},
					true,
				);
				data = await loader({
					headers: request.headers ?? {},
					parameters,
					plugins,
				});
			}
			const template = await vite.transformIndexHtml(
				url,
				baseTemplate(`
        <div id="app"></div>
        <script>
        window.__MIKR0_DATA__ = {};
        window.__MIKR0_DATA__.data = ${JSON.stringify(data.data)};
        </script>
        <script type="module" async src="/src/_entry.tsx"></script>
          `),
			);

			readableStream.push(template);

		} catch (e) {
			if (!(e instanceof Error)) {
				reply.code(500).send(String(e));
				return;
			}
			vite?.ssrFixStacktrace(e);
			console.log(e.stack);
			reply.code(500).send(e.stack);
		}
	});
	app.listen({ port }, () => {
		console.log(`Server started at http://localhost:${port}`);
	});
}
export async function runIdealServer() {
	function getBaseTemplate(name: string, version: string, appBlock: string) {
		const baseTemplate = `
<!DOCTYPE html>
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
    <script src="/registry/client.js"></script>
    <mikro-component src="/registry/component/${name}/${version}?param"></mikro-component>
  </body>
</html>
  `;
		return baseTemplate;
	}

	const { createServer } = await import("vite");
	const vite = await createServer({
		server: { middlewareMode: true },
		appType: "custom",
		base,
	});
	const { name, version } = await getPkgInfo();

	const memoryStorage = MemoryStorage();
	createRegistry(
		{
			port,
			database: {
				client: "sqlite3",
				connection: {
					filename: ":memory:",
				},
			},
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
			await app.register(FastifyExpress);
			app.use(vite.middlewares);

			app.get("*", async (request, reply) => {
				try {
					const url = request.originalUrl.replace(base, "");
					let template = await vite.transformIndexHtml(
						url,
						`<script type="module">
               import component from '${entryPoint}';
               export default component;
             </script>`,
					);
					template = `
          export default {
            mount: (element, data) => {
              element.innerHTML = \`
                ${template}
              \`
        }}
          `;
					await memoryStorage.saveFile(
						`${name}/${version}/template.js`,
						template,
					);
					await memoryStorage.saveFile(
						`${name}/${version}/package.json`,
						JSON.stringify({
							name,
							version,
							mikr0: { parameters: {} },
						}),
					);

					reply
						.code(200)
						.type("text/html")
						.send(getBaseTemplate(name, version, ""));
				} catch (e) {
					if (!(e instanceof Error)) {
						reply.code(500).send(String(e));
						return;
					}
					vite?.ssrFixStacktrace(e);
					console.log(e.stack);
					reply.code(500).send(e.stack);
				}
			});

			app.listen({ port }, () => {
				console.log(`Server started at http://localhost:${port}`);
			});
		},
	);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", async (error) => {
	await cleanup();
	console.error(error);
	process.exit(1);
});
