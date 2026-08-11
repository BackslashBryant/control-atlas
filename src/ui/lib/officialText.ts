const OFFICIAL_TEXT_PREVIEW_LIMIT = 700;

/**
 * Prefer full record text when loaded, then the compact official preview carried
 * by search. A boolean availability flag must never become withheld-content copy.
 */
export function officialDescriptionOrStatus(record: {
  description?: string;
  official_text_preview?: string;
}): string {
  if (record.description?.trim()) return record.description;
  if (record.official_text_preview?.trim()) return record.official_text_preview;
  return "";
}

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
