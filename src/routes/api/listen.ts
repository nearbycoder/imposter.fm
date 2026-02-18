import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "#/db";
import { episodeListens, episodes } from "#/db/schema";

const LISTENER_COOKIE = "imposter_listener_id";
const RECENT_WINDOW_MS = 30_000;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

interface ListenPayload {
	episodeId?: unknown;
}

function getCookieValue(
	cookieHeader: string | null,
	name: string,
): string | null {
	if (!cookieHeader) return null;
	const parts = cookieHeader.split(";");
	for (const part of parts) {
		const [rawName, ...rest] = part.trim().split("=");
		if (rawName !== name) continue;
		return decodeURIComponent(rest.join("="));
	}
	return null;
}

function buildSetCookie(name: string, value: string, secure: boolean): string {
	const attrs = [
		`${name}=${encodeURIComponent(value)}`,
		"Path=/",
		`Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
		"SameSite=Lax",
		"HttpOnly",
	];
	if (secure) {
		attrs.push("Secure");
	}
	return attrs.join("; ");
}

async function handler({ request }: { request: Request }) {
	let body: ListenPayload;
	try {
		body = (await request.json()) as ListenPayload;
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const episodeId =
		typeof body.episodeId === "number"
			? body.episodeId
			: Number.parseInt(String(body.episodeId ?? ""), 10);

	if (!Number.isFinite(episodeId) || episodeId <= 0) {
		return Response.json({ error: "Invalid episodeId" }, { status: 400 });
	}

	const [episode] = await db
		.select({ id: episodes.id })
		.from(episodes)
		.where(eq(episodes.id, episodeId))
		.limit(1);

	if (!episode) {
		return Response.json({ error: "Episode not found" }, { status: 404 });
	}

	const url = new URL(request.url);
	const existingListenerId = getCookieValue(
		request.headers.get("cookie"),
		LISTENER_COOKIE,
	);
	const listenerId = existingListenerId ?? crypto.randomUUID();
	const cutoff = new Date(Date.now() - RECENT_WINDOW_MS);
	const userAgent = request.headers.get("user-agent");

	const [recentListen] = await db
		.select({ id: episodeListens.id })
		.from(episodeListens)
		.where(
			and(
				eq(episodeListens.episodeId, episodeId),
				eq(episodeListens.listenerId, listenerId),
				gte(episodeListens.createdAt, cutoff),
			),
		)
		.orderBy(desc(episodeListens.createdAt))
		.limit(1);

	let tracked = false;
	if (!recentListen) {
		await db.insert(episodeListens).values({
			episodeId,
			listenerId,
			userAgent,
		});
		tracked = true;
	}

	const headers = new Headers({
		"Cache-Control": "no-store",
	});

	if (!existingListenerId) {
		headers.append(
			"Set-Cookie",
			buildSetCookie(LISTENER_COOKIE, listenerId, url.protocol === "https:"),
		);
	}

	return Response.json({ success: true, tracked }, { headers });
}

export const Route = createFileRoute("/api/listen")({
	server: {
		handlers: {
			POST: handler,
		},
	},
});
