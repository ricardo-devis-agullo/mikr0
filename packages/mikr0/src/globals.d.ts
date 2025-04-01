import type { Config } from "./config.js";
import type { Database } from "./database/index.js";
import type { Repository } from "./storage/repository.js";
import type { StaticStorage } from "./storage/storage.ts";

declare module "fastify" {
	interface FastifyInstance {
		conf: Config;
		storage: StaticStorage;
		repository: Repository;
		database: Database;
	}
}

declare global {
	interface Window {
		mikr0?: {
			defaultRegistry?: string;
			verbose?: boolean;
			loaded?: boolean;
			getAction?: (options: {
				action: string;
				baseUrl: string;
				name: string;
				version: string;
				parameters: unknown;
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
