import { createRegistry } from "mikr0";
import Fastify from "fastify";
import path from "node:path"
import { fileURLToPath } from 'url';
import AdmZip from "adm-zip";
import vanillaComponent from "./vanillaComponent.ts";
import undici from "undici";
import FormData from "form-data";
import fs from "node:fs";
import puppeteer from "puppeteer";
import cliProgress from "cli-progress";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, "/.temp");
const UPLOADS_DIR = path.join(__dirname, "/uploads");

const rmDirIfExists = (dir: string) => {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true });
	}
}

rmDirIfExists(TEMP_DIR);

const progressBar = new cliProgress.SingleBar({
	format: 'Progress |' + '{bar}' + '| {percentage}% || {value}/{total} Iterations',
}, cliProgress.Presets.shades_classic);

const auth = {
	password: "pass",
	username: "user",
};

let registryFastifyInstance: Fastify.FastifyInstance;

await createRegistry({
	database: {
		client: "sqlite3",
		connection: {
			filename: ":memory:",
		},
	},
	storage: {
		type: "filesystem",
		options: {
			folder: ".temp/components",
		}
	},
	auth
},
	(server) => {
		registryFastifyInstance = server
	});

const form = new FormData();
const zip = new AdmZip();

const stringifiedPkg = JSON.stringify(vanillaComponent.pkg);

zip.addFile("package.json", Buffer.from(stringifiedPkg));
zip.addFile("server.cjs", Buffer.from(vanillaComponent.rawServer))
zip.addFile("template.js", Buffer.from(vanillaComponent.rawTemplate))

const pathToZip = path.join(TEMP_DIR + "/package.zip");
zip.writeZip(pathToZip);

form.append("zip", fs.createReadStream(pathToZip));
form.append("package", stringifiedPkg, {
	contentType: "application/json",
	filename: "package.json",
});

try {
	await undici.request(
		`http://localhost:4910/r/publish/${vanillaComponent.pkg.name}/${vanillaComponent.pkg.version}`,
		{
			method: "POST",
			headers: {
				...form.getHeaders(),
				Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`,
			},
			body: form,
			throwOnError: true,
		},
	);
} catch (error) {
	console.error("Error uploading files:", error);
}
finally {

}

const fastify = Fastify();
fastify.get("/", (request, reply) => {
	const componentsAmount = Number(request.query["componentsAmount"]) || 1;
	let responseHtml = `
		<html>
			<head>
				<script src="http://localhost:4910/r/client.min.js"></script>
			</head>
			<body>`;
	for (let i = 0; i < componentsAmount; i++) {
		responseHtml += `<mikro-component src="http://localhost:4910/r/component/${vanillaComponent.pkg.name}/${vanillaComponent.pkg.version}"></mikro-component>`;
	}
	responseHtml += '</body></html>';
	reply.type("text/html").send(responseHtml);
});
const staticFIlesPort = 4000
fastify.listen({ port: staticFIlesPort }, async (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	const url = `http://localhost:${staticFIlesPort}`;
	console.log(`Server listening at ${url}`);

	console.log("Measuring performance...");
	const browser = await puppeteer.launch({ headless: true, args: ["--incognito"] });

	const metrics: { [metric: string]: { ["min(ms)"]: number, ["max(ms)"]: number, ["avg(ms)"]: number, ["median(ms)"]: number } }[] = []

	const componentsAmounts = [1, 10, 100, 1000];
	for (const componentsAmount of componentsAmounts) {
		const measurements: { startToInteractive: number, startToComplete: number }[] = [];

		const iterations = 100;
		progressBar.start(iterations, 0);
		for (let i = 0; i < iterations; i++) {
			const page = await browser.newPage();

			await page.goto(`${url}/?componentsAmount=${componentsAmount}`, { waitUntil: 'load' });
			const performanceTiming = JSON.parse(
				await page.evaluate(() => JSON.stringify(window.performance.timing))
			);

			const startToInteractive = performanceTiming.domInteractive - performanceTiming.navigationStart;
			const startToComplete = performanceTiming.domComplete - performanceTiming.navigationStart;

			measurements.push({ startToInteractive, startToComplete });
			await page.close();
			progressBar.increment();
		}
		progressBar.stop();

		const calculateSummary = (values: number[]) => {
			const sortedValues = [...values].sort((a, b) => a - b);
			const min = sortedValues[0];
			const max = sortedValues[sortedValues.length - 1];
			const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
			const median = sortedValues.length % 2 === 0
				? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
				: sortedValues[Math.floor(sortedValues.length / 2)];
			return { ["min(ms)"]: min, ["max(ms)"]: max, ["avg(ms)"]: avg, ["median(ms)"]: median };
		};

		const startToInteractiveValues = measurements.map(m => m.startToInteractive);
		const startToCompleteValues = measurements.map(m => m.startToComplete);

		metrics[`Time to interactive (x${componentsAmount})`] = calculateSummary(startToInteractiveValues);
		metrics[`Time to complete (x${componentsAmount})`] = calculateSummary(startToCompleteValues);
	}


	console.table(metrics);

	browser.close();
	exitHandler();
});

const exitHandler = () => {
	if (progressBar.isActive)
		progressBar.stop();
	fastify.close();
	registryFastifyInstance.close();
	rmDirIfExists(TEMP_DIR);
	rmDirIfExists(UPLOADS_DIR);
	process.exit();
}

process.on("SIGINT", () => {
	exitHandler();
});