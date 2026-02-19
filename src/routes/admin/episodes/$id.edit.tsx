import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"
import { EpisodeForm } from "#/components/EpisodeForm"

export const Route = createFileRoute("/admin/episodes/$id/edit")({
	component: EditEpisodePage,
})

function EditEpisodePage() {
	const { id } = Route.useParams()
	const navigate = useNavigate()
	const trpc = useTRPC()

	const { data: episode, isLoading } = useQuery(
		trpc.episodes.adminGetById.queryOptions({ id: Number(id) }),
	)

	if (isLoading) {
		return (
			<div className="p-4 sm:p-6 md:p-8">
				<div className="font-mono text-white/40 text-sm">LOADING...</div>
			</div>
		)
	}

	if (!episode) {
		return (
			<div className="p-4 sm:p-6 md:p-8">
				<div className="font-mono text-red-500 text-sm">
					EPISODE NOT FOUND
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 sm:p-6 md:p-8">
			<div className="mb-6 sm:mb-8">
				<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
					EDIT
				</div>
				<h1 className="font-black text-white text-2xl sm:text-3xl uppercase tracking-tight break-words">
					{episode.title}
				</h1>
			</div>
			<EpisodeForm
				episode={episode}
				onSuccess={() => navigate({ to: "/admin/episodes" })}
			/>
		</div>
	)
}
