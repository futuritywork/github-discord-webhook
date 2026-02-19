import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../client";
import type { User } from "../types";

export function Nav({
	user,
	currentPath,
	navigate,
}: {
	user: User;
	currentPath: string;
	navigate: (path: string) => void;
}) {
	const queryClient = useQueryClient();
	const logoutMutation = useMutation(
		orpc.auth.logout.mutationOptions({
			onSuccess: () => {
				queryClient.clear();
				navigate("/");
			},
		}),
	);

	return (
		<nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
							<svg
								aria-hidden="true"
								className="h-5 w-5 text-zinc-950"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="2"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
								/>
							</svg>
						</div>
						<span className="text-lg font-semibold">
							{currentPath === "/dashboard" ? "Dashboard" : "Test Webhook"}
						</span>
					</div>
					<div className="flex items-center gap-4">
						{currentPath === "/dashboard" ? (
							<button
								type="button"
								onClick={() => navigate("/test-webhook")}
								className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
							>
								Test Webhook
							</button>
						) : (
							<button
								type="button"
								onClick={() => navigate("/dashboard")}
								className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
							>
								Dashboard
							</button>
						)}
						<span className="text-sm text-zinc-400">{user.username}</span>
						<button
							type="button"
							onClick={() => logoutMutation.mutate(undefined)}
							className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
						>
							Sign out
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
