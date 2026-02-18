import fs from "node:fs/promises"
import path from "node:path"
import { createFileRoute } from "@tanstack/react-router"

async function handler({ request }: { request: Request }) {
	if (process.env.NODE_ENV !== "development") {
		return new Response("Not available in production", { status: 404 })
	}

	const url = new URL(request.url)
	const key = url.searchParams.get("key")

	if (!key) {
		return new Response("Missing key", { status: 400 })
	}

	// Prevent path traversal
	const safePath = path.normalize(key).replace(/^(\.\.[/\\])+/, "")
	const filePath = path.join("./uploads", safePath)

	await fs.mkdir(path.dirname(filePath), { recursive: true })

	const buffer = await request.arrayBuffer()
	await fs.writeFile(filePath, Buffer.from(buffer))

	return new Response("OK", { status: 200 })
}

export const Route = createFileRoute("/api/upload")({
	server: {
		handlers: {
			PUT: handler,
		},
	},
})
