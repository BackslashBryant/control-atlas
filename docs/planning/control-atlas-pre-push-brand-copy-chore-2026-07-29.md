# Control Atlas pre-push brand and voice chore

Status: active blocking gate
Command: `npm run prepush:audit`

The rotating `Ctrl + Alt + word` flourish is a protected brand element. It must not be removed, hidden as a workaround, or replaced with a static generic tagline.

Before a push, the release owner must review the current rotation and expand it when the product has gained a real supported action. Every word must:

- name something people can actually do in Control Atlas;
- resolve to Search, Explore, Catalog, Compare, Learn, Build, or Sources;
- avoid selecting or implying applicability, a baseline, compliance, inheritance, authorization, or an ATO outcome;
- avoid self-awarded claims such as “simplify,” “clarify,” or “demystify”;
- remain secondary to the page's actual task;
- keep reduced-motion behavior and accessible text boundaries intact.

The V1 release review expanded the protected deterministic cycle to:

`Trace`, `Find`, `Search`, `Browse`, `Read`, `Explore`, `Map`, `Compare`,
`Connect`, `Relate`, `Filter`, `Inspect`, `Crosswalk`, `Verify`, `Cite`,
`Source`, `Build`, `Create`, `Preview`, `Download`, `Export`, `Document`,
`Reconcile`, `Navigate`, `Learn`, `Share`, and `Recover`.

`Verify` means checking source identity. `Share` means copying durable URL
state. `Recover` means reaching a useful canonical destination from invalid,
stale, empty, or failed state. None of those words claims a product decision.

The same audit covers product-authored copy and disclaimers. Copy should sound like people doing the work together: direct, specific, and human. It should state boundaries where they matter without lecturing, pretending friendliness, or repeating institutional disclaimer language across every surface.

The automated gate checks the protected word corpus, feature-to-word mappings, copy-speaker ownership, prohibited determinations, product identity, disclaimers, browser contracts, and Vale style rules. Automation cannot approve tone by itself. The release record must name the editorial reviewer or record an explicit owner waiver without calling the gate passed.
