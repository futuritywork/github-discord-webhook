import { ORPCError } from "@orpc/server";
import { getCookie } from "@orpc/server/helpers";
import { z } from "zod";
import {
	authAdapter,
	inviteAdapter,
	sessionAdapter,
	userAdapter,
} from "../lib/adapters";
import { env } from "../lib/env";
import {
	authed,
	base,
	clearSessionCookie,
	SESSION_COOKIE_NAME,
	setSessionCookie,
} from "./base";

export const registrationMode = base.handler(() => {
	return { mode: env.REGISTRATION };
});

export const register = base
	.input(
		z.object({
			username: z.string(),
			password: z.string(),
			inviteCode: z.string().optional(),
		}),
	)
	.handler(async ({ input }) => {
		if (env.REGISTRATION === "closed") {
			throw new ORPCError("FORBIDDEN", {
				message: "Registration is currently closed",
			});
		}

		if (env.REGISTRATION === "invite_only") {
			if (!input.inviteCode) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invite code required",
				});
			}
			if (!(await inviteAdapter.isValid(input.inviteCode))) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid or expired invite code",
				});
			}
		}

		if (input.username.length < 3) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Username must be at least 3 characters",
			});
		}
		if (input.password.length < 8) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Password must be at least 8 characters",
			});
		}

		if (await userAdapter.usernameExists(input.username)) {
			throw new ORPCError("CONFLICT", {
				message: "Username already exists",
			});
		}

		const userId = await userAdapter.create(input.username, input.password);

		if (env.REGISTRATION === "invite_only" && input.inviteCode) {
			await inviteAdapter.consume(input.inviteCode, userId);
		}

		return { userId, username: input.username };
	});

export const login = base
	.input(
		z.object({
			username: z.string(),
			password: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		const userId = await userAdapter.validateCredentials(
			input.username,
			input.password,
		);
		if (!userId) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "Invalid username or password",
			});
		}

		const ttlSeconds = 7 * 24 * 60 * 60;
		const sessionId = await sessionAdapter.create(userId, ttlSeconds);
		setSessionCookie(context.resHeaders, sessionId, ttlSeconds);

		return { success: true as const, userId };
	});

export const logout = base.handler(async ({ context }) => {
	const sessionId = getCookie(context.reqHeaders, SESSION_COOKIE_NAME);
	if (sessionId) {
		await sessionAdapter.destroy(sessionId);
	}
	clearSessionCookie(context.resHeaders);
	return { success: true as const };
});

export const me = authed.handler(async ({ context }) => {
	const user = await userAdapter.getById(context.userId);
	if (!user) {
		throw new ORPCError("NOT_FOUND", { message: "User not found" });
	}
	return {
		id: user.id,
		username: user.username,
		createdAt: user.createdAt,
	};
});

export const createToken = authed.handler(async () => {
	const token = await authAdapter.create();
	return { token };
});

export const revokeToken = authed
	.input(z.object({ token: z.string() }))
	.handler(async ({ input }) => {
		const revoked = await authAdapter.revoke(input.token);
		if (!revoked) {
			throw new ORPCError("NOT_FOUND", { message: "Token not found" });
		}
		return { revoked: true as const };
	});

export const listInvites = authed.handler(async ({ context }) => {
	const invites = await inviteAdapter.listByUser(context.userId);
	return {
		invites: invites.map((inv) => ({
			code: inv.code,
			createdAt: inv.createdAt,
			used: inv.usedBy !== null,
			usedAt: inv.usedAt ?? null,
		})),
	};
});

export const createInvite = authed.handler(async ({ context }) => {
	if (env.REGISTRATION !== "invite_only") {
		throw new ORPCError("BAD_REQUEST", {
			message: "Invite codes are only available in invite_only mode",
		});
	}
	const code = await inviteAdapter.create(context.userId);
	return { code };
});

export const revokeInvite = authed
	.input(z.object({ code: z.string() }))
	.handler(async ({ input, context }) => {
		const revoked = await inviteAdapter.revoke(input.code, context.userId);
		if (!revoked) {
			throw new ORPCError("NOT_FOUND", {
				message: "Invite code not found, already used, or not owned by you",
			});
		}
		return { revoked: true as const, code: input.code };
	});
