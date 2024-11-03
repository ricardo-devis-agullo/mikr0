import type { Config } from "./config.js";
import type { Database } from "./database/index.js";
import type { Repository } from "./storage/repository.js";

declare module "fastify" {
	interface FastifyInstance {
		conf: Config;
		repository: Repository;
		database: Database;
	}
}

declare global {
	interface Window {
		mikr0?: {
			verbose?: boolean;
			loaded?: boolean;
			getAction?: (options: {
				action: string;
				baseUrl: string;
				name: string;
				version: string;
				parameters: unknown;
				serialized?: boolean;
			}) => Promise<unknown>;
			events?: {
				on: (eventName: string, fn: (...data: any[]) => void) => void;
				off: (eventName: string, fn?: (...data: any[]) => void) => void;
				fire: (eventName: string, data?: any) => void;
				reset: () => void;
			};
		};
	}
}
