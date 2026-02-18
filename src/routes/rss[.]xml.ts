import { createFileRoute } from "@tanstack/react-router"
import { desc, eq } from "drizzle-orm"
import { db } from "#/db"
import { episodes, podcast } from "#/db/schema"

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60
	if (h > 0) {
		return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
	}
	return `${m}:${String(s).padStart(2, "0")}`
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
}

async function handler({ request }: { request: Request }) {
	const baseUrl = new URL(request.url).origin

	const [podcastConfig, publishedEpisodes] = await Promise.all([
		db.select().from(podcast).limit(1),
		db
			.select()
			.from(episodes)
			.where(eq(episodes.status, "published"))
			.orderBy(desc(episodes.publishedAt)),
	])

	const config = podcastConfig[0] ?? {
		title: "IMPOSTER.FM",
		subtitle: "Stories from the AI-era job market",
		description:
			"A podcast about navigating layoffs in the AI era: the job hunt, uncertainty, and rebuilding momentum.",
		author: "IMPOSTER.FM",
		email: "hello@imposter.fm",
		imageUrl: `${baseUrl}/logo512.png`,
		language: "en",
		category: "Technology",
		subcategory: "",
		explicit: false,
		websiteUrl: baseUrl,
		copyright: "",
	}

	const now = new Date().toUTCString()

	const items = publishedEpisodes
		.map((ep) => {
			const pubDate = ep.publishedAt
				? new Date(ep.publishedAt).toUTCString()
				: now
			const enclosureUrl = `${baseUrl}/api/stream/${ep.id}`
			const guid = `${baseUrl}/episodes/${ep.slug}`

			return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <enclosure url="${escapeXml(enclosureUrl)}" length="${ep.audioSize}" type="${escapeXml(ep.audioMimeType)}" />
      <guid isPermaLink="true">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <itunes:duration>${formatDuration(ep.audioDuration)}</itunes:duration>
      <itunes:explicit>${ep.explicit ? "true" : "false"}</itunes:explicit>
      <itunes:episodeType>${escapeXml(ep.episodeType)}</itunes:episodeType>
      ${ep.episodeNumber != null ? `<itunes:episode>${ep.episodeNumber}</itunes:episode>` : ""}
      ${ep.seasonNumber != null ? `<itunes:season>${ep.seasonNumber}</itunes:season>` : ""}
      ${ep.content ? `<content:encoded><![CDATA[${ep.content}]]></content:encoded>` : ""}
    </item>`
		})
		.join("\n")

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.title)}</title>
    <description>${escapeXml(config.description)}</description>
    <link>${escapeXml(config.websiteUrl)}</link>
    <language>${escapeXml(config.language)}</language>
    <copyright>${escapeXml(config.copyright)}</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(config.author)}</itunes:author>
    <itunes:subtitle>${escapeXml(config.subtitle)}</itunes:subtitle>
    <itunes:summary>${escapeXml(config.description)}</itunes:summary>
    <itunes:explicit>${config.explicit ? "true" : "false"}</itunes:explicit>
    <itunes:image href="${escapeXml(config.imageUrl)}" />
    <itunes:owner>
      <itunes:name>${escapeXml(config.author)}</itunes:name>
      <itunes:email>${escapeXml(config.email)}</itunes:email>
    </itunes:owner>
    <itunes:category text="${escapeXml(config.category)}">
      ${config.subcategory ? `<itunes:category text="${escapeXml(config.subcategory)}" />` : ""}
    </itunes:category>
    ${items}
  </channel>
</rss>`

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	})
}

export const Route = createFileRoute("/rss.xml")({
	server: {
		handlers: {
			GET: handler,
		},
	},
})
