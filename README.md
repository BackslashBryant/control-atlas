# GovFrame Navigator

GovFrame Navigator is a browser-based reference tool for exploring U.S. government cybersecurity controls, related requirements, and supporting crosswalks in one place. It is designed to make it easier to move between major public frameworks, understand how a control connects to adjacent requirements, and quickly inspect source freshness and trust.

Live site: https://backslashbryant.github.io/GovFrame/

## What It Is

GovFrame Navigator is a static web application. It runs entirely in the browser and publishes a searchable, filterable view of control records, related framework mappings, and selected vulnerability references from public cybersecurity sources.

The page is built for people who need to move quickly between controls and adjacent references without digging through multiple source sites and file formats first.

## Why It Exists

Public cybersecurity references are available, but they are spread across separate catalogs, crosswalks, PDFs, and source repositories. GovFrame Navigator brings those references into a single view so a user can:

- search by control, requirement, practice, task, CCI, or seeded CVE
- inspect related items across frameworks
- see whether a source is authoritative, derived, or curated
- check how fresh a source snapshot is before relying on it
- copy a concise relationship summary from the page

## Who It Is For

GovFrame Navigator is aimed at:

- compliance and cybersecurity practitioners
- assessors and audit support teams
- engineers mapping technical work to control families
- program teams comparing related government framework requirements

## What You Can Do In The Page

- Search the combined control and reference index from a single query bar.
- Filter by framework and record type.
- Review list and map-style relationship views.
- Open a source detail view that shows provenance, trust tier, and freshness.
- Inspect crosswalks between controls and related requirements.
- Export a quick CSV row or copy a plain-language relationship summary.

## Current Source Families

The current public dataset includes these source families:

- NIST SP 800-53 Rev. 5
- NIST Cybersecurity Framework 2.0
- NIST SP 800-171 Rev. 3
- NIST SP 800-37 Rev. 2
- DoD CMMC 2.0 references
- FedRAMP Rev. 5 baseline references
- FISMA / FIPS 199 reference material
- curated DISA CCI mappings
- NIST National Vulnerability Database seed CVEs
- NIST AI Risk Management Framework
- NIST Secure Software Development Framework
- CISA Cybersecurity Performance Goals

## Source Trust Model

GovFrame Navigator shows source trust directly in the interface.

- `Authoritative` means the record comes from an official public source or official source repository.
- `Derived` means the record or relationship is built from public upstream material, but shaped into GovFrame’s browser format.
- `Curated` means a relationship or seed record is maintained in the repo because no equivalent machine-ready public feed is available in the same form.

Freshness is source-specific. Some records refresh automatically, while others remain manual until their upstream source changes or a curated update is made. The app shows freshness visually so readers can tell whether a source is current, aging, stale, or manual.

## Update Schedule

- GitHub Pages deploys the site from `main`.
- Nightly refresh runs at `06:00 UTC` for automated public-source refresh paths, including the NIST and NVD-backed refresh inputs used by the current dataset.
- Manual or curated sources remain on a manual cadence and are updated when the underlying reference changes or the mapped data is revised.

## Data Transparency

This repo includes the published static page, the data artifacts it serves, and the minimal automation used to refresh and validate those artifacts. It does not present internal planning or maintenance documents as part of the public product surface.

The site should be treated as a navigation and transparency tool, not as a replacement for reading the underlying source publications when an exact official citation is required.

## Public Repo Contents

The public repo contains:

- the static site entry point
- the published data and mapping artifacts used by the page
- the minimal refresh and validation scripts used for public updates
- GitHub Actions workflows for validation, refresh, and GitHub Pages deployment
