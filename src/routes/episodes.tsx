import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTRPC } from "#/integrations/trpc/react"
import { EpisodeCard } from "#/components/EpisodeCard"

export const Route = createFileRoute("/episodes")({ component: EpisodesPage })

function EpisodesPage() {
	const trpc = useTRPC()
	const [page, setPage] = useState(1)

	const { data, isLoading } = useQuery(
		trpc.episodes.list.queryOptions({ page, perPage: 10 }),
	)

	return (
		<div className="min-h-screen bg-[#0a0a0a]">
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
	)
}
