import { ImageResponse } from "@vercel/og";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { episodes } from "#/db/schema";

const WIDTH = 1200;
const HEIGHT = 630;

function clampTitle(title: string): string {
	if (title.length <= 90) return title;
	return `${title.slice(0, 87)}...`;
}

async function handler({ params }: { params: { slug: string } }) {
	const [episode] = await db
		.select({
			title: episodes.title,
			description: episodes.description,
		})
		.from(episodes)
		.where(
			and(eq(episodes.slug, params.slug), eq(episodes.status, "published")),
		)
		.limit(1);

	if (!episode) {
		return new Response("Episode not found", { status: 404 });
	}

	const title = clampTitle(episode.title);
	const subtitle = clampTitle(
		episode.description || "A podcast by imposter.fm",
	);
	const bars = Array.from({ length: 56 }, (_, i) => {
		const value =
			Math.abs(Math.sin(i * 0.34)) * 90 +
			Math.abs(Math.cos(i * 0.19)) * 58 +
			16;
		return Math.round(value);
	});

	const image = new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				background:
					"radial-gradient(circle at 20% 0%, #1a1a1a 0%, #080808 50%, #020202 100%)",
				color: "#ffffff",
				padding: "56px",
				fontFamily: "Arial, sans-serif",
				border: "2px solid rgba(255,255,255,0.22)",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "12px",
					}}
				>
					<div
						style={{
							fontSize: 22,
							letterSpacing: 7,
							textTransform: "uppercase",
							color: "#22c55e",
						}}
					>
						IMPOSTER.FM
					</div>
				</div>
				<div
					style={{
						fontSize: 82,
						lineHeight: 1,
						fontWeight: 900,
						textTransform: "uppercase",
						letterSpacing: -2,
						maxWidth: "98%",
					}}
				>
					{title}
				</div>
				<div
					style={{
						fontSize: 30,
						lineHeight: 1.3,
						color: "rgba(255,255,255,0.72)",
						maxWidth: "84%",
					}}
				>
					{subtitle}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "flex-end",
					gap: 5,
					height: 118,
					width: "100%",
				}}
			>
				{bars.map((bar, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: deterministic static image layout
						key={index}
						style={{
							width: 12,
							height: bar,
							background:
								index % 9 === 0 ? "#22c55e" : "rgba(255,255,255,0.34)",
							borderRadius: 2,
						}}
					/>
				))}
			</div>
		</div>,
		{
			width: WIDTH,
			height: HEIGHT,
			headers: {
				"Cache-Control": "public, max-age=3600, s-maxage=86400",
			},
		},
	);

	return image;
}

export const Route = createFileRoute("/api/og/episode/$slug")({
	server: {
		handlers: {
			GET: handler,
		},
	},
});
