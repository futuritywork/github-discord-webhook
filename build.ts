const result = await Bun.build({
	entrypoints: ["frontend/index.tsx"],
	outdir: "dist",
	naming: "app.js",
	minify: true,
	target: "browser",
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

console.log("Build complete: dist/app.js");
