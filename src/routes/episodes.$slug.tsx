import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "#/integrations/trpc/react";
import { AudioPlayer } from "#/components/AudioPlayer";

function titleFromSlug(slug: string): string {
	return slug
		.split("-")
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase() + part.slice(1))
		.join(" ");
}

const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "";

function absoluteUrl(path: string): string {
	return siteUrl ? `${siteUrl}${path}` : path;
}

export const Route = createFileRoute("/episodes/$slug")({
	head: ({ params }) => {
		const episodeTitle = titleFromSlug(params.slug) || "Episode";
		const slug = encodeURIComponent(params.slug);
		const canonicalUrl = absoluteUrl(`/episodes/${slug}`);
		const imageUrl = absoluteUrl(`/api/og/episode/${slug}`);

		return {
			meta: [
				{ title: `${episodeTitle} | imposter.fm` },
				{
					name: "description",
					content: `Listen to "${episodeTitle}" on imposter.fm.`,
				},
				{ property: "og:type", content: "article" },
				{ property: "og:site_name", content: "imposter.fm" },
				{ property: "og:title", content: `${episodeTitle} | imposter.fm` },
				{
					property: "og:description",
					content: `Listen to "${episodeTitle}" on imposter.fm.`,
				},
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:image", content: imageUrl },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: `${episodeTitle} | imposter.fm` },
				{
					name: "twitter:description",
					content: `Listen to "${episodeTitle}" on imposter.fm.`,
				},
				{ name: "twitter:image", content: imageUrl },
			],
			links: [{ rel: "canonical", href: canonicalUrl }],
		};
	},
	component: EpisodePage,
});

function EpisodePage() {
	const { slug } = Route.useParams();
	const trpc = useTRPC();
	const [origin, setOrigin] = useState("");
	const [copied, setCopied] = useState(false);

	const { data: episode, isLoading } = useQuery(
		trpc.episodes.getBySlug.queryOptions({ slug }),
	);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setOrigin(window.location.origin);
		}
	}, []);

	const embedSrc = useMemo(() => {
		const base = origin || "";
		return `${base}/embed/${slug}`;
	}, [origin, slug]);

	const embedCode = useMemo(() => {
		return `<iframe src="${embedSrc}" width="100%" height="260" frameborder="0" loading="lazy" allow="autoplay"></iframe>`;
	}, [embedSrc]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-mono text-white/40 text-sm uppercase tracking-widest">
					LOADING...
				</div>
			</div>
		);
	}

	if (!episode) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-4">
						404
					</div>
					<div className="font-black text-white text-4xl uppercase mb-6">
						EPISODE NOT FOUND
					</div>
					<Link
						to="/episodes"
						className="font-mono text-xs text-white/40 hover:text-white uppercase tracking-widest"
					>
						← ALL EPISODES
					</Link>
				</div>
			</div>
		);
	}

	async function copyEmbedCode() {
		try {
			await navigator.clipboard.writeText(embedCode);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	}

	function formatDate(date: Date | string | null): string {
		if (!date) return "";
		return new Date(date).toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	}

	function formatDuration(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		if (h > 0)
			return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
		return `${m}:${String(s).padStart(2, "0")}`;
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a]">
			{/* Header */}
			<section className="border-b-2 border-white px-6 py-12">
				<div className="max-w-4xl mx-auto">
					<Link
						to="/episodes"
						className="font-mono text-xs text-white/30 hover:text-white uppercase tracking-widest mb-8 block transition-colors"
					>
						← ALL EPISODES
					</Link>

					<div className="flex items-center gap-3 mb-4">
						{episode.episodeNumber != null && (
							<span className="font-mono text-xs text-[#22c55e] uppercase tracking-widest">
								EP {String(episode.episodeNumber).padStart(3, "0")}
							</span>
						)}
						{episode.seasonNumber != null && (
							<span className="font-mono text-xs text-white/30 border border-white/20 px-1.5 py-0.5">
								S{episode.seasonNumber}
							</span>
						)}
						{episode.explicit && (
							<span className="font-mono text-xs text-white/30 border border-white/20 px-1.5 py-0.5">
								E
							</span>
						)}
					</div>

					<div className="border-t-2 border-white mb-6" />

					<h1 className="font-black text-white text-5xl md:text-6xl uppercase tracking-tight leading-none mb-4">
						{episode.title}
					</h1>

					<div className="flex items-center gap-4 font-mono text-xs text-white/40 uppercase tracking-widest">
						{episode.publishedAt && (
							<span>{formatDate(episode.publishedAt)}</span>
						)}
						{episode.audioDuration > 0 && (
							<>
								<span>·</span>
								<span>{formatDuration(episode.audioDuration)}</span>
							</>
						)}
					</div>
				</div>
			</section>

			{/* Player */}
			<section className="border-b-2 border-white px-6 py-8">
				<div className="max-w-4xl mx-auto">
					<AudioPlayer
						src={`/api/stream/${episode.id}`}
						episodeId={episode.id}
						title={episode.title}
						duration={episode.audioDuration}
					/>

					<div className="mt-5 border border-white/20 p-4">
						<div className="font-mono text-[11px] text-[#22c55e] uppercase tracking-[0.18em] mb-3">
							Embed This Episode
						</div>
						<div className="font-mono text-xs text-white/50 mb-3">
							Paste this iframe into any page to embed the audio widget.
						</div>
						<pre className="font-mono text-xs text-white/80 bg-black/40 border border-white/15 p-3 overflow-x-auto whitespace-pre-wrap break-all">
							{embedCode}
						</pre>
						<div className="mt-3 flex items-center gap-3">
							<button
								type="button"
								onClick={copyEmbedCode}
								className="border border-[#22c55e] text-[#22c55e] font-mono text-[11px] uppercase tracking-widest px-3 py-2 hover:bg-[#22c55e] hover:text-black transition-colors"
							>
								{copied ? "Copied" : "Copy Embed Code"}
							</button>
							<a
								href={`/embed/${episode.slug}`}
								target="_blank"
								rel="noopener noreferrer"
								className="font-mono text-[11px] text-white/50 hover:text-white transition-colors uppercase tracking-widest"
							>
								Preview Widget ↗
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Description */}
			<section className="px-6 py-12">
				<div className="max-w-4xl mx-auto">
					<p className="text-white/70 text-lg leading-relaxed mb-8">
						{episode.description}
					</p>

					{/* Show notes */}
					{episode.content && (
						<div className="border-t-2 border-white/20 pt-8">
							<div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-6">
								SHOW NOTES
							</div>
							<div className="text-white/70 leading-relaxed whitespace-pre-wrap break-words">
								{episode.content}
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
