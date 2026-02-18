import { createFileRoute } from "@tanstack/react-router"
import { useId, useState } from "react"
import { authClient } from "#/lib/auth-client"

export const Route = createFileRoute("/admin/password")({
	component: AdminPasswordPage,
})

function AdminPasswordPage() {
	const currentPasswordId = useId()
	const newPasswordId = useId()
	const confirmPasswordId = useId()
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")
		setSuccess("")

		if (newPassword !== confirmPassword) {
			setError("New password and confirmation do not match")
			return
		}

		if (newPassword === currentPassword) {
			setError("New password must be different from your current password")
			return
		}

		setLoading(true)
		try {
			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			})

			if (result.error) {
				setError(result.error.message ?? "Failed to update password")
				return
			}

			setCurrentPassword("")
			setNewPassword("")
			setConfirmPassword("")
			setSuccess("Password updated successfully")
		} catch {
			setError("Failed to update password")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="p-8 max-w-2xl">
			<div className="mb-8">
				<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-1">
					SECURITY
				</div>
				<h1 className="font-black text-white text-4xl uppercase tracking-tight">
					CHANGE PASSWORD
				</h1>
			</div>

			<div className="border-2 border-white p-6">
				<p className="font-mono text-xs text-white/50 uppercase tracking-widest mb-6">
					This updates your admin password and signs out other sessions.
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<label
							htmlFor={currentPasswordId}
							className="block font-mono text-xs text-white/60 uppercase tracking-widest mb-1"
						>
							CURRENT PASSWORD
						</label>
						<input
							id={currentPasswordId}
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							required
							className="w-full bg-transparent border-2 border-white/30 text-white px-3 py-2 font-mono text-sm focus:border-[#22c55e] focus:outline-none transition-colors"
							placeholder="••••••••"
							autoComplete="current-password"
						/>
					</div>

					<div>
						<label
							htmlFor={newPasswordId}
							className="block font-mono text-xs text-white/60 uppercase tracking-widest mb-1"
						>
							NEW PASSWORD
						</label>
						<input
							id={newPasswordId}
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
							minLength={8}
							className="w-full bg-transparent border-2 border-white/30 text-white px-3 py-2 font-mono text-sm focus:border-[#22c55e] focus:outline-none transition-colors"
							placeholder="At least 8 characters"
							autoComplete="new-password"
						/>
					</div>

					<div>
						<label
							htmlFor={confirmPasswordId}
							className="block font-mono text-xs text-white/60 uppercase tracking-widest mb-1"
						>
							CONFIRM NEW PASSWORD
						</label>
						<input
							id={confirmPasswordId}
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={8}
							className="w-full bg-transparent border-2 border-white/30 text-white px-3 py-2 font-mono text-sm focus:border-[#22c55e] focus:outline-none transition-colors"
							placeholder="Repeat new password"
							autoComplete="new-password"
						/>
					</div>

					{error && (
						<div className="font-mono text-xs text-red-500 border border-red-500 px-3 py-2">
							{error}
						</div>
					)}

					{success && (
						<div className="font-mono text-xs text-[#22c55e] border border-[#22c55e] px-3 py-2">
							{success}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="mt-2 border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest py-3 hover:bg-[#22c55e] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "UPDATING..." : "UPDATE PASSWORD"}
					</button>
				</form>
			</div>
		</div>
	)
}
