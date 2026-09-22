# Breadcrumb — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — the stub's own suggestion is what got built

The stub's own `IMPLEMENTATION_NOTES.md` confirmed `Category: DOES NOT
EXIST` and suggested "plain `<nav><ol>` + CDK a11y" — re-confirmed at
build time (no `mat-breadcrumb`, no CDK primitive), and that's exactly
what this component uses: a real `<nav aria-label="Breadcrumb">` +
`<ol>`/`<li>` list, the standard WAI-ARIA breadcrumb pattern. A real,
deliberate improvement over the reference's own DOM (confirmed: Mantine's
`Breadcrumbs` renders a flat `<div>` of children with no list semantics at
all) — free to add since nothing else forced a flatter structure.

## Declarative `items`, not arbitrary projected children — a structural improvement, not a gap

The reference accepts arbitrary children and neutralizes the _last_ one at
runtime via `markCurrentPageItem` (`React.cloneElement()`-based: strips
`href`/`onClick`, sets `aria-current="page"`) — a best-effort safety net
that can't stop a custom `Link` component navigating from its own internal
handler (confirmed by reading the reference's own doc comment, and its
`LastItemAsLink` story exists specifically to demonstrate this limitation).
Angular has no `cloneElement()` equivalent.

This component sidesteps the problem instead: `items:
RecursicaBreadcrumbItem[]` (`{ label: string; href?: string }`) is rendered
by this component itself, so the last item is non-interactive **by
construction** — the template never emits an `<a>` for the last index,
regardless of whether `href` is set on it. This is a structural guarantee
stronger than the reference's own runtime patch, not a workaround. The
reference's `LastItemAsLink` story has no equivalent here for exactly that
reason: it demonstrates a failure mode this API shape doesn't allow in the
first place.

## No `rec-link` component exists yet to compose

The reference's non-last crumbs render its real `Link` component
(confirmed: `Breadcrumb.stories.tsx` wraps each one in `<Link href="#">`).
This adapter has no `Link` component built at all yet — confirmed absent
from `llms.txt`'s own component list entirely, unlike every other
component surveyed so far. Rather than block on building a full standalone
`Link` component (real scope creep beyond this task), the `link` token
family is applied directly to this component's own `.link`/`.current`
elements. Building `Link` itself is a real, separate follow-up — flagging
it here rather than silently working around the gap.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. Both golden-matching stories (Default,
CustomSeparator) confirmed registered and compiling with zero webpack
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance) — including the inline `[items]="[{...}]"`
array-literal template syntax, which risked the same double-quote/
attribute-termination bug `dropdown.stories.ts` documents for its own rich
options (avoided here the same way: single-quoted string values nested
inside the double-quoted `[items]="..."` attribute).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the rendered separator spacing
and link/current-item token styling were reasoned from the code, not
visually verified.
