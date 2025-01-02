import type { Agent as httpAgent } from "node:http";
import type { Agent as httpsAgent } from "node:https";
import type { FastifyCorsOptions } from "@fastify/cors";
import type { PackageJson } from "type-fest";
import type { ParametersSchema } from "./parameters.js";
export type { PackageJson } from "type-fest";

export type BuiltPackageJson = PackageJson & {
	name: string;
	version: string;
	mikr0: {
		clientSize: number;
		serverSize?: number;
		parameters?: ParametersSchema;
	};
};

export type PublishedPackageJson = BuiltPackageJson & {
	mikr0: BuiltPackageJson["mikr0"] & {
		publishDate: string;
	};
};

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
interface MySqlDatabase {
	client: "mysql";
	version?: string;
	connection: {
		socketPath?: string;
		host?: string;
		port?: number;
		user: string;
		password: string;
		database: string;
	};
}
interface PostgreSQLDatabase {
	client: "pg";
	connection:
		| {
				host: string;
				port: number;
				user: string;
				database: string;
				password: string;
				ssl?: boolean;
		  }
		| {
				connectionString: string;
		  };
}
export type DatabaseOptions =
	| Sqlite3Database
	| MssqlDatabase
	| MySqlDatabase
	| PostgreSQLDatabase;

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
	/**
	 * This uses Azure Blob Storage to store the components files and statics
	 * @see https://docs.microsoft.com/en-us/azure/storage/blobs/
	 */
	type: "azure";
	options: {
		/**
		 * If you want to front the assets with a CDN, you can specify the public path here
		 */
		publicPath?: string;
		/**
		 * The name of the container where the client assets will be stored
		 */
		publicContainerName: string;
		/**
		 * The name of the container where the server assets will be stored
		 */
		privateContainerName: string;
		/**
		 * The name of the storage account
		 */
		accountName: string;
		/**
		 * The access key of the storage account. If not defined it will use Azure Default Credential
		 * @see https://learn.microsoft.com/en-gb/azure/developer/javascript/sdk/credential-chains#use-defaultazurecredential-for-flexibility
		 */
		accountKey?: string;
	};
}
export type AzureStorageOptions = AzureStorage["options"];

type RequireAllOrNone<ObjectType, KeysType extends keyof ObjectType = never> = (
	| Required<Pick<ObjectType, KeysType>> // Require all of the given keys.
	| Partial<Record<KeysType, never>> // Require none of the given keys.
) &
	Omit<ObjectType, KeysType>; // The rest of the keys.

export type S3Storage = {
	/**
	 * This uses Amazon S3 to store the components files and statics
	 * @see https://aws.amazon.com/s3/
	 */
	type: "s3";
	options: RequireAllOrNone<
		{
			/**
			 * If you want to front the assets with a CDN, you can specify the public path here
			 */
			publicPath?: string;
			componentsDir: string;
			path: string;
			verbosity?: boolean;
			refreshInterval?: number;
			/**
			 * The name of the bucket where the assets will be stored
			 */
			bucket: string;
			/**
			 * The region of the bucket
			 */
			region: string;
			key?: string;
			secret?: string;
			sslEnabled?: boolean;
			s3ForcePathStyle?: boolean;
			timeout?: number;
			agentProxy?: httpAgent | httpsAgent;
			endpoint?: string;
			debug?: boolean;
		},
		"key" | "secret"
	>;
};
export type S3StorageOptions = S3Storage["options"];

export type StaticStorageOptions =
	| FilesystemStorage
	| MemoryStorage
	| AzureStorage
	| S3Storage;

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
	 * Use `true` to include all libraries (not recommended)
	 */
	dependencies?: Array<CoreLibraries | (string & {})> | true;
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
	publishValidation?: (data: BuiltPackageJson) =>
		| boolean
		| {
				isValid: boolean;
				error?: string;
		  };
	/**
	 * URL to a fallback registry that will be used when a component is not found locally
	 * Useful for development when working with existing components from a production registry
	 */
	registryFallbackUrl?: string;
}
