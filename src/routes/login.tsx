import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({
	head: () => ({
		meta: [
			{ title: "Login | imposter.fm" },
			{
				name: "robots",
				content: "noindex,nofollow,noarchive,nosnippet,max-image-preview:none",
			},
		],
	}),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const emailId = useId();
	const passwordId = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const result = await authClient.signIn.email({ email, password });

		if (result.error) {
			setError(result.error.message ?? "Sign in failed");
			setLoading(false);
		} else {
			await navigate({ to: "/admin" });
		}
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<div className="border-2 border-white p-8">
					<div className="font-mono text-[#22c55e] text-xs uppercase tracking-widest mb-2">
						IMPOSTER.FM
					</div>
					<h1 className="font-black text-white text-3xl uppercase tracking-tight mb-8">
						ADMIN
					</h1>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div>
							<label
								htmlFor={emailId}
								className="block font-mono text-xs text-white/60 uppercase tracking-widest mb-1"
							>
								EMAIL
							</label>
							<input
								id={emailId}
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full bg-transparent border-2 border-white/30 text-white px-3 py-2 font-mono text-sm focus:border-[#22c55e] focus:outline-none transition-colors"
								placeholder="you@example.com"
							/>
						</div>

						<div>
							<label
								htmlFor={passwordId}
								className="block font-mono text-xs text-white/60 uppercase tracking-widest mb-1"
							>
								PASSWORD
							</label>
							<input
								id={passwordId}
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full bg-transparent border-2 border-white/30 text-white px-3 py-2 font-mono text-sm focus:border-[#22c55e] focus:outline-none transition-colors"
								placeholder="••••••••"
							/>
						</div>

						{error && (
							<div className="font-mono text-xs text-red-500 border border-red-500 px-3 py-2">
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							className="border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-widest py-3 hover:bg-[#22c55e] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "SIGNING IN..." : "SIGN IN"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
