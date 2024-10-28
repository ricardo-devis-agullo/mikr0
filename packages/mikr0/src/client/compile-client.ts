import path from "node:path";
import { buildSync } from "esbuild";

export function compileClient() {
	const {
		outputFiles: [clientMinOutput],
	} = buildSync({
		bundle: true,
		minify: true,
		write: false,
		target: ["chrome80", "firefox80", "safari12"],
		entryPoints: [path.join(import.meta.dirname, "./client.js")],
		format: "iife",
	});
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
	const clientMin = clientMinOutput?.text;
	const client = clientOutput?.text;
	if (!clientMin || !client) {
		throw new Error("Missing client");
	}

	return { minified: clientMin, code: client };
}
