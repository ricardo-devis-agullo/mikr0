#!/usr/bin/env node

// @ts-check

import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";

async function run() {
	const { creationType } = await prompts([
		{
			type: "select",
			name: "creationType",
			message: "What do you want to create?",
			choices: [
				{ title: "Component", value: "component" },
				{ title: "Registry", value: "registry" },
			],
		},
	]);

	if (creationType === "component") {
		await createComponent();
	} else if (creationType === "registry") {
		await createRegistry();
	}
}

async function createRegistry() {
	const { folder, database, storage } = await prompts([
		{
			type: "text",
			name: "folder",
			message: "What is the name of the folder?",
			initial: "registry",
		},
		{
			type: "select",
			name: "database",
			message: "Select your SQL provider",
			choices: [
				{ title: "SQLite", value: "sqlite" },
				{ title: "MSSQL", value: "mssql" },
			],
		},
		{
			type: "select",
			name: "storage",
			message: "Select your storage provider",
			choices: [
				{ title: "Filesystem", value: "filesystem" },
				{ title: "Azure Storage", value: "azure" },
			],
		},
	]);

	/** @type Record<string, string> */
	const dependencies = {
		mikr0: "0.0.1-beta.9",
	};
	if (database === "sqlite") {
		dependencies.sqlite3 = "5.1.7";
	} else if (database === "mssql") {
		dependencies.tedious = "18.6.1";
	}

	/** @type any */
	const config = {
		auth: {
			username: "admin",
			password: "password",
		},
	};
	if (database === "sqlite") {
		config.database = {
			client: "sqlite3",
			connection: {
				filename: "./data.sqlite",
			},
		};
	} else if (database === "mssql") {
		config.database = {
			client: "mssql",
			connection: {
				database: "--FILL THIS VALUE--",
				host: "--FILL THIS VALUE--",
				user: "--FILL THIS VALUE--",
				password: "--FILL THIS VALUE--",
			},
		};
	}

	createFolder(`./${folder}`);
	writeText(
		`./${folder}/Dockerfile`,
		`FROM node:22-slim AS BUILD_IMAGE

RUN mkdir "/app"

WORKDIR "/app"
ADD ["./package.json", "./package-lock.json", "./"]

RUN npm install

ADD ["./", "./"]

EXPOSE 3000
ENTRYPOINT [ "node", "--experimental-strip-types" ,"/app/main.ts" ]`,
	);
	writeText(`./${folder}/.gitignore`, ["node_modules"].join("\n"));
	writeJson(`./${folder}/tsconfig.json`, {
		compilerOptions: {
			esModuleInterop: true,
			skipLibCheck: true,
			target: "ESNext",
			resolveJsonModule: true,
			moduleDetection: "force",
			isolatedModules: true,
			verbatimModuleSyntax: true,
			strict: true,
			noEmit: true,
			module: "NodeNext",
		},
	});
	writeJson(`./${folder}/package.json`, {
		name: "registry",
		version: "1.0.0",
		type: "module",
		private: true,
		scripts: {
			start: "node --experimental-strip-types index.ts",
		},
		keywords: [],
		author: "",
		license: "ISC",
		description: "",
		dependencies,
		devDependencies: {
			"@types/node": "^22.7.7",
			typescript: "^5.6.3",
		},
	});
	writeText(
		`./${folder}/index.ts`,
		`import { createRegistry } from "mikr0";

createRegistry(${JSON.stringify(config, null, 2)});`,
	);
}

async function createComponent() {
	const { componentName, template } = await prompts([
		{
			type: "text",
			name: "componentName",
			message: "Component name",
			initial: "component",
		},
		{
			type: "select",
			name: "template",
			message: "Select a template",
			choices: [{ title: "React", value: "react" }],
		},
	]);

	createFolder(`./${componentName}`);

	const templateDir = path.resolve(
		import.meta.dirname,
		`./component/${template}`,
	);

	console.log();
	console.log("Creating the template");
	fs.cpSync(templateDir, `./${componentName}`, {
		recursive: true,
	});
	writeText(`./${componentName}/.gitignore`, ["node_modules"].join("\n"));
	replaceJson(`./${componentName}/package.json`, (/** @type any */ pkg) => ({
		...pkg,
		name: componentName,
	}));

	console.log("Finished. To start your oc for the first time:");
	console.log();
	console.log(`  cd ${componentName}`);
	console.log("  npm install");
	console.log("  npm start");
}

const writeText = (/** @type string */ file, /** @type string */ text) =>
	fs.writeFileSync(file, text, "utf-8");
const writeJson = (/** @type string */ file, /** @type any */ json) =>
	writeText(file, JSON.stringify(json, null, 2));
function replaceJson(/** @type string */ file, /** @type any */ transformer) {
	const json = JSON.parse(fs.readFileSync(file, "utf-8"));
	const transformed = transformer(json);
	writeJson(file, transformed);
}

function createFolder(/** @type string */ folderName) {
	try {
		fs.mkdirSync(`./${folderName}`);
	} catch (/** @type any */ err) {
		if (err.code === "EEXIST") {
			console.log("Folder already exists");
			process.exit(1);
		}
		throw err;
	}
}

run();
