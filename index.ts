import { RPCHandler } from "@orpc/server/fetch";
import {
	RequestHeadersPlugin,
	ResponseHeadersPlugin,
} from "@orpc/server/plugins";
import { $ } from "bun";
import { Hono } from "hono";
import { inviteAdapter } from "./lib/adapters";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { githubWebhookApp } from "./routes/github-webhook";
import staticApp from "./routes/static";
import { router } from "./rpc";

await $`bunx drizzle-kit migrate`;

const app = new Hono();

const rpcHandler = new RPCHandler(router, {
	plugins: [new RequestHeadersPlugin(), new ResponseHeadersPlugin()],
});

// Health check endpoint
app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// oRPC handler
app.on(["POST", "GET"], "/rpc/*", async (c) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: { requestUrl: c.req.url },
	});
	if (matched) return response;
	return c.notFound();
});

// Keep github webhook as plain Hono route
app.route("/webhook", githubWebhookApp);

// Keep static serving
app.route("/", staticApp);

// Global error handler.
// The GitHub delivery GUID is logged so a 500 in Railway can be matched
// one-to-one against an entry in the repo's "Recent Deliveries" list.
app.onError((err, c) => {
	logger.error(
		{
			err,
			method: c.req.method,
			path: c.req.path,
			githubEvent: c.req.header("X-GitHub-Event"),
			githubDelivery: c.req.header("X-GitHub-Delivery"),
		},
		"Server error",
	);
	return c.json({ error: "Internal Server Error" }, 500);
});

// Fallback for unmatched routes
app.notFound((c) => {
	return c.json({ error: "Not Found" }, 404);
});

// Start server
const server = Bun.serve({
	port: env.PORT,
	fetch: app.fetch,
});

logger.info({ url: server.url?.toString(), port: env.PORT }, "Server started");
if (env.REGISTRATION === "invite_only") {
	inviteAdapter.createFirst().then((code) => {
		if (code) {
			logger.info({ code }, "First invite code created");
		}
	});
}
