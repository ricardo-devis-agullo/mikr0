import type { FastifyCorsOptions } from "@fastify/cors";

type BaseCoreLibraries =
	| "assert"
	| "buffer"
	| "child_process"
	| "cluster"
	| "console"
	| "constants"
	| "crypto"
	| "dgram"
	| "dns"
	| "domain"
	| "events"
	| "fs"
	| "http"
	| "https"
	| "module"
	| "net"
	| "os"
	| "path"
	| "punycode"
	| "querystring"
	| "readline"
	| "repl"
	| "stream"
	| "string_decoder"
	| "sys"
	| "timers"
	| "tls"
	| "tty"
	| "url"
	| "util"
	| "vm"
	| "zlib";
// create type like nodemodules but append 'node:' to the beginning
type CoreLibraries = `node:${BaseCoreLibraries}`;

interface Sqlite3Database {
	client: "sqlite3";
	connection: {
		filename: string;
	};
}
interface MssqlDatabase {
	client: "mssql";
	connection: {
		host: string;
		port?: number;
		user: string;
		password: string;
		database: string;
		options?: {
			encrypt?: boolean;
		};
	};
}
export type DatabaseOptions = Sqlite3Database | MssqlDatabase;

/**
 * Storage configuration to where store the components files and statics
 * Useful for development purposes. DO NOT USE IN PRODUCTION.
 */
interface MemoryStorage {
	type: "memory";
}
interface FilesystemStorage {
	type: "filesystem";
	options: {
		folder: string;
	};
}
interface AzureStorage {
	type: "azure";
	options: {
		publicContainerName: string;
		privateContainerName: string;
		accountName: string;
		accountKey?: string;
	};
}

export type StaticStorageOptions =
	| FilesystemStorage
	| MemoryStorage
	| AzureStorage;

export interface Options {
	/**
	 * Port where the registry will be listening
	 * @default 4910
	 */
	port?: number | string;
	/**
	 * Database configuration to where store information about the registry components
	 * @default { client: 'sqlite3', connection: { filename: '.mikr0/db.sqlite' } }
	 */
	database?: DatabaseOptions;
	/**
	 * Storage configuration to where store the components files and statics
	 * @default { type: 'filesystem', options: { folder: '.mikr0/components' } }
	 */
	storage?: StaticStorageOptions;
	/**
	 * Enable verbose logging
	 * @default false
	 */
	verbose?: boolean;
	/**
	 * Execution timeout in milliseconds for the component server
	 * @default 5000
	 */
	executionTimeout?: number;
	/**
	 * CORS configuration
	 * @default { origin: '*' }
	 */
	cors?: FastifyCorsOptions;
	/**
	 * Import map configuration to share globals between your components
	 * @default { imports: {} }
	 * @example
	 * ```json
	 * {
	 *  "imports": {
	 *   "react": "https://cdn.skypack.dev/react@17.0.2/umd/react.production.min.js",
	 *  }
	 * }
	 */
	importmap?: {
		imports: Record<string, string>;
	};
	/**
	 * A list of server dependencies that can be used in the component's loaders
	 */
	availableDependencies?: Array<CoreLibraries | (string & {})>;
	/**
	 * A set of shared functions that can be called from the components
	 */
	plugins?: Record<
		string,
		{
			description?: string;
			handler: (...params: any[]) => any;
		}
	>;
	/**
	 * Basic authentication configuration
	 */
	auth: {
		username: string;
		password: string;
	};
}
