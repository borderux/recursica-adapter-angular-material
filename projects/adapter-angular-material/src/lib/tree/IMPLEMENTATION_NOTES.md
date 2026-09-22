# Tree — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: REQUIRES WORK` re-investigated — the stub's checkbox-selection guess didn't match the real reference

The stub's own `IMPLEMENTATION_NOTES.md` flagged `MatTree`/`@angular/cdk/tree`
as the candidate, with a guess that real work would include "checkbox-
selection semantics (no built-in tri-state-checkbox tree node)".
Re-investigated by reading `Tree.tsx` directly before building — that
guess doesn't match the real reference at all: there is no checkbox
selection anywhere in it. Selection is plain row-click (or `Enter`/
`Space`), completely independent of expand/collapse (a separate chevron
button) — the same category of "verify the real reference before trusting
a pre-implementation guess" correction `Table`'s own notes document for a
different, larger mismatch earlier this session.

## `@angular/cdk/tree` investigated and not adopted — genuinely headless, but no capability gap it would close

`cdk-tree`/`[cdkTreeNodeDef]`/`[cdkTreeNodePadding]`/`[cdkTreeNodeToggle]`
are real, bare structural directives with no fixed visual template
(confirmed in the compiled source) — architecturally the same "real,
adoptable low-level primitive" category `CdkConnectedOverlay` already
falls into elsewhere in this adapter, not a `MatTabGroup`/`MatSelect`-style
rejection on structural-incompatibility grounds. Not adopted anyway: the
reference's own `renderNode` callback already controls 100% of each row's
visual DOM directly, and `CdkTree`'s own flattener/`LevelAccessor`
configuration surface adds real indirection for no capability this
adapter's much simpler recursive-component approach doesn't already cover.

**Decision**: hand-built — `TreeComponent` owns expanded/selected state
(provided to every node via `TREE_CONTEXT`, the same DI-context pattern
`STEPPER_CONTEXT`/`TIMELINE_CONTEXT` already establish), and
`TreeNodeComponent` renders itself recursively for `node.children`.

## `role="treeitem"` lives in `host: {}` — a live-caught repeat of `Table`'s own wrapper-element finding

A first draft put `<li role="treeitem">` _inside_ `TreeNodeComponent`'s own
template, with `rec-tree-node` as a plain wrapping custom element around
it. Caught and fixed before building (not discovered via a failing
build): that breaks the real ARIA parent-child relationship the WAI-ARIA
tree pattern depends on — the accessibility tree's "tree owns treeitem"
nesting is derived from the DOM ancestor chain of elements actually
carrying `role="tree"`/`role="treeitem"`/`role="group"`, and a
non-role-bearing wrapper element breaks that chain. Same root-cause
category as `table.component.ts`'s own "`rec-table-tr` can't wrap a real
`<tr>`" finding (there, a CSS `display`-layout problem; here, an ARIA
ownership problem — different mechanism, same "a wrapper element breaks
browser-computed structure" lesson, applied proactively this time instead
of discovered via a failing lint/build pass). Fixed identically: no
wrapper — `role`/`tabindex`/`[attr.data-value]`/`[attr.aria-expanded]`/
`[attr.aria-selected]`/`[style.--tree-level]`/`(click)`/`(keydown)` all
live in `TreeNodeComponent`'s own `host: {}` metadata, so `<ul>`'s real
children are `rec-tree-node` elements directly carrying `role="treeitem"`
themselves.

## `:host`, not a plain `.node` class selector, in `tree-node.component.css`

A related, also-caught-before-building finding: under
`ViewEncapsulation.Emulated`, a component's own stylesheet can only reach
its _host_ element via `:host`/`:host()`/`:host-context()` — a plain class
selector compiles with the component's own `_ngcontent-*` content
attribute appended, which the host element itself never carries (it
carries `_nghost-*` instead), even though `host: { class: 'node' }` does
put a literal `node` class on it. Every host-level rule in
`tree-node.component.css` uses `:host`/`:host(:focus-visible)` accordingly
— the same category of finding `table-td.component.css`'s own
`:host(:not(:first-child))` rule already establishes elsewhere in this
adapter.

## `initialExpandedValues`/`initialSelectedValues`: uncontrolled-only, matching the reference exactly

Confirmed by reading `Tree.tsx` directly: Mantine's own `useTree()` has no
controlled `expandedValues`/`selectedValues` prop pair — only an _initial_
seed plus `onNodeExpand`/`onNodeCollapse`/`onSelectedChange` callbacks, all
state lives inside the hook. This component reproduces that shape exactly
rather than inventing a controlled variant with no reference precedent.

## Known, documented gap: no full WAI-ARIA roving-tabindex tree navigation

The reference relies on Mantine's own internal `TreeNode` keyboard
handling for the full WAI-ARIA treeitem pattern (up/down arrow moves focus
across the entire flattened _visible_ tree, not just within one node's own
children). Reproducing that faithfully requires tracking flattened
visible-node order and a single shared roving `tabindex` across every
node — real, substantial keyboard-management work with no golden-story
screenshot that would visually distinguish it from a simpler
per-node-focusable approach. This component gives every node its own
`tabindex="0"` and handles `Enter`/`Space` (select) and `ArrowLeft`/
`ArrowRight` (collapse/expand) locally per node — real, working keyboard
interaction, just not the single-tab-stop roving-focus pattern the
reference inherits from Mantine.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass — the wrapper-element and `:host`-selector
findings above were caught and fixed _before_ the first build attempt
(applying the `Table` lesson proactively), not discovered via a failing
pass. All 6 golden-matching stories (Default, AllExpanded, PreSelected,
MultipleSelection, Disabled, LayerOne) confirmed registered and compiling
with zero webpack errors in a live Storybook dev server (port 6007,
isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual expand/collapse
animation, click/keyboard selection flow, and real screen-reader
announcement of the `role="tree"`/`"treeitem"`/`"group"` structure were
reasoned from the code and ARIA spec behavior, not click- or
screen-reader-verified. The roving-tabindex gap above is a known,
unbuilt simplification, not an oversight.
