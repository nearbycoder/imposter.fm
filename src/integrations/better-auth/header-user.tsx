import { authClient } from "#/lib/auth-client"
import { Link } from "@tanstack/react-router"

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession()

	if (isPending) {
		return (
			<div className="h-8 w-8 bg-white/10 animate-pulse" />
		)
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-2">
				<div className="h-7 w-7 bg-[#22c55e] flex items-center justify-center">
					<span className="text-xs font-black text-black">
						{session.user.name?.charAt(0).toUpperCase() ?? "U"}
					</span>
				</div>
				<button
					type="button"
					onClick={() => {
						void authClient.signOut()
					}}
					className="flex-1 font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white border border-white/20 hover:border-white px-2 py-1 transition-colors"
				>
					SIGN OUT
				</button>
			</div>
		)
	}

	return (
		<Link
			to="/login"
			className="block font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white border border-white/20 hover:border-white px-3 py-2 transition-colors text-center"
		>
			SIGN IN
		</Link>
	)
}
