import { describe, expect, test } from "bun:test";
import {
	fetchMergeStatus,
	formatFileList,
	formatMergeStatus,
	MERGE_STATUS_FIELD_NAME,
	type MergeStatus,
	mergeStatusRef,
	overlappingFiles,
	pendingMergeStatusField,
	withMergeStatus,
} from "./mergeStatus";

const base = { baseRef: "main", aheadBy: 2, behindBy: 14 };

describe("formatMergeStatus", () => {
	test("clean", () => {
		expect(
			formatMergeStatus({
				...base,
				aheadBy: 5,
				behindBy: 0,
				mergeability: { kind: "clean" },
			}),
		).toBe("✅ No conflicts · 5 ahead, 0 behind `main`");
	});

	test("conflicts name the files changed on both sides, not 'conflicts'", () => {
		expect(
			formatMergeStatus({
				...base,
				mergeability: {
					kind: "conflicts",
					overlap: { files: ["a.ts", "b.ts", "c.ts"], complete: true },
				},
			}),
		).toBe(
			"⚠️ Has conflicts · 2 ahead, 14 behind `main`\nChanged on both sides (3 files): `a.ts`, `b.ts`, `c.ts`",
		);
	});

	test("conflicts without an overlap list stay a single line", () => {
		expect(
			formatMergeStatus({
				...base,
				mergeability: { kind: "conflicts", overlap: null },
			}),
		).toBe("⚠️ Has conflicts · 2 ahead, 14 behind `main`");
	});

	test("an incomplete overlap says so", () => {
		expect(
			formatMergeStatus({
				...base,
				mergeability: {
					kind: "conflicts",
					overlap: { files: ["a.ts"], complete: false },
				},
			}),
		).toBe(
			"⚠️ Has conflicts · 2 ahead, 14 behind `main`\nChanged on both sides (1+ file): `a.ts` (list may be incomplete)",
		);
	});

	test("still computing never claims clean or conflicted", () => {
		const out = formatMergeStatus({
			...base,
			mergeability: { kind: "computing" },
		});
		expect(out).toBe(
			"⏳ GitHub hasn't finished its conflict check · 2 ahead, 14 behind `main`",
		);
	});

	test("unknown drift falls back to naming the base", () => {
		expect(
			formatMergeStatus({
				baseRef: "release/1.2",
				aheadBy: null,
				behindBy: null,
				mergeability: { kind: "unknown" },
			}),
		).toBe("❔ Conflict check unavailable · vs `release/1.2`");
	});
});

describe("formatFileList", () => {
	test("caps at five and counts the rest", () => {
		const files = ["a", "b", "c", "d", "e", "f", "g"];
		expect(formatFileList(files, true)).toBe("`a`, `b`, `c`, `d`, `e` +2 more");
	});

	test("shortens long paths from the front and defuses backticks", () => {
		const long = `${"x/".repeat(60)}file.ts`;
		const out = formatFileList([long, "we`ird.ts"], true);
		expect(out).toStartWith("`…");
		expect(out).toContain("file.ts`");
		expect(out).toContain("`we'ird.ts`");
	});
});

describe("overlappingFiles", () => {
	test("keeps only files both sides touched, sorted", () => {
		expect(
			overlappingFiles(
				[
					{ filename: "z.ts" },
					{ filename: "a.ts" },
					{ filename: "only-head.ts" },
				],
				[
					{ filename: "a.ts" },
					{ filename: "z.ts" },
					{ filename: "only-base.ts" },
				],
			),
		).toEqual({ files: ["a.ts", "z.ts"], complete: true });
	});

	test("matches renames under either name", () => {
		expect(
			overlappingFiles(
				[{ filename: "new.ts", previous_filename: "old.ts" }],
				[{ filename: "old.ts" }],
			).files,
		).toEqual(["new.ts"]);
		expect(
			overlappingFiles(
				[{ filename: "old.ts" }],
				[{ filename: "moved.ts", previous_filename: "old.ts" }],
			).files,
		).toEqual(["old.ts"]);
	});

	test("a capped compare marks the overlap incomplete", () => {
		const many = Array.from({ length: 300 }, (_, i) => ({ filename: `f${i}` }));
		expect(overlappingFiles(many, []).complete).toBe(false);
	});
});

describe("embed helpers", () => {
	const status: MergeStatus = {
		...base,
		mergeability: { kind: "clean" },
	};

	test("withMergeStatus replaces the placeholder in place", () => {
		const embed = {
			title: "t",
			fields: [
				{ name: "Author", value: "x", inline: true },
				pendingMergeStatusField("main"),
				{ name: "After", value: "y" },
			],
		};
		const out = withMergeStatus(embed, status);
		expect(out.fields.map((f) => f.name)).toEqual([
			"Author",
			MERGE_STATUS_FIELD_NAME,
			"After",
		]);
		expect(out.fields[1]?.value).toStartWith("✅");
		// The original embed is untouched.
		expect(embed.fields[1]?.value).toStartWith("⏳");
	});

	test("mergeStatusRef needs a token, a full repo name, and head/base", () => {
		const pr = {
			number: 7,
			head: { sha: "abc" },
			base: { ref: "main" },
		};
		expect(mergeStatusRef("t", "o/r", pr)).toEqual({
			repoFullName: "o/r",
			number: 7,
			baseRef: "main",
			headSha: "abc",
		});
		expect(mergeStatusRef(undefined, "o/r", pr)).toBeNull();
		expect(mergeStatusRef("t", "Unknown", pr)).toBeNull();
		expect(mergeStatusRef("t", "o/r", { number: 7 })).toBeNull();
	});
});

describe("fetchMergeStatus", () => {
	const ref = {
		repoFullName: "o/r",
		number: 7,
		baseRef: "feat/base",
		headSha: "h",
	};

	function fakeGitHub(routes: Record<string, unknown[]>) {
		const calls: string[] = [];
		const fetchFn = async (url: string) => {
			const path = url.replace("https://api.github.com", "");
			calls.push(path);
			const queue = routes[path];
			if (!queue || queue.length === 0) {
				return new Response("not found", { status: 404 });
			}
			const body = queue.length > 1 ? queue.shift() : queue[0];
			return Response.json(body);
		};
		return { fetchFn, calls };
	}

	const sleeps: number[] = [];
	const sleep = async (ms: number) => {
		sleeps.push(ms);
	};

	test("polls past mergeable=null, then reports clean with drift", async () => {
		sleeps.length = 0;
		const gh = fakeGitHub({
			"/repos/o/r/pulls/7": [
				{ mergeable: null },
				{ mergeable: null },
				{ mergeable: true },
			],
			"/repos/o/r/compare/feat/base...h": [{ ahead_by: 5, behind_by: 0 }],
		});
		const status = await fetchMergeStatus(ref, {
			token: "t",
			fetch: gh.fetchFn,
			sleep,
			pollDelaysMs: [1, 2, 3],
		});
		expect(status).toEqual({
			baseRef: "feat/base",
			aheadBy: 5,
			behindBy: 0,
			mergeability: { kind: "clean" },
		});
		expect(sleeps).toEqual([1, 2]);
		// No reverse compare for a clean PR.
		expect(gh.calls).not.toContain("/repos/o/r/compare/h...feat/base");
	});

	test("gives up honestly when GitHub is still computing", async () => {
		const gh = fakeGitHub({
			"/repos/o/r/pulls/7": [{ mergeable: null }],
			"/repos/o/r/compare/feat/base...h": [{ ahead_by: 1, behind_by: 2 }],
		});
		const status = await fetchMergeStatus(ref, {
			token: "t",
			fetch: gh.fetchFn,
			sleep,
			pollDelaysMs: [1, 1],
		});
		expect(status.mergeability).toEqual({ kind: "computing" });
		expect(gh.calls.filter((c) => c === "/repos/o/r/pulls/7")).toHaveLength(3);
	});

	test("conflicts pull the base side's files for the overlap", async () => {
		const gh = fakeGitHub({
			"/repos/o/r/pulls/7": [{ mergeable: false }],
			"/repos/o/r/compare/feat/base...h": [
				{
					ahead_by: 2,
					behind_by: 14,
					files: [{ filename: "a.ts" }, { filename: "b.ts" }],
				},
			],
			"/repos/o/r/compare/h...feat/base": [
				{
					ahead_by: 14,
					behind_by: 2,
					files: [{ filename: "b.ts" }, { filename: "c.ts" }],
				},
			],
		});
		const status = await fetchMergeStatus(ref, {
			token: "t",
			fetch: gh.fetchFn,
			sleep,
		});
		expect(status.mergeability).toEqual({
			kind: "conflicts",
			overlap: { files: ["b.ts"], complete: true },
		});
		expect(status.behindBy).toBe(14);
	});

	test("an inaccessible repo reports unknown, not clean", async () => {
		const gh = fakeGitHub({});
		const status = await fetchMergeStatus(ref, {
			token: "t",
			fetch: gh.fetchFn,
			sleep,
		});
		expect(status).toEqual({
			baseRef: "feat/base",
			aheadBy: null,
			behindBy: null,
			mergeability: { kind: "unknown" },
		});
	});

	test("a thrown fetch is treated like a failed request", async () => {
		const status = await fetchMergeStatus(ref, {
			token: "t",
			fetch: async () => {
				throw new Error("network down");
			},
			sleep,
		});
		expect(status.mergeability).toEqual({ kind: "unknown" });
	});
});
