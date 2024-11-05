/// <reference types="vite/client" />

interface Window {
	mikr0Data: {
		components: Record<
			string,
			Record<string, { publishedAt: number; description?: string }>
		>;
		importMap?: { imports: Record<string, string> };
	};
}
