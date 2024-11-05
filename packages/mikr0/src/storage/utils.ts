import path from "node:path";

export function getMimeType(filePath: string) {
	const extension = path.extname(filePath).toLowerCase();

	return {
		".js": "application/javascript",
		".cjs": "application/javascript",
		".mjs": "application/javascript",
		".css": "text/css",
		".map": "application/json",
		".json": "application/json",
		".gif": "image/gif",
		".jpg": "image/jpeg",
		".png": "image/png",
		".svg": "image/svg+xml",
		".html": "text/html",
	}[extension];
}

export function getFileInfo(filePath: string) {
	const ext = path.extname(filePath).toLowerCase();

	return {
		extname: ext,
		mimeType: getMimeType(filePath),
	};
}

export function isFilePrivate(filePath: string) {
	return filePath.includes("server.js");
}
