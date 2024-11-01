import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
  },
	plugins: [react()],
	build: {
		rollupOptions: {
			external: ["react", "react-dom"],
		},
	},
});
