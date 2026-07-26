# STATE

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
