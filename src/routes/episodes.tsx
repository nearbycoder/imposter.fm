import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EpisodeCard } from "#/components/EpisodeCard";
import { useTRPC } from "#/integrations/trpc/react";

const EPISODES_DESCRIPTION =
	"Browse all imposter.fm episodes about layoffs, rebuilding momentum, and navigating software careers in the AI era.";
const siteUrl =
	import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "https://imposter.fm";

function absoluteUrl(path: string): string {
	return `${siteUrl}${path}`;
}

export const Route = createFileRoute("/episodes")({
	head: () => {
		const canonicalUrl = absoluteUrl("/episodes");
		const imageUrl = absoluteUrl("/api/og/home");

		return {
			meta: [
				{ title: "Episodes | imposter.fm" },
				{ name: "description", content: EPISODES_DESCRIPTION },
				{
					name: "robots",
					content: "index,follow,max-image-preview:large,max-snippet:-1",
				},
				{ property: "og:type", content: "website" },
				{ property: "og:site_name", content: "imposter.fm" },
				{ property: "og:title", content: "Episodes | imposter.fm" },
				{ property: "og:locale", content: "en_US" },
				{ property: "og:description", content: EPISODES_DESCRIPTION },
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:image", content: imageUrl },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
				{
					property: "og:image:alt",
					content: "imposter.fm episode archive",
				},
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: "Episodes | imposter.fm" },
				{ name: "twitter:description", content: EPISODES_DESCRIPTION },
				{ name: "twitter:image", content: imageUrl },
				{ name: "twitter:image:alt", content: "imposter.fm episode archive" },
			],
			links: [{ rel: "canonical", href: canonicalUrl }],
		};
	},
	component: EpisodesPage,
});

function EpisodesPage() {
	const trpc = useTRPC();
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery(
		trpc.episodes.list.queryOptions({ page, perPage: 10 }),
	);
	const episodesJsonLd = JSON.stringify({
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Episodes | imposter.fm",
		description: EPISODES_DESCRIPTION,
		url: absoluteUrl("/episodes"),
		isPartOf: {
			"@type": "WebSite",
			name: "imposter.fm",
			url: absoluteUrl("/"),
		},
	}).replaceAll("<", "\\u003c");

	return (
		<div className="min-h-screen bg-[#0a0a0a]">
			<script type="application/ld+json">{episodesJsonLd}</script>
			<section className="border-b-2 border-white px-6 py-12">
				<div className="max-w-4xl mx-auto">
					<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-2">
						ARCHIVE
					</div>
					<h1 className="font-black text-white text-5xl uppercase tracking-tight">
						EPISODES
					</h1>
				</div>
			</section>

			<section className="px-6 py-12">
				<div className="max-w-4xl mx-auto">
					{isLoading && (
						<div className="font-mono text-white/40 text-sm py-12 text-center">
							LOADING...
						</div>
					)}

					{!isLoading && (!data?.items || data.items.length === 0) && (
						<div className="border-2 border-white/20 p-12 text-center">
							<div className="font-mono text-white/20 text-sm uppercase tracking-widest">
								NO EPISODES YET
							</div>
						</div>
					)}

					{data?.items && data.items.length > 0 && (
						<>
							<div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-6">
								{data.total} EPISODE{data.total !== 1 ? "S" : ""}
							</div>

							<div className="grid gap-4 mb-8">
								{data.items.map((episode) => (
									<EpisodeCard key={episode.id} episode={episode} />
								))}
							</div>

							{/* Pagination */}
							{data.totalPages > 1 && (
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page <= 1}
										className="font-mono text-xs border-2 border-white text-white uppercase tracking-widest px-4 py-2 hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									>
										← PREV
									</button>
									<span className="font-mono text-xs text-white/40 uppercase tracking-widest px-4">
										{page} / {data.totalPages}
									</span>
									<button
										type="button"
										onClick={() =>
											setPage((p) => Math.min(data.totalPages, p + 1))
										}
										disabled={page >= data.totalPages}
										className="font-mono text-xs border-2 border-white text-white uppercase tracking-widest px-4 py-2 hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									>
										NEXT →
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
