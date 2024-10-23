import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { type Static, Type } from "@sinclair/typebox";
import AdmZip from "adm-zip";
import type { FastifyInstance } from "fastify";
import superjson from "superjson";
import { parseParameters } from "../parameters.js";
import makeServerData from "../server.js";
import { getAvailableVersion } from "./versions.js";

export const Component = Type.Object({
	name: Type.String(),
	version: Type.String({ pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" }),
});
export type Component = Static<typeof Component>;

const ComponentRequest = Type.Object({
	name: Type.String(),
	version: Type.Optional(
		Type.String({ pattern: "^(?:\\d+|x)(?:\\.(?:\\d+|x)){0,2}$" }),
	),
});
type ComponentRequest = Static<typeof ComponentRequest>;

export default async function routes(fastify: FastifyInstance) {
	fastify.after(() => {
		fastify.withTypeProvider<TypeBoxTypeProvider>().post(
			"/publish/:name/:version",
			{
				onRequest: fastify.basicAuth,
				schema: {
					params: Component,
					response: {
						200: {
							type: "string",
						},
					},
				},
			},
			async function publishComponent(request, reply) {
				const { name, version } = request.params;
				const exists = Boolean(
					await fastify.conf.database.versionExists(name, version),
				);
				if (exists) {
					reply.code(400).send("Version already exists");
					return;
				}
				const id = crypto.randomUUID();

				await mkdir(`./uploads/${id}`, { recursive: true });
				try {
					const files = await request.saveRequestFiles();
					const [zipFile, pkg] = files;
					if (pkg) {
						const pkgJson = JSON.parse(await readFile(pkg.filepath, "utf-8"));
						pkgJson.mikr0.publishDate = Date.now();
						await writeFile(
							`./uploads/${id}/package.json`,
							JSON.stringify(pkgJson, null, 2),
						);
					}
					if (zipFile) {
						const zip = new AdmZip(zipFile.filepath);
						const extract = promisify(zip.extractAllToAsync).bind(zip);
						await extract(`./uploads/${id}`, true, true);
					} else {
						reply.code(400).send("Missing zip");
						return;
					}

					await fastify.repository.saveComponent(`./uploads/${id}`);
					await fastify.conf.database.insertComponent({
						name,
						version,
						client_size: 0,
						server_size: 0,
						published_at: new Date(),
					});
					reply.code(200).send("OK");
				} finally {
					rm(`./uploads/${id}`, { recursive: true }).catch(() => {});
				}
			},
		);
	});

	fastify.withTypeProvider<TypeBoxTypeProvider>().get(
		"/component/:name/:version?",
		{
			schema: {
				params: ComponentRequest,
				querystring: Type.Record(Type.String(), Type.Unknown()),
			},
		},
		async function getComponent(request, reply) {
			const getServerData = makeServerData({
				repository: fastify.repository,
				dependencies: fastify.conf.availableDependencies,
			});
			const { name, version: versionRequested } = request.params;
			const versions = await fastify.conf.database.getComponentVersions(name);
			if (!versions.length) {
				reply.code(400).send("Component not found");
				return;
			}
			const version = getAvailableVersion(versions, versionRequested);
			if (!version) {
				reply.code(400).send("Version not found");
				return;
			}

			const pkg = await fastify.repository.getPackageJson(name, version);
			const parsedParameters = parseParameters(
				pkg.mikr0.parameters,
				request.query,
			);
			let data: unknown = undefined;
			const plugins = Object.fromEntries(
				Object.entries(fastify.conf.plugins).map(([name, plugin]) => [
					name,
					plugin.handler,
				]),
			);
			if (pkg.mikr0.server) {
				data = await getServerData({
					name,
					version,
					parameters: parsedParameters,
					plugins,
					request,
				});
			}

			return {
				src: `${request.protocol}://${request.host}/r/template/${name}/${version}/entry.js`,
				data: superjson.stringify(data),
			};
		},
	);

	fastify.withTypeProvider<TypeBoxTypeProvider>().get(
		"/template/:name/:version/entry.js",
		{
			schema: {
				params: Component,
				response: {
					200: {
						type: "string",
					},
				},
			},
		},
		async function getTemplate(request, reply) {
			const { name, version } = request.params;
			const template = await fastify.repository.getTemplate(name, version);

			reply.type("application/javascript").send(template);
		},
	);
	fastify.withTypeProvider<TypeBoxTypeProvider>().get(
		"/template/:name/:version/*",
		{
			schema: {
				params: Component,
				response: {
					200: {
						type: "string",
					},
				},
			},
		},
		async function getTemplate(request, reply) {
			const { name, version } = request.params;
			const filePath = request.url.replace(
				`/r/template/${name}/${version}/`,
				"",
			);
			const file = await (await import("node:fs")).readFileSync(
				(await import("node:path")).join(
					process.cwd(),
					`components/${name}/${version}`,
					filePath,
				),
				"utf-8",
			);

			reply.type("application/javascript").send(file);
		},
	);
}
