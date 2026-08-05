<!-- guardrails-kit: v1.0 -->
<!-- BEGIN KIT CORE v1.0 -->
<!-- Editing this file? Read docs/guardrails/_FORMAT.md first. Never paraphrase kit text. -->
These rules compensate for known model failure modes. They are procedures, not advice — follow them literally.

## Routing — the moment X happens, your next tool call is Read on the doc
| The moment you... | Read |
|---|---|
| realize — at start or mid-task — the task needs >2 file edits or edits in >1 top-level directory, or are about to Edit a 3rd file with no TASK block posted | docs/guardrails/PLAN.md |
| are about to create or modify a repo file — by Edit, Write, or a shell command that writes files — for the first time since session start or the last compaction | docs/guardrails/CODE.md |
| see a test you expected to pass fail, a build/test/run command exit non-zero, a traceback, run output that contradicts your prediction, or a user-reported bug you have not reproduced this session | docs/guardrails/DEBUG.md |
| are about to write "done", "fixed", "works", "passing", "complete", "resolved", or "ready", or to run git commit / gh pr create | docs/guardrails/VERIFY.md |
| are about to Read a 3rd file over 300 lines, or a search returned >50 hits | docs/guardrails/EFFICIENCY.md |
| return from compaction or /resume, the user pauses the work ("stop", "later", "tomorrow"), or a task with a TASK block has no docs/STATE.md | docs/guardrails/SESSION.md |
| no row above matches but the work feels risky | docs/guardrails/PLAN.md |

Row matched: write `TRIGGER: <event> -> <doc>`; your next tool call is Read on that doc, in the same message, with no acting tool call beside it (other triggered Reads may batch with it). 2+ rows match at once? Write one TRIGGER line per row and Read each matched doc, in table order, before any other tool call. Already Read the doc since the last compaction? Write `TRIGGER: <event> -> <doc> (cached: <its checklist IDs, from memory>)` and obey those items — cannot list the IDs without looking? It is not cached: Read the doc. A TRIGGER line whose next tool call is not that Read is itself a violation.

## Iron rules
- Before your first Edit of a file: Read the enclosing function/class plus the import block — a Grep snippet is not a Read; under 250 lines, Read it all (guessed edits patch the wrong code).
- Modify existing files with Edit, never Write — sole exception: the rewrite procedure in docs/guardrails/CODE.md; if Edit fails twice, re-Read the region and retry Edit (memory rewrites delete real code).
- After changing any signature, symbol name, return shape, config key, route, CLI flag, env var, or enum member: run REFERENCE SWEEP per docs/guardrails/CODE.md (missed callers break silently).
- Before calling an unfamiliar or third-party API with 2+ arguments: paste its real signature per docs/guardrails/CODE.md C5 (plausible is not real).
- Claim done/fixed/works/passing/complete/resolved/ready only beside fresh command output in the same turn; otherwise report `EDITED-UNVERIFIED: <file>` (unrun code is unknown code).
- Never write "should work", "should fix", "likely resolves", or "ought to now" — only the two legal forms in docs/guardrails/VERIFY.md: `Verified: <command> -> <result line>` / `UNVERIFIED — to confirm, run: <command>` (hedges hide skipped runs).
- Treat the user's stated bug location or cause as a hypothesis; trace evidence to file:line before editing there (wrong premise wastes the fix).
- Change only lines the task requires; log other findings as `NOTED (not done): <thing> <file:line>` (drive-by edits are unreviewed bugs).
- Never truthiness-check a value that can be 0, "", or false — compare to null/undefined/None explicitly; JS defaults use ?? (zero is data).
- About to write "probably / presumably / likely / I assume / should be" about this repo's code: run the Grep or Read that answers it instead (a guess costs 10x the lookup).
- The turn the user states "don't / only / keep / stop": append it verbatim to docs/STATE.md `## Constraints` — file missing? Create it per docs/guardrails/SESSION.md S2 (unwritten constraints decay within 50 turns).
- Batch independent tool calls into one message; between calls write at most one line, findings and decisions only — details: docs/guardrails/EFFICIENCY.md E5/E6 (narration buries findings).
<!-- END KIT CORE -->

## Project
<!-- Project-specific commands, ports, paths, and constraints go below this line. Cap: 40 lines. -->
Doctrine: follow C:\Users\OrEo2\.engineering\core-engineering-doctrine.md — precedence: safety/security/legal + explicit user instructions > project rules > this doctrine > agent defaults.
# GovFrame — federal compliance framework static site (Node.js + Playwright)
build:site: npm run build:site        # tools/build-static-site.mjs — generates static HTML
build:data: npm run build:data        # scripts/build-framework-data.mjs
test: npm test                        # test:data + test:runtime + test:graph
test:data: npm run test:data          # source/template/framework data contracts (node --test)
test:runtime: npm run test:runtime    # framework-runtime + graph tests
test:graph: npm run test:graph        # tsx graph tests
test:e2e: npm run test:e2e            # npm run build:site && playwright test
test:a11y: npm run test:a11y          # accessibility playwright spec
test:browser: npm run test:browser    # browser-contract.test.mjs
lint: npm run lint                    # eslint --max-warnings=0
audit:deps: npm run audit:deps        # scripts/security/npm-audit.mjs
ports:status: npm run ports:status
Ship contract: Control Atlas v1.0 shipped (v1.0.0-rc.1); open scope = docs/plans/prd-v3-alignment-backlog.md; non-goals per docs/PRD.md
Corrections (append here the turn the user corrects you — don't wait to be asked):
- 2026-08-02: The tree model's vocabulary (trunk/limb/twig/acorn) is internal reasoning, never product copy. "Nine limbs" shipped to Home, Explore and Start Here; the owner rejected it outright. Every surface says "area". Guarded by tests/content-review.test.mjs "the internal tree vocabulary never reaches rendered copy". The same rule covers any internal model word — if the team invented it to reason about the data, a visitor should never read it.
- 2026-08-02: Never ship a navigation category with nothing in it. "Not yet loaded" on three of nine areas was advertising our own backlog to the user. Either the category has content, or it names the surface that does (data/curated/tree-spine.json areaDestinations), or it does not exist.
- 2026-08-01: Green tests are not proof a feature works. Start Here's limb routing passed lint, typecheck, 341 unit tests and every e2e gate while being completely dead in the browser — `canonicalizeHashLocation` stripped the new `atlasLimb` param, so the link landed on a generic page. Before calling any user-facing feature done, drive the actual click path in a browser and read the resulting screen. A new route/query field is not real until `tests/graph/routeIdentity.test.ts` "every durable view field survives canonicalization" covers it.
- 2026-08-01: Judge every surface at both viewports before claiming a QA pass — not a sample. The 2026-08-01 sweep of all 20 routes found, on pages nobody had flagged: a static "Opening workspace" placeholder left visible above real content on every non-home mobile route, limb blurbs squeezed into a 90px column by a fixed-width sibling in a flex row, external Resources ranked above published records in search, "Not recorded"/"Other" printed as real publisher values, a 17,000px unpaginated Resources page, and three pages whose H1 repeated their own eyebrow. Sampling 8 of 20 routes missed all of them.
- 2026-08-01: A page that shows "no results" when its data failed to load is lying. Distinguish "empty" from "not loaded" wherever a fetch can fail (`runtimeLoader` swallows several with `.catch(() => null)`).
- 2026-08-01: `tests/e2e/live-smoke.spec.mjs` runs only after deploy and hard-codes Home copy. Run it locally before pushing any Home change: `npx playwright test --config playwright.e2e.config.mjs tests/e2e/live-smoke.spec.mjs`.
- 2026-08-01: Never ship UI copy that voices our own build concerns or reaches for a cute closer — "Nothing floats loose" (about orphan graph nodes), "the joint in the middle of the tree", "the rules are real". The visitor was not part of development; internal data problems, our model's metaphors, and rhetorical filler mean nothing to them. Write the plain fact the reader needs and stop. Re-read every string you author as a first-time visitor before shipping it.
- 2026-07-26: Measuring a gap and reporting it "honestly" is not the deliverable — closing it is. When data shows 53% of nodes unparented, do not propose shipping a reduced-scope honest version; find the derivation or the authoritative source that closes it. Reporting the limitation is the same trap the product exists to fix.
- 2026-07-19: Don't invent what you can acquire. Before writing any nontrivial algorithm or mechanism (layout solvers, parsers, schedulers), scan reputable open-source repos/TTPs for a maintained, license-compatible implementation — starting with dependencies already in the repo — and adapt it instead of hand-rolling.
- 2026-07-18: A visual browse that reports "polish confirmed" while screenshots show overlapping map cards, repeated "Open record" buttons, and padding gaps is a failed audit. Judge each screenshot as a designer would — overlaps, redundant controls, missing wayfinding — and report defects even when tests are green and the walkthrough "works".
<!-- BEGIN KIT FOOTER v1.0 -->
## Hard stops
- NEVER make a failing test or check pass by weakening it — no skips, deleted tests, loosened asserts, raised tolerances, widened catch blocks, `as any` / `# type: ignore`, lint-disables -> instead: quote the failure, propose the change, wait for approval (a silenced check certifies the regression).
- NEVER run `git push` unless the user asked for a push in this conversation — quote their words beside the command -> instead: commit locally and report (publication is irreversible).
- NEVER kill processes by image name (`taskkill /IM node.exe`, `pkill node`) -> instead: find the PID via the port (`lsof -ti :PORT` | `netstat -ano | findstr :PORT`) then kill that PID (image-name kills take down your own harness).
- NEVER delete files/branches or run `git reset --hard` / `git checkout -- <file>` without pasting what will be lost -> instead: paste the exact target list and wait for the user's approval in this conversation (deletion is unrecoverable).

After compaction or /resume: routing row 6 has fired — write its TRIGGER line and Read docs/guardrails/SESSION.md (S1 runs first). Docs read before compaction no longer count as read: `(cached)` is invalid until you Read the doc again.
<!-- END KIT FOOTER -->
