import fsp from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { fs } from "memfs";
import type { StaticStorage } from "./storage.js";
import { getMimeType } from "./utils.js";

export function MemoryStorage(): StaticStorage {
	const storage: Map<string, string> = new Map();

	return {
		async save(src: string, destination: string) {
			for await (const file of fsp.glob(path.join(src, "/*"))) {
				fs.mkdirSync(path.join("/", destination), { recursive: true });
				const mime = getMimeType(file);
				const encoding = mime?.startsWith("image") ? "binary" : "utf-8";
				const data = await fsp.readFile(file, encoding);
				fs.writeFileSync(
					path.join("/", destination, path.basename(file)),
					data,
					{
						encoding,
					},
				);
			}
		},
		async saveFile(destination: string, contents: string) {
			const mime = getMimeType(destination);
			const encoding = mime?.startsWith("image") ? "binary" : "utf-8";
			await fs.writeFileSync(path.join("/", destination), contents, {
				encoding,
			});
			storage.set(destination, contents);
		},
		async get(file: string) {
			const mime = getMimeType(file);
			const encoding = mime?.startsWith("image") ? "binary" : "utf-8";

			return fs.readFileSync(path.join("/", file), {
				encoding,
			}) as string;
		},
		getUrl(file: string) {
			return url.pathToFileURL(path.join("/", file));
		},
	};
}
