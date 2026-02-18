import { Download, Pause, Play } from "lucide-react"
import { useCallback, useMemo } from "react"
import { usePersistentPlayer } from "#/integrations/player/persistent-player"

interface AudioPlayerProps {
	src: string
	episodeId: number
	title: string
	duration: number
	compact?: boolean
}

function formatTime(secs: number): string {
	const m = Math.floor(secs / 60)
	const s = Math.floor(secs % 60)
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

const SPEEDS = [1, 1.25, 1.5, 1.75, 2]

export function AudioPlayer({
	src,
	episodeId,
	title,
	duration,
	compact = false,
}: AudioPlayerProps) {
	const {
		track,
		isPlaying,
		currentTime,
		duration: activeDuration,
		playbackRate,
		loadTrack,
		toggle,
		seek,
		setPlaybackRate,
	} = usePersistentPlayer()

	const isCurrentTrack = track?.src === src
	const displayDuration = isCurrentTrack
		? (activeDuration > 0 ? activeDuration : duration)
		: duration
	const displayTime = isCurrentTrack ? currentTime : 0
	const isActivePlaying = isCurrentTrack && isPlaying

	const bars = useMemo(
		() => generateBars(episodeId, compact ? 60 : 80),
		[episodeId, compact],
	)

	const progress = displayDuration > 0 ? displayTime / displayDuration : 0
	const progressBars = Math.floor(progress * bars.length)
	const currentSpeed = playbackRate

	function togglePlayback() {
		if (isCurrentTrack) {
			toggle()
			return
		}
		void loadTrack({ id: episodeId, title, src, duration })
	}

	function cycleSpeed() {
		const currentIndex = SPEEDS.findIndex((s) => s === currentSpeed)
		const nextIndex = (currentIndex + 1) % SPEEDS.length
		setPlaybackRate(SPEEDS[nextIndex] ?? 1)
	}

	const handleSeek = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!displayDuration) return
			const rect = e.currentTarget.getBoundingClientRect()
			const ratio = Math.max(
				0,
				Math.min(1, (e.clientX - rect.left) / rect.width),
			)
			const newTime = ratio * displayDuration

			if (isCurrentTrack) {
				seek(newTime)
				return
			}

			void loadTrack(
				{ id: episodeId, title, src, duration },
				{ autoplay: false, startAt: newTime },
			)
		},
		[displayDuration, isCurrentTrack, seek, loadTrack, episodeId, title, src, duration],
	)

	return (
		<div
			className={`border-2 border-white bg-[#0a0a0a] ${compact ? "p-4" : "p-6"}`}
		>
			<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
				{isActivePlaying ? "NOW PLAYING" : "EPISODE"}
			</div>
			{!compact && (
				<div className="font-black text-white text-xl uppercase tracking-tight mb-5 leading-tight">
					{title}
				</div>
			)}

			<div
				className="flex items-center gap-[2px] h-14 cursor-pointer mb-3 group"
				onClick={handleSeek}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault()
						togglePlayback()
					}
				}}
				role="slider"
				aria-label="Seek audio"
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
							className="flex-shrink-0 transition-all duration-75"
							style={{
								height: `${height * 100}%`,
								width: compact ? "2px" : "3px",
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

			<div className="flex justify-between font-mono text-xs text-white/50 mb-4">
				<span>{formatTime(displayTime)}</span>
				<span>{formatTime(displayDuration)}</span>
			</div>

			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={togglePlayback}
					className="w-11 h-11 border-2 border-[#22c55e] text-[#22c55e] flex items-center justify-center hover:bg-[#22c55e] hover:text-black transition-colors flex-shrink-0"
					aria-label={isActivePlaying ? "Pause" : "Play"}
				>
					{isActivePlaying ? <Pause size={16} /> : <Play size={16} />}
				</button>

				<button
					type="button"
					onClick={cycleSpeed}
					className="font-mono text-xs border border-white/30 px-2 py-1 text-white/60 hover:border-white hover:text-white transition-colors"
				>
					{currentSpeed}x
				</button>

				<a
					href={src}
					download
					className="ml-auto font-mono text-xs border border-white/20 px-2 py-1 text-white/40 hover:border-white hover:text-white transition-colors flex items-center gap-1"
					aria-label="Download episode"
				>
					<Download size={10} />
					{!compact && " DOWNLOAD"}
				</a>
			</div>
		</div>
	)
}
