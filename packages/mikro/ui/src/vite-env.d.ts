/// <reference types="vite/client" />

interface Window {
	mikroData: {
		components: Record<
			string,
			Record<string, { publishedAt: number; description?: string }>
		>;
		importMap?: { imports: Record<string, string> };
	};
}
