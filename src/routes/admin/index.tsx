import { Link, createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "#/integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
});

function AdminDashboard() {
	const trpc = useTRPC();

	const { data: podcastConfig } = useQuery(trpc.podcast.get.queryOptions());
	const { data: episodesData } = useQuery(
		trpc.episodes.adminList.queryOptions(),
	);

	const totalEpisodes = episodesData?.length ?? 0;
	const publishedEpisodes =
		episodesData?.filter((e) => e.status === "published").length ?? 0;
	const draftEpisodes =
		episodesData?.filter((e) => e.status === "draft").length ?? 0;
	const totalListens =
		episodesData?.reduce((sum, episode) => sum + (episode.listens ?? 0), 0) ??
		0;

	return (
		<div className="p-4 sm:p-6 md:p-8">
			<div className="mb-6 sm:mb-8">
				<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
					DASHBOARD
				</div>
				<h1 className="font-black text-white text-3xl sm:text-4xl uppercase tracking-tight break-words">
					{podcastConfig?.title ?? "IMPOSTER.FM"}
				</h1>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
				{[
					{ label: "TOTAL EPISODES", value: totalEpisodes },
					{ label: "PUBLISHED", value: publishedEpisodes },
					{ label: "DRAFTS", value: draftEpisodes },
					{ label: "LISTENS", value: totalListens },
				].map((stat) => (
					<div key={stat.label} className="border-2 border-white p-4 sm:p-6">
						<div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2">
							{stat.label}
						</div>
						<div className="font-black text-white text-4xl sm:text-5xl">
							{stat.value}
						</div>
					</div>
				))}
			</div>

			{/* Quick actions */}
			<div className="border-2 border-white p-4 sm:p-6 mb-6 sm:mb-8">
				<div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-4">
					QUICK ACTIONS
				</div>
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
					<Link
						to="/admin/episodes/new"
						className="w-full sm:w-auto text-center border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest px-5 py-3 hover:bg-[#22c55e] hover:text-black transition-colors"
					>
						+ NEW EPISODE
					</Link>
					<Link
						to="/admin/episodes"
						className="w-full sm:w-auto text-center border-2 border-white text-white font-black uppercase tracking-widest px-5 py-3 hover:bg-white hover:text-black transition-colors"
					>
						MANAGE EPISODES
					</Link>
				</div>
			</div>

			{/* RSS link */}
			<div className="border border-white/20 p-4">
				<div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2">
					RSS FEED
				</div>
				<a
					href="/rss.xml"
					target="_blank"
					rel="noopener noreferrer"
					className="font-mono text-sm text-[#22c55e] hover:underline"
				>
					/rss.xml ↗
				</a>
			</div>
		</div>
	);
}
