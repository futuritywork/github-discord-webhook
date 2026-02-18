import { useState } from "react";
import * as api from "../api";

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
			className="px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors ring-1 ring-inset ring-zinc-700"
			title="Copy secret"
		>
			{copied ? (
				<svg
					aria-hidden="true"
					className="h-4 w-4 text-emerald-400"
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
			)}
		</button>
	);
}

export function MappingModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void;
	onSuccess: (githubWebhookUrl: string, secret: string) => void;
}) {
	const [repo, setRepo] = useState("");
	const [webhookUrl, setWebhookUrl] = useState("");
	const [secret, setSecret] = useState(() => crypto.randomUUID());
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const data = await api.createMapping(repo, webhookUrl, secret);
			onSuccess(data.githubWebhookUrl, secret);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add mapping");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl fade-in">
				<h3 className="text-lg font-semibold mb-4">Add Webhook Mapping</h3>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-zinc-300 mb-1.5">
							Repository
						</label>
						<input
							type="text"
							required
							placeholder="owner/repo"
							value={repo}
							onChange={(e) => setRepo(e.target.value)}
							className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-zinc-300 mb-1.5">
							Discord Webhook URL
						</label>
						<input
							type="url"
							required
							placeholder="https://discord.com/api/webhooks/..."
							value={webhookUrl}
							onChange={(e) => setWebhookUrl(e.target.value)}
							className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-zinc-300 mb-1.5">
							GitHub Webhook Secret
						</label>
						<div className="flex gap-2">
							<input
								type="text"
								required
								readOnly
								value={secret}
								className="flex-1 rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 text-sm font-mono"
							/>
							<button
								type="button"
								onClick={() => setSecret(crypto.randomUUID())}
								className="px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors ring-1 ring-inset ring-zinc-700"
								title="Generate new secret"
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
										d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
									/>
								</svg>
							</button>
							<CopyButton text={secret} />
						</div>
						<p className="text-xs text-zinc-500 mt-1">
							Auto-generated secret. Copy and use in GitHub webhook settings.
						</p>
					</div>
					{error && (
						<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
							{error}
						</div>
					)}
					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all disabled:opacity-50"
						>
							{loading ? "Adding..." : "Add Mapping"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
