import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTRPC } from "#/integrations/trpc/react"

interface Episode {
	id: number
	slug: string
	title: string
	description: string
	content: string
	audioKey: string
	audioDuration: number
	audioSize: number
	audioMimeType: string
	episodeNumber: number | null
	seasonNumber: number | null
	episodeType: string
	explicit: boolean
	status: string
	publishedAt: Date | null | string
}

interface EpisodeFormProps {
	episode?: Episode
	onSuccess?: () => void
}

function toSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}

async function getAudioDuration(file: File): Promise<number> {
	return new Promise((resolve) => {
		const audioContext = new AudioContext()
		const reader = new FileReader()
		reader.onload = async (e) => {
			try {
				const buffer = await audioContext.decodeAudioData(
					e.target!.result as ArrayBuffer,
				)
				resolve(Math.round(buffer.duration))
			} catch {
				// Fall back to HTML audio element for large files
				const url = URL.createObjectURL(file)
				const audio = new Audio(url)
				audio.onloadedmetadata = () => {
					resolve(Math.round(audio.duration))
					URL.revokeObjectURL(url)
				}
				audio.onerror = () => {
					resolve(0)
					URL.revokeObjectURL(url)
				}
			} finally {
				audioContext.close()
			}
		}
		reader.readAsArrayBuffer(file)
	})
}

export function EpisodeForm({ episode, onSuccess }: EpisodeFormProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [title, setTitle] = useState(episode?.title ?? "")
	const [slug, setSlug] = useState(episode?.slug ?? "")
	const [description, setDescription] = useState(episode?.description ?? "")
	const [content, setContent] = useState(episode?.content ?? "")
	const [episodeNumber, setEpisodeNumber] = useState(
		episode?.episodeNumber != null ? String(episode.episodeNumber) : "",
	)
	const [seasonNumber, setSeasonNumber] = useState(
		episode?.seasonNumber != null ? String(episode.seasonNumber) : "",
	)
	const [episodeType, setEpisodeType] = useState(
		episode?.episodeType ?? "full",
	)
	const [explicit, setExplicit] = useState(episode?.explicit ?? false)
	const [status, setStatus] = useState(episode?.status ?? "draft")
	const [publishedAt, setPublishedAt] = useState(
		episode?.publishedAt
			? new Date(episode.publishedAt).toISOString().slice(0, 16)
			: "",
	)

	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [uploadProgress, setUploadProgress] = useState<
		"idle" | "uploading" | "done" | "error"
	>("idle")
	const [error, setError] = useState("")
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!episode)

	// Auto-generate slug from title
	useEffect(() => {
		if (!slugManuallyEdited && title) {
			setSlug(toSlug(title))
		}
	}, [title, slugManuallyEdited])

	const getUploadUrl = useMutation(trpc.episodes.getUploadUrl.mutationOptions())

	const createEpisode = useMutation(
		trpc.episodes.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.episodes.adminList.queryOptions(),
				)
				onSuccess?.()
			},
		}),
	)

	const updateEpisode = useMutation(
		trpc.episodes.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.episodes.adminList.queryOptions(),
				)
				onSuccess?.()
			},
		}),
	)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")

		let audioKey = episode?.audioKey ?? ""
		let audioDuration = episode?.audioDuration ?? 0
		let audioSize = episode?.audioSize ?? 0
		let audioMimeType = episode?.audioMimeType ?? "audio/mpeg"

		if (audioFile) {
			try {
				setUploadProgress("uploading")

				const ext = audioFile.name.split(".").pop() ?? "mp3"
				const key = `episodes/${slug || toSlug(title)}-${Date.now()}.${ext}`

				const { uploadUrl, key: uploadedKey } =
					await getUploadUrl.mutateAsync({
						key,
						contentType: audioFile.type || "audio/mpeg",
					})

				// Detect duration client-side
				audioDuration = await getAudioDuration(audioFile)
				audioSize = audioFile.size
				audioMimeType = audioFile.type || "audio/mpeg"

				// Upload file
				const uploadRes = await fetch(uploadUrl, {
					method: "PUT",
					body: audioFile,
					headers: { "Content-Type": audioMimeType },
				})

				if (!uploadRes.ok) {
					throw new Error(`Upload failed: ${uploadRes.statusText}`)
				}

				audioKey = uploadedKey
				setUploadProgress("done")
			} catch (err) {
				setUploadProgress("error")
				setError(
					err instanceof Error ? err.message : "Upload failed",
				)
				return
			}
		}

		if (!audioKey && !episode) {
			setError("Audio file is required for new episodes")
			return
		}

		const episodeData = {
			slug,
			title,
			description,
			content,
			audioKey,
			audioDuration,
			audioSize,
			audioMimeType,
			episodeNumber: episodeNumber ? Number(episodeNumber) : null,
			seasonNumber: seasonNumber ? Number(seasonNumber) : null,
			episodeType: episodeType as "full" | "trailer" | "bonus",
			explicit,
			status: status as "draft" | "published",
			publishedAt: publishedAt ? new Date(publishedAt) : null,
		}

		try {
			if (episode) {
				await updateEpisode.mutateAsync({ id: episode.id, ...episodeData })
			} else {
				await createEpisode.mutateAsync(episodeData)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed")
		}
	}

	const isSubmitting =
		createEpisode.isPending ||
		updateEpisode.isPending ||
		uploadProgress === "uploading"

	const inputClass =
		"w-full bg-transparent border-2 border-white/20 text-white px-3 py-2 font-mono text-sm focus:border-[#22c55e] focus:outline-none transition-colors"
	const labelClass =
		"block font-mono text-xs text-white/40 uppercase tracking-widest mb-1"

	return (
		<form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-6">
			{/* Title */}
			<div>
				<label htmlFor="title" className={labelClass}>
					TITLE *
				</label>
				<input
					id="title"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
					className={inputClass}
					placeholder="The Notification"
				/>
			</div>

			{/* Slug */}
			<div>
				<label htmlFor="slug" className={labelClass}>
					SLUG *
				</label>
				<input
					id="slug"
					type="text"
					value={slug}
					onChange={(e) => {
						setSlug(e.target.value)
						setSlugManuallyEdited(true)
					}}
					required
					className={inputClass}
					placeholder="the-notification"
				/>
				<div className="font-mono text-xs text-white/20 mt-1">
					/episodes/{slug || "…"}
				</div>
			</div>

			{/* Description */}
			<div>
				<label htmlFor="description" className={labelClass}>
					DESCRIPTION * (used in cards + RSS)
				</label>
				<textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					required
					rows={3}
					className={`${inputClass} resize-y`}
					placeholder="Short summary of this episode..."
				/>
			</div>

			{/* Show notes */}
			<div>
				<label htmlFor="content" className={labelClass}>
					SHOW NOTES (HTML)
				</label>
				<textarea
					id="content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					rows={6}
					className={`${inputClass} resize-y`}
					placeholder="<p>Full show notes...</p>"
				/>
			</div>

			{/* Audio file */}
			<div>
				<label htmlFor="audio" className={labelClass}>
					AUDIO FILE {episode ? "(leave blank to keep current)" : "*"}
				</label>
				<input
					ref={fileInputRef}
					id="audio"
					type="file"
					accept="audio/*"
					onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
					className="w-full font-mono text-sm text-white/60 file:mr-4 file:border-2 file:border-[#22c55e] file:text-[#22c55e] file:bg-transparent file:px-3 file:py-1 file:font-mono file:text-xs file:uppercase file:tracking-widest hover:file:bg-[#22c55e] hover:file:text-black file:transition-colors cursor-pointer"
				/>
				{episode?.audioKey && !audioFile && (
					<div className="font-mono text-xs text-white/30 mt-1">
						Current: {episode.audioKey}
					</div>
				)}
				{uploadProgress === "uploading" && (
					<div className="font-mono text-xs text-[#22c55e] mt-1">
						UPLOADING...
					</div>
				)}
				{uploadProgress === "done" && (
					<div className="font-mono text-xs text-[#22c55e] mt-1">
						UPLOAD COMPLETE
					</div>
				)}
			</div>

			{/* Episode/Season numbers */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="episodeNumber" className={labelClass}>
						EPISODE #
					</label>
					<input
						id="episodeNumber"
						type="number"
						min="1"
						value={episodeNumber}
						onChange={(e) => setEpisodeNumber(e.target.value)}
						className={inputClass}
						placeholder="1"
					/>
				</div>
				<div>
					<label htmlFor="seasonNumber" className={labelClass}>
						SEASON #
					</label>
					<input
						id="seasonNumber"
						type="number"
						min="1"
						value={seasonNumber}
						onChange={(e) => setSeasonNumber(e.target.value)}
						className={inputClass}
						placeholder="1"
					/>
				</div>
			</div>

			{/* Episode type */}
			<div>
				<label htmlFor="episodeType" className={labelClass}>
					EPISODE TYPE
				</label>
				<select
					id="episodeType"
					value={episodeType}
					onChange={(e) => setEpisodeType(e.target.value)}
					className={`${inputClass} cursor-pointer`}
				>
					<option value="full">Full</option>
					<option value="trailer">Trailer</option>
					<option value="bonus">Bonus</option>
				</select>
			</div>

			{/* Status + publish date */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="status" className={labelClass}>
						STATUS
					</label>
					<select
						id="status"
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						className={`${inputClass} cursor-pointer`}
					>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
				</div>
				<div>
					<label htmlFor="publishedAt" className={labelClass}>
						PUBLISH DATE
					</label>
					<input
						id="publishedAt"
						type="datetime-local"
						value={publishedAt}
						onChange={(e) => setPublishedAt(e.target.value)}
						className={inputClass}
					/>
				</div>
			</div>

			{/* Explicit */}
			<div className="flex items-center gap-3">
				<input
					id="explicit"
					type="checkbox"
					checked={explicit}
					onChange={(e) => setExplicit(e.target.checked)}
					className="w-4 h-4 accent-[#22c55e]"
				/>
				<label
					htmlFor="explicit"
					className="font-mono text-xs text-white/60 uppercase tracking-widest cursor-pointer"
				>
					EXPLICIT CONTENT
				</label>
			</div>

			{/* Error */}
			{error && (
				<div className="font-mono text-xs text-red-500 border border-red-500 px-3 py-2">
					{error}
				</div>
			)}

			{/* Submit */}
			<div className="flex gap-4">
				<button
					type="submit"
					disabled={isSubmitting}
					className="border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest px-8 py-3 hover:bg-[#22c55e] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "SAVING..." : episode ? "UPDATE EPISODE" : "CREATE EPISODE"}
				</button>
			</div>
		</form>
	)
}
