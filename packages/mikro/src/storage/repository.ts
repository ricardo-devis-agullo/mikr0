import fsp from "node:fs/promises";
import path from "node:path";
import type { ParametersSchema } from "../parameters.js";
import type { StaticStorage } from "./storage.js";

interface MikroInfo {
	parameters: ParametersSchema;
	server: boolean;
}

interface Pkg {
	name: string;
	version: string;
	mikro: MikroInfo;
}

export const Repository = (options: { storage: StaticStorage }) => {
	return {
		async saveComponent(folderPath: string) {
			const pkg = JSON.parse(
				await fsp.readFile(path.join(folderPath, "package.json"), "utf-8"),
			);
			await options.storage.save(folderPath, `${pkg.name}/${pkg.version}`);
		},
		getTemplate(name: string, version: string) {
			return options.storage.get(`${name}/${version}/template.js`);
		},
		getServer(name: string, version: string) {
			return options.storage.get(`${name}/${version}/server.cjs`);
		},
		async getPackageJson(name: string, version: string): Promise<Pkg> {
			const pkg = await options.storage.get(`${name}/${version}/package.json`);

			return JSON.parse(pkg);
		},
	};
};

export type Repository = ReturnType<typeof Repository>;
