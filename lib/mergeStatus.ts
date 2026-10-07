// Does this PR still merge cleanly, and how far has it drifted from its base?
//
// Two GitHub API facts answer that:
//   - `GET /pulls/:n` → `mergeable`, GitHub's own test merge against the base
//     tip. It is computed asynchronously and reads `null` until the job
//     finishes — which is nearly always the case on `opened`, so we poll.
//   - `GET /compare/base...head` → `ahead_by` / `behind_by`.
//
// GitHub never says *which* files conflict, and the service has no clone to
// run `git merge-tree` in. When the PR conflicts we instead name the files
// changed on both sides since the merge base. Every conflicting file is in that
// set, but not every file in it conflicts, so it is labelled as such — the
// field must never claim more than GitHub actually told us.

export type FileOverlap = {
	files: string[];
	// False when either compare hit GitHub's per-response file cap, so the
	// overlap may be missing entries.
	complete: boolean;
};

export type Mergeability =
	| { kind: "clean" }
	| { kind: "conflicts"; overlap: FileOverlap | null }
	// GitHub still had `mergeable: null` after we stopped polling.
	| { kind: "computing" }
	// The PR request itself failed (no access, rate limit, outage).
	| { kind: "unknown" };

export type MergeStatus = {
	baseRef: string;
	aheadBy: number | null;
	behindBy: number | null;
	mergeability: Mergeability;
};

export type PrRef = {
	repoFullName: string;
	number: number;
	baseRef: string;
	headSha: string;
};

export const MERGE_STATUS_FIELD_NAME = "Merge status";
const MAX_LISTED_FILES = 5;
const MAX_PATH_LENGTH = 80;
// GitHub's compare endpoint returns at most this many files per response.
const COMPARE_FILE_CAP = 300;
// Roughly 20s in total — enough for GitHub's test merge on a large repo,
// short enough that the placeholder never lingers for long.
export const DEFAULT_POLL_DELAYS_MS = [1500, 2500, 4000, 6000, 6000];

const nf = new Intl.NumberFormat("en-US");

// ---- formatting -----------------------------------------------------------

function code(s: string): string {
	return `\`${s.replaceAll("`", "'")}\``;
}

function shortenPath(path: string): string {
	return path.length <= MAX_PATH_LENGTH
		? path
		: `…${path.slice(path.length - (MAX_PATH_LENGTH - 1))}`;
}

/** `2 ahead, 14 behind \`main\`` — or just `vs \`main\`` when compare failed. */
export function formatDrift(s: {
	baseRef: string;
	aheadBy: number | null;
	behindBy: number | null;
}): string {
	const parts: string[] = [];
	if (s.aheadBy !== null) parts.push(`${nf.format(s.aheadBy)} ahead`);
	if (s.behindBy !== null) parts.push(`${nf.format(s.behindBy)} behind`);
	return parts.length > 0
		? `${parts.join(", ")} ${code(s.baseRef)}`
		: `vs ${code(s.baseRef)}`;
}

/** `\`a.ts\`, \`b.ts\` +3 more` */
export function formatFileList(files: string[], complete: boolean): string {
	const shown = files
		.slice(0, MAX_LISTED_FILES)
		.map((f) => code(shortenPath(f)));
	const hidden = files.length - shown.length;
	let out = shown.join(", ");
	if (hidden > 0) out += ` +${nf.format(hidden)} more`;
	if (!complete) out += " (list may be incomplete)";
	return out;
}

// Emoji + words carry the meaning on their own; nothing here relies on colour.
export function formatMergeStatus(s: MergeStatus): string {
	const drift = formatDrift(s);
	const m = s.mergeability;
	switch (m.kind) {
		case "clean":
			return `✅ No conflicts · ${drift}`;
		case "computing":
			return `⏳ GitHub hasn't finished its conflict check · ${drift}`;
		case "unknown":
			return `❔ Conflict check unavailable · ${drift}`;
		case "conflicts": {
			const head = `⚠️ Has conflicts · ${drift}`;
			if (!m.overlap || m.overlap.files.length === 0) return head;
			const n = m.overlap.files.length;
			return `${head}\nChanged on both sides (${nf.format(n)}${m.overlap.complete ? "" : "+"} file${n === 1 ? "" : "s"}): ${formatFileList(m.overlap.files, m.overlap.complete)}`;
		}
	}
}

export function pendingMergeStatusField(baseRef: string) {
	return {
		name: MERGE_STATUS_FIELD_NAME,
		value: `⏳ Checking against ${code(baseRef)}…`,
		inline: false,
	};
}

export function mergeStatusField(s: MergeStatus) {
	return {
		name: MERGE_STATUS_FIELD_NAME,
		value: formatMergeStatus(s),
		inline: false,
	};
}

/** A copy of the embed with its merge-status field replaced by the result. */
export function withMergeStatus<
	E extends { fields?: { name: string; value: string; inline?: boolean }[] },
>(embed: E, status: MergeStatus): E {
	const field = mergeStatusField(status);
	const fields = embed.fields ?? [];
	const replaced = fields.some((f) => f.name === MERGE_STATUS_FIELD_NAME)
		? fields.map((f) => (f.name === MERGE_STATUS_FIELD_NAME ? field : f))
		: [...fields, field];
	return { ...embed, fields: replaced };
}

/**
 * The PR coordinates the check needs, or null when it can't run: no token, or
 * a payload without head/base.
 */
export function mergeStatusRef(
	token: string | undefined,
	repoFullName: string | null | undefined,
	pr: {
		number: number;
		head?: { sha: string };
		base?: { ref: string };
	},
): PrRef | null {
	if (!token || !repoFullName || !repoFullName.includes("/")) return null;
	if (!pr.head || !pr.base) return null;
	return {
		repoFullName,
		number: pr.number,
		baseRef: pr.base.ref,
		headSha: pr.head.sha,
	};
}

// ---- overlap --------------------------------------------------------------

export type CompareFile = { filename: string; previous_filename?: string };

/**
 * Files the head side changed that the base side also changed since the merge
 * base. Renames count under either name so a rename-vs-edit still shows up.
 */
export function overlappingFiles(
	headFiles: CompareFile[],
	baseFiles: CompareFile[],
): FileOverlap {
	const baseTouched = new Set<string>();
	for (const f of baseFiles) {
		baseTouched.add(f.filename);
		if (f.previous_filename) baseTouched.add(f.previous_filename);
	}
	const files = headFiles
		.filter(
			(f) =>
				baseTouched.has(f.filename) ||
				(f.previous_filename !== undefined &&
					baseTouched.has(f.previous_filename)),
		)
		.map((f) => f.filename)
		.sort();
	return {
		files,
		complete:
			headFiles.length < COMPARE_FILE_CAP &&
			baseFiles.length < COMPARE_FILE_CAP,
	};
}

// ---- GitHub ---------------------------------------------------------------

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export type MergeStatusDeps = {
	token: string;
	fetch?: Fetch;
	sleep?: (ms: number) => Promise<void>;
	pollDelaysMs?: number[];
};

type Compare = {
	ahead_by: number;
	behind_by: number;
	files?: CompareFile[];
};

// Branch names may contain `/`, which the compare path accepts as-is; every
// other reserved character is escaped.
function encodeRef(ref: string): string {
	return ref.split("/").map(encodeURIComponent).join("/");
}

async function getJson<T>(
	fetchFn: Fetch,
	token: string,
	path: string,
): Promise<T | null> {
	try {
		const res = await fetchFn(`https://api.github.com${path}`, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${token}`,
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "github-discord-webhook",
			},
		});
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

/** Poll `mergeable` until GitHub has an answer or we run out of patience. */
async function pollMergeable(
	fetchFn: Fetch,
	sleep: (ms: number) => Promise<void>,
	token: string,
	pr: PrRef,
	delays: number[],
): Promise<boolean | "computing" | "unknown"> {
	const path = `/repos/${pr.repoFullName}/pulls/${pr.number}`;
	for (let attempt = 0; ; attempt++) {
		const body = await getJson<{ mergeable: boolean | null }>(
			fetchFn,
			token,
			path,
		);
		if (!body) return "unknown";
		if (typeof body.mergeable === "boolean") return body.mergeable;
		const delay = delays[attempt];
		if (delay === undefined) return "computing";
		await sleep(delay);
	}
}

export async function fetchMergeStatus(
	pr: PrRef,
	deps: MergeStatusDeps,
): Promise<MergeStatus> {
	const fetchFn = deps.fetch ?? fetch;
	const sleep =
		deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
	const repo = `/repos/${pr.repoFullName}`;
	const base = encodeRef(pr.baseRef);

	// The head SHA is reachable from the base repo even for fork PRs
	// (GitHub keeps it under refs/pull/N/head), so no fork owner is needed.
	const [compare, mergeable] = await Promise.all([
		getJson<Compare>(
			fetchFn,
			deps.token,
			`${repo}/compare/${base}...${pr.headSha}`,
		),
		pollMergeable(
			fetchFn,
			sleep,
			deps.token,
			pr,
			deps.pollDelaysMs ?? DEFAULT_POLL_DELAYS_MS,
		),
	]);

	let mergeability: Mergeability;
	if (mergeable === true) {
		mergeability = { kind: "clean" };
	} else if (mergeable === false) {
		// Only now is the second compare worth its request: what the base side
		// changed since the merge base.
		const reverse = compare
			? await getJson<Compare>(
					fetchFn,
					deps.token,
					`${repo}/compare/${pr.headSha}...${base}`,
				)
			: null;
		mergeability = {
			kind: "conflicts",
			overlap:
				compare?.files && reverse?.files
					? overlappingFiles(compare.files, reverse.files)
					: null,
		};
	} else {
		mergeability = { kind: mergeable };
	}

	return {
		baseRef: pr.baseRef,
		aheadBy: compare?.ahead_by ?? null,
		behindBy: compare?.behind_by ?? null,
		mergeability,
	};
}
