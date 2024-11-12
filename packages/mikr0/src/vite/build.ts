import { readdirSync, renameSync, rmSync } from "node:fs";
import fsp from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import AdmZip from "adm-zip";
import * as vite from "vite";
import type { BuiltPackageJson } from "../types.js";
import { ocClientPlugin, ocServerPlugin } from "./plugins.js";

const config = await vite.loadConfigFromFile(
	{ command: "build", mode: "production" },
	"vite.config.ts",
);
const require = createRequire(import.meta.url);

export function getEntryPoint() {
	const dir = readdirSync(path.join(process.cwd(), "src"));
	const fileInOrderOfPriority = [
		"index.tsx",
		"index.ts",
		"index.jsx",
		"index.js",
	];
	const entry = fileInOrderOfPriority.find((file) => dir.includes(file));
	if (!entry)
		throw new Error(
			"Could not find entry point (index.(t|j)sx?) in the src folder",
		);

	return {
		absolute: path.join(process.cwd(), "src", entry),
		relative: `src/${entry}`,
		filename: entry,
	};
}

export async function build(options: { entry: string }) {
	rmSync("dist", { recursive: true, force: true });

	const client = await vite.build({
		appType: "custom",
		plugins: config?.config.plugins?.concat(
			ocClientPlugin({ entry: options.entry }),
		),
		build: {
			emptyOutDir: false,
			lib: {
				entry: options.entry,
				formats: ["es"],
				fileName: "template",
			},
			rollupOptions: {
				// TODO: externalize all assets
				external: ["/vite.svg"],
			},
			outDir: "dist",
		},
	});
	const server = await vite.build({
		appType: "custom",
		plugins: [ocServerPlugin({ entry: options.entry })],
		build: {
			emptyOutDir: false,
			minify: true,
			ssr: true,
			rollupOptions: {
				external: (id) => {
					if (id.startsWith("node:")) {
						return true;
					}
					return false;
				},
			},
			lib: {
				entry: options.entry,
				formats: ["cjs"],
				// This is being ignored ATM for some reason
				fileName: "server",
			},
			outDir: "dist",
		},
	});
	if (!Array.isArray(server) || !Array.isArray(client))
		throw new Error("Expected builds to be a single bundle");
	const serverSize = server[0]?.output[0].code.length;
	const clientSize = client[0]?.output[0].code.length;
	if (!clientSize) throw new Error("Could not determine client size");

	renameSync(
		path.join(process.cwd(), "dist/index.cjs"),
		path.join(process.cwd(), "dist/server.cjs"),
	);
	const { parameters } = require(path.join(process.cwd(), "dist/server.cjs"));
	const pkg: BuiltPackageJson = JSON.parse(
		await fsp.readFile(path.join(process.cwd(), "package.json"), "utf-8"),
	);
	pkg.mikr0 = { parameters, serverSize, clientSize };
	await fsp.writeFile(
		path.join(process.cwd(), "dist/package.json"),
		JSON.stringify(pkg, null, 2),
		"utf-8",
	);

	const zip = new AdmZip();
	zip.addLocalFolder("dist");
	await zip.writeZipPromise("dist/package.zip");
}
