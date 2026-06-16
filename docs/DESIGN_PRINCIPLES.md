# Control Atlas Design Principles

## Build for translation, not documentation

Every feature should reduce the distance between complex security guidance and practical action. The product should turn frameworks, controls, mappings, STIGs, MITRE techniques, Zero Trust concepts, and RMF artifacts into a **shared plain-language model** that small teams can understand, trust, and use.

## What this means in practice

1. **Use plain operational language first, formal source language second.** Lead with what to do; cite official IDs and framework terms on drill-down.
2. **Show how things connect, not just that they exist.** Surfaces should emphasize relationships (Library → Sources → Crosswalks), not isolated feature lists.
3. **Make every crosswalk traceable back to authoritative sources.** Point users to Sources and provenance; never imply magic linkage.
4. **Treat mappings as decision support, not magic automation.** Disclaimers stay visible; no compliant / not compliant framing.
5. **Help users move from "What does this mean?" to "What do I need to do next?"** Every major surface should suggest a concrete next step.
6. **Design for small teams without assuming dedicated compliance staff.** Progressive disclosure, short first screens, no jargon walls on entry.
7. **Preserve rigor without making the user speak in framework jargon.** Approachable entry points; depth behind search and detail views.

## Feature and copy review checklist

Before shipping UI copy or a new surface, confirm:

- Does it lead with plain operational language?
- Does it show connection, not just existence?
- Can the user trace back to an authoritative source?
- Does it suggest a next action?
- Would a small team without a dedicated compliance officer understand the first screen?

## Related docs

- Product vision: [`vision.md`](vision.md)
- Requirements: [`PRD.md`](PRD.md)
- Agent handoff: [`context.md`](context.md)
