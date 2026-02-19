import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { orpc } from "../client";
import type { EventKey } from "../types";
import { EVENT_LABELS } from "../types";

function UsernameCombobox({
	value,
	onChange,
	suggestions,
}: {
	value: string;
	onChange: (val: string) => void;
	suggestions: string[];
}) {
	const [open, setOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const filtered = value
		? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
		: suggestions;

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const select = (username: string) => {
		onChange(username);
		setOpen(false);
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!open || filtered.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightIndex((i) => (i + 1) % filtered.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
		} else if (
			e.key === "Enter" &&
			highlightIndex >= 0 &&
			filtered[highlightIndex]
		) {
			e.preventDefault();
			select(filtered[highlightIndex]);
		} else if (e.key === "Escape") {
			e.stopPropagation();
			setOpen(false);
		}
	};

	return (
		<div ref={ref} className="relative flex-1">
			<input
				ref={inputRef}
				type="text"
				placeholder="GitHub username"
				data-1p-ignore
				autoComplete="off"
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					setHighlightIndex(-1);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={handleKeyDown}
				className="w-full rounded-lg border-0 bg-zinc-800 py-2 px-3 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-sm"
			/>
			{open && filtered.length > 0 && (
				<div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl">
					{filtered.map((username, i) => (
						<button
							key={username}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								select(username);
							}}
							onMouseEnter={() => setHighlightIndex(i)}
							className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
								i === highlightIndex
									? "bg-violet-500/20 text-violet-300"
									: "text-zinc-300 hover:bg-zinc-700"
							}`}
						>
							{username}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function SettingsModal({
	mappingId,
	repo,
	onClose,
}: {
	mappingId: string;
	repo: string;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [pingError, setPingError] = useState("");
	const [userError, setUserError] = useState("");
	const [newGithub, setNewGithub] = useState("");
	const [newDiscord, setNewDiscord] = useState("");

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	const settingsQuery = useQuery(
		orpc.pingSettings.get.queryOptions({ input: { mappingId } }),
	);
	const usersQuery = useQuery(
		orpc.pingSettings.listDiscordUsers.queryOptions({ input: { mappingId } }),
	);
	const seenQuery = useQuery(
		orpc.pingSettings.listSeenUsernames.queryOptions({
			input: { mappingId },
		}),
	);

	const settings = settingsQuery.data;
	const users = usersQuery.data ?? [];
	const seenUsernames = seenQuery.data ?? [];

	// Filter out usernames that already have a mapping
	const mappedUsernames = new Set(users.map((u) => u.githubUsername));
	const availableSuggestions = seenUsernames.filter(
		(u) => !mappedUsernames.has(u),
	);

	const toggleMutation = useMutation(
		orpc.pingSettings.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.pingSettings.get.key({ input: { mappingId } }),
				});
				setPingError("");
			},
			onError: (err) => {
				setPingError(err.message);
			},
		}),
	);

	const addUserMutation = useMutation(
		orpc.pingSettings.addDiscordUser.mutationOptions({
			onSuccess: () => {
				setNewGithub("");
				setNewDiscord("");
				setUserError("");
				queryClient.invalidateQueries({
					queryKey: orpc.pingSettings.listDiscordUsers.key({
						input: { mappingId },
					}),
				});
			},
			onError: (err) => {
				setUserError(err.message);
			},
		}),
	);

	const deleteUserMutation = useMutation(
		orpc.pingSettings.deleteDiscordUser.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.pingSettings.listDiscordUsers.key({
						input: { mappingId },
					}),
				});
			},
			onError: (err) => {
				alert(err.message);
			},
		}),
	);

	const toggleSetting = (key: EventKey, enabled: boolean) => {
		setPingError("");
		toggleMutation.mutate({ mappingId, settings: { [key]: enabled } });
	};

	const addUserMapping = () => {
		setUserError("");
		const githubUsername = newGithub.trim();
		const discordUserId = newDiscord.trim();
		if (!githubUsername || !discordUserId) {
			setUserError("Both fields are required");
			return;
		}
		addUserMutation.mutate({ mappingId, githubUsername, discordUserId });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Ping Settings</h3>
					<span className="text-sm text-zinc-400">{repo}</span>
				</div>

				{/* Event Toggles */}
				<div className="mb-6">
					<h4 className="text-sm font-medium text-zinc-300 mb-3">
						Discord Ping Events
					</h4>
					<p className="text-xs text-zinc-500 mb-3">
						Choose which events ping mapped Discord users.
					</p>
					<div className="space-y-2">
						{settings &&
							(Object.entries(EVENT_LABELS) as [EventKey, string][]).map(
								([key, label]) => (
									<label
										key={key}
										className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer"
									>
										<span className="text-sm text-zinc-300">{label}</span>
										<div className="relative">
											<input
												type="checkbox"
												checked={settings[key] ?? false}
												onChange={(e) => toggleSetting(key, e.target.checked)}
												className="sr-only peer"
											/>
											<div className="w-9 h-5 bg-zinc-700 rounded-full peer-checked:bg-violet-500 transition-colors" />
											<div className="absolute left-0.5 top-0.5 w-4 h-4 bg-zinc-300 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
										</div>
									</label>
								),
							)}
					</div>
					{pingError && (
						<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-2">
							{pingError}
						</div>
					)}
				</div>

				{/* User Mappings */}
				<div className="border-t border-zinc-800 pt-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<h4 className="text-sm font-medium text-zinc-300">
								User Mappings
							</h4>
							<p className="text-xs text-zinc-500 mt-0.5">
								Map GitHub usernames to Discord user IDs
							</p>
						</div>
					</div>
					<div className="space-y-2 mb-3">
						{users.length === 0 ? (
							<div className="text-xs text-zinc-500 py-2">
								No user mappings yet.
							</div>
						) : (
							users.map((u) => (
								<div
									key={u.id}
									className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50"
								>
									<span className="text-sm text-zinc-300 flex-1 truncate">
										{u.githubUsername}
									</span>
									<svg
										aria-hidden="true"
										className="h-3.5 w-3.5 text-zinc-600 shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="2"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
										/>
									</svg>
									<span className="text-sm text-violet-400 flex-1 truncate">
										{u.discordUserId}
									</span>
									<button
										type="button"
										onClick={() =>
											deleteUserMutation.mutate({ mappingId, id: u.id })
										}
										className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors shrink-0"
										title="Remove"
									>
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
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							))
						)}
					</div>
					<div className="flex gap-2">
						<UsernameCombobox
							value={newGithub}
							onChange={setNewGithub}
							suggestions={availableSuggestions}
						/>
						<input
							type="text"
							placeholder="Discord user ID"
							data-1p-ignore
							autoComplete="off"
							value={newDiscord}
							onChange={(e) => setNewDiscord(e.target.value)}
							className="flex-1 rounded-lg border-0 bg-zinc-800 py-2 px-3 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-sm"
						/>
						<button
							type="button"
							onClick={addUserMapping}
							className="px-3 py-2 rounded-lg text-sm font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors border border-violet-500/20 shrink-0"
						>
							Add
						</button>
					</div>
					{userError && (
						<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-2">
							{userError}
						</div>
					)}
				</div>

				<div className="mt-6">
					<button
						type="button"
						onClick={onClose}
						className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-zinc-950 bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-300 hover:to-purple-300 transition-all"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}
