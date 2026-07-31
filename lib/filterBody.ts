/** Extract image URLs from markdown images and HTML img tags, returning cleaned text and URLs */
export function extractImages(body: string): {
	text: string;
	images: string[];
} {
	const images: string[] = [];

	// Extract markdown images: ![alt](url)
	const mdImageRe = /!\[[^\]]*\]\(([^)]+)\)/g;
	for (const match of body.matchAll(mdImageRe)) {
		if (match[1]) images.push(match[1]);
	}

	// Extract HTML img tags: <img src="url" ...>
	const imgTagRe = /<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi;
	for (const match of body.matchAll(imgTagRe)) {
		if (match[1]) images.push(match[1]);
	}

	// Remove image references from text
	const cleaned = body.replace(mdImageRe, "").replace(imgTagRe, "");

	return { text: cleaned, images };
}

export function filterBody(body: string): { text: string; images: string[] } {
	const cleaned = body
		.replace(/<!--.*?-->/g, "")
		.replace("<sup>", "-# ")
		.replace("</sup>", "")
		.replace("[!NOTE]", "");

	const { text, images } = extractImages(cleaned);
	return { text, images };
}
