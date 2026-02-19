import { ORPCError, os } from "@orpc/server";
import { deleteCookie, getCookie, setCookie } from "@orpc/server/helpers";
import type {
	RequestHeadersPluginContext,
	ResponseHeadersPluginContext,
} from "@orpc/server/plugins";
import { sessionAdapter } from "../lib/adapters";
import { env } from "../lib/env";

export const SESSION_COOKIE_NAME =
	env.NODE_ENV === "production" ? "__Secure-ghdw-session" : "ghdw-session-dev";

const cookieOptions = {
	httpOnly: true,
	sameSite: "lax" as const,
	path: "/",
	secure: env.NODE_ENV === "production",
};

export interface ORPCContext
	extends RequestHeadersPluginContext,
		ResponseHeadersPluginContext {
	requestUrl: string;
}

export const base = os.$context<ORPCContext>();

const authMiddleware = base.middleware(async ({ context, next }) => {
	const sessionId = getCookie(context.reqHeaders, SESSION_COOKIE_NAME);
	if (!sessionId) {
		throw new ORPCError("UNAUTHORIZED", { message: "Not authenticated" });
	}

	const userId = await sessionAdapter.validate(sessionId);
	if (!userId) {
		deleteCookie(context.resHeaders, SESSION_COOKIE_NAME, cookieOptions);
		throw new ORPCError("UNAUTHORIZED", { message: "Session expired" });
	}

	return next({ context: { userId } });
});

export const authed = base.use(authMiddleware);

export function setSessionCookie(
	resHeaders: Headers | undefined,
	sessionId: string,
	maxAgeSecs: number,
) {
	setCookie(resHeaders, SESSION_COOKIE_NAME, sessionId, {
		...cookieOptions,
		maxAge: maxAgeSecs,
	});
}

export function clearSessionCookie(resHeaders: Headers | undefined) {
	deleteCookie(resHeaders, SESSION_COOKIE_NAME, cookieOptions);
}
