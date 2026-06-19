## Pull Request Details

### UI Surface & Copy Identification
- **Which UI surface does this change affect?** (e.g., Start Here, Library, Detail Page, Compare, Patterns, Templates, Sources)
- **Provide a summary of any new user-facing copy introduced:**

---

## Copy QA Checklist
Please verify the following guidelines before merging:

- [ ] **No Repetition**: Does this copy avoid repeating something already explained elsewhere?
- [ ] **Conciseness**: Can these sentences be written shorter or more directly?
- [ ] **Terminology**: Is every technical term defined in the glossary (`src/app/glossary-data.mjs`) or otherwise explained where the user needs it?
- [ ] **No Developer Jargon**: Does the copy avoid backend/implementation terms (e.g. `API`, `manifest`, `JSON`, `shard`)?
- [ ] **Visual Hierarchy**: Should this copy be moved to a tooltip or expandable help text instead of being body copy?
- [ ] **Next Steps**: Does the user know exactly what action to take next based on this copy?
- [ ] **Copy Reuse**: If using standard terms/status labels, are they imported from `app/content/` instead of hardcoded?

## Translation-First Review

- [ ] This change reduces user confusion or improves a clear user action.
- [ ] Default UI does not expose raw schema, enum, registry, or graph terms.
- [ ] Technical details are available only when useful and disclosed progressively.
- [ ] Page or component copy answers what this is, why it matters, and what to do next.
- [ ] Navigation, labels, and actions use consistent language.
- [ ] No novice/expert mode or split-personality UX was introduced.
- [ ] Accessibility and keyboard behavior were checked.
