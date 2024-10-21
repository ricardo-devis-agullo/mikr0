import path from "node:path";

export function getMimeType(extension: string) {
	return {
		".js": "application/javascript",
		".css": "text/css",
		".map": "application/json",
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
		mimeType: getMimeType(ext),
	};
}

export function isFilePrivate(filePath: string) {
	return filePath.includes("server.js");
}
