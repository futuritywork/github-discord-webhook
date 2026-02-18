import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const staticApp = new Hono();

// Serve built frontend assets
staticApp.get("/dist/*", serveStatic({ root: "./" }));

// serve the assets folder
staticApp.get("/assets/*", serveStatic({ root: "./assets" }));

// SPA catch-all: serve app.html for all non-API routes
staticApp.get("*", (c) => {
	const file = Bun.file("www/app.html");
	return c.body(file.stream(), undefined, {
		"Content-Type": file.type || "text/html",
	});
});

export default staticApp;
