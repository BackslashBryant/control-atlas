<!-- BEGIN core-engineering-doctrine -->
# Core Engineering Doctrine (project reference)

This repository follows the Core Engineering Doctrine. Canonical, full text:
~/.engineering/core-engineering-doctrine.md

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
