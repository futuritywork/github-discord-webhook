import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { EVENT_KEYS, type EventKey } from "../adapters";
import {
	githubDiscordUserAdapter,
	pingSettingsAdapter,
	seenGithubUsernamesAdapter,
	webhookAdapter,
} from "../lib/adapters";
import { authed } from "./base";

async function requireMappingOwnership(userId: string, mappingId: string) {
	const mapping = await webhookAdapter.getById(mappingId);
	if (!mapping) {
		throw new ORPCError("NOT_FOUND", {
			message: "Webhook mapping not found",
		});
	}
	if (mapping.userId !== userId) {
		throw new ORPCError("FORBIDDEN", {
			message: "Not authorized to access this mapping",
		});
	}
}

export const get = authed
	.input(z.object({ mappingId: z.string() }))
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		return pingSettingsAdapter.getForMapping(input.mappingId);
	});

export const update = authed
	.input(
		z.object({
			mappingId: z.string(),
			settings: z.record(z.string(), z.boolean()),
		}),
	)
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);

		const validSettings: Partial<Record<EventKey, boolean>> = {};
		for (const [key, value] of Object.entries(input.settings)) {
			if (EVENT_KEYS.includes(key as EventKey) && typeof value === "boolean") {
				validSettings[key as EventKey] = value;
			}
		}

		if (Object.keys(validSettings).length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "No valid event settings provided",
			});
		}

		await pingSettingsAdapter.bulkUpsert(input.mappingId, validSettings);
		return pingSettingsAdapter.getForMapping(input.mappingId);
	});

export const listDiscordUsers = authed
	.input(z.object({ mappingId: z.string() }))
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		const users = await githubDiscordUserAdapter.listByWebhookMapping(
			input.mappingId,
		);
		return users;
	});

export const addDiscordUser = authed
	.input(
		z.object({
			mappingId: z.string(),
			githubUsername: z.string(),
			discordUserId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);

		const existing = await githubDiscordUserAdapter.getByGithubUsername(
			input.mappingId,
			input.githubUsername,
		);
		if (existing) {
			throw new ORPCError("CONFLICT", {
				message: `Mapping for GitHub user '${input.githubUsername}' already exists`,
			});
		}

		const created = await githubDiscordUserAdapter.create(
			input.mappingId,
			input.githubUsername,
			input.discordUserId,
		);
		return created;
	});

export const listSeenUsernames = authed
	.input(z.object({ mappingId: z.string() }))
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		const seen = await seenGithubUsernamesAdapter.listByWebhookMapping(
			input.mappingId,
		);
		return seen.map((s) => s.githubUsername);
	});

export const deleteDiscordUser = authed
	.input(z.object({ mappingId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);

		const deleted = await githubDiscordUserAdapter.delete(input.id);
		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "User mapping not found",
			});
		}
		return { deleted: true as const };
	});
