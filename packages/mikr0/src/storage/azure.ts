import fs from "node:fs";
import { promisify } from "node:util";
import { DefaultAzureCredential } from "@azure/identity";
import {
	BlobServiceClient,
	StorageSharedKeyCredential,
} from "@azure/storage-blob";
import type {
	BlockBlobUploadOptions,
	ContainerClient,
} from "@azure/storage-blob";
import nodeDir, { type PathsResult } from "node-dir";
import type { StaticStorage } from "./storage.js";
import { getFileInfo, isFilePrivate } from "./utils.js";

const getPaths: (path: string) => Promise<PathsResult> = promisify(
	nodeDir.paths,
);

let containersStatus: "unknown" | "checked" = "unknown";

async function streamToBuffer(readableStream: NodeJS.ReadableStream) {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		readableStream.on("data", (data) => {
			chunks.push(data instanceof Buffer ? data : Buffer.from(data));
		});
		readableStream.on("end", () => {
			resolve(Buffer.concat(chunks));
		});
		readableStream.on("error", reject);
	});
}

export function AzureStorage(options: {
	publicContainerName: string;
	privateContainerName: string;
	accountName: string;
	accountKey?: string;
}): StaticStorage {
	let privateClient: ContainerClient | undefined = undefined;
	let publicClient: ContainerClient | undefined = undefined;

	const getClient = () => {
		if (!privateClient || !publicClient) {
			const client = new BlobServiceClient(
				`https://${options.accountName}.blob.core.windows.net`,
				options.accountName && options.accountKey
					? new StorageSharedKeyCredential(
							options.accountName,
							options.accountKey,
						)
					: new DefaultAzureCredential(),
			);
			publicClient = client.getContainerClient(options.publicContainerName);
			privateClient = client.getContainerClient(options.privateContainerName);

			return { publicClient, privateClient };
		}
		return { publicClient, privateClient };
	};

	const get = async (filePath: string) => {
		const { privateClient } = getClient();
		const blobClient = privateClient.getBlobClient(filePath);
		try {
			const downloadBlockBlobResponse = await blobClient.download();
			const streamBody = downloadBlockBlobResponse.readableStreamBody!;
			const fileContent = (await streamToBuffer(streamBody)).toString();

			return fileContent;
		} catch (err: any) {
			if (err.statusCode === 404) {
				throw {
					code: "file_not_found",
					msg: `File "${filePath}" not found`,
				};
			}
			throw err;
		}
	};

	const save = async (dirInput: string, dirOutput: string) => {
		const paths = await getPaths(dirInput);
		const { publicClient, privateClient } = getClient();

		if (containersStatus === "unknown") {
			await Promise.all([
				privateClient.createIfNotExists(),
				publicClient.createIfNotExists({ access: "blob" }),
			]);
			containersStatus = "checked";
		}

		await Promise.all(
			paths.files.map((file: string) => {
				const formattedDirInput = dirInput.replace(/^[./\\]+/, "");
				const relativeFile = file.slice(formattedDirInput.length);
				const url = (dirOutput + relativeFile).replace(/\\/g, "/");

				return saveFile(file, url);
			}),
		);
	};

	const saveFile = async (filePath: string, fileName: string) => {
		const { publicClient, privateClient } = getClient();
		const content = await streamToBuffer(fs.createReadStream(filePath));

		const uploadToAzureContainer = (client: ContainerClient) => {
			const fileInfo = getFileInfo(fileName);
			const blobHTTPHeaders: BlockBlobUploadOptions["blobHTTPHeaders"] = {
				blobCacheControl: "public, max-age=31556926",
			};

			if (fileInfo.mimeType) {
				blobHTTPHeaders.blobContentType = fileInfo.mimeType;
			}

			const blockBlobClient = client.getBlockBlobClient(fileName);

			return blockBlobClient.uploadData(content, {
				blobHTTPHeaders,
			});
		};

		await uploadToAzureContainer(privateClient);
		if (!isFilePrivate(filePath)) {
			await uploadToAzureContainer(publicClient);
		}
	};

	return {
		get,
		save,
		saveFile,
		getUrl(file: string) {
			const { publicClient } = getClient();
			return new URL(
				`${options.publicContainerName}/${file}`,
				publicClient.url,
			);
		},
	};
}
