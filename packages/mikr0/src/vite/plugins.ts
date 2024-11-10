import { generateCode, parseModule } from "magicast";
import type { PluginOption } from "vite";

export const ocClientPlugin = (opts: { entry: string }): PluginOption => {
	return {
		name: "ocClient",
		enforce: "pre",
		transform(code, id) {
			if (id === opts.entry) {
				const mod = parseModule(code);
				if (mod.exports.default.$type === "function-call") {
					// biome-ignore lint/performance/noDelete: required for tree shaking
					delete mod.exports.default.$args[0].loader;
					// biome-ignore lint/performance/noDelete: required for tree shaking
					delete mod.exports.default.$args[0].parameters;
					// biome-ignore lint/performance/noDelete: required for tree shaking
					delete mod.exports.default.$args[0].plugins;
					// biome-ignore lint/performance/noDelete: required for tree shaking
					delete mod.exports.default.$args[0].actions;
					return generateCode(mod);
				}
				console.error(
					"You need export directly the creation of the component: export default createComponent(...)",
				);
				return code;
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
				if (mod.exports.default.$type === "function-call") {
					// biome-ignore lint/performance/noDelete: <explanation>
					delete mod.exports.default.$args[0].mount;
					// biome-ignore lint/performance/noDelete: <explanation>
					delete mod.exports.default.$args[0].unmount;
					return generateCode(mod);
				}
				return code;
			}
		},
	};
};
