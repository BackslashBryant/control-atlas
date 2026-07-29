const OFFICIAL_TEXT_PREVIEW_LIMIT = 700;

export function officialTextPreview(text: string): {
  preview: string;
  truncated: boolean;
} {
  if (text.length <= OFFICIAL_TEXT_PREVIEW_LIMIT) {
    return { preview: text, truncated: false };
  }
  const candidate = text.slice(0, OFFICIAL_TEXT_PREVIEW_LIMIT + 1);
  const lastBreak = candidate.lastIndexOf(" ");
  const boundary =
    lastBreak >= Math.floor(OFFICIAL_TEXT_PREVIEW_LIMIT * 0.8)
      ? lastBreak
      : OFFICIAL_TEXT_PREVIEW_LIMIT;
  return {
    preview: `${text.slice(0, boundary).trimEnd()}...`,
    truncated: true,
  };
}
