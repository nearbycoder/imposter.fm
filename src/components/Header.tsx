import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { openCommandMenu } from "#/components/GlobalCommandMenu";
import { PocketCastsLogo } from "#/components/icons/PocketCastsLogo";
import { authClient } from "#/lib/auth-client";

const POCKET_CASTS_URL =
	"https://pocketcasts.com/podcast/imposterfm/2711c4e0-f017-013e-f85c-022038d1b2e1";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [hasHydrated, setHasHydrated] = useState(false);
	const [isMacPlatform, setIsMacPlatform] = useState(true);
	const { data: session } = authClient.useSession();
	const showAdminLink = hasHydrated && Boolean(session?.user);
	const shortcutHint = isMacPlatform ? "⌘K" : "Ctrl K";

	useEffect(() => {
		setHasHydrated(true);
		setIsMacPlatform(
			/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent),
		);
	}, []);

	const navLinks: Array<{ to: string; label: string; exact?: boolean }> = [
		{ to: "/", label: "HOME", exact: true },
		{ to: "/episodes", label: "EPISODES" },
	];

	return (
		<>
			<header className="border-b-2 border-white bg-[#0a0a0a] flex items-center px-4 h-14">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="p-2 text-white hover:text-[#22c55e] transition-colors mr-4"
					aria-label="Open menu"
				>
					<Menu size={20} />
				</button>

				<Link
					to="/"
					className="font-black text-white text-lg uppercase tracking-tight hover:text-[#22c55e] transition-colors"
				>
					IMPOSTER<span className="text-[#22c55e]">.</span>FM
				</Link>

				<nav className="hidden md:flex items-center gap-1 ml-8">
					{navLinks.map((link) => (
						<Link
							key={link.to}
							to={link.to as never}
							className="font-mono text-xs uppercase tracking-widest px-3 py-2 text-white/60 hover:text-white transition-colors"
							activeProps={{
								className:
									"font-mono text-xs uppercase tracking-widest px-3 py-2 text-[#22c55e]",
							}}
							activeOptions={link.exact ? { exact: true } : undefined}
						>
							{link.label}
						</Link>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-3">
					<button
						type="button"
						onClick={openCommandMenu}
						className="hidden md:inline-flex items-center gap-2 border border-white/20 hover:border-[#22c55e] px-2.5 py-1.5 transition-colors"
						aria-label={`Open command menu (${shortcutHint})`}
					>
						<Search size={13} className="text-white/60" />
						<span className="font-mono text-[11px] uppercase tracking-widest text-white/60">
							Command
						</span>
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
							{shortcutHint}
						</span>
					</button>
					<a
						href={POCKET_CASTS_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="hidden md:flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
						aria-label="Subscribe on Pocket Casts"
					>
						<PocketCastsLogo className="w-4 h-4" />
						<span className="hidden lg:inline">POCKET CASTS</span>
					</a>
					<a
						href="/rss.xml"
						className="hidden md:block font-mono text-xs uppercase tracking-widest text-white/30 hover:text-[#22c55e] transition-colors"
						aria-label="RSS Feed"
					>
						RSS
					</a>
					{showAdminLink && (
						<Link
							to="/admin"
							className="font-mono text-xs uppercase tracking-widest border border-white/20 hover:border-[#22c55e] text-white/40 hover:text-[#22c55e] px-3 py-1 transition-colors"
						>
							ADMIN
						</Link>
					)}
				</div>
			</header>

			{/* Mobile drawer backdrop */}
			{isOpen && (
				<button
					type="button"
					aria-label="Close menu"
					className="fixed inset-0 z-50 bg-black/80 cursor-default border-0 p-0 w-full"
					onClick={() => setIsOpen(false)}
				/>
			)}

			<aside
				className={`fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r-2 border-white z-50 flex flex-col transform transition-transform duration-200 ease-in-out ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between px-4 h-14 border-b-2 border-white">
					<span className="font-black text-white text-base uppercase tracking-tight">
						IMPOSTER<span className="text-[#22c55e]">.</span>FM
					</span>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 text-white hover:text-[#22c55e] transition-colors"
						aria-label="Close menu"
					>
						<X size={18} />
					</button>
				</div>

				<nav className="flex-1 p-4 flex flex-col gap-1">
					<button
						type="button"
						onClick={() => {
							openCommandMenu();
							setIsOpen(false);
						}}
						className="w-full flex items-center justify-between font-mono text-xs uppercase tracking-widest px-3 py-3 text-white/60 hover:text-white border-b border-white/10 transition-colors"
					>
						<span className="flex items-center gap-2">
							<Search size={13} />
							Command Menu
						</span>
						<span className="text-white/40">{shortcutHint}</span>
					</button>
					{navLinks.map((link) => (
						<Link
							key={link.to}
							to={link.to as never}
							onClick={() => setIsOpen(false)}
							className="block font-mono text-xs uppercase tracking-widest px-3 py-3 text-white/60 hover:text-white border-b border-white/10 transition-colors"
							activeProps={{
								className:
									"block font-mono text-xs uppercase tracking-widest px-3 py-3 text-[#22c55e] border-b border-white/10",
							}}
							activeOptions={link.exact ? { exact: true } : undefined}
						>
							{link.label}
						</Link>
					))}

					<a
						href="/rss.xml"
						className="block font-mono text-xs uppercase tracking-widest px-3 py-3 text-white/40 hover:text-[#22c55e] border-b border-white/10 transition-colors"
						onClick={() => setIsOpen(false)}
					>
						RSS FEED ↗
					</a>

					<a
						href={POCKET_CASTS_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-3 py-3 text-white/40 hover:text-[#22c55e] border-b border-white/10 transition-colors"
						onClick={() => setIsOpen(false)}
					>
						<PocketCastsLogo className="w-4 h-4" />
						<span>POCKET CASTS ↗</span>
					</a>

					{showAdminLink && (
						<Link
							to="/admin"
							onClick={() => setIsOpen(false)}
							className="block font-mono text-xs uppercase tracking-widest px-3 py-3 text-white/40 hover:text-[#22c55e] border-b border-white/10 transition-colors"
						>
							ADMIN PANEL
						</Link>
					)}
				</nav>
			</aside>
		</>
	);
}
