import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import FastifyExpress from "@fastify/express";
import Fastify from "fastify";
import { createServer } from "vite";
import esbuild from "esbuild";
import { createRegistry } from "../Registry.js";
import { MemoryStorage } from "../storage/memory.js";
import { ocClientPlugin } from "./plugins.js";

const port = Number(process.env.PORT) || 5173;
const base = process.env.BASE || "/";

async function getPkgInfo() {
	const pkg = JSON.parse(
		await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8"),
	);

	return { name: String(pkg.name), version: String(pkg.version) };
}

const tmpEntryPoint = path.join(process.cwd(), "src/_entry.tsx");
let tmpServer = "";
const entryPoint = path.join(process.cwd(), "src/index.tsx");

async function cleanup() {
	await fs.rm(tmpEntryPoint).catch(() => {});
	if (tmpServer) {
		await fs.rm(tmpServer, { recursive: true }).catch(() => {});
	}
	process.exit(1);
}

async function getServerParts(entry: string) {
	tmpServer = await fs.mkdtemp(path.join(os.tmpdir(), "mikr0-"));
	await esbuild.build({
		bundle: true,
		minify: false,
		entryPoints: ["src/index.tsx"],
		outfile: path.join(tmpServer, "server.js"),
		format: "esm",
		plugins: [
			{
				name: "ignore-media",
				setup(build) {
					build.onResolve(
						{ filter: /.*\.(svg|css|jpg|png|gif|jpeg)$/ },
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
		default: { loader, plugins },
	} = await import(path.join(tmpServer, "server.js"));

	return { loader, plugins };
}

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

export async function runServer() {
	const { loader, plugins } = await getServerParts(entryPoint);
	const { name, version } = await getPkgInfo();
	const data = await loader({
		parameters: {},
		plugins,
	});
	await fs.writeFile(
		tmpEntryPoint,
		`import component from './index.tsx';
     component.render(document.getElementById('app'), ${JSON.stringify(data)});`,
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

	const app = Fastify({ logger: false });

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
    </head>
    <body>
      ${body}
    </body>
  </html>
    `;

	app.get("*", async (request, reply) => {
		try {
			const url = request.originalUrl.replace(base, "");

			const template = await vite.transformIndexHtml(
				url,
				baseTemplate(`
        <div id="app"></div>
        <script type="module" src="/src/_entry.tsx"></script>
          `),
			);

			reply.code(200).type("text/html").send(template);
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
               import component from '/src/index.tsx';
               export default component;
             </script>`,
					);
					template = `
          export default {
            render: (element, data) => {
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
