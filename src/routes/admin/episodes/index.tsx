import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/admin/episodes/")({
	component: AdminEpisodesList,
});

function AdminEpisodesList() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [copiedEpisodeId, setCopiedEpisodeId] = useState<number | null>(null);

	const { data: episodesList, isLoading } = useQuery(
		trpc.episodes.adminList.queryOptions(),
	);

	const deleteMutation = useMutation(
		trpc.episodes.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.episodes.adminList.queryOptions());
			},
		}),
	);

	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${String(s).padStart(2, "0")}`;
	}

	function handleDelete(id: number, title: string) {
		if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
			deleteMutation.mutate({ id });
		}
	}

	async function handleCopyEmbedLink(id: number, slug: string) {
		const embedUrl = `${window.location.origin}/embed/${slug}`;

		try {
			await navigator.clipboard.writeText(embedUrl);
		} catch {
			const textArea = document.createElement("textarea");
			textArea.value = embedUrl;
			textArea.setAttribute("readonly", "");
			textArea.style.position = "absolute";
			textArea.style.left = "-9999px";
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
		}

		setCopiedEpisodeId(id);
		window.setTimeout(() => {
			setCopiedEpisodeId((current) => (current === id ? null : current));
		}, 2000);
	}

	return (
		<div className="p-4 sm:p-6 md:p-8">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
				<div>
					<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
						MANAGE
					</div>
					<h1 className="font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">
						EPISODES
					</h1>
				</div>
				<Link
					to="/admin/episodes/new"
					className="w-full sm:w-auto text-center border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest px-5 py-3 hover:bg-[#22c55e] hover:text-black transition-colors"
				>
					+ NEW EPISODE
				</Link>
			</div>

			{isLoading && (
				<div className="font-mono text-white/40 text-sm">LOADING...</div>
			)}

			{!isLoading && (!episodesList || episodesList.length === 0) && (
				<div className="border-2 border-white/20 p-6 sm:p-8 text-center">
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
				<div className="space-y-3 lg:space-y-0">
					<div className="lg:hidden space-y-3">
						{episodesList.map((ep) => (
							<div key={ep.id} className="border-2 border-white p-4">
								<div className="flex items-start justify-between gap-3 mb-3">
									<div>
										<div className="font-black text-white text-base uppercase break-words">
											{ep.title}
										</div>
										<div className="font-mono text-xs text-white/40 mt-1 break-all">
											/{ep.slug}
										</div>
									</div>
									<span
										className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border shrink-0 ${
											ep.status === "published"
												? "border-[#22c55e] text-[#22c55e]"
												: "border-white/30 text-white/40"
										}`}
									>
										{ep.status}
									</span>
								</div>

								<div className="grid grid-cols-2 gap-3 mb-4">
									<div>
										<div className="font-mono text-[10px] text-white/35 uppercase tracking-widest">
											Episode
										</div>
										<div className="font-mono text-xs text-white/70 mt-0.5">
											{ep.episodeNumber != null
												? String(ep.episodeNumber).padStart(3, "0")
												: "—"}
										</div>
									</div>
									<div>
										<div className="font-mono text-[10px] text-white/35 uppercase tracking-widest">
											Duration
										</div>
										<div className="font-mono text-xs text-white/70 mt-0.5">
											{ep.audioDuration > 0 ? formatDuration(ep.audioDuration) : "—"}
										</div>
									</div>
									<div className="col-span-2">
										<div className="font-mono text-[10px] text-white/35 uppercase tracking-widest">
											Listens
										</div>
										<div className="font-mono text-xs text-white/70 mt-0.5">
											{ep.listens} ({ep.uniqueListeners} unique)
										</div>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-2">
									<Link
										to="/admin/episodes/$id/edit"
										params={{ id: String(ep.id) }}
										className="text-center font-mono text-xs text-white/70 hover:text-white border border-white/30 hover:border-white px-3 py-2 transition-colors"
									>
										EDIT
									</Link>
									<button
										type="button"
										onClick={() => handleCopyEmbedLink(ep.id, ep.slug)}
										className="font-mono text-xs text-[#22c55e]/80 hover:text-[#22c55e] border border-[#22c55e]/30 hover:border-[#22c55e] px-3 py-2 transition-colors"
									>
										{copiedEpisodeId === ep.id ? "COPIED" : "EMBED"}
									</button>
									<button
										type="button"
										onClick={() => handleDelete(ep.id, ep.title)}
										disabled={deleteMutation.isPending}
										className="font-mono text-xs text-red-500/70 hover:text-red-500 border border-red-500/30 hover:border-red-500 px-3 py-2 transition-colors disabled:opacity-30"
									>
										DELETE
									</button>
								</div>
							</div>
						))}
					</div>

					<div className="hidden lg:block border-2 border-white overflow-x-auto">
						<div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 border-b-2 border-white bg-white/5 min-w-[840px]">
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
								LISTENS
							</div>
							<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
								ACTIONS
							</div>
						</div>

						{episodesList.map((ep, index) => (
							<div
								key={ep.id}
								className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center min-w-[840px] ${
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
									{ep.audioDuration > 0 ? formatDuration(ep.audioDuration) : "—"}
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
								<div className="font-mono text-xs text-white/60 whitespace-nowrap">
									{ep.listens}
									<span className="text-white/35"> ({ep.uniqueListeners} unique)</span>
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
										onClick={() => handleCopyEmbedLink(ep.id, ep.slug)}
										className="font-mono text-xs text-[#22c55e]/80 hover:text-[#22c55e] border border-[#22c55e]/30 hover:border-[#22c55e] px-2 py-1 transition-colors"
									>
										{copiedEpisodeId === ep.id ? "COPIED" : "EMBED"}
									</button>
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
				</div>
			)}
		</div>
	);
}
