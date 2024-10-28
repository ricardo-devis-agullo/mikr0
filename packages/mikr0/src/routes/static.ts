import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { type Static, Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import { compileClient } from "../client/compile-client.js";

export const Component = Type.Object({
	name: Type.String(),
	version: Type.String(),
});
export type Component = Static<typeof Component>;

const { code: client, minified: clientMin } = compileClient();

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
