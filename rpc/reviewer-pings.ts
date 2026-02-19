import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { EVENT_KEYS } from "../adapters";
import { reviewerPingAdapter, webhookAdapter } from "../lib/adapters";
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

export const list = authed
	.input(z.object({ mappingId: z.string() }))
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		return reviewerPingAdapter.listByWebhookMapping(input.mappingId);
	});

export const create = authed
	.input(
		z.object({
			mappingId: z.string(),
			discordUserId: z.string().min(1),
			watchedGithubUsernames: z.array(z.string().min(1)).min(1),
			watchedEventKeys: z.array(z.enum(EVENT_KEYS)).min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		return reviewerPingAdapter.create(
			input.mappingId,
			input.discordUserId,
			input.watchedGithubUsernames,
			input.watchedEventKeys,
		);
	});

export const update = authed
	.input(
		z.object({
			mappingId: z.string(),
			id: z.string(),
			discordUserId: z.string().min(1),
			watchedGithubUsernames: z.array(z.string().min(1)).min(1),
			watchedEventKeys: z.array(z.enum(EVENT_KEYS)).min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		const updated = await reviewerPingAdapter.update(
			input.id,
			input.discordUserId,
			input.watchedGithubUsernames,
			input.watchedEventKeys,
		);
		if (!updated) {
			throw new ORPCError("NOT_FOUND", {
				message: "Reviewer ping not found",
			});
		}
		return { updated: true as const };
	});

export const del = authed
	.input(z.object({ mappingId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await requireMappingOwnership(context.userId, input.mappingId);
		const deleted = await reviewerPingAdapter.delete(input.id);
		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Reviewer ping not found",
			});
		}
		return { deleted: true as const };
	});
