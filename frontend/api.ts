import {
	CreateInviteResponseSchema,
	CreateMappingResponseSchema,
	DeleteResponseSchema,
	ErrorResponseSchema,
	type GitHubDiscordUser,
	GitHubDiscordUserListSchema,
	GitHubDiscordUserSchema,
	InvitesResponseSchema,
	LoginResponseSchema,
	type PingSettings,
	PingSettingsSchema,
	RegisterResponseSchema,
	RegistrationModeSchema,
	TestWebhookResponseSchema,
	UpdateSecretResponseSchema,
	UserSchema,
	WebhookMappingListSchema,
} from "./types";

class ApiError extends Error {}

async function parseErrorOrThrow(res: Response): Promise<never> {
	const json: unknown = await res.json();
	const parsed = ErrorResponseSchema.safeParse(json);
	if (parsed.success) {
		throw new ApiError(parsed.data.error);
	}
	throw new ApiError(`Request failed with status ${res.status}`);
}

// =====================================================================
// Auth
// =====================================================================

export async function getMe() {
	const res = await fetch("/auth/me");
	if (!res.ok) return null;
	const json: unknown = await res.json();
	return UserSchema.parse(json);
}

export async function getRegistrationMode() {
	const res = await fetch("/auth/registration-mode");
	const json: unknown = await res.json();
	return RegistrationModeSchema.parse(json);
}

export async function login(username: string, password: string) {
	const res = await fetch("/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	});
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return LoginResponseSchema.parse(json);
}

export async function register(
	username: string,
	password: string,
	inviteCode?: string,
) {
	const res = await fetch("/auth/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password, inviteCode }),
	});
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return RegisterResponseSchema.parse(json);
}

export async function logout() {
	await fetch("/auth/logout", { method: "POST" });
}

// =====================================================================
// Invites
// =====================================================================

export async function getInvites() {
	const res = await fetch("/auth/invites");
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return InvitesResponseSchema.parse(json);
}

export async function createInvite() {
	const res = await fetch("/auth/invites", { method: "POST" });
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return CreateInviteResponseSchema.parse(json);
}

export async function revokeInvite(code: string) {
	const res = await fetch(`/auth/invites/${encodeURIComponent(code)}`, {
		method: "DELETE",
	});
	if (!res.ok) await parseErrorOrThrow(res);
}

// =====================================================================
// Webhook Mappings
// =====================================================================

export async function getMappings() {
	const res = await fetch("/webhooks/mapping");
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return WebhookMappingListSchema.parse(json);
}

export async function createMapping(
	repo: string,
	webhookUrl: string,
	secret: string,
) {
	const res = await fetch("/webhooks/mapping", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ repo, webhookUrl, secret }),
	});
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return CreateMappingResponseSchema.parse(json);
}

export async function deleteMapping(repo: string) {
	const res = await fetch(`/webhooks/mapping/${encodeURIComponent(repo)}`, {
		method: "DELETE",
	});
	if (!res.ok) await parseErrorOrThrow(res);
}

export async function regenerateSecret(repo: string, secret: string) {
	const res = await fetch(
		`/webhooks/mapping/${encodeURIComponent(repo)}/secret`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ secret }),
		},
	);
	if (!res.ok) await parseErrorOrThrow(res);
	return UpdateSecretResponseSchema.parse(await res.json());
}

// =====================================================================
// Ping Settings
// =====================================================================

export async function getPingSettings(mappingId: string) {
	const res = await fetch(`/ping-settings/${mappingId}`);
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return PingSettingsSchema.parse(json);
}

export async function updatePingSettings(
	mappingId: string,
	settings: Partial<PingSettings>,
) {
	const res = await fetch(`/ping-settings/${mappingId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(settings),
	});
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return PingSettingsSchema.parse(json);
}

// =====================================================================
// GitHub-Discord User Mappings
// =====================================================================

export async function getDiscordUsers(
	mappingId: string,
): Promise<GitHubDiscordUser[]> {
	const res = await fetch(`/ping-settings/${mappingId}/discord-users`);
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return GitHubDiscordUserListSchema.parse(json);
}

export async function addDiscordUser(
	mappingId: string,
	githubUsername: string,
	discordUserId: string,
) {
	const res = await fetch(`/ping-settings/${mappingId}/discord-users`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ githubUsername, discordUserId }),
	});
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return GitHubDiscordUserSchema.parse(json);
}

export async function deleteDiscordUser(mappingId: string, id: string) {
	const res = await fetch(`/ping-settings/${mappingId}/discord-users/${id}`, {
		method: "DELETE",
	});
	if (!res.ok) await parseErrorOrThrow(res);
	return DeleteResponseSchema.parse(await res.json());
}

// =====================================================================
// Test Webhook
// =====================================================================

export interface DiscordEmbed {
	title?: string;
	description?: string;
	url?: string;
	color?: number;
	timestamp?: string;
	author?: { name?: string; url?: string; icon_url?: string };
	footer?: { text?: string; icon_url?: string };
	image?: { url: string };
	thumbnail?: { url: string };
	fields?: { name: string; value: string; inline?: boolean }[];
}

export async function sendTestWebhook(webhookUrl: string, embed: DiscordEmbed) {
	const res = await fetch("/webhooks/test", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ webhookUrl, embed }),
	});
	if (!res.ok) await parseErrorOrThrow(res);
	const json: unknown = await res.json();
	return TestWebhookResponseSchema.parse(json);
}
