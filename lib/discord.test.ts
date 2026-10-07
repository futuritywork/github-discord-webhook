import { describe, expect, test } from "bun:test";
import { webhookMessageUrl } from "./discord";

describe("webhookMessageUrl", () => {
	test("appends the message path", () => {
		expect(
			webhookMessageUrl("https://discord.com/api/webhooks/1/tok", "99"),
		).toBe("https://discord.com/api/webhooks/1/tok/messages/99");
	});

	test("keeps thread_id and drops wait", () => {
		expect(
			webhookMessageUrl(
				"https://discord.com/api/webhooks/1/tok/?thread_id=5&wait=true",
				"99",
			),
		).toBe("https://discord.com/api/webhooks/1/tok/messages/99?thread_id=5");
	});
});
