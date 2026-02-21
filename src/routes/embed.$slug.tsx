import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AudioPlayer } from "#/components/AudioPlayer";
import { useTRPC } from "#/integrations/trpc/react";

const siteUrl =
	import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "https://imposter.fm";

function absoluteUrl(path: string): string {
	return siteUrl ? `${siteUrl}${path}` : path;
}

export const Route = createFileRoute("/embed/$slug")({
	head: ({ params }) => ({
		meta: [
			{ title: "Episode Embed | imposter.fm" },
			{
				name: "robots",
				content: "noindex,nofollow,noarchive,nosnippet,max-image-preview:none",
			},
		],
		links: [
			{
				rel: "canonical",
				href: absoluteUrl(`/episodes/${encodeURIComponent(params.slug)}`),
			},
		],
	}),
	component: EmbedPage,
});

function EmbedPage() {
	const { slug } = Route.useParams();
	const trpc = useTRPC();

	const { data: episode, isLoading } = useQuery(
		trpc.episodes.getBySlug.queryOptions({ slug }),
	);

	if (isLoading) {
		return (
			<div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
				<div className="font-mono text-white/40 text-xs uppercase tracking-widest">
					LOADING...
				</div>
			</div>
		);
	}

	if (!episode) {
		return (
			<div className="bg-[#0a0a0a] min-h-screen p-4">
				<div className="font-mono text-red-500 text-xs">EPISODE NOT FOUND</div>
			</div>
		);
	}

	return (
		<div className="bg-[#0a0a0a] p-3">
			<div className="border border-white/25 bg-[#070707] p-3">
				<div className="font-mono text-[10px] text-[#22c55e] uppercase tracking-[0.2em] mb-2">
					IMPOSTER.FM
				</div>
				<div className="font-black text-white text-base uppercase tracking-tight leading-tight mb-2">
					{episode.title}
				</div>
				{episode.description && (
					<div className="font-mono text-[11px] text-white/50 mb-3 line-clamp-2">
						{episode.description}
					</div>
				)}
				<AudioPlayer
					src={`/api/stream/${episode.id}`}
					episodeId={episode.id}
					title={episode.title}
					duration={episode.audioDuration}
					compact
				/>
			</div>
		</div>
	);
}
