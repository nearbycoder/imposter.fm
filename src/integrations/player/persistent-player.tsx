import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

interface PlayerTrack {
	id: number
	title: string
	src: string
	duration: number
}

interface LoadTrackOptions {
	autoplay?: boolean
	startAt?: number
}

interface PersistentPlayerContextValue {
	track: PlayerTrack | null
	isPlaying: boolean
	currentTime: number
	duration: number
	playbackRate: number
	loadTrack: (track: PlayerTrack, options?: LoadTrackOptions) => Promise<void>
	toggle: () => void
	pause: () => void
	seek: (time: number) => void
	setPlaybackRate: (rate: number) => void
	clearTrack: () => void
}

const PersistentPlayerContext =
	createContext<PersistentPlayerContextValue | null>(null)

export function PersistentPlayerProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const audioRef = useRef<HTMLAudioElement>(null)
	const pendingSeekRef = useRef<number | null>(null)
	const [track, setTrack] = useState<PlayerTrack | null>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [playbackRate, setPlaybackRateState] = useState(1)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		function applyPendingSeek() {
			if (pendingSeekRef.current == null) return
			const next = Math.max(0, Math.min(pendingSeekRef.current, audio.duration || pendingSeekRef.current))
			audio.currentTime = next
			setCurrentTime(next)
			pendingSeekRef.current = null
		}

		function onTimeUpdate() {
			setCurrentTime(audio.currentTime ?? 0)
		}
		function onLoadedMetadata() {
			const nextDuration = audio.duration || track?.duration || 0
			setDuration(nextDuration)
			applyPendingSeek()
		}
		function onDurationChange() {
			setDuration(audio.duration || track?.duration || 0)
		}
		function onPlay() {
			setIsPlaying(true)
		}
		function onPause() {
			setIsPlaying(false)
		}
		function onEnded() {
			setIsPlaying(false)
			setCurrentTime(0)
		}

		audio.addEventListener("timeupdate", onTimeUpdate)
		audio.addEventListener("loadedmetadata", onLoadedMetadata)
		audio.addEventListener("durationchange", onDurationChange)
		audio.addEventListener("play", onPlay)
		audio.addEventListener("pause", onPause)
		audio.addEventListener("ended", onEnded)

		return () => {
			audio.removeEventListener("timeupdate", onTimeUpdate)
			audio.removeEventListener("loadedmetadata", onLoadedMetadata)
			audio.removeEventListener("durationchange", onDurationChange)
			audio.removeEventListener("play", onPlay)
			audio.removeEventListener("pause", onPause)
			audio.removeEventListener("ended", onEnded)
		}
	}, [track?.duration])

	useEffect(() => {
		if (!audioRef.current) return
		audioRef.current.playbackRate = playbackRate
	}, [playbackRate])

	async function loadTrack(nextTrack: PlayerTrack, options?: LoadTrackOptions) {
		const audio = audioRef.current
		if (!audio) return

		const autoplay = options?.autoplay ?? true
		const startAt = options?.startAt
		const isSameTrack = track?.src === nextTrack.src

		setTrack(nextTrack)
		setDuration(nextTrack.duration || duration)

		if (!isSameTrack) {
			audio.src = nextTrack.src
			audio.load()
			setCurrentTime(0)
		}

		if (startAt != null) {
			pendingSeekRef.current = startAt
			if (audio.readyState >= 1) {
				const seekTo = Math.max(0, Math.min(startAt, audio.duration || startAt))
				audio.currentTime = seekTo
				setCurrentTime(seekTo)
				pendingSeekRef.current = null
			}
		}

		if (!autoplay) {
			audio.pause()
			return
		}

		try {
			await audio.play()
		} catch {
			setIsPlaying(false)
		}
	}

	function toggle() {
		const audio = audioRef.current
		if (!audio) return
		if (isPlaying) {
			audio.pause()
			return
		}
		void audio.play().catch(() => {
			setIsPlaying(false)
		})
	}

	function pause() {
		audioRef.current?.pause()
	}

	function seek(time: number) {
		const audio = audioRef.current
		if (!audio) return
		audio.currentTime = Math.max(0, Math.min(time, audio.duration || time))
		setCurrentTime(audio.currentTime)
	}

	function setPlaybackRate(rate: number) {
		setPlaybackRateState(rate)
	}

	function clearTrack() {
		const audio = audioRef.current
		if (!audio) return
		audio.pause()
		audio.removeAttribute("src")
		audio.load()
		setTrack(null)
		setIsPlaying(false)
		setCurrentTime(0)
		setDuration(0)
	}

	const value = useMemo<PersistentPlayerContextValue>(
		() => ({
			track,
			isPlaying,
			currentTime,
			duration,
			playbackRate,
			loadTrack,
			toggle,
			pause,
			seek,
			setPlaybackRate,
			clearTrack,
		}),
		[track, isPlaying, currentTime, duration, playbackRate],
	)

	return (
		<PersistentPlayerContext.Provider value={value}>
			{children}
			{/* biome-ignore lint/a11y/useMediaCaption: global podcast player has no video/captions */}
			<audio ref={audioRef} preload="metadata" />
		</PersistentPlayerContext.Provider>
	)
}

export function usePersistentPlayer() {
	const ctx = useContext(PersistentPlayerContext)
	if (!ctx) {
		throw new Error("usePersistentPlayer must be used within PersistentPlayerProvider")
	}
	return ctx
}
