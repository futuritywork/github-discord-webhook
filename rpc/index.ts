import * as auth from "./auth";
import { base } from "./base";
import * as pingSettings from "./ping-settings";
import * as webhooks from "./webhooks";

export const router = base.router({
	auth: {
		registrationMode: auth.registrationMode,
		register: auth.register,
		login: auth.login,
		logout: auth.logout,
		me: auth.me,
		createToken: auth.createToken,
		revokeToken: auth.revokeToken,
		listInvites: auth.listInvites,
		createInvite: auth.createInvite,
		revokeInvite: auth.revokeInvite,
	},
	webhooks: {
		create: webhooks.create,
		list: webhooks.list,
		get: webhooks.get,
		delete: webhooks.del,
		updateSecret: webhooks.updateSecret,
		test: webhooks.test,
	},
	pingSettings: {
		get: pingSettings.get,
		update: pingSettings.update,
		listDiscordUsers: pingSettings.listDiscordUsers,
		addDiscordUser: pingSettings.addDiscordUser,
		listSeenUsernames: pingSettings.listSeenUsernames,
		deleteDiscordUser: pingSettings.deleteDiscordUser,
	},
});

export type AppRouter = typeof router;
