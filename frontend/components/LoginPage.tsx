import { useEffect, useState } from "react";
import * as api from "../api";
import type { RegistrationMode } from "../types";

export function LoginPage({ navigate }: { navigate: (path: string) => void }) {
	const [tab, setTab] = useState<"login" | "register">("login");
	const [registrationMode, setRegistrationMode] =
		useState<RegistrationMode["mode"]>("open");

	// Login state
	const [loginUsername, setLoginUsername] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	// Register state
	const [regUsername, setRegUsername] = useState("");
	const [regPassword, setRegPassword] = useState("");
	const [regInviteCode, setRegInviteCode] = useState("");
	const [regError, setRegError] = useState("");
	const [regSuccess, setRegSuccess] = useState("");
	const [regLoading, setRegLoading] = useState(false);

	useEffect(() => {
		api.getMe().then((user) => {
			if (user) navigate("/dashboard");
		});
		api.getRegistrationMode().then((data) => {
			setRegistrationMode(data.mode);
		});
	}, [navigate]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoginError("");
		setLoginLoading(true);
		try {
			await api.login(loginUsername, loginPassword);
			navigate("/dashboard");
		} catch (err) {
			setLoginError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoginLoading(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setRegError("");
		setRegSuccess("");
		setRegLoading(true);
		try {
			await api.register(
				regUsername,
				regPassword,
				registrationMode === "invite_only" ? regInviteCode : undefined,
			);
			setRegSuccess("Account created! You can now sign in.");
			setRegUsername("");
			setRegPassword("");
			setRegInviteCode("");
			setTimeout(() => setTab("login"), 1500);
		} catch (err) {
			setRegError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setRegLoading(false);
		}
	};

	const switchTab = (t: "login" | "register") => {
		setTab(t);
		setLoginError("");
		setRegError("");
		setRegSuccess("");
	};

	return (
		<div className="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex justify-center">
					<div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
						<svg
							aria-hidden="true"
							className="h-9 w-9 text-zinc-950"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="2"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
							/>
						</svg>
					</div>
				</div>
				<h2 className="mt-6 text-center text-2xl font-bold tracking-tight">
					GitHub &rarr; Discord
				</h2>
				<p className="mt-2 text-center text-sm text-zinc-500">
					Webhook notification service
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-zinc-900 border border-zinc-800 py-8 px-6 shadow-xl rounded-2xl">
					{/* Tab switcher */}
					<div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
						<button
							type="button"
							onClick={() => switchTab("login")}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
								tab === "login"
									? "bg-zinc-700 text-zinc-100"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							Sign in
						</button>
						<button
							type="button"
							onClick={() => switchTab("register")}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
								tab === "register"
									? "bg-zinc-700 text-zinc-100"
									: "text-zinc-400 hover:text-zinc-200"
							} ${registrationMode === "closed" ? "opacity-50" : ""}`}
						>
							Register
						</button>
					</div>

					{/* Login form */}
					{tab === "login" && (
						<form onSubmit={handleLogin} className="space-y-5">
							<div>
								<label
									htmlFor="login-username"
									className="block text-sm font-medium text-zinc-300"
								>
									Username
								</label>
								<input
									type="text"
									id="login-username"
									required
									autoComplete="username"
									value={loginUsername}
									onChange={(e) => setLoginUsername(e.target.value)}
									className="mt-1.5 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all text-sm"
								/>
							</div>
							<div>
								<label
									htmlFor="login-password"
									className="block text-sm font-medium text-zinc-300"
								>
									Password
								</label>
								<input
									type="password"
									id="login-password"
									required
									autoComplete="current-password"
									value={loginPassword}
									onChange={(e) => setLoginPassword(e.target.value)}
									className="mt-1.5 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all text-sm"
								/>
							</div>
							{loginError && (
								<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
									{loginError}
								</div>
							)}
							<button
								type="submit"
								disabled={loginLoading}
								className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-zinc-900 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
							>
								{loginLoading ? "Signing in..." : "Sign in"}
							</button>
						</form>
					)}

					{/* Register form */}
					{tab === "register" && (
						<form onSubmit={handleRegister} className="space-y-5">
							{registrationMode === "invite_only" && (
								<div>
									<label
										htmlFor="register-invite"
										className="block text-sm font-medium text-zinc-300"
									>
										Invite Code
									</label>
									<input
										type="text"
										id="register-invite"
										required
										autoComplete="off"
										value={regInviteCode}
										onChange={(e) => setRegInviteCode(e.target.value)}
										className="mt-1.5 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all text-sm font-mono tracking-wider"
										placeholder="Enter invite code"
									/>
								</div>
							)}
							<div>
								<label
									htmlFor="register-username"
									className="block text-sm font-medium text-zinc-300"
								>
									Username
								</label>
								<input
									type="text"
									id="register-username"
									required
									autoComplete="username"
									minLength={3}
									value={regUsername}
									onChange={(e) => setRegUsername(e.target.value)}
									className="mt-1.5 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all text-sm"
									placeholder="min 3 characters"
								/>
							</div>
							<div>
								<label
									htmlFor="register-password"
									className="block text-sm font-medium text-zinc-300"
								>
									Password
								</label>
								<input
									type="password"
									id="register-password"
									required
									autoComplete="new-password"
									minLength={8}
									value={regPassword}
									onChange={(e) => setRegPassword(e.target.value)}
									className="mt-1.5 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 px-3.5 text-zinc-100 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all text-sm"
									placeholder="min 8 characters"
								/>
							</div>
							{registrationMode === "closed" && (
								<div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
									Registration is currently closed.
								</div>
							)}
							{regError && (
								<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
									{regError}
								</div>
							)}
							{regSuccess && (
								<div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
									{regSuccess}
								</div>
							)}
							<button
								type="submit"
								disabled={regLoading || registrationMode === "closed"}
								className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-zinc-900 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{regLoading ? "Creating account..." : "Create account"}
							</button>
						</form>
					)}
				</div>
			</div>

			<p className="mt-8 text-center text-xs text-zinc-600">
				Receive GitHub events as Discord notifications
			</p>
		</div>
	);
}
