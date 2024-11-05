import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import type { StaticStorage } from "./storage.js";
import { getMimeType } from "./utils.js";

export function FilesystemStorage(options: {
	folderPath: string;
}): StaticStorage {
	const absolutePath = path.resolve(options.folderPath);
	fs.mkdirSync(absolutePath, { recursive: true });

	return {
		async save(src: string, destination: string) {
			await fsp.cp(src, path.join(options.folderPath, destination), {
				force: true,
				recursive: true,
			});
		},
		async saveFile(destination: string, contents: string) {
			const mime = getMimeType(destination);
			await fsp.writeFile(
				path.join(options.folderPath, destination),
				contents,
				mime?.startsWith("image") ? "binary" : "utf-8",
			);
		},
		get(file: string) {
			return fsp.readFile(path.join(absolutePath, file), "utf-8");
		},
		getUrl(file: string) {
			return url.pathToFileURL(path.join(absolutePath, file));
		},
	};
}
