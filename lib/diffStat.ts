// How big is this PR? The single most useful thing a notification can say
// beyond the title — it is the difference between "I'll look now" and "I'll
// block out an hour", and it was previously only discoverable by opening the
// PR.
//
// GitHub puts `additions`, `deletions` and `changed_files` on the full
// `pull_request` representation that `pull_request` events carry. They are
// treated as optional throughout: an older or partial payload should lose the
// size line, never the whole notification.

export type DiffStat = {
	additions?: number;
	deletions?: number;
	changed_files?: number;
};

const nf = new Intl.NumberFormat("en-US");

// A PR that only deletes has `additions: 0`, which is a real and interesting
// answer — so presence is tested rather than truthiness. `0` is a number;
// `undefined` is a payload that did not tell us.
function known(n: number | undefined): n is number {
	return typeof n === "number" && Number.isFinite(n);
}

/**
 * `+257 / -9` — the churn, or null when the payload carried neither figure.
 */
export function formatDiffStat(pr: DiffStat): string | null {
	const { additions, deletions } = pr;
	if (!known(additions) && !known(deletions)) return null;

	const parts: string[] = [];
	if (known(additions)) parts.push(`+${nf.format(additions)}`);
	if (known(deletions)) parts.push(`-${nf.format(deletions)}`);
	return parts.join(" / ");
}

/**
 * The embed field: churn, plus the file count when GitHub sent one.
 * Null when there is nothing to say, so callers can spread it away entirely
 * rather than render an empty field.
 */
export function diffStatField(
	pr: DiffStat,
): { name: string; value: string; inline: boolean }[] {
	const churn = formatDiffStat(pr);
	if (!churn) return [];

	const files = known(pr.changed_files)
		? ` across ${nf.format(pr.changed_files)} file${pr.changed_files === 1 ? "" : "s"}`
		: "";

	return [{ name: "Changes", value: `\`${churn}\`${files}`, inline: true }];
}

/**
 * The compact form for the plain-text line above the embed, which is what
 * shows in a Discord notification preview and in the channel list.
 */
export function diffStatSuffix(pr: DiffStat): string {
	const churn = formatDiffStat(pr);
	return churn ? ` (${churn})` : "";
}
