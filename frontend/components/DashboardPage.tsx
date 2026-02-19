import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { orpc } from "../client";
import { InviteSection } from "./InviteSection";
import { MappingList } from "./MappingList";
import { MappingModal } from "./MappingModal";
import { Nav } from "./Nav";
import { SecretModal } from "./SecretModal";
import { SettingsModal } from "./SettingsModal";
import { SuccessModal } from "./SuccessModal";

export function DashboardPage({
	navigate,
}: {
	navigate: (path: string) => void;
}) {
	const queryClient = useQueryClient();

	const meQuery = useQuery({
		...orpc.auth.me.queryOptions(),
		retry: false,
	});
	const mappingsQuery = useQuery(orpc.webhooks.list.queryOptions());
	const regModeQuery = useQuery(orpc.auth.registrationMode.queryOptions());

	// Modal state
	const [showAddModal, setShowAddModal] = useState(false);
	const [successData, setSuccessData] = useState<{
		url: string;
		secret: string;
	} | null>(null);
	const [secretData, setSecretData] = useState<{
		repo: string;
		secret: string;
	} | null>(null);
	const [settingsData, setSettingsData] = useState<{
		mappingId: string;
		repo: string;
	} | null>(null);

	useEffect(() => {
		if (meQuery.isError) navigate("/");
	}, [meQuery.isError, navigate]);

	const regenerateSecretMutation = useMutation(
		orpc.webhooks.updateSecret.mutationOptions({
			onSuccess: (_data, variables) => {
				setSecretData({
					repo: variables.repo,
					secret: variables.secret,
				});
			},
		}),
	);

	const handleRegenerateSecret = (repo: string) => {
		if (
			!confirm(
				`Regenerate secret for ${repo}?\n\nYou'll need to update the secret in GitHub's webhook settings.`,
			)
		)
			return;
		const newSecret = crypto.randomUUID();
		regenerateSecretMutation.mutate({ repo, secret: newSecret });
	};

	const user = meQuery.data;
	if (!user) return null;

	const mappings = mappingsQuery.data ?? [];
	const registrationMode = regModeQuery.data?.mode ?? "open";

	return (
		<div className="min-h-full">
			<Nav user={user} currentPath="/dashboard" navigate={navigate} />
			<main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				{/* Webhook Mappings Section */}
				<section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
					<div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold">Webhook Mappings</h2>
							<p className="text-sm text-zinc-500 mt-0.5">
								Route GitHub events to Discord channels
							</p>
						</div>
						<button
							type="button"
							onClick={() => setShowAddModal(true)}
							className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
						>
							+ Add Mapping
						</button>
					</div>
					<div className="divide-y divide-zinc-800">
						<MappingList
							mappings={mappings}
							onOpenSettings={(id, repo) =>
								setSettingsData({ mappingId: id, repo })
							}
							onRegenerateSecret={handleRegenerateSecret}
						/>
					</div>
				</section>

				{/* Invite Codes Section */}
				{registrationMode === "invite_only" && <InviteSection />}
			</main>

			{/* Modals */}
			{showAddModal && (
				<MappingModal
					onClose={() => setShowAddModal(false)}
					onSuccess={(url, secret) => {
						setShowAddModal(false);
						setSuccessData({ url, secret });
						queryClient.invalidateQueries({
							queryKey: orpc.webhooks.key(),
						});
					}}
				/>
			)}
			{successData && (
				<SuccessModal
					githubWebhookUrl={successData.url}
					secret={successData.secret}
					onClose={() => setSuccessData(null)}
				/>
			)}
			{secretData && (
				<SecretModal
					repo={secretData.repo}
					secret={secretData.secret}
					onClose={() => setSecretData(null)}
				/>
			)}
			{settingsData && (
				<SettingsModal
					mappingId={settingsData.mappingId}
					repo={settingsData.repo}
					onClose={() => setSettingsData(null)}
				/>
			)}
		</div>
	);
}
