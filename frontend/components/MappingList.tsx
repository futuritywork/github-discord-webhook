import { useState } from "react";
import * as api from "../api";
import type { WebhookMapping } from "../types";

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
			title="Copy"
		>
			{copied ? (
				<svg
					aria-hidden="true"
					className="h-3.5 w-3.5 text-emerald-400"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="2"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M4.5 12.75l6 6 9-13.5"
					/>
				</svg>
			) : (
				<svg
					aria-hidden="true"
					className="h-3.5 w-3.5"
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
			)}
		</button>
	);
}

export function MappingList({
	mappings,
	onReload,
	onOpenSettings,
	onRegenerateSecret,
}: {
	mappings: WebhookMapping[];
	onReload: () => void;
	onOpenSettings: (mappingId: string, repo: string) => void;
	onRegenerateSecret: (repo: string) => void;
}) {
	const handleDelete = async (repo: string) => {
		if (!confirm(`Delete mapping for ${repo}?`)) return;
		try {
			await api.deleteMapping(repo);
			onReload();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete");
		}
	};

	if (mappings.length === 0) {
		return (
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
						d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
					/>
				</svg>
				No webhook mappings yet. Add one to get started.
			</div>
		);
	}

	return (
		<>
			{mappings.map((m) => (
				<div
					key={m.id}
					className="px-6 py-4 hover:bg-zinc-800/50 transition-colors"
				>
					<div className="flex items-center justify-between gap-4 mb-2">
						<div className="font-medium text-zinc-100">{m.repo}</div>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => onOpenSettings(m.id, m.repo)}
								className="p-2 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
								title="Ping settings"
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
										d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</button>
							<button
								type="button"
								onClick={() => onRegenerateSecret(m.repo)}
								className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
								title="Regenerate secret"
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
										d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
									/>
								</svg>
							</button>
							<button
								type="button"
								onClick={() => handleDelete(m.repo)}
								className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
								title="Delete mapping"
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
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="text-xs text-zinc-500 w-16 shrink-0">
								GitHub:
							</span>
							<code className="text-xs text-cyan-400 truncate flex-1">
								{m.githubWebhookUrl}
							</code>
							<CopyButton text={m.githubWebhookUrl} />
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-zinc-500 w-16 shrink-0">
								Discord:
							</span>
							<code className="text-xs text-zinc-400 truncate flex-1">
								{m.discordWebhookUrl}
							</code>
						</div>
					</div>
				</div>
			))}
		</>
	);
}
