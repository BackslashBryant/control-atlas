# Penpot plugin manifest

## Connection and import

- Penpot MCP: configured and verified; read/write operations succeeded.
- File: `3be9e5e1-190f-8090-8008-6dde29eb7086`
- Page: `Control Atlas correction pass`
- Imported: Control Atlas design tokens and existing visual language from the repository.
- Reusable library lookup: no connected reusable component library was exposed, so the wireframes reuse imported tokens and browser-derived component dimensions.
- Final Atlas design board: `e3981b0a-a691-8015-8008-6e05ace78bd2` (`09 Atlas authority tree + semantic zoom - v3`). Earlier radial/canopy studies remain in the file as rejected iteration evidence and were not treated as implementation approval.

## Plugin review

| Plugin | Publisher / source | Permissions | Maintenance / license | Decision | Reason |
|---|---|---|---|---|---|
| Contrast | Official Penpot plugin; manifest `https://contrast.plugins.penpot.app/assets/manifest.json`; source in the Penpot project | `content:read` | Officially maintained; MPL-2.0 source | Not installed - authentication boundary | Installation redirected to Penpot sign-in in the available browser session. No credential was available and the product work did not depend on bypassing that boundary. Contrast was verified in the browser implementation with automated accessibility/computed-style checks instead. |

No decorative, paid, unmaintained, or unrelated plugins were installed. No plugin received write or network permissions.
