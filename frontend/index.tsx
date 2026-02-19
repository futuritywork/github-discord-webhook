import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const serializer = new StandardRPCJsonSerializer();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn(queryKey) {
				const [json, meta] = serializer.serialize(queryKey);
				return JSON.stringify({ json, meta });
			},
			staleTime: 60 * 1000,
		},
	},
});

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>,
	);
}
