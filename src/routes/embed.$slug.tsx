import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"
import { AudioPlayer } from "#/components/AudioPlayer"

export const Route = createFileRoute("/embed/$slug")({
	component: EmbedPage,
})

function EmbedPage() {
	const { slug } = Route.useParams()
	const trpc = useTRPC()

	const { data: episode, isLoading } = useQuery(
		trpc.episodes.getBySlug.queryOptions({ slug }),
	)

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-mono text-white/40 text-xs uppercase tracking-widest">
					LOADING...
				</div>
			</div>
		)
	}

	if (!episode) {
		return (
			<div className="bg-[#0a0a0a] p-4">
				<div className="font-mono text-red-500 text-xs">EPISODE NOT FOUND</div>
			</div>
		)
	}

	return (
		<div className="bg-[#0a0a0a] min-h-screen p-4">
			<div className="mb-2">
				<div className="font-black text-white text-base uppercase tracking-tight leading-tight mb-0.5">
					{episode.title}
				</div>
				<div className="font-mono text-[#22c55e] text-xs">IMPOSTER.FM</div>
			</div>
			<AudioPlayer
				src={`/api/stream/${episode.id}`}
				episodeId={episode.id}
				title={episode.title}
				duration={episode.audioDuration}
				compact
			/>
		</div>
	)
}
