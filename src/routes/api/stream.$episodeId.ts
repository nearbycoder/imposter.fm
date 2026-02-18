import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { db } from "#/db"
import { episodes } from "#/db/schema"
import { storage } from "#/lib/storage"

async function handler({
	request,
	params,
}: { request: Request; params: { episodeId: string } }) {
	const id = Number.parseInt(params.episodeId, 10)
	if (Number.isNaN(id)) {
		return new Response("Invalid episode ID", { status: 400 })
	}

	const [episode] = await db
		.select()
		.from(episodes)
		.where(eq(episodes.id, id))
		.limit(1)

	if (!episode) {
		return new Response("Episode not found", { status: 404 })
	}

	const range = request.headers.get("range") ?? undefined

	try {
		const { body, size, contentRange } = await storage.getStream(
			episode.audioKey,
			range,
		)

		const headers: Record<string, string> = {
			"Content-Type": episode.audioMimeType,
			"Accept-Ranges": "bytes",
			"Cache-Control": "public, max-age=86400",
			"Content-Length": String(size),
		}

		if (contentRange) {
			headers["Content-Range"] = contentRange
		}

		return new Response(body as BodyInit, {
			status: contentRange ? 206 : 200,
			headers,
		})
	} catch {
		return new Response("Audio not found", { status: 404 })
	}
}

export const Route = createFileRoute("/api/stream/$episodeId")({
	server: {
		handlers: {
			GET: handler,
		},
	},
})
