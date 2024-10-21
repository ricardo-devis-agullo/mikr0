import type { StaticStorageOptions } from "../types.js";
import { AzureStorage } from "./azure.js";
import { FilesystemStorage } from "./filesystem.js";
import { MemoryStorage } from "./memory.js";

export interface StaticStorage {
	save: (src: string, destination: string) => Promise<void>;
	saveFile: (destination: string, contents: string) => Promise<void>;
	get: (file: string) => Promise<string>;
}

export function StaticStorage(config: StaticStorageOptions): StaticStorage {
	switch (config.type) {
		case "filesystem":
			return FilesystemStorage({ folderPath: config.options.folder });
		case "memory":
			return MemoryStorage();
		case "azure":
			return AzureStorage({
				accountKey: config.options.accountKey,
				accountName: config.options.accountName,
				privateContainerName: config.options.privateContainerName,
				publicContainerName: config.options.publicContainerName,
			});
	}
}
