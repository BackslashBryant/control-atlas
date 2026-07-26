# STATE

## 2026-07-26 (session 6) - W3 documents

Goal: execute `docs/plans/sprint-handoff-2026-07-26.md` Part III §9 (W3) only.

### Completed changes

- Every starter document now advertises only Word, Excel, and/or PDF in the
  registry. Security Plan Starter defaults to Word; operational worksheets
  default to Excel; every artifact also offers a branded PDF.
- Added client-side PDF generation with a Control Atlas masthead, readable
  record cards, disclaimer, and print footer. The package is `pdf-lib` 1.17.1
  (MIT), loaded only when a document is generated.
- Replaced the header-only structure view with the actual generated document's
  headings, prompts, and starter rows before the download button.
- Fixed a real Office-download race: object URLs now remain available long
  enough for the browser's download manager to read the generated package.
- Kept the legacy text generator for documented internal/legacy callers; it is
  no longer advertised in the current Documents UI.

### Verification

- Generated and structurally verified all 24 registered Office/PDF outputs;
  PDF raster inspection confirmed the branded title, disclaimer, readable
  records, and print footer.
- Focused document contracts passed (54 tests). The POA&M Excel-download,
  document-preview, and PDF-selection browser regressions passed (3/3).
- `npm run lint`, `npm run typecheck`, `npm run test:browser`,
  `npm run smoke:dom`, `npm run verify:public`, `npm run test:e2e:smoke`, and
  `npm run test:a11y:smoke` passed. The full `npm run precommit` was also
  rerun locally after the final type fix; no push or merge occurred.

### Next workstream

Execute W4 - fold Commons into Documents and apply the approved user-facing
rebrand. Do not start W7 or W2 first. Do not push or merge without fresh owner
approval.

## 2026-07-26 (session 5) — W6 defects batch

Goal: execute `docs/plans/sprint-handoff-2026-07-26.md` Part III §12 (W6) only.
W1 and W5 are complete; the next workstream is W3.

### Completed changes

- `#/start-here` now resolves to Start here.
- Commons filters derive from URL state, so browser Back/Forward resyncs both
  controls and results; an e2e regression test covers Back navigation.
- Commons and Sources use the shared 90rem content ceiling.
- Commons links: 11 verified replacements, 3 removed because no matching
  current content could be verified. The dataset now has 96 resources and a
  reconciled 106-candidate manifest (96 accepted, 10 rejected).
- The Commons integrity and search benchmark tests now run under `test:data`;
  the benchmark no longer rewrites its checked-in report.
- Deleted the tracked dangerous Commons dataset generator and ignored local
  debug/generator leftovers after C14 reference checks. Retained `tools/` and
  `scripts/spikes/search-baseline.mjs`: internal/documented consumers exist.
- PostCSS is locked at 8.5.23, removing its reported advisory. React Router’s
  RSC advisory remains unaccepted and owner-gated; see
  `docs/audits/react-router-rsc-csrf-proposed-exception-2026-07-26.md`.
- The visual test waited for a partial bundle before capturing Documents and
  Sources. It now requires the full route state; the observed failure was the
  loading notice, not an application error.

### Verification

- Focused alias and Commons-history e2e checks passed (2/2); Documents and
  Sources visual composition checks passed at desktop and compact widths (4/4).
- `npm run precommit` passed. The build validated 96 Commons resources and 12
  collections; it retains the existing large-chunk warning.
- W6 is ready for local commit only. Do not push or merge without fresh owner
  approval.

### Next workstream

After W6 verification and local commit, execute W3 — Documents (Word, Excel,
PDF, and preview) — per §13. Do not start W4, W7, or W2 first.

## Historical record

The previous long-form session log and superseded open-item snapshots are
preserved at `docs/audits/state-history-through-2026-07-26.md`.
