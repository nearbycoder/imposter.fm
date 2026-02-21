import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { episodes } from "#/db/schema";

const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function absoluteUrl(baseUrl: string, path: string): string {
	return `${baseUrl}${path}`;
}

function formatLastModified(value: Date | string | null | undefined): string {
	if (!value) return new Date().toISOString();
	return new Date(value).toISOString();
}

async function handler({ request }: { request: Request }) {
	const requestOrigin = new URL(request.url).origin;
	const baseUrl = configuredSiteUrl || requestOrigin;

	const publishedEpisodes = await db
		.select({
			slug: episodes.slug,
			publishedAt: episodes.publishedAt,
			updatedAt: episodes.updatedAt,
		})
		.from(episodes)
		.where(eq(episodes.status, "published"))
		.orderBy(desc(episodes.publishedAt), desc(episodes.updatedAt));

	const staticUrls = [
		{
			loc: absoluteUrl(baseUrl, "/"),
			changefreq: "daily",
			priority: "1.0",
			lastmod: new Date().toISOString(),
		},
		{
			loc: absoluteUrl(baseUrl, "/episodes"),
			changefreq: "daily",
			priority: "0.9",
			lastmod: new Date().toISOString(),
		},
		{
			loc: absoluteUrl(baseUrl, "/rss.xml"),
			changefreq: "daily",
			priority: "0.7",
			lastmod: new Date().toISOString(),
		},
	];

	const episodeUrls = publishedEpisodes.map((episode) => ({
		loc: absoluteUrl(baseUrl, `/episodes/${encodeURIComponent(episode.slug)}`),
		changefreq: "weekly",
		priority: "0.8",
		lastmod: formatLastModified(episode.updatedAt ?? episode.publishedAt),
	}));

	const urls = [...staticUrls, ...episodeUrls]
		.map(
			(url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${escapeXml(url.lastmod)}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
		)
		.join("");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	});
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: handler,
		},
	},
});
