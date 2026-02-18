import { useEffect, useRef, useState } from "react";
import type { DiscordEmbed } from "../api";
import * as api from "../api";
import type { User } from "../types";
import { Nav } from "./Nav";

interface FieldEntry {
	id: string;
	name: string;
	value: string;
	inline: boolean;
}

let fieldIdCounter = 0;

function hexToDecimal(hex: string): number | undefined {
	if (!hex) return undefined;
	const cleaned = hex.replace("#", "");
	return Number.parseInt(cleaned, 16);
}

export function TestWebhookPage({
	navigate,
}: {
	navigate: (path: string) => void;
}) {
	const [user, setUser] = useState<User | null>(null);

	// Form state
	const [webhookUrl, setWebhookUrl] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [url, setUrl] = useState("");
	const [colorHex, setColorHex] = useState("");
	const [timestamp, setTimestamp] = useState("");
	const [authorName, setAuthorName] = useState("");
	const [authorUrl, setAuthorUrl] = useState("");
	const [authorIconUrl, setAuthorIconUrl] = useState("");
	const [footerText, setFooterText] = useState("");
	const [footerIconUrl, setFooterIconUrl] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [thumbnailUrl, setThumbnailUrl] = useState("");
	const [fields, setFields] = useState<FieldEntry[]>([]);

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		api.getMe().then((u) => {
			if (!u) {
				navigate("/");
				return;
			}
			setUser(u);
		});
	}, [navigate]);

	const buildEmbed = (): DiscordEmbed => {
		const embed: DiscordEmbed = {};
		if (title) embed.title = title;
		if (description) embed.description = description;
		if (url) embed.url = url;
		if (colorHex) embed.color = hexToDecimal(colorHex);
		embed.timestamp = timestamp
			? new Date(timestamp).toISOString()
			: new Date().toISOString();

		if (authorName || authorUrl || authorIconUrl) {
			embed.author = {};
			if (authorName) embed.author.name = authorName;
			if (authorUrl) embed.author.url = authorUrl;
			if (authorIconUrl) embed.author.icon_url = authorIconUrl;
		}

		if (footerText || footerIconUrl) {
			embed.footer = {};
			if (footerText) embed.footer.text = footerText;
			if (footerIconUrl) embed.footer.icon_url = footerIconUrl;
		}

		if (imageUrl) embed.image = { url: imageUrl };
		if (thumbnailUrl) embed.thumbnail = { url: thumbnailUrl };

		const validFields = fields.filter((f) => f.name && f.value);
		if (validFields.length > 0) {
			embed.fields = validFields.map((f) => ({
				name: f.name,
				value: f.value,
				inline: f.inline,
			}));
		}

		return embed;
	};

	const addField = () => {
		setFields((prev) => [
			...prev,
			{ id: `field-${fieldIdCounter++}`, name: "", value: "", inline: false },
		]);
	};

	const removeField = (id: string) => {
		setFields((prev) => prev.filter((f) => f.id !== id));
	};

	const updateField = (
		id: string,
		key: keyof FieldEntry,
		value: string | boolean,
	) => {
		setFields((prev) =>
			prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);
		try {
			const embed = buildEmbed();
			if (!embed.title && !embed.description && !embed.fields?.length) {
				throw new Error(
					"Embed must have at least title, description, or fields",
				);
			}
			await api.sendTestWebhook(webhookUrl, embed);
			setSuccess("Webhook sent successfully! Check your Discord channel.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send webhook");
		} finally {
			setLoading(false);
		}
	};

	const clearForm = () => {
		setTitle("");
		setDescription("");
		setUrl("");
		setColorHex("");
		setTimestamp("");
		setAuthorName("");
		setAuthorUrl("");
		setAuthorIconUrl("");
		setFooterText("");
		setFooterIconUrl("");
		setImageUrl("");
		setThumbnailUrl("");
		setFields([]);
		fieldIdCounter = 0;
	};

	const loadExample = (type: string) => {
		clearForm();
		if (type === "github-pr") {
			setTitle("PR #42 Opened: Add new feature");
			setDescription("by alice");
			setUrl("https://github.com/owner/repo/pull/42");
			setColorHex("#238636");
			setFooterText("owner/repo");
			setAuthorName("alice");
			setAuthorIconUrl("https://github.com/alice.png");
		} else if (type === "success") {
			setTitle("\u2705 Deployment Successful");
			setDescription("Production deployment completed successfully");
			setColorHex("#238636");
			setFooterText("Deployment System");
			setFields([
				{
					id: `field-${fieldIdCounter++}`,
					name: "Environment",
					value: "Production",
					inline: false,
				},
				{
					id: `field-${fieldIdCounter++}`,
					name: "Version",
					value: "v1.2.3",
					inline: false,
				},
			]);
		} else if (type === "error") {
			setTitle("\u274C Build Failed");
			setDescription("The build process encountered an error");
			setColorHex("#dc2626");
			setAuthorName("CI/CD System");
			setFooterText("Build #1234");
			setFields([
				{
					id: `field-${fieldIdCounter++}`,
					name: "Error",
					value: "TypeError: Cannot read property of undefined",
					inline: false,
				},
			]);
		} else if (type === "minimal") {
			setTitle("Hello World");
			setDescription("This is a minimal embed example");
		}
	};

	const previewEmbed = buildEmbed();

	if (!user) return null;

	return (
		<div className="min-h-full">
			<Nav user={user} currentPath="/test-webhook" navigate={navigate} />
			<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-bold mb-2">Test Discord Webhook</h1>
					<p className="text-zinc-500">
						Send a test embed to your Discord webhook with all available fields
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Form */}
					<div className="lg:col-span-2 space-y-6">
						<form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
							{/* Webhook URL */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<h2 className="text-lg font-semibold mb-4">Webhook URL</h2>
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
										className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono"
									/>
								</div>
							</div>

							{/* Basic Fields */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<h2 className="text-lg font-semibold mb-4">Basic Fields</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Title
										</label>
										<input
											type="text"
											placeholder="Embed Title"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Description
										</label>
										<textarea
											rows={3}
											placeholder="Embed description text..."
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm resize-none"
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-300 mb-1.5">
												URL
											</label>
											<input
												type="url"
												placeholder="https://example.com"
												value={url}
												onChange={(e) => setUrl(e.target.value)}
												className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono text-xs"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-300 mb-1.5">
												Color (hex)
											</label>
											<input
												type="text"
												placeholder="#238636"
												pattern="#[0-9A-Fa-f]{6}"
												value={colorHex}
												onChange={(e) => setColorHex(e.target.value)}
												className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono"
											/>
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Timestamp
										</label>
										<input
											type="datetime-local"
											value={timestamp}
											onChange={(e) => setTimestamp(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
										/>
										<p className="mt-1 text-xs text-zinc-500">
											Leave empty to use current time
										</p>
									</div>
								</div>
							</div>

							{/* Author */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<h2 className="text-lg font-semibold mb-4">Author</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Name
										</label>
										<input
											type="text"
											placeholder="Author Name"
											value={authorName}
											onChange={(e) => setAuthorName(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-300 mb-1.5">
												URL
											</label>
											<input
												type="url"
												placeholder="https://example.com"
												value={authorUrl}
												onChange={(e) => setAuthorUrl(e.target.value)}
												className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono text-xs"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-300 mb-1.5">
												Icon URL
											</label>
											<input
												type="url"
												placeholder="https://example.com/icon.png"
												value={authorIconUrl}
												onChange={(e) => setAuthorIconUrl(e.target.value)}
												className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono text-xs"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Footer */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<h2 className="text-lg font-semibold mb-4">Footer</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Text
										</label>
										<input
											type="text"
											placeholder="Footer text"
											value={footerText}
											onChange={(e) => setFooterText(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Icon URL
										</label>
										<input
											type="url"
											placeholder="https://example.com/icon.png"
											value={footerIconUrl}
											onChange={(e) => setFooterIconUrl(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono text-xs"
										/>
									</div>
								</div>
							</div>

							{/* Image & Thumbnail */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<h2 className="text-lg font-semibold mb-4">
									Image &amp; Thumbnail
								</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Image URL
										</label>
										<input
											type="url"
											placeholder="https://example.com/image.png"
											value={imageUrl}
											onChange={(e) => setImageUrl(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono text-xs"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-1.5">
											Thumbnail URL
										</label>
										<input
											type="url"
											placeholder="https://example.com/thumb.png"
											value={thumbnailUrl}
											onChange={(e) => setThumbnailUrl(e.target.value)}
											className="w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm font-mono text-xs"
										/>
									</div>
								</div>
							</div>

							{/* Fields */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-lg font-semibold">Fields</h2>
									<button
										type="button"
										onClick={addField}
										className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
									>
										+ Add Field
									</button>
								</div>
								<div className="space-y-4">
									{fields.map((f, i) => (
										<div
											key={f.id}
											className="bg-zinc-800 rounded-lg p-4 space-y-3"
										>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium text-zinc-300">
													Field {i + 1}
												</span>
												<button
													type="button"
													onClick={() => removeField(f.id)}
													className="text-zinc-500 hover:text-red-400 transition-colors"
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
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											</div>
											<div>
												<label className="block text-xs font-medium text-zinc-400 mb-1">
													Name
												</label>
												<input
													type="text"
													value={f.name}
													onChange={(e) =>
														updateField(f.id, "name", e.target.value)
													}
													className="w-full rounded-lg border-0 bg-zinc-700 py-2 px-3 text-zinc-100 ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm"
													placeholder="Field name"
												/>
											</div>
											<div>
												<label className="block text-xs font-medium text-zinc-400 mb-1">
													Value
												</label>
												<textarea
													rows={2}
													value={f.value}
													onChange={(e) =>
														updateField(f.id, "value", e.target.value)
													}
													className="w-full rounded-lg border-0 bg-zinc-700 py-2 px-3 text-zinc-100 ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm resize-none"
													placeholder="Field value"
												/>
											</div>
											<div>
												<label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
													<input
														type="checkbox"
														checked={f.inline}
														onChange={(e) =>
															updateField(f.id, "inline", e.target.checked)
														}
														className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
													/>
													Inline field
												</label>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Examples */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								<h2 className="text-lg font-semibold mb-4">Examples</h2>
								<div className="space-y-2">
									<button
										type="button"
										onClick={() => loadExample("github-pr")}
										className="w-full text-left px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
									>
										<span className="font-medium">GitHub PR Example</span>
										<p className="text-xs text-zinc-500 mt-0.5">
											Pull request opened/closed notification
										</p>
									</button>
									<button
										type="button"
										onClick={() => loadExample("success")}
										className="w-full text-left px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
									>
										<span className="font-medium">Success Notification</span>
										<p className="text-xs text-zinc-500 mt-0.5">
											Deployment success with fields
										</p>
									</button>
									<button
										type="button"
										onClick={() => loadExample("error")}
										className="w-full text-left px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
									>
										<span className="font-medium">Error Alert</span>
										<p className="text-xs text-zinc-500 mt-0.5">
											Error notification with author and footer
										</p>
									</button>
									<button
										type="button"
										onClick={() => loadExample("minimal")}
										className="w-full text-left px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
									>
										<span className="font-medium">Minimal Example</span>
										<p className="text-xs text-zinc-500 mt-0.5">
											Just title and description
										</p>
									</button>
								</div>
							</div>

							{/* Submit */}
							<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
								{error && (
									<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
										{error}
									</div>
								)}
								{success && (
									<div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
										{success}
									</div>
								)}
								<button
									type="submit"
									disabled={loading}
									className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? "Sending..." : "Send Test Webhook"}
								</button>
							</div>
						</form>
					</div>

					{/* Preview */}
					<div className="lg:col-span-1">
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
							<h2 className="text-lg font-semibold mb-4">Preview</h2>
							<pre className="text-xs bg-zinc-800 rounded-lg p-4 overflow-auto max-h-96">
								<code>{JSON.stringify(previewEmbed, null, 2)}</code>
							</pre>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
