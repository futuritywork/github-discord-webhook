import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "../rpc";

type Outputs = InferRouterOutputs<AppRouter>;

// =====================================================================
// Types inferred from router
// =====================================================================

export type User = Outputs["auth"]["me"];
export type RegistrationMode = Outputs["auth"]["registrationMode"];
export type WebhookMapping = Outputs["webhooks"]["list"][number];
export type CreateMappingResponse = Outputs["webhooks"]["create"];
export type PingSettings = Outputs["pingSettings"]["get"];
export type GitHubDiscordUser =
	Outputs["pingSettings"]["listDiscordUsers"][number];
export type Invite = Outputs["auth"]["listInvites"]["invites"][number];

export type ReviewerPing = Outputs["reviewerPings"]["list"][number];

export type EventKey = keyof PingSettings;

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

// =====================================================================
// UI Constants
// =====================================================================

export const EVENT_LABELS: Record<EventKey, string> = {
	pr_opened: "PR Opened",
	pr_draft_opened: "Draft PR Opened",
	pr_closed: "PR Closed (not merged)",
	pr_merged: "PR Merged",
	pr_converted_to_draft: "PR Converted to Draft",
	pr_ready_for_review: "PR Ready for Review",
	review_approved: "Review: Approved",
	review_changes_requested: "Review: Changes Requested",
	review_commented: "Review: Commented",
};
