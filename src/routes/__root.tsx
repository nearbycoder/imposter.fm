import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "#/integrations/trpc/router";
import Header from "../components/Header";
import { MiniPlayer } from "../components/MiniPlayer";
import { PersistentPlayerProvider } from "../integrations/player/persistent-player";
import PostHogProvider from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "imposter.fm" },
			{
				name: "description",
				content:
					"A podcast about navigating layoff in the AI era — the job hunt, the uncertainty, and what happens when a career starts to feel like borrowed time.",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{ rel: "manifest", href: "/manifest.json" },
			{
				rel: "alternate",
				type: "application/rss+xml",
				title: "imposter.fm podcast feed",
				href: "/rss.xml",
			},
			{
				rel: "sitemap",
				type: "application/xml",
				href: "/sitemap.xml",
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: RootNotFound,
});

const EMBED_PATHS = ["/embed/"];
const NO_HEADER_PATHS = ["/login", "/embed/"];

function RootDocument({ children }: { children: React.ReactNode }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const hideHeader = NO_HEADER_PATHS.some((p) => pathname.startsWith(p));
	const isEmbed = EMBED_PATHS.some((p) => pathname.startsWith(p));

	return (
		<html lang="en">
			<head>
				<HeadContent />
				<script
					defer
					data-domain="imposter.fm"
					src="https://tic.nrby.xyz/js/script.js"
				/>
			</head>
			<body className={isEmbed ? "" : "bg-[#0a0a0a]"}>
				<TanStackQueryProvider>
					<PostHogProvider>
						<PersistentPlayerProvider>
							{!hideHeader && <Header />}
							{children}
							{!isEmbed && <MiniPlayer />}
							{!isEmbed && (
								<TanStackDevtools
									config={{ position: "bottom-right" }}
									plugins={[
										{
											name: "Tanstack Router",
											render: <TanStackRouterDevtoolsPanel />,
										},
										TanStackQueryDevtools,
									]}
								/>
							)}
						</PersistentPlayerProvider>
					</PostHogProvider>
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}

function RootNotFound() {
	return (
		<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
			<div className="text-center border-2 border-white p-10 max-w-xl w-full">
				<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-4">
					404
				</div>
				<h1 className="font-black text-white text-4xl uppercase tracking-tight mb-4">
					Page Not Found
				</h1>
				<p className="text-white/60 mb-8">
					The page you requested does not exist or has moved.
				</p>
				<Link
					to="/"
					className="inline-block border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest px-5 py-2 hover:bg-[#22c55e] hover:text-black transition-colors"
				>
					Back Home
				</Link>
			</div>
		</div>
	);
}
