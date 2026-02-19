import { Link } from "@tanstack/react-router"
import { Pause, Play } from "lucide-react"
import { useCallback, useMemo } from "react"
import { usePersistentPlayer } from "#/integrations/player/persistent-player"

interface Episode {
	id: number
	slug: string
	title: string
	description: string
	audioDuration: number
	episodeNumber: number | null
	seasonNumber: number | null
	publishedAt: Date | null | string
	explicit: boolean
}

interface EpisodeCardProps {
	episode: Episode
}

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
	return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(date: Date | string | null): string {
	if (!date) return ""
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	})
}

function generateBars(episodeId: number, count: number): number[] {
	return Array.from({ length: count }, (_, i) => {
		const seed = episodeId * 137.5 + i * 23.7
		const h =
			Math.abs(Math.sin(seed * 0.1)) * 0.4 +
			Math.abs(Math.sin(seed * 0.31)) * 0.3 +
			Math.abs(Math.sin(seed * 0.73)) * 0.2 +
			0.1
		return Math.min(1, Math.max(0.06, h))
	})
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
	const {
		track,
		isPlaying,
		currentTime,
		duration,
		loadTrack,
		toggle,
		seek,
	} = usePersistentPlayer()

	const src = `/api/stream/${episode.id}`
	const isCurrentTrack = track?.src === src
	const isActivePlaying = isCurrentTrack && isPlaying
	const displayDuration = isCurrentTrack
		? (duration > 0 ? duration : episode.audioDuration)
		: episode.audioDuration
	const displayTime = isCurrentTrack ? currentTime : 0
	const bars = useMemo(() => generateBars(episode.id, 72), [episode.id])
	const progress = displayDuration > 0 ? displayTime / displayDuration : 0
	const progressBars = Math.floor(progress * bars.length)

	function togglePlayback() {
		if (isCurrentTrack) {
			toggle()
			return
		}
		void loadTrack({
			id: episode.id,
			title: episode.title,
			src,
			duration: episode.audioDuration,
		})
	}

	const handleSeek = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!displayDuration) return
			const rect = e.currentTarget.getBoundingClientRect()
			const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
			const newTime = ratio * displayDuration

			if (isCurrentTrack) {
				seek(newTime)
				return
			}

			void loadTrack(
				{
					id: episode.id,
					title: episode.title,
					src,
					duration: episode.audioDuration,
				},
				{ autoplay: false, startAt: newTime },
			)
		},
		[displayDuration, isCurrentTrack, seek, loadTrack, episode.id, episode.title, src, episode.audioDuration],
	)

	return (
		<article className="border-2 border-white p-6 hover:border-[#22c55e] transition-colors group">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					{episode.episodeNumber != null && (
						<span className="font-mono text-xs text-[#22c55e] uppercase tracking-widest">
							EP {String(episode.episodeNumber).padStart(3, "0")}
						</span>
					)}
					{episode.seasonNumber != null && (
						<span className="font-mono text-xs text-white/30 uppercase tracking-widest border border-white/20 px-1.5 py-0.5">
							S{episode.seasonNumber}
						</span>
					)}
					{episode.explicit && (
						<span className="font-mono text-xs text-white/30 uppercase tracking-widest border border-white/20 px-1.5 py-0.5">
							E
						</span>
					)}
				</div>
				<div className="font-mono text-xs text-white/30">
					{formatDate(episode.publishedAt)}
				</div>
			</div>

			<div className="border-t-2 border-white group-hover:border-[#22c55e] transition-colors mb-4" />

			<h2 className="font-black text-white text-2xl uppercase tracking-tight leading-tight mb-3 group-hover:text-[#22c55e] transition-colors">
				<Link to="/episodes/$slug" params={{ slug: episode.slug }}>
					{episode.title}
				</Link>
			</h2>

			<p className="text-white/60 text-sm leading-relaxed mb-5 line-clamp-3">
				{episode.description}
			</p>

			<div
				className="w-full overflow-hidden flex items-center gap-px sm:gap-[2px] h-10 cursor-pointer mb-2"
				onClick={handleSeek}
				role="slider"
				aria-label="Seek episode audio"
				aria-valuenow={Math.round(progress * 100)}
				aria-valuemin={0}
				aria-valuemax={100}
				tabIndex={0}
			>
				{bars.map((height, i) => {
					const isPast = i < progressBars
					const isHead = i === progressBars

					return (
						<div
							key={`bar-${i}`}
							className="min-w-0 flex-1 transition-all duration-75"
							style={{
								height: `${height * 100}%`,
								backgroundColor: isPast
									? "#22c55e"
									: isHead && isActivePlaying
										? "#ffffff"
										: "rgba(255,255,255,0.25)",
								transform:
									isActivePlaying && Math.abs(i - progressBars) <= 1
										? `scaleY(${1 + Math.sin(displayTime * 8 + i) * 0.15})`
										: "scaleY(1)",
							}}
						/>
					)
				})}
			</div>

			<div className="flex items-center justify-between">
				<div className="font-mono text-xs text-white/40 uppercase tracking-widest">
					{displayDuration > 0
						? `${formatDuration(displayTime)} / ${formatDuration(displayDuration)}`
						: ""}
				</div>
				<button
					type="button"
					onClick={togglePlayback}
					className="flex items-center gap-2 border-2 border-white text-white font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-white hover:text-black transition-colors"
					aria-label={isActivePlaying ? "Pause episode" : "Play episode"}
				>
					{isActivePlaying ? <Pause size={12} /> : <Play size={12} />}
					{isActivePlaying ? "PAUSE" : "PLAY"}
				</button>
			</div>
		</article>
	)
}
