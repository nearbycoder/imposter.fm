import { createFileRoute } from "@tanstack/react-router";
import { ImageResponse } from "@vercel/og";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { episodes, podcast } from "#/db/schema";

const WIDTH = 1200;
const HEIGHT = 630;

function clamp(value: string, max: number): string {
	if (value.length <= max) return value;
	return `${value.slice(0, max - 3)}...`;
}

async function handler() {
	const [podcastConfig, latestEpisode] = await Promise.all([
		db
			.select({
				title: podcast.title,
				description: podcast.description,
			})
			.from(podcast)
			.limit(1)
			.then((rows) => rows[0]),
		db
			.select({
				title: episodes.title,
			})
			.from(episodes)
			.where(eq(episodes.status, "published"))
			.orderBy(desc(episodes.publishedAt), desc(episodes.createdAt))
			.limit(1)
			.then((rows) => rows[0]),
	]);

	const title = clamp(podcastConfig?.title ?? "IMPOSTER.FM", 22);
	const description = clamp(
		podcastConfig?.description ??
			"One engineer. One layoff. What happens when the career that once felt stable starts to feel like borrowed time.",
		140,
	);
	const latest = clamp(latestEpisode?.title ?? "New episodes coming soon", 68);
	const bars = Array.from({ length: 64 }, (_, i) =>
		Math.round(
			Math.abs(Math.sin(i * 0.34)) * 68 +
				Math.abs(Math.cos(i * 0.17)) * 38 +
				12,
		),
	);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				background:
					"radial-gradient(circle at 18% 0%, #1b1b1b 0%, #0a0a0a 52%, #040404 100%)",
				color: "#ffffff",
				padding: "52px",
				border: "2px solid rgba(255,255,255,0.2)",
				fontFamily: '"Helvetica Neue", Arial, sans-serif',
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
				<div
					style={{
						display: "flex",
						fontFamily: '"Courier New", monospace',
						fontSize: 22,
						textTransform: "uppercase",
						letterSpacing: 7,
						color: "#22c55e",
					}}
				>
					A Podcast About
				</div>
				<div
					style={{
						display: "flex",
						width: "100%",
						height: 2,
						backgroundColor: "rgba(255,255,255,0.9)",
					}}
				/>
				<div
					style={{
						display: "flex",
						fontSize: 106,
						lineHeight: 0.9,
						fontWeight: 900,
						textTransform: "uppercase",
						letterSpacing: -3,
					}}
				>
					{title}
				</div>
				<div
					style={{
						display: "flex",
						fontSize: 30,
						lineHeight: 1.3,
						color: "rgba(255,255,255,0.72)",
						maxWidth: "88%",
					}}
				>
					{description}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					width: "100%",
					gap: 20,
				}}
			>
				<div style={{ display: "flex", gap: 12 }}>
					{["POCKET CASTS", "RSS FEED", "ALL EPISODES"].map((label, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: deterministic static image layout
							key={index}
							style={{
								display: "flex",
								border:
									label === "ALL EPISODES"
										? "2px solid #22c55e"
										: "2px solid rgba(255,255,255,0.7)",
								color: label === "ALL EPISODES" ? "#22c55e" : "#ffffff",
								padding: "8px 14px",
								fontFamily: '"Courier New", monospace',
								fontSize: 16,
								letterSpacing: 2,
								textTransform: "uppercase",
							}}
						>
							{label}
						</div>
					))}
				</div>
				<div
					style={{
						display: "flex",
						fontFamily: '"Courier New", monospace',
						fontSize: 16,
						textTransform: "uppercase",
						letterSpacing: 2,
						color: "rgba(255,255,255,0.7)",
					}}
				>
					Latest Episode: {latest}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 12,
				}}
			>
				<div
					style={{
						display: "flex",
						fontFamily: '"Courier New", monospace',
						fontSize: 14,
						textTransform: "uppercase",
						letterSpacing: 3,
						color: "rgba(255,255,255,0.42)",
					}}
				>
					Signal
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						gap: 4,
						height: 96,
						width: "100%",
					}}
				>
					{bars.map((bar, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: deterministic static image layout
							key={index}
							style={{
								display: "flex",
								width: 13,
								height: bar,
								background:
									index % 11 === 0 ? "#22c55e" : "rgba(255,255,255,0.34)",
								borderRadius: 2,
							}}
						/>
					))}
				</div>
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
}

export const Route = createFileRoute("/api/og/home")({
	server: {
		handlers: {
			GET: handler,
		},
	},
});
