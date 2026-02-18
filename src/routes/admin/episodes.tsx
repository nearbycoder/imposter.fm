import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/episodes")({
	component: AdminEpisodesLayout,
})

function AdminEpisodesLayout() {
	return <Outlet />
}
