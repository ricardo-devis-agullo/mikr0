import { generateCode, parseModule } from "magicast";
import type { PluginOption } from "vite";

export const ocClientPlugin = (opts: { entry: string }): PluginOption => {
	return {
		name: "ocClient",
		enforce: "pre",
		transform(code, id) {
			if (id === opts.entry) {
				const mod = parseModule(code);
				// biome-ignore lint/performance/noDelete: required for tree shaking
				delete mod.exports.default.$args[0].loader;
				// biome-ignore lint/performance/noDelete: required for tree shaking
				delete mod.exports.default.$args[0].validateParams;
				return generateCode(mod);
			}
		},
	};
};

export const ocServerPlugin = (opts: { entry: string }): PluginOption => {
	return {
		name: "ocServer",
		enforce: "pre",
		transform(code, id) {
			if (id === opts.entry) {
				const mod = parseModule(code);
				// biome-ignore lint/performance/noDelete: <explanation>
				delete mod.exports.default.$args[0].render;
				return generateCode(mod);
			}
		},
	};
};
