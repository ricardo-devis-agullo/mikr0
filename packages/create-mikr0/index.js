#!/usr/bin/env node

// @ts-check

import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import { parseArgs } from "node:util";

const placeholder = "--FILL THIS VALUE--";

let {
	values: { type: creationType },
} = parseArgs({
	args: process.argv.slice(2),
	options: {
		type: {
			type: "string",
			short: "t",
		},
	},
});
if (creationType !== "component" && creationType !== "registry") {
	creationType = "";
}

async function run() {
	await prompts([
		{
			type: creationType ? null : "select",
			name: "type",
			message: "What do you want to create?",
			choices: [
				{ title: "Component", value: "component" },
				{ title: "Registry", value: "registry" },
			],
			onState(state) {
				creationType = state.value;
			},
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
				{ title: "MySQL", value: "mysql" },
				{ title: "PostgreSQL", value: "pg" },
				{ title: "Microsoft SQL Server", value: "mssql" },
			],
		},
		{
			type: "select",
			name: "storage",
			message: "Select your storage provider",
			choices: [
				{ title: "Filesystem", value: "filesystem" },
				{ title: "Amazon S3", value: "s3" },
				{ title: "Azure Storage", value: "azure" },
			],
		},
	]);

	/** @type Record<string, string> */
	const dependencies = {
		mikr0: "0.0.1-beta.19",
	};
	if (database === "sqlite") {
		dependencies.sqlite3 = "5.1.7";
	} else if (database === "mssql") {
		dependencies.tedious = "18.6.1";
	} else if (database === "mysql") {
		dependencies.mysql2 = "3.11.3";
	} else if (database === "pg") {
		dependencies.pg = "8.13.1";
	}

	/** @type any */
	const config = {
		auth: {
			username: "admin",
			password: crypto.randomUUID(),
		},
		importmap: {
			imports: {
				react: "https://unpkg.com/react@18/umd/react.production.min.js",
				"react-dom":
					"https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
				"solid-js": "https://cdn.jsdelivr.net/npm/solid-js@1.9/+esm",
				vue: "https://cdn.jsdelivr.net/npm/vue@3.5/+esm",
			},
		},
	};
	if (database === "sqlite") {
		config.database = {
			client: "sqlite3",
			connection: {
				filename: ".mikro/db.sqlite",
			},
		};
	} else if (database === "mssql") {
		config.database = {
			client: "mssql",
			connection: {
				database: placeholder,
				host: placeholder,
				user: placeholder,
				password: placeholder,
			},
		};
	} else if (database === "mysql") {
		config.database = {
			client: "mysql",
			connection: {
				database: placeholder,
				host: placeholder,
				user: placeholder,
				password: placeholder,
			},
		};
	} else if (database === "pg") {
		config.database = {
			client: "pg",
			connection: {
				database: placeholder,
				host: placeholder,
				user: placeholder,
				password: placeholder,
			},
		};
	}

	if (storage === "filesystem") {
		config.storage = {
			type: "filesystem",
			options: {
				folder: ".mikro/components",
			},
		};
	} else if (storage === "s3") {
		config.storage = {
			type: "s3",
			options: {
				bucket: placeholder,
				componentsDir: "components",
				path: placeholder,
				region: placeholder,
			},
		};
	} else if (storage === "azure") {
		config.storage = {
			type: "azure",
			options: {
				accountName: placeholder,
				accountKey: placeholder,
				privateContainerName: "mikro-private",
				publicContainerName: "mikro-public",
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
			choices: [
				{ title: "Vanilla", value: "vanilla" },
				{ title: "React", value: "react" },
				{ title: "Solid", value: "solid" },
				{ title: "Vue", value: "vue" },
			],
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
