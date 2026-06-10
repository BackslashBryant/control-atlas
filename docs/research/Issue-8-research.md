# Issue 8 Research

## Product Correction

GovFrame is a framework mapper, not a STIG-first tool. Control Correlation Identifiers are granular bridge requirements that may connect controls and mappable technical requirements. They are not synonymous with STIGs, and complete STIG ingestion is not a goal.

The official DISA CCI List is the gold source for CCI identity and includes direct NIST SP 800-53 Revision 5 references. Those references publish as CCI-to-control mappings without requiring STIG data. A STIG-derived assertion may be added later only as a separate, evidence-backed edge.

## Source Policy

- Gold: official NIST, DoD, DISA, FedRAMP, and DoD Responsible AI sources.
- Silver: maintained crosswalk repositories such as MITRE material where applicable.
- Bronze: community research used for discovery and corroboration only.

Gold decides publication. Silver and bronze gaps remain visible rather than blocking valid gold-supported mappings.

## UX Backlog Research (Single Consolidated Canvas)

To transition GovFrame from a technical reference tool to an educational and highly functional portal for both junior and senior assessors, we have identified these design directions:

1. **State Storage for Onboarding Preference**:
   Since the app runs as a client-side static site on GitHub Pages with no server or data-storage capabilities, the "New to Mapping" vs "Expert" choice must be stored in the URL query string (e.g. `mode=novice` or `mode=expert`) or in-memory. Query parameters allow easy bookmarking/sharing of states.
   
2. **Copy Reduction (DRY/KISS)**:
   Explanations are currently hardcoded inside `app.mjs`. Creating an ESM module structure in `app/content/` (e.g., `terms.mjs`, `tooltips.mjs`, `glossary.mjs`) ensures single-source-of-truth copy definitions, making audits simple and preventing discrepancies.
   
3. **Accessibility (WCAG 2.2)**:
   Any added interactive overlays (walkthrough, glossary drawer) must conform to keyboard trap rules, handle focus redirection on open/close, and provide clear screen-reader labels (aria attributes).
