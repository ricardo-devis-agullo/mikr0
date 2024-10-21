import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { StaticStorage } from "./storage.js";

export function FilesystemStorage(options: {
	folderPath: string;
}): StaticStorage {
	fs.mkdirSync(options.folderPath, { recursive: true });

	return {
		async save(src: string, destination: string) {
			await fsp.cp(src, path.join(options.folderPath, destination), {
				force: true,
				recursive: true,
			});
		},
		async saveFile(destination: string, contents: string) {
			await fsp.writeFile(
				path.join(options.folderPath, destination),
				contents,
				"utf-8",
			);
		},
		get(file: string) {
			return fsp.readFile(path.join(options.folderPath, file), "utf-8");
		},
	};
}
