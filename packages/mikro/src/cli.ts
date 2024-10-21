#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import FormData from "form-data";
import undici from "undici";
import { build } from "./vite/Vite.js";
import { runServer } from "./vite/viteDev.js";

const {
	positionals: [command],
	values: { registry },
} = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
	options: {
		registry: {
			type: "string",
			alias: "r",
			description: "Registry URL",
		},
	},
});

(async () => {
	if (command === "build") {
		await build();
		return;
	}

	if (command === "publish") {
		if (!registry) exit("Missing --registry");
		await build();
		await sendFolderToServer("./dist", registry);
		return;
	}

	if (command === "dev") {
		runServer();
		return;
	}

	console.log("Usage: mikro <command> [options]");
})();

function exit(msg: string): never {
	console.error(msg);
	process.exit(1);
}

export async function sendFolderToServer(distPath: string, serverUrl: string) {
	const form = new FormData();
	const zipPath = path.join(distPath, "package.zip");
	const pkg = JSON.parse(
		await fsp.readFile(path.join(distPath, "package.json"), "utf-8"),
	);
	const sanitizedUrl = new URL(serverUrl).href.replace(/\/$/, "");

	form.append("zip", fs.createReadStream(zipPath));
	form.append("package", JSON.stringify(pkg), {
		contentType: "application/json",
		filename: "package.json",
	});

	try {
		await undici.request(
			`${sanitizedUrl}/r/publish/${pkg.name}/${pkg.version}`,
			{
				method: "POST",
				headers: form.getHeaders(),
				body: form,
				throwOnError: true,
			},
		);
	} catch (error) {
		console.error("Error uploading files:", error);
	}
}
