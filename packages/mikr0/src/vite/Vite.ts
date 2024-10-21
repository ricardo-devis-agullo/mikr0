import { rmSync } from "node:fs";
import fsp from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import AdmZip from "adm-zip";
import * as vite from "vite";
import { ocClientPlugin, ocServerPlugin } from "./plugins.js";

const config = await vite.loadConfigFromFile(
	{ command: "build", mode: "production" },
	"vite.config.ts",
);
const require = createRequire(import.meta.url);

export async function build() {
	rmSync("dist", { recursive: true, force: true });
	const entry = path.join(process.cwd(), "src/index.tsx");

	const client = await vite.build({
		appType: "custom",
		plugins: config?.config.plugins?.concat(ocClientPlugin({ entry })),
		build: {
			emptyOutDir: false,
			lib: {
				entry: "src/index.tsx",
				name: "myLib",
				formats: ["es"],
				fileName: "template",
			},
			rollupOptions: {
				external: ["/vite.svg"],
			},
			outDir: "dist",
		},
	});
	const server = await vite.build({
		appType: "custom",
		plugins: [ocServerPlugin({ entry })],
		build: {
			emptyOutDir: false,
			rollupOptions: {
				external: (id) => {
					if (id.startsWith("node:")) return true;
					return false;
				},
			},
			lib: {
				entry: "src/index.tsx",
				name: "myLib",
				formats: ["cjs"],
				fileName: "server",
			},
			outDir: "dist",
		},
	});
	if (!Array.isArray(server) || !Array.isArray(client))
		throw new Error("Expected builds to be a single bundle");
	const serverSize = server[0]?.output[0].code.length;
	const clientSize = client[0]?.output[0].code.length;

	const { parameters } = require(path.join(process.cwd(), "dist/server.cjs"));
	const pkg = JSON.parse(
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
