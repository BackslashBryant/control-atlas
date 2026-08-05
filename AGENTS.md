# Agent Rules

## Product Scope

**Control Atlas** v1.0 is the full product in `docs/PRD.md` and `docs/roadmap.md`. Build all six epics unless the user explicitly narrows a task.

**Delivery status:** Epics 0–10 shipped (`v1.0.0-rc.1`). Open gaps: [`docs/plans/prd-v3-alignment-backlog.md`](docs/plans/prd-v3-alignment-backlog.md).

**Active sprint:** None — Epic 10 complete (zero residuals). See [`docs/Plan.md`](docs/Plan.md).

## Design principle

**Build for translation, not complexity.** See `docs/DESIGN_PRINCIPLES.md` before UI copy, feature work, or user-facing output.

Operating rules for agents:

1. Plain language first — domain terms only when they add precision.
2. Show the connection — no isolated facts without context.
3. Make action obvious — user should not synthesize alone.
4. Preserve rigor — simplification must stay accurate and traceable.
5. Design for constrained teams — limited time, staff, and data.
6. Separate source truth from interpretation.
7. Prefer usable systems over impressive systems.
8. Every output answers: What is this? Why does it matter? What should I do with it?

## Operating Model

1. Cursor is the primary workhorse. Other AI tools adapt through `.ai/shared/`.
2. Personas stay because they make ownership memorable:
   - Vector: specs, planning, lightweight docs/status.
   - Forge: implementation.
   - Pixel: verification.
   - Muse: UI/UX, brand, copy, product feel.
   - Scout: research.
   - Sentinel: security/risk.
   - Nexus: git, CI, release, deploy, maintenance automation.
3. Pick one lead persona per task. Do not stage fake full-team reviews.
4. Setup should be agent-led. If setup state is missing, run `npm run agent:bootstrap -- --apply` and report what it found.

## Execution Guardrails

1. Before editing, restate the task, constraints, and relevant rules.
2. Never start a dev server unless the user explicitly asks in this chat turn and confirms command and port.
3. Check active processes first with `npm run ports:status` before server work.
4. To launch a server, run only `npm run dev:guarded`.
5. To stop or clean up ports, run only `npm run ports:free` or `npm run ports:free:win`.
6. Do not kill processes you did not start unless the user confirms.
7. Use package.json scripts. Do not hand-craft long commands when a script exists.
8. Never modify files outside this repository.
9. Do not explain shell syntax or tool mechanics in chat. Report results directly.

## Code-Change Guardrails

1. Work on a branch, not `main`, unless the user explicitly asks otherwise.
2. Use `agent/<persona>/<issue>-<slug>` for issue work and `chore/<slug>` for template/tooling work.
3. Keep changes minimal and reversible.
4. After edits, show `git status` and a diff summary of touched files.
5. Run `npm run precommit` before ship-ready completion unless a stricter task-specific gate applies.
6. If a gate fails, stop and report the failure before attempting broader fixes.
7. Control Atlas must never fabricate official source URLs. If a per-control URL scheme is not verified from an official source, store the official catalog/document URL and the control identifier separately. Deep links may be generated only when marked `best_effort` and backed by a fallback to the official source landing page.

## Data Pipeline & Integrity Guardrails

1. **Evidence-Based Generation (No Fabrication)**: Never invent or estimate checksums, file sizes, publication dates, record counts, benchmark names, or lifecycle states. Every value must be computed from actual downloaded bytes or parsed records. Unknown upstream values must be explicitly recorded as `null` with a stated reason.
2. **Discovery Pipeline Precedence**: Use discovery mechanisms in the following order:
   1. Official documented API
   2. Official undocumented but stable JSON endpoint
   3. Static HTML or embedded page data
   4. Official compilation/download artifact
   5. Playwright-rendered discovery (last resort)
3. **Playwright Constraints**: Live browser discovery (Playwright) must never run during normal site builds, precommit, unit tests, or routine data consumption. It must be placed behind an explicit refresh command or scheduled workflow, and must save a deterministic raw discovery snapshot for separate parsing. Tests must use committed fixtures.
4. **Reconciliation & Completeness**: Data ingestion pipelines must prove completeness by producing a discovered-versus-ingested reconciliation table. Automated completeness gates must fail on:
   - Invalid or abbreviated checksums
   - Declared byte lengths differing from downloaded bytes
   - Declared counts differing from parsed output
   - Ingested artifacts absent from discovery (or vice versa)
   - Canonical-ID collisions or duplicate releases
   - Silent stale fallbacks during required-fresh runs
5. **Separation of Validation**: Maintain strict separation between validation scopes:
   - `verify:discovery`: Validates retrieved inventories and reconciliation.
   - `verify:manifests`: Validates evidence locators, checksums, lengths, and referential integrity.
   - `check:oscal`: Validates actual upstream external OSCAL files using official tooling (NIST CLI).
   - Normalized internal schemas must be validated via AJV, not described as OSCAL documents unless fully conforming.

## Pull Request and Ship Flow

Every change must follow the pull request ship flow:

1. Build on a feature branch (`agent/<persona>/<issue>-<slug>` or `chore/<slug>`).
2. Verify all local quality, hygiene, and test gates pass.
3. Commit narrowly scoped changes.
4. Push the feature branch to `origin`.
5. Open a Pull Request against `main`.
6. Confirm all GitHub CI checks run and pass (no direct local merges to `main` allowed).
7. Perform fresh-checkout verification from the remote branch.
8. Retain the feature branch until PR review and CI are complete.
9. Report branch, PR URL, commit, CI status, and verification results.

## Maintenance Mode

Maintenance means git and CI automation:

- scheduled dependency checks
- security scans
- smoke tests
- lint/type/test gates
- stale issue or branch reporting
- generated issues for actionable failures

## Repository hygiene rules

* Commit only files required to build, test, deploy, operate, understand, or maintain the application.
* Never commit agent walkthroughs, completion reports, prompts, transcripts, scratch notes, local research, temporary plans, internal chain-of-thought summaries, or session artifacts.
* Never commit fabricated, estimated, placeholder, or unverified evidence.
* Never create documentation whose primary purpose is to narrate what an agent did.
* Never commit machine-specific absolute paths or local `file:///` links.
* Never add generated files unless the repository intentionally versions them and can regenerate them deterministically.
* Never weaken tests, schemas, integrity checks, limits, or quality budgets merely to make a branch pass.
* Never raise a size or performance budget without measured evidence and documented justification.
* Never silently ignore new production files.
* Review every staged path before committing.
* Keep unrelated changes out of the diff.
* Avoid timestamp-only, line-ending-only, or formatting-only churn.
* Local-only work must remain under ignored directories.
* When uncertain, leave the file untracked and document the decision locally.

## Required pre-commit checklist

Before every commit:

1. Run `git status --short`.
2. Review every staged file.
3. Inspect `git diff --cached`.
4. Search for absolute paths.
5. Search for agent/session directory names.
6. Search for placeholder or fabricated values.
7. Check for generated churn.
8. Run applicable validation.
9. Confirm the commit is narrowly scoped.
10. Confirm no useful local-only file is accidentally deleted.

<!-- BEGIN core-engineering-doctrine -->
# Core Engineering Doctrine (project reference)

This repository follows the Core Engineering Doctrine. Canonical, full text:
C:\Users\OrEo2\.engineering\core-engineering-doctrine.md

Precedence when guidance conflicts (top wins):
1. Safety, security, legal obligations, data integrity, and explicit user instructions.
2. This project's own requirements, contracts, and instruction files.
3. The Core Engineering Doctrine.
4. Agent defaults and stylistic preferences.
Doctrine exceptions are allowed but must be explicit, owned, and time-bounded.

Condensed: define outcome + constraints + hazards + acceptance criteria; choose the
simplest sufficient design; do not build speculative capability; keep responsibilities
cohesive and dependencies controlled; centralize knowledge without premature abstraction;
deliver small reversible increments; build in tests, observability, and rollback; assume
failure and bound its blast radius; treat security, privacy, and data integrity as
foundational; price and remediate debt deliberately; delete the obsolete; make ownership
explicit; optimize lifecycle cost; remove unjustified complexity.
<!-- END core-engineering-doctrine -->
