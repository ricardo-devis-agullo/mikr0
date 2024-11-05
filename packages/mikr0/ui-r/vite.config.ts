import path from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		outDir: "../dist/ui-dist",
	},
	base: "/ui",
	plugins: [TanStackRouterVite({}), react()],
});
