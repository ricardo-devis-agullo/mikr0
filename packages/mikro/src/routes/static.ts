import path from "node:path";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { type Static, Type } from "@sinclair/typebox";
import { buildSync } from "esbuild";
import type { FastifyInstance } from "fastify";

export const Component = Type.Object({
	name: Type.String(),
	version: Type.String(),
});
export type Component = Static<typeof Component>;

const {
	outputFiles: [clientMinOutput],
} = buildSync({
	bundle: true,
	minify: true,
	write: false,
	target: ["chrome80", "firefox80", "safari12"],
	entryPoints: [path.join(import.meta.dirname, "../client.js")],
	format: "iife",
});
const {
	outputFiles: [clientOutput],
} = buildSync({
	bundle: true,
	minify: false,
	write: false,
	target: ["chrome80", "firefox80", "safari12"],
	entryPoints: [path.join(import.meta.dirname, "../client.js")],
	format: "iife",
});
const clientMin = clientMinOutput?.text;
const client = clientOutput?.text;
if (!clientMin || !client) {
	throw new Error("Missing client");
}

export default async function routes(fastify: FastifyInstance) {
	fastify.withTypeProvider<TypeBoxTypeProvider>().get(
		"/client.min.js",
		{
			schema: {
				response: {
					200: {
						type: "string",
					},
				},
			},
		},
		(req, reply) => {
			reply.type("application/javascript").send(clientMin);
		},
	);
	fastify.withTypeProvider<TypeBoxTypeProvider>().get(
		"/client.js",
		{
			schema: {
				response: {
					200: {
						type: "string",
					},
				},
			},
		},
		(req, reply) => {
			reply.type("application/javascript").send(client);
		},
	);
	fastify.withTypeProvider<TypeBoxTypeProvider>().get(
		"/imports.importmap",
		{
			schema: {
				response: {
					200: {
						type: "string",
					},
				},
			},
		},
		(req, reply) => {
			reply
				.type("application/importmap+json")
				.send(JSON.stringify(fastify.conf.importmap));
		},
	);
}
