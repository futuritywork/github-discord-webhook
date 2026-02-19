import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { reviewerPings } from "../schemas/db";

export interface ReviewerPing {
	id: string;
	webhookMappingId: string;
	discordUserId: string;
	watchedGithubUsernames: string[];
	watchedEventKeys: string[];
	userId: string | null;
	createdAt: Date;
}

export abstract class ReviewerPingAdapter {
	abstract listByWebhookMapping(
		webhookMappingId: string,
	): Promise<ReviewerPing[]>;

	abstract create(
		webhookMappingId: string,
		discordUserId: string,
		watchedGithubUsernames: string[],
		watchedEventKeys: string[],
	): Promise<ReviewerPing>;

	abstract update(
		id: string,
		discordUserId: string,
		watchedGithubUsernames: string[],
		watchedEventKeys: string[],
	): Promise<boolean>;

	abstract delete(id: string): Promise<boolean>;

	abstract findMatchingReviewers(
		webhookMappingId: string,
		eventKey: string,
		triggeringUsername: string,
	): Promise<string[]>;
}

export class DatabaseReviewerPingAdapter extends ReviewerPingAdapter {
	async listByWebhookMapping(
		webhookMappingId: string,
	): Promise<ReviewerPing[]> {
		const db = getDb();
		return db
			.select()
			.from(reviewerPings)
			.where(eq(reviewerPings.webhookMappingId, webhookMappingId));
	}

	async create(
		webhookMappingId: string,
		discordUserId: string,
		watchedGithubUsernames: string[],
		watchedEventKeys: string[],
	): Promise<ReviewerPing> {
		const db = getDb();
		const [result] = await db
			.insert(reviewerPings)
			.values({
				webhookMappingId,
				discordUserId,
				watchedGithubUsernames,
				watchedEventKeys,
			})
			.returning();

		if (!result) {
			throw new Error("Failed to create reviewer ping");
		}
		return result;
	}

	async update(
		id: string,
		discordUserId: string,
		watchedGithubUsernames: string[],
		watchedEventKeys: string[],
	): Promise<boolean> {
		const db = getDb();
		const result = await db
			.update(reviewerPings)
			.set({ discordUserId, watchedGithubUsernames, watchedEventKeys })
			.where(eq(reviewerPings.id, id))
			.returning();
		return result.length > 0;
	}

	async delete(id: string): Promise<boolean> {
		const db = getDb();
		const result = await db
			.delete(reviewerPings)
			.where(eq(reviewerPings.id, id))
			.returning();
		return result.length > 0;
	}

	async findMatchingReviewers(
		webhookMappingId: string,
		eventKey: string,
		triggeringUsername: string,
	): Promise<string[]> {
		const db = getDb();
		const rows = await db
			.select()
			.from(reviewerPings)
			.where(eq(reviewerPings.webhookMappingId, webhookMappingId));

		const discordIds: string[] = [];
		for (const row of rows) {
			if (
				row.watchedEventKeys.includes(eventKey) &&
				row.watchedGithubUsernames.includes(triggeringUsername)
			) {
				discordIds.push(row.discordUserId);
			}
		}
		return discordIds;
	}
}
