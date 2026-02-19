import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../client";

function formatDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

export function InviteSection() {
	const queryClient = useQueryClient();
	const invitesQuery = useQuery(orpc.auth.listInvites.queryOptions());
	const invites = invitesQuery.data?.invites ?? [];

	const createMutation = useMutation(
		orpc.auth.createInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.auth.listInvites.key(),
				});
			},
			onError: (err) => {
				alert(err.message);
			},
		}),
	);

	const revokeMutation = useMutation(
		orpc.auth.revokeInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.auth.listInvites.key(),
				});
			},
			onError: (err) => {
				alert(err.message);
			},
		}),
	);

	const handleRevoke = (code: string) => {
		if (!confirm(`Revoke invite code ${code}?`)) return;
		revokeMutation.mutate({ code });
	};

	const handleCopy = (code: string) => {
		navigator.clipboard.writeText(code);
	};

	return (
		<section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
			<div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Invite Codes</h2>
					<p className="text-sm text-zinc-500 mt-0.5">
						Invite others to register
					</p>
				</div>
				<button
					type="button"
					onClick={() => createMutation.mutate(undefined)}
					disabled={createMutation.isPending}
					className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors border border-violet-500/20 disabled:opacity-50"
				>
					{createMutation.isPending ? "Creating..." : "+ Create Invite"}
				</button>
			</div>
			<div className="divide-y divide-zinc-800">
				{invitesQuery.isLoading ? (
					<div className="px-6 py-8 text-center text-zinc-500">Loading...</div>
				) : invites.length === 0 ? (
					<div className="px-6 py-8 text-center text-zinc-500">
						<svg
							aria-hidden="true"
							className="h-8 w-8 mx-auto mb-2 opacity-50"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
							/>
						</svg>
						No invite codes yet.
					</div>
				) : (
					invites.map((inv) => (
						<div
							key={inv.code}
							className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-3">
									<code className="font-medium text-violet-400 tracking-wider">
										{inv.code}
									</code>
									{inv.used ? (
										<span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-500">
											Used
										</span>
									) : (
										<span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
											Available
										</span>
									)}
								</div>
								<div className="text-sm text-zinc-500 mt-1">
									Created {formatDate(inv.createdAt)}
									{inv.usedAt ? ` \u00B7 Used ${formatDate(inv.usedAt)}` : ""}
								</div>
							</div>
							{!inv.used && (
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => handleCopy(inv.code)}
										className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
										title="Copy code"
									>
										<svg
											aria-hidden="true"
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="2"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
											/>
										</svg>
									</button>
									<button
										type="button"
										onClick={() => handleRevoke(inv.code)}
										className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
										title="Revoke code"
									>
										<svg
											aria-hidden="true"
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="2"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
											/>
										</svg>
									</button>
								</div>
							)}
						</div>
					))
				)}
			</div>
		</section>
	);
}
