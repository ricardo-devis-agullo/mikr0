import fsp from "node:fs/promises";
import path from "node:path";
import type { ParametersSchema } from "../parameters.js";
import type { StaticStorage } from "./storage.js";

interface Mikr0Info {
	parameters: ParametersSchema;
	server: boolean;
}

interface Pkg {
	name: string;
	version: string;
	mikr0: Mikr0Info;
}

export const Repository = (options: { storage: StaticStorage }) => {
	return {
		getUrl(file: string) {
			return options.storage.getUrl(file);
		},
		async saveComponent(folderPath: string) {
			const pkg = JSON.parse(
				await fsp.readFile(path.join(folderPath, "package.json"), "utf-8"),
			);
			await options.storage.save(folderPath, `${pkg.name}/${pkg.version}`);
		},
		getTemplate(name: string, version: string) {
			return options.storage.get(`${name}/${version}/template.js`);
		},
		getFile(name: string, version: string, file: string) {
			return options.storage.get(`${name}/${version}/${file}`);
		},
		getTemplateUrl(name: string, version: string) {
			return options.storage.getUrl(`${name}/${version}/template.js`);
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
