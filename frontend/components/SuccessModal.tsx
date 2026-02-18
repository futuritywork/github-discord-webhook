import { useState } from "react";

function CopyBtn({ text, label }: { text: string; label: string }) {
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
			className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
			title={`Copy ${label}`}
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
					className="h-4 w-4 text-zinc-400"
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

export function SuccessModal({
	githubWebhookUrl,
	secret,
	onClose,
}: {
	githubWebhookUrl: string;
	secret: string;
	onClose: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl fade-in">
				<div className="flex items-center gap-3 mb-4">
					<div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
						<svg
							aria-hidden="true"
							className="h-5 w-5 text-emerald-400"
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
					</div>
					<h3 className="text-lg font-semibold">Webhook Created!</h3>
				</div>
				<p className="text-sm text-zinc-400 mb-4">
					Configure these in your GitHub repository webhook settings:
				</p>
				<div className="space-y-3">
					<div>
						<span className="block text-xs font-medium text-zinc-500 mb-1">
							Payload URL
						</span>
						<div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
							<code className="flex-1 text-sm text-cyan-400 break-all">
								{githubWebhookUrl}
							</code>
							<CopyBtn text={githubWebhookUrl} label="URL" />
						</div>
					</div>
					<div>
						<span className="block text-xs font-medium text-zinc-500 mb-1">
							Secret
						</span>
						<div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
							<code className="flex-1 text-sm text-emerald-400 break-all font-mono">
								{secret}
							</code>
							<CopyBtn text={secret} label="Secret" />
						</div>
					</div>
					<div className="text-xs text-zinc-500 space-y-1 pt-1">
						<p>
							In GitHub:{" "}
							<strong>Settings &rarr; Webhooks &rarr; Add webhook</strong>
						</p>
						<p>
							&bull; Set Content type to{" "}
							<code className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">
								application/json
							</code>
						</p>
					</div>
				</div>
				<div className="mt-6">
					<button
						type="button"
						onClick={onClose}
						className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}
