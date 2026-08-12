# Control Atlas Product Vision

- **Owner:** Product owner
- **Status:** Canonical
- **Last reviewed:** 2026-08-11
- **Supersession:** Owner-approved vision changes replace this document; historical wording remains in Git.

**Ctrl+Alt+Comply**

**Federal cybersecurity reference and practitioner workbench.**

Control Atlas brings the federal cybersecurity landscape together in one place—
requirements, frameworks, controls, mappings, official guidance, tools, and
practitioner resources—so you can see what applies, understand how it connects,
and get to the next step faster.

Control Atlas is a static, open-source, public-data-only reference workbench for
the broader federal and DoD cybersecurity ecosystem. Its primary user is the
newcomer — someone new to federal cyber compliance who does not yet know how
frameworks relate to each other or to the work in front of them. It helps this
person, and the practitioners who join them (ISSOs, assessors, engineers,
program managers, and contractors), understand public controls, baselines,
STIGs, SRGs, CCIs, MITRE mappings, provenance, reciprocity, inheritance, and
reusable authorization patterns before they begin organization-specific work.

Control Atlas is not a GRC system, evidence processor, scan parser, compliance
scoring engine, package manager, eMASS replacement, or authorization decision
tool. It has no backend and collects no user, organization, or system data.

## The ambition

Control Atlas should be the federal-cybersecurity resource people recommend to
one another: the place to start when someone asks what a requirement means,
where it came from, how it connects to the rest of the work, or what public
material to read next. It earns that recommendation through useful coverage,
clear explanations, traceable relationships, and respect for the people doing
the work — not through a login wall, opaque scoring, or claims of authority it
does not possess.

It is built openly, from public material, for the practitioners and newcomers
who need it. The product should feel like durable shared infrastructure:
practical enough for someone wearing three hats, deep enough for an experienced
assessor, and honest enough that both can see the source and limits of every
answer.

## The cybersecurity tree theory

Federal cybersecurity is layered rather than incoherent. Authorities, people,
and organizations create requirements; those requirements pass through policy,
risk, and frameworks; they become controls and technical work; and that work is
assessed and reused. The chain is real, but it is scattered across publishers
and rarely shown end-to-end. **Showing the chain is the product.**

Control Atlas explains that ecosystem with one orienting tree and honest
relationship overlays:

1. **Context** frames the work: mission, systems, data, environment, and threats.
2. **Roots** establish why it exists: authorities, law, policy, standards, and source material.
3. **Cybersecurity** is the shared trunk: the field every area of the work belongs to.
4. **Nine areas** organize the work: Governance, Risk, Compliance, Architecture, Implementation, Assessment, Operations, Threats & Defense, and Knowledge.
5. **Publisher-native branches and requirements** retain each source's real structure — for example, NIST families and controls, CMMC domains and practices, or ATT&CK tactics and techniques.
6. **Junctions** connect related material: CCIs, crosswalks, mappings, and references.
7. **Implementation, assurance, and reusable work** connect a requirement to technical checks, publisher-specified assessment content, and public templates or patterns.

The tree provides orientation. The graph carries the many-to-many reality. A
publisher-declared parent-child relationship is never confused with a baseline
selection, a crosswalk, an implementation link, or Control Atlas's own
organizing layer. Those differences stay visible because they determine what a
user can safely infer.

## Success standard

Success means a user can navigate trustworthy public relationships, understand
the provenance behind every displayed mapping, find the next useful source or
action, and export blank/public-reference materials without submitting
operational data or confusing reference guidance with an official decision.
Over time, Control Atlas should become the public, people-first common resource
that federal cybersecurity practitioners point others to with confidence.

## Design principles

Control Atlas is built for **translation, not complexity** — reducing the
distance between complex security guidance and practical action. See
[`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) for the canonical product and
development principle.
