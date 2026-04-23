/** Post form writes `\n\nBox & papers: …`; legacy rows may use `Box/papers:`. */
const BOX_PAPERS_PATTERNS = [
  /\n\nBox & papers:\s*([\s\S]+)$/,
  /\n\nBox\/papers:\s*([\s\S]+)$/,
] as const;

export function parseBoxPapersFromDetails(details: string): string {
  for (const re of BOX_PAPERS_PATTERNS) {
    const m = details.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return '';
}

export function descriptionFromListingDetails(details: string): string {
  let stripped = details;
  for (const re of BOX_PAPERS_PATTERNS) {
    stripped = stripped.replace(re, '').trim();
  }
  return stripped || details.trim();
}
