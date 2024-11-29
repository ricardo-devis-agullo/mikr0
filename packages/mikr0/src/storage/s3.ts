import fs from "node:fs";
import { promisify } from "node:util";
import { S3, type S3ClientConfig } from "@aws-sdk/client-s3";
import {
	NodeHttpHandler,
	type NodeHttpHandlerOptions,
} from "@aws-sdk/node-http-handler";
import nodeDir, { type PathsResult } from "node-dir";

import type { Agent as httpAgent } from "node:http";
import type { Agent as httpsAgent } from "node:https";
import type { StaticStorage } from "./storage.js";
import { getFileInfo, isFilePrivate } from "./utils.js";
import type { S3StorageOptions } from "../types.js";

const getPaths: (path: string) => Promise<PathsResult> = promisify(
	nodeDir.paths,
);

const streamToString = (stream: NodeJS.ReadableStream) =>
	new Promise<string>((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on("data", (chunk) => chunks.push(chunk));
		stream.on("error", reject);
		stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
	});

export function S3Storage(conf: S3StorageOptions): StaticStorage {
	const accessKeyId = conf.key;
	const secretAccessKey = conf.secret;
	const region = conf.region;
	const bucket = conf.bucket ? conf.bucket : "";
	const sslEnabled = conf.sslEnabled === false;
	const s3ForcePathStyle = !!conf.s3ForcePathStyle;

	let requestHandler: NodeHttpHandler | undefined;
	if (conf.agentProxy) {
		const handlerOptions: NodeHttpHandlerOptions = {
			connectionTimeout: conf.timeout || 10000,
		};
		if (sslEnabled) {
			handlerOptions.httpAgent = conf.agentProxy as httpAgent;
		} else {
			handlerOptions.httpsAgent = conf.agentProxy as httpsAgent;
		}
		requestHandler = new NodeHttpHandler(handlerOptions);
	}

	let client: S3 | undefined = undefined;

	const getClient = () => {
		if (!client) {
			const configOpts: S3ClientConfig = {
				logger: conf.debug ? (console as any) : undefined,
				tls: sslEnabled,
				requestHandler,
				endpoint: conf.endpoint,
				region,
				forcePathStyle: s3ForcePathStyle,
			};
			if (accessKeyId && secretAccessKey) {
				configOpts.credentials = {
					accessKeyId,
					secretAccessKey,
				};
			}
			client = new S3(configOpts);
		}
		return client;
	};

	const get = async (filePath: string) => {
		try {
			const data = await getClient().getObject({
				Bucket: bucket,
				Key: filePath,
			});

			return streamToString(data.Body as any);
		} catch (err) {
			throw (err as any).code === "NoSuchKey"
				? {
						code: "file_not_found",
						msg: `File "${filePath}" not found`,
					}
				: err;
		}
	};

	const save = async (dirInput: string, dirOutput: string) => {
		const paths = await getPaths(dirInput);

		await Promise.all(
			paths.files.map((file: string) => {
				const formattedDirInput = dirInput.replace(/^[./\\]+/, "");
				const relativeFile = file.slice(formattedDirInput.length);
				const url = (dirOutput + relativeFile).replace(/\\/g, "/");

				return saveFile(file, url);
			}),
		);
	};

	async function saveFile(filePath: string, fileName: string) {
		const stream = fs.createReadStream(filePath);
		const client = getClient();
		const fileInfo = getFileInfo(fileName);

		await client.putObject({
			Bucket: bucket,
			Key: fileName,
			Body: stream,
			ContentType: fileInfo.mimeType,
			ContentEncoding: undefined,
			ACL: isFilePrivate(fileName) ? "authenticated-read" : "public-read",
			ServerSideEncryption: "AES256",
			Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
		});
	}

	return {
		get,
		save,
		saveFile,
		getUrl(file: string) {
      if (conf.publicPath) {
        return new URL(
          file,
          conf.publicPath
        );
      }

			return new URL(file, `https://${bucket}.s3.${region}.amazonaws.com`);
		},
	};
}
