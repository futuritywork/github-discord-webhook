import { z } from "zod";

const userSchema = z.object({
	type: z.literal("User"),
	login: z.string(),
	avatar_url: z.string(),
	url: z.string(),
	html_url: z.string(),
});

// GitHub sends these on the full `pull_request` representation that
// `pull_request` events carry, but not on the trimmed one attached to
// `pull_request_review*` events. Optional so a payload without them still
// parses — a missing size is a field we omit, never a rejected delivery.
export const diffStatFields = {
	additions: z.number().optional(),
	deletions: z.number().optional(),
	changed_files: z.number().optional(),
};

export const openSchema = z.object({
	action: z.literal("opened"),
	repository: z.object({
		name: z.string().optional().nullable().default("Unknown"),
		full_name: z.string().optional().nullable().default("Unknown"),
	}),
	pull_request: z.object({
		number: z.number(),
		title: z.string(),
		html_url: z.string(),
		user: userSchema,
		body: z.string().optional().nullable(),
		draft: z.boolean().optional().default(false),
		...diffStatFields,
	}),
});

export const closedSchema = z.object({
	action: z.literal("closed"),
	repository: z.object({
		name: z.string().optional().nullable().default("Unknown"),
		full_name: z.string().optional().nullable().default("Unknown"),
	}),
	pull_request: z.object({
		number: z.number(),
		title: z.string(),
		html_url: z.string(),
		user: userSchema,
		merged: z.boolean(),
		closed_at: z.coerce.date().nullable(),
		merged_at: z.coerce.date().nullable(),
		merge_commit_sha: z.string().nullable(),
		body: z.string().nullable(),
		merged_by: userSchema.nullable(),
		...diffStatFields,
	}),
});

export const synchronizeSchema = z.object({
	action: z.literal("synchronize"),
});

export const editedSchema = z.object({
	action: z.literal("edited"),
});

export const convertedToDraftSchema = z.object({
	action: z.literal("converted_to_draft"),
	repository: z.object({
		name: z.string().optional().nullable().default("Unknown"),
		full_name: z.string().optional().nullable().default("Unknown"),
	}),
	pull_request: z.object({
		number: z.number(),
		title: z.string(),
		html_url: z.string(),
		user: userSchema,
		body: z.string().optional().nullable(),
		draft: z.literal(true),
		...diffStatFields,
	}),
});

export const readyForReviewSchema = z.object({
	action: z.literal("ready_for_review"),
	repository: z.object({
		name: z.string().optional().nullable().default("Unknown"),
		full_name: z.string().optional().nullable().default("Unknown"),
	}),
	pull_request: z.object({
		number: z.number(),
		title: z.string(),
		html_url: z.string(),
		user: userSchema,
		body: z.string().optional().nullable(),
		draft: z.literal(false),
		...diffStatFields,
	}),
});

export const githubWebhookSchema = z.discriminatedUnion("action", [
	openSchema,
	closedSchema,
	synchronizeSchema,
	editedSchema,
	convertedToDraftSchema,
	readyForReviewSchema,
]);

export type GithubWebhookPayload = z.infer<typeof githubWebhookSchema>;

// Pull Request Review schemas
export const pullRequestReviewSubmittedSchema = z.object({
	action: z.literal("submitted"),
	review: z.object({
		id: z.number(),
		state: z.enum(["approved", "changes_requested", "commented"]),
		body: z.string().nullable(),
		html_url: z.string(),
		user: userSchema,
		submitted_at: z.coerce.date(),
	}),
	pull_request: z.object({
		number: z.number(),
		title: z.string(),
		html_url: z.string(),
		user: userSchema,
	}),
	repository: z.object({
		name: z.string().optional().nullable().default("Unknown"),
		full_name: z.string().optional().nullable().default("Unknown"),
	}),
});

export const pullRequestReviewSchema = z.discriminatedUnion("action", [
	pullRequestReviewSubmittedSchema,
]);

export type PullRequestReviewPayload = z.infer<typeof pullRequestReviewSchema>;

// Pull Request Review Comment schemas
export const pullRequestReviewCommentCreatedSchema = z.object({
	action: z.literal("created"),
	comment: z.object({
		id: z.number(),
		body: z.string(),
		html_url: z.string(),
		path: z.string().nullable(),
		line: z.number().nullable(),
		user: userSchema,
		created_at: z.coerce.date(),
	}),
	pull_request: z.object({
		number: z.number(),
		title: z.string(),
		html_url: z.string(),
		user: userSchema,
	}),
	repository: z.object({
		name: z.string().optional().nullable().default("Unknown"),
		full_name: z.string().optional().nullable().default("Unknown"),
	}),
});

export const pullRequestReviewCommentSchema = z.discriminatedUnion("action", [
	pullRequestReviewCommentCreatedSchema,
]);

export type PullRequestReviewCommentPayload = z.infer<
	typeof pullRequestReviewCommentSchema
>;
