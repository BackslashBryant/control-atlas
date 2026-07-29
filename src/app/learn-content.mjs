export const learnArticles = Object.freeze([
  {
    id: "hierarchy-and-relationships",
    title: "Hierarchy and relationships are different",
    summary: "Read structural ancestry separately from mappings, choices, evidence, and implementation links.",
    explanation:
      "A structural path follows only hierarchy declared by the publisher. Baselines select from a catalog; mappings correlate records; evidence and implementation resources support work. None of those becomes a structural parent.",
    limitations:
      "Control Atlas can display published structure and recorded relationships. It cannot decide which baseline, mapping, or implementation applies to an organization.",
    nextAction: { label: "Open Explore", view: "atlas-map" },
    citations: [
      { sourceId: "nist-800-53", role: "official-subject-source", label: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", supports: "The publisher-declared catalog and control hierarchy used in the example; it does not define Control Atlas navigation." },
    ],
    templates: [],
  },
  {
    id: "source-truth-and-notes",
    title: "Publisher text and Control Atlas notes",
    summary: "Distinguish publisher text and identity from navigation labels and product explanations.",
    explanation:
      "Official titles, identifiers, text, and publication links retain their source identity. Labels that explain navigation or relationship classes are Control Atlas explanations, not publisher language.",
    limitations:
      "A Control Atlas explanation is a reading aid. Use the cited publication and responsible authority for substantive decisions.",
    nextAction: { label: "Review Sources", view: "sources" },
    citations: [
      { sourceId: "nist-csf-2", role: "official-subject-source", label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20", supports: "The official publication identity and subject matter used in the example; it does not author Control Atlas notes." },
    ],
    templates: [],
  },
  {
    id: "search-eligibility-and-ranking",
    title: "How Search eligibility and ranking work",
    summary: "See why exact identifiers, ambiguous text, active filters, and zero results behave differently.",
    explanation:
      "Search first determines which records match the query and active filters. Exact identifiers may open one unique canonical record. Ambiguous text stays in Search, and ranking orders only eligible matches. A zero result remains zero.",
    limitations:
      "Search ranking does not establish importance, applicability, or authority for a particular system or program.",
    nextAction: { label: "Open Search", view: "search" },
    citations: [
      { sourceId: "nist-800-53", role: "official-subject-source", label: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", supports: "Examples of published identifiers and titles searchable in Control Atlas; Search eligibility and ranking are Control Atlas behavior." },
    ],
    templates: [],
  },
  {
    id: "read-a-record",
    title: "How to read a record",
    summary: "Verify official identity and text before reviewing structure, relationships, and working links.",
    explanation:
      "Start with the record identifier, official title, publisher, publication, and official text. Then read structural position, published relationships, and Control Atlas navigation notes as distinct sections.",
    limitations:
      "A record page does not establish that the record applies, is implemented, or is satisfied.",
    nextAction: { label: "Browse Catalog", view: "catalog-detail" },
    citations: [
      { sourceId: "nist-800-53", role: "official-subject-source", label: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", supports: "The official record identifiers, titles, and hierarchy used in the reading example." },
    ],
    templates: [],
  },
  {
    id: "published-mappings-in-compare",
    title: "Use published mappings in Compare",
    summary: "Treat a crosswalk as cited correlation evidence, not equivalence or a compliance conclusion.",
    explanation:
      "Compare displays mappings and other recorded relationships with their source, derivation, and confidence. Two records can be related without being equivalent, interchangeable, or sufficient for the same outcome.",
    limitations:
      "Control Atlas cannot infer an unmapped relationship or decide that one requirement satisfies another.",
    nextAction: { label: "Open Compare", view: "matrix" },
    citations: [
      { sourceId: "nist-olir-csf2-to-sp800-53", role: "official-subject-source", label: "NIST CSF 2.0 Concept Crosswalk to SP 800-53 5.2.0 (draft)", url: "https://csrc.nist.gov/csrc/media/projects/olir/documents/submissions/Cybersecurity_Framework_v2-0_Concept_Crosswalk_800-53_5_2_0_draft.xlsx", supports: "A published mapping source used by Compare; it does not establish equivalence or applicability." },
    ],
    templates: [],
  },
  {
    id: "starter-documents-and-judgment",
    title: "Starter documents preserve user judgment",
    summary: "Check required inputs, source citations, previews, downloads, and explicit unselected values.",
    explanation:
      "Starter documents use only the inputs selected in Build. Required inputs fail closed; optional values remain unselected. Preview and Download use the same validated snapshot and include cited source context and limitations.",
    limitations:
      "A generated starter document is not evidence, an authorization package, a compliance result, or an authorizing-authority decision.",
    nextAction: { label: "Open Starter documents", view: "templates", patch: { buildSection: "documents" } },
    citations: [
      { sourceId: "nist-ssdf", role: "official-subject-source", label: "NIST SP 800-218 SSDF Version 1.1", url: "https://csrc.nist.gov/pubs/sp/800/218/final", supports: "Subject matter that a starter document may cite; preview and download snapshot behavior is authored by Control Atlas." },
    ],
    templates: [],
  },
]);

export function learnArticleById(id) {
  return learnArticles.find((article) => article.id === id) || null;
}
