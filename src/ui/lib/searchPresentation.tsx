import { Fragment, type ReactNode } from "react";

type SearchDocument = {
  description?: string;
  official_text_preview?: string;
  publisher_name?: string;
  source_name?: string;
};

export function publisherPublicationLabel(document: SearchDocument): string {
  const publisher = document.publisher_name?.trim() || "";
  const publication = document.source_name?.trim() || "";
  if (!publisher) return publication || "Publisher unavailable";
  if (!publication) return publisher;
  if (publication.toLocaleLowerCase().startsWith(publisher.toLocaleLowerCase())) {
    return publication;
  }
  return `${publisher} ${publication}`;
}

export function searchPreviewText(document: SearchDocument): string {
  return (
    document.description?.trim() ||
    document.official_text_preview?.trim() ||
    "No narrative text was published; this record provides an official title and identifier."
  );
}

export function connectionSummary(
  connectionCount: number,
  publicationCount: number,
): string {
  if (connectionCount <= 0) return "No published mappings yet";
  const mappings = `${connectionCount.toLocaleString()} published mapping${connectionCount === 1 ? "" : "s"}`;
  if (publicationCount <= 1) return mappings;
  return `${mappings} across ${publicationCount.toLocaleString()} publications`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function MarkedSearchText(props: {
  query: string;
  text: string;
}): ReactNode {
  const terms = [...new Set(
    props.query
      .trim()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean),
  )].sort((left, right) => right.length - left.length);
  if (terms.length === 0) return props.text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "giu");
  const normalizedTerms = new Set(terms.map((term) => term.toLocaleLowerCase()));
  return props.text.split(pattern).map((part, index) =>
    normalizedTerms.has(part.toLocaleLowerCase()) ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    ),
  );
}
