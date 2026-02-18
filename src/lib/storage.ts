import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface StorageAdapter {
	getUploadUrl(
		key: string,
		contentType: string,
	): Promise<{ uploadUrl: string; key: string }>;
	getStream(
		key: string,
		range?: string,
	): Promise<{ body: ReadableStream; size: number; contentRange?: string }>;
}

class InvalidStorageKeyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidStorageKeyError";
	}
}

function normalizeStorageKey(key: string): string {
	const trimmed = key.trim();
	if (!trimmed) {
		throw new InvalidStorageKeyError("Storage key is empty");
	}
	if (trimmed.includes("\0")) {
		throw new InvalidStorageKeyError("Storage key contains null bytes");
	}
	if (path.isAbsolute(trimmed)) {
		throw new InvalidStorageKeyError("Absolute paths are not allowed");
	}

	const normalized = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
	const segments = normalized.split("/");
	if (
		segments.some(
			(segment) => segment === "" || segment === "." || segment === "..",
		)
	) {
		throw new InvalidStorageKeyError(
			"Storage key contains invalid path segments",
		);
	}
	return normalized;
}

export function resolveLocalStoragePath(
	basePath: string,
	key: string,
): {
	normalizedKey: string;
	filePath: string;
} {
	const normalizedKey = normalizeStorageKey(key);
	const base = path.resolve(basePath);
	const filePath = path.resolve(base, normalizedKey);
	const withinBase =
		filePath === base || filePath.startsWith(`${base}${path.sep}`);
	if (!withinBase) {
		throw new InvalidStorageKeyError(
			"Storage key resolves outside base directory",
		);
	}
	return { normalizedKey, filePath };
}

class LocalStorageAdapter implements StorageAdapter {
	constructor(private basePath: string) {}

	async getUploadUrl(key: string, _contentType: string) {
		const { normalizedKey, filePath } = resolveLocalStoragePath(
			this.basePath,
			key,
		);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		return {
			uploadUrl: `/api/upload?key=${encodeURIComponent(normalizedKey)}`,
			key: normalizedKey,
		};
	}

	async getStream(key: string, range?: string) {
		const { filePath } = resolveLocalStoragePath(this.basePath, key);
		const stat = await fs.stat(filePath);
		const totalSize = stat.size;

		if (range) {
			const [, rangeStr] = range.split("=");
			const [startStr, endStr] = rangeStr.split("-");
			const start = Number.parseInt(startStr, 10);
			const end = endStr ? Number.parseInt(endStr, 10) : totalSize - 1;
			const chunkSize = end - start + 1;

			const nodeStream = createReadStream(filePath, { start, end });
			const webStream = Readable.toWeb(nodeStream) as ReadableStream;

			return {
				body: webStream,
				size: chunkSize,
				contentRange: `bytes ${start}-${end}/${totalSize}`,
			};
		}

		const nodeStream = createReadStream(filePath);
		const webStream = Readable.toWeb(nodeStream) as ReadableStream;
		return { body: webStream, size: totalSize };
	}
}

class S3StorageAdapter implements StorageAdapter {
	private client: S3Client;
	private bucket: string;

	constructor() {
		this.bucket =
			process.env.S3_BUCKET_NAME ?? process.env.R2_BUCKET_NAME ?? "";
		this.client = new S3Client({
			endpoint: process.env.S3_ENDPOINT ?? process.env.R2_ENDPOINT,
			region: process.env.S3_REGION ?? "auto",
			credentials: {
				accessKeyId:
					process.env.S3_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID ?? "",
				secretAccessKey:
					process.env.S3_SECRET_ACCESS_KEY ??
					process.env.R2_SECRET_ACCESS_KEY ??
					"",
			},
		});
	}

	async getUploadUrl(key: string, contentType: string) {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ContentType: contentType,
		});
		const uploadUrl = await getSignedUrl(this.client, command, {
			expiresIn: 3600,
		});
		return { uploadUrl, key };
	}

	async getStream(key: string, range?: string) {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
			...(range ? { Range: range } : {}),
		});
		const response = await this.client.send(command);
		const body = response.Body as { transformToWebStream(): ReadableStream };
		return {
			body: body.transformToWebStream(),
			size: response.ContentLength ?? 0,
			contentRange: response.ContentRange,
		};
	}
}

export const storage: StorageAdapter =
	process.env.NODE_ENV === "development"
		? new LocalStorageAdapter("./uploads")
		: new S3StorageAdapter();
