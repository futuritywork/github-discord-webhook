import { useCallback, useEffect, useState } from "react";
import { DashboardPage } from "./components/DashboardPage";
import { LoginPage } from "./components/LoginPage";
import { TestWebhookPage } from "./components/TestWebhookPage";

export function App() {
	const [path, setPath] = useState(window.location.pathname);

	useEffect(() => {
		const handlePopState = () => {
			setPath(window.location.pathname);
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	const navigate = useCallback((newPath: string) => {
		window.history.pushState(null, "", newPath);
		setPath(newPath);
	}, []);

	switch (path) {
		case "/dashboard":
			return <DashboardPage navigate={navigate} />;
		case "/test-webhook":
			return <TestWebhookPage navigate={navigate} />;
		default:
			return <LoginPage navigate={navigate} />;
	}
}
