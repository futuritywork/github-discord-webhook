import { z } from "zod";

// =====================================================================
// API Response Schemas
// =====================================================================

export const UserSchema = z.object({
	id: z.string(),
	username: z.string(),
	createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const RegistrationModeSchema = z.object({
	mode: z.enum(["open", "invite_only", "closed"]),
});
export type RegistrationMode = z.infer<typeof RegistrationModeSchema>;

export const LoginResponseSchema = z.object({
	success: z.literal(true),
	userId: z.string(),
});

export const RegisterResponseSchema = z.object({
	userId: z.string(),
	username: z.string(),
});

export const WebhookMappingSchema = z.object({
	id: z.string(),
	repo: z.string(),
	discordWebhookUrl: z.string(),
	githubWebhookUrl: z.string(),
});
export type WebhookMapping = z.infer<typeof WebhookMappingSchema>;

export const WebhookMappingListSchema = z.array(WebhookMappingSchema);

export const CreateMappingResponseSchema = z.object({
	created: z.literal(true),
	repo: z.string(),
	id: z.string(),
	githubWebhookUrl: z.string(),
});
export type CreateMappingResponse = z.infer<typeof CreateMappingResponseSchema>;

export const EventKeySchema = z.enum([
	"pr_opened",
	"pr_closed",
	"pr_merged",
	"pr_converted_to_draft",
	"pr_ready_for_review",
	"review_approved",
	"review_changes_requested",
	"review_commented",
]);
export type EventKey = z.infer<typeof EventKeySchema>;

export const PingSettingsSchema = z.record(EventKeySchema, z.boolean());
export type PingSettings = z.infer<typeof PingSettingsSchema>;

export const GitHubDiscordUserSchema = z.object({
	id: z.string(),
	webhookMappingId: z.string(),
	githubUsername: z.string(),
	discordUserId: z.string(),
	userId: z.string().nullable(),
	createdAt: z.string(),
});
export type GitHubDiscordUser = z.infer<typeof GitHubDiscordUserSchema>;

export const GitHubDiscordUserListSchema = z.array(GitHubDiscordUserSchema);

export const InviteSchema = z.object({
	code: z.string(),
	createdAt: z.string(),
	used: z.boolean(),
	usedAt: z.string().nullable(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const InvitesResponseSchema = z.object({
	invites: z.array(InviteSchema),
});

export const CreateInviteResponseSchema = z.object({
	code: z.string(),
});

export const ErrorResponseSchema = z.object({
	error: z.string(),
});

export const TestWebhookResponseSchema = z.object({
	sent: z.literal(true),
	status: z.number(),
});

export const DeleteResponseSchema = z.object({
	deleted: z.literal(true),
});

export const UpdateSecretResponseSchema = z.object({
	updated: z.literal(true),
	repo: z.string(),
});

export const EVENT_LABELS: Record<EventKey, string> = {
	pr_opened: "PR Opened",
	pr_closed: "PR Closed (not merged)",
	pr_merged: "PR Merged",
	pr_converted_to_draft: "PR Converted to Draft",
	pr_ready_for_review: "PR Ready for Review",
	review_approved: "Review: Approved",
	review_changes_requested: "Review: Changes Requested",
	review_commented: "Review: Commented",
};
