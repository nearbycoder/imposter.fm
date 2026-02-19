import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
	useRouterState,
} from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { authClient } from "#/lib/auth-client"
import { auth } from "#/lib/auth"

const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	return session ?? null
})

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const session = await getAdminSession()
		if (!session) {
			throw redirect({ to: "/login" })
		}
		return { session }
	},
	component: AdminLayout,
})

function AdminLayout() {
	const location = useRouterState({ select: (s) => s.location })
	const pathname = location.pathname

	async function handleSignOut() {
		await authClient.signOut()
		window.location.href = "/login"
	}

	const navLinks: Array<{ to: string; label: string; exact?: boolean }> = [
		{ to: "/admin", label: "DASHBOARD", exact: true },
		{ to: "/admin/episodes", label: "EPISODES" },
		{ to: "/admin/password", label: "SECURITY" },
	]

	return (
		<div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
			{/* Sidebar */}
			<aside className="w-full md:w-56 border-b-2 md:border-b-0 md:border-r-2 border-white flex flex-col flex-shrink-0">
				<div className="px-4 py-3 md:p-4 border-b-2 border-white">
					<Link
						to="/"
						className="font-mono text-[#22c55e] text-xs uppercase tracking-widest block mb-1"
					>
						IMPOSTER.FM
					</Link>
					<div className="font-mono text-white/40 text-xs">ADMIN PANEL</div>
				</div>

				<nav className="flex-1 p-3 md:p-4 flex md:flex-col gap-2 overflow-x-auto">
					{navLinks.map((link) => {
						const isActive = link.exact
							? pathname === link.to
							: pathname.startsWith(link.to)
						return (
							<Link
								key={link.to}
								to={link.to as never}
								className={`block whitespace-nowrap font-mono text-xs uppercase tracking-widest px-3 py-2 border transition-colors ${
									isActive
										? "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10"
										: "border-transparent text-white/60 hover:text-white hover:border-white/30"
								}`}
							>
								{link.label}
							</Link>
						)
					})}
				</nav>

				<div className="px-4 pb-4 md:p-4 border-t-0 md:border-t-2 border-white">
					<button
						type="button"
						onClick={handleSignOut}
						className="w-full md:w-auto font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white border border-white/20 hover:border-white px-3 py-2 transition-colors"
					>
						SIGN OUT
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 min-w-0 overflow-auto">
				<Outlet />
			</main>
		</div>
	)
}
