# SegmentedControl — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: EASY` overturned — `MatButtonToggleGroup` re-investigated and rejected

The stub's own `IMPLEMENTATION_NOTES.md` guessed `Category: EASY` with
`MatButtonToggleGroup`/`MatButtonToggle` as a strong conceptual match.
Re-investigated against the real compiled source
(`node_modules/@angular/material/fesm2022/button-toggle.mjs`) before
writing any code — it does not survive contact:

1. `MatButtonToggle` is `ViewEncapsulation.None` with a fixed template of
   its own (confirmed) — the same category of "Material owns the DOM"
   finding that sank `MatTabGroup`/`MatSelect` elsewhere in this adapter.
2. **The real, decisive blocker**: the reference's own `SegmentedControl`
   (confirmed by reading `SegmentedControl.tsx`/`.module.css` directly)
   renders a single animated `.indicator` element that slides and resizes
   to the active segment's bounding box — not independent per-button
   background colors. `MatButtonToggle`'s selection model has no shared
   DOM node representing "the current selection" that could slide between
   siblings; each toggle just owns its own checked-state background
   independently. No CSS override can conjure a sliding indicator element
   that doesn't exist in Material's template.

**Decision**: hand-built — `role="radiogroup"` of `role="radio"` buttons
plus one absolutely-positioned `.indicator` div, matching the reference's
real anatomy.

## The sliding indicator: `offsetLeft`/`offsetWidth` measurement, written as CSS custom properties

`updateIndicator()` reads the active segment's own `<button>`'s
`offsetLeft`/`offsetTop`/`offsetWidth`/`offsetHeight` (relative to `.root`,
which is `position: relative`) and writes them as
`--rec-segmented-control-indicator-{x,y,width,height}` custom properties
via `nativeElement.style.setProperty()` — imperative, not a template
binding, since it's driven by a manual DOM measurement rather than
component state. `segmented-control.component.css`'s `.indicator` rule
reads those properties for its `transform`/`width`/`height`, with a CSS
`transition` producing the slide animation. Recomputed on `value` change,
initial paint, and via a `ResizeObserver` on `.root` (catches `fullWidth`/
container-resize/responsive reflow, the same class of coverage
`ResizeObserver` gives `ModalScrollDividerDirective` elsewhere in this
adapter, applied to a different measurement).

## Dividers, not just `item-gap`: a real, token-confirmed finding

The reference's own `.module.css` comment notes Mantine adds `::before`
separators between adjacent controls. Confirmed directly against
`recursica_variables_scoped.css`: `item-gap` resolves to
`--recursica_brand_dimensions_general_none` (0) while `divider-size` is a
real `1px` — meaning the divider lines, not inter-item spacing, are the
actual visual separator in this design system's token values, not a
redundant hardcode layered on top of a real gap. The divider is hidden
adjacent to the active indicator (matching the reference's own visual
behavior where the sliding indicator overlaps and visually absorbs it).

## Keyboard model: real ARIA radiogroup, roving tabindex, arrow keys change selection immediately

A `role="radiogroup"` of real, independently focusable `role="radio"`
elements per the W3C APG pattern — only the checked (or, if none checked,
first enabled) segment is a `Tab` stop; arrow keys move both focus and
selection to the next/previous enabled segment immediately, matching real
native `<input type="radio">` group behavior (and what
`MatButtonToggleGroup`'s own single-selection mode would also have
provided — this is not a deviation from that baseline, just hand-rolled
instead of inherited).

## `data`: string shorthand or `{ value, label, icon, disabled }` — same shape as `Dropdown`'s

`segmented-control-item.ts`'s `normalizeSegmentedControlItem` mirrors
`normalizeDropdownOption` (`dropdown-option.ts`) exactly — `icon` is a
`TemplateRef` instead of a `ReactNode`.

## No `value`/`defaultValue`: defaults to the first enabled item

Confirmed by reading `SegmentedControl.stories.tsx` directly: all 5 golden
stories omit `value` entirely, yet the reference's own rendered output
always shows the first item selected (Mantine's `SegmentedControl`
auto-selects `data[0].value` when neither `value` nor `defaultValue` is
given) — reproduced in `ngOnInit`'s uncontrolled-value seeding.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass. All 5 golden-matching stories (Default,
FullWidth, Vertical, Disabled, WithIcons) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual sliding-indicator
animation, `offsetLeft`/`offsetWidth` measurement accuracy at real
viewport sizes, and arrow-key roving-tabindex behavior were reasoned from
the code, not click-verified.
