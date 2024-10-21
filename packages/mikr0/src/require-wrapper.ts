import { builtinModules } from "node:module";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(process.cwd());

function tryRequire(id: string) {
	let path = "";

	try {
		path = require.resolve(id);
	} catch {}

	if (path) {
		return require(path);
	}
}

function requirePackageName(str: string) {
	const scopePattern = /^(?:(@[^/]+)[/]+)([^/]+)[/]?/;
	const basePattern = /^([^/]+)[/]?/;

	if (/^@/.test(str)) {
		const [, scope, pkg] = scopePattern.exec(str) ?? [];
		if (!scope || !pkg) return;

		return [scope, pkg].join("/");
	}

	const [, pkg] = basePattern.exec(str) ?? [];
	return pkg;
}

const coreModules = builtinModules.flatMap((x) => [x, `node:${x}`]);

const isCoreDependency = (x: string) => coreModules.includes(x);
const requireCoreDependency = (x: string) =>
	(isCoreDependency(x) && tryRequire(x)) || undefined;

const requireDependency = (requirePath: string) => {
	const nodeModulesPath = path.resolve(".", "node_modules");
	const modulePath = path.resolve(nodeModulesPath, requirePath);
	return tryRequire(modulePath);
};

const throwError = (requirePath: string) => {
	throw new Error(`Dependency "${requirePath}" is not allowed`);
};

export default (injectedDependencies: string[]) =>
	<T = unknown>(requirePath: string): T => {
		const moduleName = requirePackageName(requirePath);
		const isAllowed = !!moduleName && injectedDependencies.includes(moduleName);

		if (!isAllowed) {
			return throwError(requirePath);
		}

		return (
			requireDependency(requirePath) ||
			requireCoreDependency(requirePath) ||
			throwError(requirePath)
		);
	};
