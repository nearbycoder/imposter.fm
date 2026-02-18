import { Pause, Play, X } from "lucide-react"
import { useCallback, useMemo } from "react"
import { usePersistentPlayer } from "#/integrations/player/persistent-player"

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${String(s).padStart(2, "0")}`
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

export function MiniPlayer() {
	const {
		track,
		isPlaying,
		currentTime,
		duration,
		toggle,
		seek,
		clearTrack,
	} = usePersistentPlayer()

	const bars = useMemo(
		() => (track ? generateBars(track.id, 64) : []),
		[track],
	)

	if (!track) return null

	const total = duration > 0 ? duration : track.duration
	const progress = total > 0 ? currentTime / total : 0
	const progressBars = Math.floor(progress * bars.length)

	const handleSeek = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!total) return
			const rect = e.currentTarget.getBoundingClientRect()
			const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
			seek(ratio * total)
		},
		[seek, total],
	)

	return (
		<>
			<div className="h-24" aria-hidden />
			<div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-white bg-[#0a0a0a]/95 backdrop-blur px-4 py-3">
				<div className="max-w-6xl mx-auto flex items-center gap-3">
					<button
						type="button"
						onClick={toggle}
						className="w-10 h-10 border-2 border-[#22c55e] text-[#22c55e] flex items-center justify-center hover:bg-[#22c55e] hover:text-black transition-colors flex-shrink-0"
						aria-label={isPlaying ? "Pause" : "Play"}
					>
						{isPlaying ? <Pause size={14} /> : <Play size={14} />}
					</button>

					<div className="min-w-0 flex-1">
						<div className="font-mono text-[10px] text-[#22c55e] uppercase tracking-widest mb-1">
							Now Playing
						</div>
						<div className="font-black text-white text-sm uppercase truncate">
							{track.title}
						</div>
						<div
							className="mt-2 h-7 flex items-center gap-[2px] cursor-pointer"
							onClick={handleSeek}
							role="slider"
							aria-label="Seek current episode"
							aria-valuenow={Math.round(progress * 100)}
							aria-valuemin={0}
							aria-valuemax={100}
							tabIndex={0}
						>
							{bars.map((height, i) => {
								const isPast = i < progressBars
								return (
									<div
										key={`mini-bar-${i}`}
										className="flex-shrink-0 transition-all duration-75"
										style={{
											height: `${height * 100}%`,
											width: "2px",
											backgroundColor: isPast ? "#22c55e" : "rgba(255,255,255,0.25)",
										}}
									/>
								)
							})}
						</div>
					</div>

					<div className="font-mono text-xs text-white/50 whitespace-nowrap">
						{formatTime(currentTime)} / {formatTime(total)}
					</div>

					<button
						type="button"
						onClick={clearTrack}
						className="w-8 h-8 border border-white/20 text-white/40 hover:text-white hover:border-white transition-colors flex items-center justify-center flex-shrink-0"
						aria-label="Close mini player"
					>
						<X size={14} />
					</button>
				</div>
			</div>
		</>
	)
}
