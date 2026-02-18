import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"
import { AudioPlayer } from "#/components/AudioPlayer"

export const Route = createFileRoute("/episodes/$slug")({
	component: EpisodePage,
})

function EpisodePage() {
	const { slug } = Route.useParams()
	const trpc = useTRPC()

	const { data: episode, isLoading } = useQuery(
		trpc.episodes.getBySlug.queryOptions({ slug }),
	)

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-mono text-white/40 text-sm uppercase tracking-widest">
					LOADING...
				</div>
			</div>
		)
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
		)
	}

	function formatDate(date: Date | string | null): string {
		if (!date) return ""
		return new Date(date).toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		})
	}

	function formatDuration(seconds: number): string {
		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = Math.floor(seconds % 60)
		if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
		return `${m}:${String(s).padStart(2, "0")}`
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

					{/* Embed link */}
					<div className="mt-3 text-right">
						<a
							href={`/embed/${episode.slug}`}
							target="_blank"
							rel="noopener noreferrer"
							className="font-mono text-xs text-white/20 hover:text-white/40 transition-colors"
						>
							[embed ↗]
						</a>
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
							<div
								className="prose prose-invert prose-sm max-w-none"
								dangerouslySetInnerHTML={{ __html: episode.content }}
							/>
						</div>
					)}
				</div>
			</section>
		</div>
	)
}
