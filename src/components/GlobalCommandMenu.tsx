import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
	Copy,
	ExternalLink,
	FastForward,
	FileAudio2,
	Home,
	Library,
	LogOut,
	Pause,
	Pencil,
	Play,
	Plus,
	Rewind,
	Rss,
	Shield,
	Square,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "#/components/ui/command";
import { usePersistentPlayer } from "#/integrations/player/persistent-player";
import { useTRPC } from "#/integrations/trpc/react";
import { authClient } from "#/lib/auth-client";

const POCKET_CASTS_URL =
	"https://pocketcasts.com/podcast/imposterfm/2711c4e0-f017-013e-f85c-022038d1b2e1";

export const OPEN_COMMAND_MENU_EVENT = "imposter:open-command-menu";

export function openCommandMenu() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(OPEN_COMMAND_MENU_EVENT));
}

function getIsMacPlatform() {
	if (typeof navigator === "undefined") return true;
	return /mac|iphone|ipad|ipod/i.test(
		navigator.platform || navigator.userAgent,
	);
}

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) {
		return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	}
	return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GlobalCommandMenu() {
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const trpc = useTRPC();
	const { data: session } = authClient.useSession();
	const {
		track,
		isPlaying,
		currentTime,
		duration,
		isMuted,
		toggle,
		seek,
		toggleMute,
		clearTrack,
	} = usePersistentPlayer();

	const [open, setOpen] = useState(false);
	const [isMac, setIsMac] = useState(true);

	const { data: publishedEpisodes } = useQuery({
		...trpc.episodes.list.queryOptions({ page: 1, perPage: 20 }),
		staleTime: 60_000,
	});

	const isAdmin = Boolean(session?.user);

	const { data: adminEpisodes } = useQuery({
		...trpc.episodes.adminList.queryOptions(),
		enabled: isAdmin,
		staleTime: 60_000,
	});

	const shortcutHint = isMac ? "⌘K" : "Ctrl K";
	const topPublishedEpisodes = publishedEpisodes?.items ?? [];
	const quickEditEpisodes = useMemo(
		() => (adminEpisodes ?? []).slice(0, 8),
		[adminEpisodes],
	);

	useEffect(() => {
		setIsMac(getIsMacPlatform());
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return;
			if (event.key.toLowerCase() !== "k") return;
			if (!event.metaKey && !event.ctrlKey) return;
			event.preventDefault();
			setOpen((current) => !current);
		};

		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
		};
	}, []);

	useEffect(() => {
		const onOpen = () => setOpen(true);
		window.addEventListener(OPEN_COMMAND_MENU_EVENT, onOpen);
		return () => {
			window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onOpen);
		};
	}, []);

	function runAction(action: () => void | Promise<void>) {
		setOpen(false);
		window.setTimeout(() => {
			void action();
		}, 0);
	}

	function isCurrentRoute(routePath: string): boolean {
		if (routePath === "/") return pathname === "/";
		return pathname === routePath || pathname.startsWith(`${routePath}/`);
	}

	async function copyToClipboard(value: string) {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// Ignore clipboard permissions failures.
		}
	}

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput
				placeholder={`Jump to any page or run any action (${shortcutHint})`}
			/>
			<CommandList>
				<CommandEmpty>No matches found.</CommandEmpty>

				<CommandGroup heading="Navigation">
					<CommandItem
						value="home root index"
						onSelect={() => runAction(() => navigate({ to: "/" }))}
					>
						<Home />
						<span>Home</span>
						{isCurrentRoute("/") && <CommandShortcut>Current</CommandShortcut>}
					</CommandItem>
					<CommandItem
						value="episodes archive list browse"
						onSelect={() => runAction(() => navigate({ to: "/episodes" }))}
					>
						<Library />
						<span>Episodes</span>
						{isCurrentRoute("/episodes") && (
							<CommandShortcut>Current</CommandShortcut>
						)}
					</CommandItem>
					{isAdmin && (
						<CommandItem
							value="admin dashboard"
							onSelect={() => runAction(() => navigate({ to: "/admin" }))}
						>
							<Shield />
							<span>Admin Dashboard</span>
							{isCurrentRoute("/admin") && (
								<CommandShortcut>Current</CommandShortcut>
							)}
						</CommandItem>
					)}
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Actions">
					<CommandItem
						value="open rss feed"
						onSelect={() =>
							runAction(() => {
								window.open("/rss.xml", "_blank", "noopener,noreferrer");
							})
						}
					>
						<Rss />
						<span>Open RSS Feed</span>
						<CommandShortcut>↗</CommandShortcut>
					</CommandItem>
					<CommandItem
						value="open pocket casts external"
						onSelect={() =>
							runAction(() => {
								window.open(POCKET_CASTS_URL, "_blank", "noopener,noreferrer");
							})
						}
					>
						<ExternalLink />
						<span>Open Pocket Casts</span>
						<CommandShortcut>↗</CommandShortcut>
					</CommandItem>
					<CommandItem
						value="copy page url link"
						onSelect={() =>
							runAction(() => copyToClipboard(window.location.href))
						}
					>
						<Copy />
						<span>Copy Current Page URL</span>
					</CommandItem>
					<CommandItem
						value="copy rss url"
						onSelect={() =>
							runAction(() =>
								copyToClipboard(`${window.location.origin}/rss.xml`),
							)
						}
					>
						<Copy />
						<span>Copy RSS Feed URL</span>
					</CommandItem>
				</CommandGroup>

				{track && (
					<>
						<CommandSeparator />
						<CommandGroup heading="Player">
							<CommandItem
								value={isPlaying ? "pause playback" : "play playback resume"}
								onSelect={() => runAction(() => toggle())}
							>
								{isPlaying ? <Pause /> : <Play />}
								<span>{isPlaying ? "Pause Playback" : "Resume Playback"}</span>
								<CommandShortcut>
									{formatDuration(duration > 0 ? duration : track.duration)}
								</CommandShortcut>
							</CommandItem>
							<CommandItem
								value="rewind back 15 seconds"
								onSelect={() =>
									runAction(() => seek(Math.max(0, currentTime - 15)))
								}
							>
								<Rewind />
								<span>Back 15 Seconds</span>
							</CommandItem>
							<CommandItem
								value="forward skip 15 seconds"
								onSelect={() =>
									runAction(() =>
										seek(
											Math.min(
												duration > 0 ? duration : track.duration,
												currentTime + 15,
											),
										),
									)
								}
							>
								<FastForward />
								<span>Forward 15 Seconds</span>
							</CommandItem>
							<CommandItem
								value={isMuted ? "unmute sound volume" : "mute sound volume"}
								onSelect={() => runAction(() => toggleMute())}
							>
								{isMuted ? <Volume2 /> : <VolumeX />}
								<span>{isMuted ? "Unmute Player" : "Mute Player"}</span>
							</CommandItem>
							<CommandItem
								value="stop close clear mini player"
								onSelect={() => runAction(() => clearTrack())}
							>
								<Square />
								<span>Stop and Close Player</span>
							</CommandItem>
						</CommandGroup>
					</>
				)}

				{topPublishedEpisodes.length > 0 && (
					<>
						<CommandSeparator />
						<CommandGroup heading="Episodes">
							{topPublishedEpisodes.map((episode) => (
								<CommandItem
									key={episode.id}
									value={`episode ${episode.title} ${episode.slug}`}
									onSelect={() =>
										runAction(() =>
											navigate({
												to: "/episodes/$slug",
												params: { slug: episode.slug },
											}),
										)
									}
								>
									<FileAudio2 />
									<span className="truncate">{episode.title}</span>
									<CommandShortcut>
										{formatDuration(episode.audioDuration)}
									</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					</>
				)}

				{isAdmin && (
					<>
						<CommandSeparator />
						<CommandGroup heading="Admin">
							<CommandItem
								value="admin new episode create"
								onSelect={() =>
									runAction(() => navigate({ to: "/admin/episodes/new" }))
								}
							>
								<Plus />
								<span>New Episode</span>
							</CommandItem>
							<CommandItem
								value="admin manage episodes"
								onSelect={() =>
									runAction(() => navigate({ to: "/admin/episodes" }))
								}
							>
								<Library />
								<span>Manage Episodes</span>
							</CommandItem>
							<CommandItem
								value="admin security password"
								onSelect={() =>
									runAction(() => navigate({ to: "/admin/password" }))
								}
							>
								<Shield />
								<span>Security Settings</span>
							</CommandItem>
							<CommandItem
								value="sign out logout"
								onSelect={() =>
									runAction(async () => {
										await authClient.signOut();
										await navigate({ to: "/login" });
									})
								}
							>
								<LogOut />
								<span>Sign Out</span>
							</CommandItem>
						</CommandGroup>
					</>
				)}

				{isAdmin && quickEditEpisodes.length > 0 && (
					<>
						<CommandSeparator />
						<CommandGroup heading="Quick Edit">
							{quickEditEpisodes.map((episode) => (
								<CommandItem
									key={episode.id}
									value={`edit ${episode.title} ${episode.slug} ${episode.status}`}
									onSelect={() =>
										runAction(() =>
											navigate({
												to: "/admin/episodes/$id/edit",
												params: { id: String(episode.id) },
											}),
										)
									}
								>
									<Pencil />
									<span className="truncate">{episode.title}</span>
									<CommandShortcut>{episode.status}</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}
