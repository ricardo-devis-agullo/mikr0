import path from "node:path";
import { buildSync, transformSync } from "esbuild";

export function compileClient() {
	const {
		outputFiles: [clientOutput],
	} = buildSync({
		bundle: true,
		minify: false,
		write: false,
		target: ["chrome80", "firefox80", "safari12"],
		entryPoints: [path.join(import.meta.dirname, "./client.js")],
		format: "iife",
	});
	const client = clientOutput?.text;
	if (!client) {
		throw new Error("Missing client");
	}

	const { code: clientMin } = transformSync(client, { minify: true });

	return { minified: clientMin, code: client };
}
