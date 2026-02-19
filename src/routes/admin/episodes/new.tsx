import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { EpisodeForm } from "#/components/EpisodeForm"

export const Route = createFileRoute("/admin/episodes/new")({
	component: NewEpisodePage,
})

function NewEpisodePage() {
	const navigate = useNavigate()

	return (
		<div className="p-4 sm:p-6 md:p-8">
			<div className="mb-6 sm:mb-8">
				<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
					CREATE
				</div>
				<h1 className="font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">
					NEW EPISODE
				</h1>
			</div>
			<EpisodeForm onSuccess={() => navigate({ to: "/admin/episodes" })} />
		</div>
	)
}
