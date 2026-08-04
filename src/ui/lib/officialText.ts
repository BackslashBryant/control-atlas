const OFFICIAL_TEXT_PREVIEW_LIMIT = 700;

const NO_DESCRIPTION = "No narrative description was published for this record.";
const DESCRIPTION_AVAILABLE = "Official description available — open this record to read it.";

/**
 * The compact search artifact deliberately transports description availability,
 * not every full description. Never mistake that omitted payload for a source
 * record that lacks published narrative text.
 */
export function officialDescriptionOrStatus(record: {
  description?: string;
  description_available?: boolean;
}): string {
  if (record.description?.trim()) return record.description;
  return record.description_available ? DESCRIPTION_AVAILABLE : NO_DESCRIPTION;
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
