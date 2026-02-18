import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"

export const Route = createFileRoute("/admin/episodes/")({
	component: AdminEpisodesList,
})

function AdminEpisodesList() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: episodesList, isLoading } = useQuery(
		trpc.episodes.adminList.queryOptions(),
	)

	const deleteMutation = useMutation(
		trpc.episodes.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.episodes.adminList.queryOptions())
			},
		}),
	)

	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60)
		const s = seconds % 60
		return `${m}:${String(s).padStart(2, "0")}`
	}

	function handleDelete(id: number, title: string) {
		if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
			deleteMutation.mutate({ id })
		}
	}

	return (
		<div className="p-8">
			<div className="flex items-start justify-between mb-8">
				<div>
					<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
						MANAGE
					</div>
					<h1 className="font-black text-white text-4xl uppercase tracking-tight">
						EPISODES
					</h1>
				</div>
				<Link
					to="/admin/episodes/new"
					className="border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest px-6 py-3 hover:bg-[#22c55e] hover:text-black transition-colors"
				>
					+ NEW EPISODE
				</Link>
			</div>

			{isLoading && (
				<div className="font-mono text-white/40 text-sm">LOADING...</div>
			)}

			{!isLoading && (!episodesList || episodesList.length === 0) && (
				<div className="border-2 border-white/20 p-8 text-center">
					<div className="font-mono text-white/40 text-sm mb-4">
						NO EPISODES YET
					</div>
					<Link
						to="/admin/episodes/new"
						className="font-mono text-xs text-[#22c55e] hover:underline"
					>
						Create your first episode →
					</Link>
				</div>
			)}

			{episodesList && episodesList.length > 0 && (
				<div className="border-2 border-white">
					{/* Table header */}
					<div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b-2 border-white bg-white/5">
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
							#
						</div>
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
							TITLE
						</div>
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
							DURATION
						</div>
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
							STATUS
						</div>
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
							ACTIONS
						</div>
					</div>

					{episodesList.map((ep, index) => (
						<div
							key={ep.id}
							className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center ${
								index < episodesList.length - 1
									? "border-b border-white/20"
									: ""
							}`}
						>
							<div className="font-mono text-xs text-white/40 w-8">
								{ep.episodeNumber != null
									? String(ep.episodeNumber).padStart(3, "0")
									: "—"}
							</div>
							<div>
								<div className="font-black text-white text-sm uppercase">
									{ep.title}
								</div>
								<div className="font-mono text-xs text-white/40 mt-0.5">
									/{ep.slug}
								</div>
							</div>
							<div className="font-mono text-xs text-white/60">
								{ep.audioDuration > 0
									? formatDuration(ep.audioDuration)
									: "—"}
							</div>
							<div>
								<span
									className={`font-mono text-xs uppercase tracking-widest px-2 py-0.5 border ${
										ep.status === "published"
											? "border-[#22c55e] text-[#22c55e]"
											: "border-white/30 text-white/40"
									}`}
								>
									{ep.status}
								</span>
							</div>
							<div className="flex gap-2">
								<Link
									to="/admin/episodes/$id/edit"
									params={{ id: String(ep.id) }}
									className="font-mono text-xs text-white/60 hover:text-white border border-white/20 hover:border-white px-2 py-1 transition-colors"
								>
									EDIT
								</Link>
								<button
									type="button"
									onClick={() => handleDelete(ep.id, ep.title)}
									disabled={deleteMutation.isPending}
									className="font-mono text-xs text-red-500/60 hover:text-red-500 border border-red-500/20 hover:border-red-500 px-2 py-1 transition-colors disabled:opacity-30"
								>
									DEL
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
