import fsp from "node:fs/promises";
import url from "node:url";
import type { StaticStorage } from "./storage.js";

export function MemoryStorage(): StaticStorage {
	const storage: Map<string, string> = new Map();

	return {
		async save(src: string, destination: string) {
			storage.set(destination, await fsp.readFile(src, "utf-8"));
		},
		async saveFile(destination: string, contents: string) {
			storage.set(destination, contents);
		},
		async get(filePath: string) {
			const file = storage.get(filePath);
			if (!file) {
				throw new Error(`File not found: ${filePath}`);
			}
			return file;
		},
		getUrl(file: string) {
			return url.pathToFileURL(file);
		},
	};
}
