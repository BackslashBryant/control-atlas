const OFFICIAL_TEXT_PREVIEW_LIMIT = 700;

export function officialTextPreview(
  text: string,
  limit: number = OFFICIAL_TEXT_PREVIEW_LIMIT,
): {
  preview: string;
  truncated: boolean;
} {
  if (text.length <= limit) {
    return { preview: text, truncated: false };
  }
  const candidate = text.slice(0, limit + 1);
  const lastBreak = candidate.lastIndexOf(" ");
  const boundary =
    lastBreak >= Math.floor(limit * 0.8) ? lastBreak : limit;
  return {
    preview: `${text.slice(0, boundary).trimEnd()}...`,
    truncated: true,
  };
}
