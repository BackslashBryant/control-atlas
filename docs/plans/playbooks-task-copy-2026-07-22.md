# Playbooks task-copy rewrite — 2026-07-22

## Outcome

Rewrite the Playbooks surface so a practitioner can recognize their situation,
understand the decision in front of them, and open a relevant record or starter
document without translating product language.

## Copy contract

- Card summaries describe the decision or outcome, not the feature.
- Avoid abstract lead verbs such as `understand`, `leverage`, `utilize`,
  `establish`, `centralize`, and `facilitate`.
- Keep necessary domain terms, but explain them in ordinary language on first use.
- Detail headers use the selected playbook's outcome; they do not repeat a generic
  description of the Playbooks feature.
- `Use this when` describes an observable situation the reader can recognize.
- `What to do` contains direct, specific actions.
- `What to avoid` names realistic mistakes and their consequence where useful.
- Buttons name the destination or object they open.
- Template IDs never appear as human-facing labels.
- Empty search results say what happened and offer a recovery action.
- Source boundaries remain explicit; advisory guidance must not imply an
  authorization or compliance decision.

## Acceptance criteria

- All 15 playbook cards use concrete, task-focused summaries.
- The selected-playbook page does not contain the generic sentence beginning
  `Use task-focused guidance`.
- The selected-playbook summary appears once, in the page header.
- Every selected playbook shows `Use this when`, `What to do`, `How it works`,
  and `What to avoid` sections.
- Related starter documents use registry-aligned display names.
- The primary next action names the specific control it opens.
- A zero-result state includes a `Clear filters` action.
- Copy contracts reject the known abstract phrases that caused this rewrite.

## Evidence basis

- GOV.UK content guidance: user needs must be based on actions or tasks and
  warns against `understand`, `know`, `be aware of`, and solution-led `using`.
- GOV.UK clear-language guidance: use specific, active, familiar language even
  for specialist audiences.
- Control Atlas `docs/DESIGN_PRINCIPLES.md`: plain language first, make action
  obvious, and answer what this is, why it matters, and what to do next.
