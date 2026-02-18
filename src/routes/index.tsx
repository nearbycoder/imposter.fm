import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"
import { EpisodeCard } from "#/components/EpisodeCard"
import { AudioPlayer } from "#/components/AudioPlayer"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
	const trpc = useTRPC()

	const { data: podcastConfig } = useQuery(trpc.podcast.get.queryOptions())
	const { data: episodesData } = useQuery(
		trpc.episodes.list.queryOptions({ page: 1, perPage: 3 }),
	)

	const latestEpisode = episodesData?.items[0]

	return (
		<div className="min-h-screen bg-[#0a0a0a]">
			{/* Hero */}
			<section className="border-b-2 border-white px-6 py-16 md:py-24">
				<div className="max-w-4xl mx-auto">
					<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-4">
						A PODCAST ABOUT
					</div>
					<h1 className="font-black text-white text-6xl md:text-8xl uppercase tracking-tight leading-none mb-6">
						{podcastConfig?.title ?? "IMPOSTER.FM"}
					</h1>
					<div className="border-t-2 border-white mb-6" />
					<p className="text-white/60 text-lg max-w-2xl leading-relaxed">
						{podcastConfig?.description ??
							"One engineer. One layoff. What happens when the career that once felt stable starts to feel like borrowed time."}
					</p>

					<div className="flex flex-wrap gap-4 mt-8">
						<a
							href="/rss.xml"
							className="font-mono text-xs border-2 border-white text-white uppercase tracking-widest px-4 py-2 hover:bg-white hover:text-black transition-colors"
						>
							RSS FEED
						</a>
						<Link
							to="/episodes"
							className="font-mono text-xs border-2 border-[#22c55e] text-[#22c55e] uppercase tracking-widest px-4 py-2 hover:bg-[#22c55e] hover:text-black transition-colors"
						>
							ALL EPISODES
						</Link>
					</div>
				</div>
			</section>

			{/* Latest episode player */}
			{latestEpisode && (
				<section className="border-b-2 border-white px-6 py-12">
					<div className="max-w-4xl mx-auto">
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-6">
							LATEST EPISODE
						</div>
						<AudioPlayer
							src={`/api/stream/${latestEpisode.id}`}
							episodeId={latestEpisode.id}
							title={latestEpisode.title}
							duration={latestEpisode.audioDuration}
						/>
					</div>
				</section>
			)}

			{/* Recent episodes */}
			{episodesData?.items && episodesData.items.length > 0 && (
				<section className="px-6 py-12">
					<div className="max-w-4xl mx-auto">
						<div className="flex items-center justify-between mb-8">
							<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
								RECENT EPISODES
							</div>
							{episodesData.total > 3 && (
								<Link
									to="/episodes"
									className="font-mono text-xs text-[#22c55e] hover:underline uppercase tracking-widest"
								>
									VIEW ALL ({episodesData.total}) →
								</Link>
							)}
						</div>

						<div className="grid gap-4">
							{episodesData.items.map((episode) => (
								<EpisodeCard key={episode.id} episode={episode} />
							))}
						</div>
					</div>
				</section>
			)}

			{/* Empty state */}
				{(!episodesData?.items || episodesData.items.length === 0) && (
					<section className="px-6 py-24">
						<div className="max-w-4xl mx-auto text-center">
						<div className="font-mono text-xs text-white/20 uppercase tracking-widest mb-4">
							SIGNAL INCOMING
						</div>
						<div className="font-black text-white/10 text-6xl uppercase">
							COMING SOON
						</div>
						</div>
					</section>
				)}

				{/* Contact */}
				<section className="border-t-2 border-white px-6 py-16">
					<div className="max-w-4xl mx-auto">
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-4">
							CONTACT US
						</div>
						<a
							href="mailto:contact@imposter.fm"
							className="inline-block font-black text-white text-3xl md:text-4xl uppercase tracking-tight hover:text-[#22c55e] transition-colors break-all"
						>
							contact@imposter.fm
						</a>
					</div>
				</section>
			</div>
		)
	}
