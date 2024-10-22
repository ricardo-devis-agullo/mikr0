// @ts-check

import fs from "node:fs";
import path from "node:path";

const readText = (/** @type string */ file) => fs.readFileSync(file, "utf-8");
const readJson = (/** @type string */ file) => JSON.parse(readText(file));
const writeFile = (/** @type string */ file, /** @type string */ data) =>
	fs.writeFileSync(file, data, "utf-8");

let cliFile = readText(path.join(import.meta.dirname, "index.js"));
const typeScriptVersion = readJson(
	path.join(import.meta.dirname, "../../package.json"),
).devDependencies.typescript;
const mikr0Version = readJson(
	path.join(import.meta.dirname, "../mikr0/package.json"),
).version;

cliFile = cliFile.replace(
	/typescript: "(\^?[\d.]+)"/,
	`typescript: "${typeScriptVersion}"`,
);
cliFile = cliFile.replace(
	/mikr0: "(\^?[\d.]+(?:-beta\.\d+)?)"/,
	`mikr0: "${mikr0Version}"`,
);

writeFile(path.join(import.meta.dirname, "index.js"), cliFile);
