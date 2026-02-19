import { eq, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { seenGithubUsernames } from "../schemas/db";

export interface SeenGithubUsername {
	id: string;
	webhookMappingId: string;
	githubUsername: string;
	lastSeenAt: Date;
}

export abstract class SeenGithubUsernamesAdapter {
	abstract upsertMany(
		webhookMappingId: string,
		usernames: string[],
	): Promise<void>;

	abstract listByWebhookMapping(
		webhookMappingId: string,
	): Promise<SeenGithubUsername[]>;
}

export class DatabaseSeenGithubUsernamesAdapter extends SeenGithubUsernamesAdapter {
	async upsertMany(
		webhookMappingId: string,
		usernames: string[],
	): Promise<void> {
		if (usernames.length === 0) return;

		const db = getDb();
		await db
			.insert(seenGithubUsernames)
			.values(usernames.map((u) => ({ webhookMappingId, githubUsername: u })))
			.onConflictDoUpdate({
				target: [
					seenGithubUsernames.webhookMappingId,
					seenGithubUsernames.githubUsername,
				],
				set: { lastSeenAt: sql`now()` },
			});
	}

	async listByWebhookMapping(
		webhookMappingId: string,
	): Promise<SeenGithubUsername[]> {
		const db = getDb();
		return db
			.select()
			.from(seenGithubUsernames)
			.where(eq(seenGithubUsernames.webhookMappingId, webhookMappingId));
	}
}
