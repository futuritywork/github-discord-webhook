import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { webhookAdapter } from "../lib/adapters";
import { type DiscordEmbed, sendDiscordEmbed } from "../lib/discord";
import { env } from "../lib/env";
import { authed } from "./base";

function getGitHubWebhookUrl(requestUrl: string, webhookId: string): string {
	if (env.RAILWAY_PUBLIC_DOMAIN) {
		return `https://${env.RAILWAY_PUBLIC_DOMAIN}/webhook/github/${webhookId}`;
	}
	const url = new URL(requestUrl);
	return `${url.protocol}//${url.host}/webhook/github/${webhookId}`;
}

function redactDiscordUrl(url: string): string {
	return url.replace(/\/webhooks\/\d+\/.*$/, "/webhooks/***");
}

export const create = authed
	.input(
		z.object({
			repo: z.string(),
			webhookUrl: z.string(),
			secret: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		if (!input.webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
			throw new ORPCError("BAD_REQUEST", {
				message: "webhookUrl must be a valid Discord webhook URL",
			});
		}

		const existing = await webhookAdapter.getByRepo(input.repo);
		if (existing) {
			throw new ORPCError("CONFLICT", {
				message: `Mapping for repo '${input.repo}' already exists`,
			});
		}

		const webhookId = await webhookAdapter.create(
			context.userId,
			input.repo,
			input.webhookUrl,
			input.secret,
		);
		const githubWebhookUrl = getGitHubWebhookUrl(context.requestUrl, webhookId);

		return {
			created: true as const,
			repo: input.repo,
			id: webhookId,
			githubWebhookUrl,
		};
	});

export const list = authed.handler(async ({ context }) => {
	const mappings = await webhookAdapter.listByUser(context.userId);
	return mappings.map((m) => ({
		id: m.id,
		repo: m.repo,
		discordWebhookUrl: redactDiscordUrl(m.webhookUrl),
		githubWebhookUrl: getGitHubWebhookUrl(context.requestUrl, m.id),
	}));
});

export const get = authed
	.input(z.object({ repo: z.string() }))
	.handler(async ({ input, context }) => {
		const mapping = await webhookAdapter.getByRepo(input.repo);
		if (!mapping) {
			throw new ORPCError("NOT_FOUND", {
				message: `No mapping found for repo '${input.repo}'`,
			});
		}
		if (mapping.userId !== context.userId) {
			throw new ORPCError("FORBIDDEN", {
				message: "Not authorized to view this mapping",
			});
		}
		return {
			id: mapping.id,
			repo: mapping.repo,
			discordWebhookUrl: redactDiscordUrl(mapping.webhookUrl),
			githubWebhookUrl: getGitHubWebhookUrl(context.requestUrl, mapping.id),
		};
	});

export const del = authed
	.input(z.object({ repo: z.string() }))
	.handler(async ({ input, context }) => {
		const mapping = await webhookAdapter.getByRepo(input.repo);
		if (!mapping) {
			throw new ORPCError("NOT_FOUND", {
				message: `No mapping found for repo '${input.repo}'`,
			});
		}
		if (mapping.userId !== context.userId) {
			throw new ORPCError("FORBIDDEN", {
				message: "Not authorized to delete this mapping",
			});
		}

		const deleted = await webhookAdapter.delete(context.userId, input.repo);
		if (!deleted) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: `Failed to delete mapping for repo '${input.repo}'`,
			});
		}
		return { deleted: true as const, repo: input.repo };
	});

export const updateSecret = authed
	.input(z.object({ repo: z.string(), secret: z.string() }))
	.handler(async ({ input, context }) => {
		const mapping = await webhookAdapter.getByRepo(input.repo);
		if (!mapping) {
			throw new ORPCError("NOT_FOUND", {
				message: `No mapping found for repo '${input.repo}'`,
			});
		}
		if (mapping.userId !== context.userId) {
			throw new ORPCError("FORBIDDEN", {
				message: "Not authorized to update this mapping",
			});
		}

		const updated = await webhookAdapter.updateSecret(
			context.userId,
			input.repo,
			input.secret,
		);
		if (!updated) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: `Failed to update secret for repo '${input.repo}'`,
			});
		}
		return { updated: true as const, repo: input.repo };
	});

const discordEmbedSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	url: z.string().optional(),
	color: z.number().optional(),
	timestamp: z.string().optional(),
	author: z
		.object({
			name: z.string().optional(),
			url: z.string().optional(),
			icon_url: z.string().optional(),
		})
		.optional(),
	footer: z
		.object({
			text: z.string().optional(),
			icon_url: z.string().optional(),
		})
		.optional(),
	image: z.object({ url: z.string() }).optional(),
	thumbnail: z.object({ url: z.string() }).optional(),
	fields: z
		.array(
			z.object({
				name: z.string(),
				value: z.string(),
				inline: z.boolean().optional(),
			}),
		)
		.optional(),
});

export const test = authed
	.input(
		z.object({
			webhookUrl: z.string(),
			embed: discordEmbedSchema,
		}),
	)
	.handler(async ({ input }) => {
		if (!input.webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
			throw new ORPCError("BAD_REQUEST", {
				message: "webhookUrl must be a valid Discord webhook URL",
			});
		}

		if (
			!input.embed.title &&
			!input.embed.description &&
			!input.embed.fields?.length
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Embed must have at least title, description, or fields",
			});
		}

		const result = await sendDiscordEmbed(
			input.webhookUrl,
			input.embed as DiscordEmbed,
		);

		if (!result.ok) {
			throw new ORPCError("BAD_GATEWAY", {
				message: "Failed to send Discord notification",
			});
		}

		return { sent: true as const, status: result.status };
	});
