import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { type Static, Type } from "@sinclair/typebox";
import AdmZip from "adm-zip";
import type { FastifyInstance, FastifyReply } from "fastify";
import superjson from "superjson";
import { parseParameters } from "../parameters.js";
import makeServerData from "../server.js";
import { getMimeType } from "../storage/utils.js";
import type { PublishedPackageJson } from "../types.js";
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

function serializeError(error: Error) {
	return {
		...error, // includes any custom properties on the error
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
}

function isPromise(x: unknown): x is Promise<unknown> {
	return typeof (x as Promise<unknown>).then === "function";
}

function streamData(
	reply: FastifyReply,
	meta: { src: string; version: string; component: string },
	data: Record<string, unknown | Promise<unknown>>,
) {
	// Separate immediate properties and promises
	const immediateData: Record<string, unknown> = {};
	const promiseKeys = new Set();
	const promises: Array<Promise<{ key: string; value: unknown }>> = [];

	for (const [key, value] of Object.entries(data)) {
		if (isPromise(value)) {
			promiseKeys.add(key);
			promises.push(
				value
					.then((resolvedValue) => {
						return { key, value: resolvedValue };
					})
					.catch((error) => {
						throw { key, value: error };
					}),
			);
		} else {
			immediateData[key] = value;
		}
	}

	// Set the headers and send the initial data structure
	reply.raw.writeHead(200, { "Content-Type": "text/x-defer" });
	reply.raw.write(
		`I:X: ${JSON.stringify({
			...meta,
			data: immediateData,
			promises: [...promiseKeys],
		})}\n`,
	);

	// Stream each promise as it resolves
	for (const promise of promises) {
		promise
			.then(({ key, value }) => {
				reply.raw.write(`P:${key}: ${JSON.stringify(value)}\n`);
				promiseKeys.delete(key);
				if (promiseKeys.size === 0) {
					reply.raw.end();
				}
			})
			.catch(({ key, error }) => {
				const serializedError = JSON.stringify(
					error instanceof Error ? serializeError(error) : error,
				);
				const indicator = error instanceof Error ? "E" : "U";

				reply.raw.write(`${indicator}:${key}: ${serializedError}\n`);
				promiseKeys.delete(key);
				if (promiseKeys.size === 0) {
					reply.raw.end();
				}
			});
	}

	return reply;
}

export default async function routes(fastify: FastifyInstance) {
	const getServerData = makeServerData({
		timeout: fastify.conf.executionTimeout,
		repository: fastify.repository,
		dependencies: fastify.conf.availableDependencies,
	});

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
					await fastify.database.versionExists(name, version),
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
					const publishDate = new Date();

					if (!pkg || !zipFile) {
						reply.code(400).send("Missing package.json or zip file");
						return;
					}

					const pkgJson: PublishedPackageJson = JSON.parse(
						await readFile(pkg.filepath, "utf-8"),
					);
					if (fastify.conf.publishValidation) {
						const validation = fastify.conf.publishValidation?.(pkgJson);
						if (
							(typeof validation === "object" && !validation.isValid) ||
							!validation
						) {
							reply
								.code(400)
								.send(
									typeof validation === "boolean"
										? "Did not pass publish validation"
										: validation.error,
								);
							return;
						}
					}

					pkgJson.mikr0.publishDate = publishDate.toISOString();
					await writeFile(
						`./uploads/${id}/package.json`,
						JSON.stringify(pkgJson, null, 2),
					);
					const zip = new AdmZip(zipFile.filepath);
					const extract = promisify(zip.extractAllToAsync).bind(zip);
					await extract(`./uploads/${id}`, true, true);

					await fastify.repository.saveComponent(`./uploads/${id}`);
					await fastify.database.insertComponent({
						name,
						version,
						client_size: pkgJson.mikr0.clientSize ?? null,
						server_size: pkgJson.mikr0.serverSize ?? null,
						published_at: new Date(),
						serialized: pkgJson.mikr0.serialized,
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
				response: {
					200: Type.Object({
						src: Type.String(),
						data: Type.Any(),
						component: Type.String(),
						version: Type.String(),
					}),
					400: Type.String(),
				},
			},
		},
		async function getComponent(request, reply) {
			const { name, version: versionRequested } = request.params;
			const versions = await fastify.database.getComponentVersions(name);
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
			// TODO: Add support for parameters in the database
			const parsedParameters = pkg.mikr0.parameters
				? parseParameters(pkg.mikr0.parameters, request.query)
				: {};
			let data:
				| { deferred: boolean; data: Record<string, unknown> }
				| undefined = undefined;
			const plugins = Object.fromEntries(
				Object.entries(fastify.conf.plugins).map(([name, plugin]) => [
					name,
					plugin.handler,
				]),
			);
			if (pkg.mikr0.serverSize) {
				data = await getServerData({
					name,
					version,
					parameters: parsedParameters,
					plugins,
					headers: request.headers,
				});
			}

			const templateUrl = fastify.repository.getTemplateUrl(name, version);
			const isLocal = templateUrl.protocol === "file:";

			const meta = {
				src: isLocal
					? `${request.protocol}://${request.host}/r/template/${name}/${version}/entry.js`
					: templateUrl.href,
				component: name,
				version,
			};

			if (data?.deferred) {
				streamData(reply, meta, data.data);
				return;
			}

			return {
				...meta,
				data: pkg.mikr0.serialized ? superjson.stringify(data) : data,
			};
		},
	);

	fastify.withTypeProvider<TypeBoxTypeProvider>().post(
		"/action/:name/:version?",
		{
			schema: {
				params: ComponentRequest,
				body: Type.Object({
					action: Type.String(),
					parameters: Type.Any(),
				}),
				response: {
					200: {},
					400: {
						type: "string",
					},
				},
			},
		},
		async function getComponentAction(request, reply) {
			const { name, version: versionRequested } = request.params;
			const versions = await fastify.database.getComponentVersions(name);
			if (!versions.length) {
				reply.code(400).send("Component not found");
				return;
			}
			const version = getAvailableVersion(versions, versionRequested);
			if (!version) {
				reply.code(400).send("Version not found");
				return;
			}
			const component = await fastify.database.getComponent(name, version);
			const parameters = component.serialized
				? superjson.parse(request.body.parameters)
				: request.body.parameters;

			let data: unknown = undefined;
			const plugins = Object.fromEntries(
				Object.entries(fastify.conf.plugins).map(([name, plugin]) => [
					name,
					plugin.handler,
				]),
			);
			data = await getServerData({
				name,
				version,
				action: request.body.action,
				parameters,
				plugins,
				headers: request.headers,
			});

			return {
				data: component.serialized ? superjson.stringify(data) : data,
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
			// TODO: Improve by streaming the file
			const file = await fastify.repository.getFile(name, version, filePath);
			const mime = getMimeType(filePath);

			reply.type(mime ?? "application/javascript").send(file);
		},
	);
}
