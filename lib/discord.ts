/** Discord embed type with all supported fields */
export type DiscordEmbed = {
	title?: string;
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: {
		text: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	image?: {
		url: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
	thumbnail?: {
		url: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
	author?: {
		name: string;
		url?: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	fields?: Array<{
		name: string;
		value: string;
		inline?: boolean;
	}>;
};

/** Send an embed to a Discord webhook, with optional content/sender overrides */
export async function sendDiscordEmbed(
	webhookUrl: string,
	embed: DiscordEmbed,
	options: {
		content?: string;
		username?: string;
		avatarUrl?: string;
		// Ask Discord to return the created message so it can be edited later.
		wait?: boolean;
	} = {},
): Promise<{ ok: boolean; status: number; messageId?: string }> {
	const payload: {
		embeds: DiscordEmbed[];
		content?: string;
		username?: string;
		avatar_url?: string;
	} = {
		embeds: [embed],
	};
	if (options.content) {
		payload.content = options.content;
	}
	if (options.username) {
		payload.username = options.username;
	}
	if (options.avatarUrl) {
		payload.avatar_url = options.avatarUrl;
	}
	const url = options.wait ? withQuery(webhookUrl, "wait", "true") : webhookUrl;
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	let messageId: string | undefined;
	if (options.wait && response.ok) {
		try {
			const body = (await response.json()) as { id?: unknown };
			if (typeof body.id === "string") messageId = body.id;
		} catch {
			// A sent message without a readable id just can't be edited later.
		}
	}
	return { ok: response.ok, status: response.status, messageId };
}

function withQuery(url: string, key: string, value: string): string {
	const u = new URL(url);
	u.searchParams.set(key, value);
	return u.toString();
}

/**
 * The edit endpoint for a message a webhook sent:
 * `/webhooks/:id/:token/messages/:message_id`. A `thread_id` on the webhook URL
 * must be carried over, or Discord looks for the message in the parent channel.
 */
export function webhookMessageUrl(
	webhookUrl: string,
	messageId: string,
): string {
	const u = new URL(webhookUrl);
	const threadId = u.searchParams.get("thread_id");
	u.search = "";
	u.pathname = `${u.pathname.replace(/\/+$/, "")}/messages/${encodeURIComponent(messageId)}`;
	if (threadId) u.searchParams.set("thread_id", threadId);
	return u.toString();
}

/**
 * Replace the embeds on a message this webhook sent. Content is left alone, so
 * the edit never re-sends mentions.
 */
export async function editDiscordEmbed(
	webhookUrl: string,
	messageId: string,
	embed: DiscordEmbed,
): Promise<{ ok: boolean; status: number }> {
	const response = await fetch(webhookMessageUrl(webhookUrl, messageId), {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ embeds: [embed] }),
	});
	return { ok: response.ok, status: response.status };
}
