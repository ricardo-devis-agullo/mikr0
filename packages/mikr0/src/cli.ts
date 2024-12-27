#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import FormData from "form-data";
import prompts from "prompts";
import undici from "undici";
import chalk from "chalk";
import { build, getEntryPoint } from "./vite/build.js";
import { runServer } from "./vite/viteDev.js";
import { BuildError, PublishError, ValidationError } from "./errors.js";

function formatError(error: Error): string {
	if (error instanceof BuildError) {
		return chalk.red(`Build Error: ${error.message}`);
	}
	if (error instanceof PublishError) {
		return chalk.red(`Publish Error: ${error.message}`);
	}
	if (error instanceof ValidationError) {
		return chalk.yellow(`Validation Error: ${error.message}`);
	}
	return chalk.red(`Error: ${error.message}`);
}

let {
	positionals: [command],
	values: { registry, username, password, folder },
} = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
	options: {
		registry: {
			type: "string",
			alias: "r",
			description: "Registry URL",
		},
		username: {
			type: "string",
			alias: "u",
			description: "Username to authenticate with",
		},
		password: {
			type: "string",
			alias: "p",
			description: "Password to authenticate with",
		},
		folder: {
			type: "string",
			alias: "f",
			description: "Skip the build and specify the folder to publish",
		},
	},
});

const { absolute: entry } = getEntryPoint();

async function validatePublishRequirements() {
	if (!registry) {
		throw new ValidationError("Missing --registry parameter");
	}

	if (!username || !password) {
		try {
			const result = await prompts([
				{
					type: username ? null : "text",
					name: "username",
					message: "Username",
				},
				{
					type: password ? null : "password",
					name: "password",
					message: "Password",
				},
			]);

			if (!result.username && !username) {
				throw new ValidationError("Username is required");
			}
			if (!result.password && !password) {
				throw new ValidationError("Password is required");
			}

			username ??= result.username;
			password ??= result.password;
		} catch (error) {
			if (error instanceof ValidationError) throw error;
			throw new ValidationError("Failed to get credentials");
		}
	}
}

async function handleBuild() {
	try {
		console.log(chalk.blue("Starting build..."));
		await build({ entry });
		console.log(chalk.green("Build completed successfully"));
	} catch (error) {
		throw new BuildError(
			error instanceof Error ? error.message : "Build failed",
		);
	}
}

async function handlePublish() {
	try {
		await validatePublishRequirements();

		if (!folder) {
			await handleBuild();
		}

		console.log(chalk.blue("Publishing to registry..."));
		await sendFolderToServer({
			distPath: folder ?? "./dist",
			serverUrl: registry!,
			username: username!,
			password: password!,
		});
		console.log(chalk.green("Published successfully"));
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BuildError) {
			throw error;
		}
		throw new PublishError(
			error instanceof Error ? error.message : "Publish failed",
		);
	}
}

(async () => {
	try {
		switch (command) {
			case "build":
				await handleBuild();
				break;

			case "publish":
				await handlePublish();
				break;

			case "dev":
				console.log(chalk.blue("Starting development server..."));
				await runServer();
				break;

			default:
				console.log(
					chalk.yellow(`
Usage: mikr0 <command> [options]

Commands:
  build             Build the component
  publish           Publish the component to registry
  dev              Start development server

Options:
  -r, --registry   Registry URL
  -u, --username   Username for authentication
  -p, --password   Password for authentication
  -f, --folder     Specify build folder for publishing
`),
				);
		}
	} catch (error) {
		console.error(formatError(error as Error));
		process.exit(1);
	}
})();

export async function sendFolderToServer({
	distPath,
	password,
	serverUrl,
	username,
}: {
	distPath: string;
	serverUrl: string;
	username: string;
	password: string;
}) {
	if (!fs.existsSync(distPath)) {
		throw new ValidationError(`Folder ${distPath} does not exist`);
	}

	const form = new FormData();
	const zipPath = path.join(distPath, "package.zip");

	try {
		const pkgContent = await fsp.readFile(
			path.join(distPath, "package.json"),
			"utf-8",
		);
		const pkg = JSON.parse(pkgContent);
		const sanitizedUrl = new URL(serverUrl).href.replace(/\/$/, "");

		form.append("zip", fs.createReadStream(zipPath));
		form.append("package", JSON.stringify(pkg), {
			contentType: "application/json",
			filename: "package.json",
		});

		const response = await undici.request(
			`${sanitizedUrl}/r/publish/${pkg.name}/${pkg.version}`,
			{
				method: "POST",
				headers: {
					...form.getHeaders(),
					Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
				},
				body: form,
			},
		);

		if (response.statusCode !== 200) {
			const text = await response.body.text();
			throw new Error(
				text || `Server responded with status ${response.statusCode}`,
			);
		}
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new ValidationError("Invalid package.json");
		}
		throw error;
	}
}
