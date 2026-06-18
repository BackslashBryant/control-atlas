# Control Atlas Design Principles

## Build for translation, not complexity

Every project should reduce the distance between a messy real-world problem and clear user action. The system should organize complexity into plain language, visible relationships, practical workflows, and trustworthy outputs that help users understand what matters, why it matters, and what to do next.

**Tighter version:** Build for translation, not complexity — turn messy domains, fragmented information, and expert-only language into clear, connected, trustworthy systems that help users understand the problem, make decisions, and act with confidence.

For Control Atlas, that means turning frameworks, controls, mappings, STIGs, MITRE techniques, Zero Trust concepts, and RMF artifacts into a **shared plain-language model** that small teams can understand, trust, and use.

## Operating rules for AI agents

1. **Plain language first.** Use domain terms only when they add precision.
2. **Show the connection.** Do not present isolated facts, features, tasks, or artifacts without explaining how they relate.
3. **Make action obvious.** The user should not have to perform the final synthesis.
4. **Preserve rigor.** Simplifying something must not make it less accurate, traceable, or defensible.
5. **Design for constrained teams.** Assume limited time, limited staffing, imperfect data, and competing priorities.
6. **Separate source truth from interpretation.** Make clear what is known, what is inferred, and what is recommended.
7. **Prefer usable systems over impressive systems.** A smaller workflow that people actually trust and use is better than a powerful one they avoid.
8. **Every output should answer:** What is this? Why does it matter? What should I do with it?

## What this means in practice (Control Atlas)

1. **Use plain operational language first, formal source language second.** Lead with what to do; cite official IDs and framework terms on drill-down.
2. **Show how things connect, not just that they exist.** Surfaces should emphasize relationships (Library → Sources → Crosswalks), not isolated feature lists.
3. **Make every crosswalk traceable back to authoritative sources.** Point users to Sources and provenance; never imply magic linkage.
4. **Treat mappings as decision support, not magic automation.** Disclaimers stay visible; no compliant / not compliant framing.
5. **Help users move from "What does this mean?" to "What do I need to do next?"** Every major surface should suggest a concrete next step.
6. **Design for small teams without assuming dedicated compliance staff.** Progressive disclosure, short first screens, no jargon walls on entry.
7. **Preserve rigor without making the user speak in framework jargon.** Approachable entry points; depth behind search and detail views.
8. **No raw identifiers in user-facing copy.** Every `source_id`, `canonical_id`, or schema enum in a label, filter, or button must resolve through a `display_name`.

## Feature and copy review checklist

Before shipping UI copy or a new surface, confirm:

- Does it lead with plain operational language (rule 1)?
- Does it show connection, not just existence (rule 2)?
- Does it suggest a concrete next action (rule 3)?
- Is it still accurate, traceable, and defensible (rule 4)?
- Would a constrained team understand the first screen (rule 5)?
- Is source truth separated from interpretation (rule 6)?
- Is this the simplest workflow people will actually use (rule 7)?
- Does it answer: What is this? Why does it matter? What should I do with it (rule 8)?
- Can the user trace back to an authoritative source?

## Related docs

- Product vision: [`vision.md`](vision.md)
- Requirements: [`PRD.md`](PRD.md)
- Agent handoff: [`context.md`](context.md)
