#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const prompts = require("prompts");

export async function run({ debugging = false } = {}) {
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
		await createComponent({ debugging });
	} else if (creationType === "registry") {
		await createRegistry({ debugging });
	}
}

async function createRegistry({ debugging }) {
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

	const dependencies = {
		mikr0: "0.0.1-beta.4",
	};
	if (database === "sqlite") {
		dependencies.sqlite3 = "5.1.7";
	} else if (database === "mssql") {
		dependencies.tedious = "18.6.1";
	}
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

	if (!debugging) {
		createFolder(`./${folder}`);
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
}

async function createComponent({ debugging }) {
	const { componentName, template } = await prompts([
		{
			type: "text",
			name: "componentName",
			message: "Component name",
			initial: "oc-component",
		},
		{
			type: "select",
			name: "template",
			message: "Select a template",
			choices: [{ title: "React", value: "react" }],
		},
	]);

	if (!debugging) {
		createFolder(`./${componentName}`);
	}

	const templateDir = path.resolve(
		import.meta.dirname,
		`./component/${template}`,
	);

	console.log();
	console.log("Creating the template");
	if (!debugging) {
		fs.cpSync(templateDir, `./${componentName}`, {
			recursive: true,
		});
		writeText(`./${componentName}/.gitignore`, ["node_modules"].join("\n"));
		replaceJson(`./${componentName}/package.json`, (pkg) => ({
			...pkg,
			name: componentName,
		}));
	}

	console.log("Finished. To start your oc for the first time:");
	console.log();
	console.log(`  cd ${componentName}`);
	console.log("  npm install");
	console.log("  npm start");
}

const writeText = (file, text) => fs.writeFileSync(file, text, "utf-8");
const writeJson = (file, json) =>
	writeText(file, JSON.stringify(json, null, 2));
function replaceJson(file, transformer) {
	const json = JSON.parse(fs.readFileSync(file, "utf-8"));
	const transformed = transformer(json);
	writeJson(file, transformed);
}

function createFolder(folderName) {
	try {
		fs.mkdirSync(`./${folderName}`);
	} catch (err) {
		if (err.code === "EEXIST") {
			console.log("Folder already exists");
			process.exit(1);
		}
		throw err;
	}
}
