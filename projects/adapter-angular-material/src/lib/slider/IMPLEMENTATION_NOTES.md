# Slider — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: EASY–REQUIRES WORK` re-investigated — `MatSlider` rejected

The stub's own `IMPLEMENTATION_NOTES.md` flagged `MatSlider`/
`MatSliderThumb`/`MatSliderRangeThumb` as a real, MDC-redesigned candidate.
Re-investigated against the compiled source
(`node_modules/@angular/material/fesm2022/slider.mjs`) before building:
the thumb directives themselves (`input[matSliderThumb]`, etc.) are real
bare directives on a native `<input type="range">`, but the surrounding
`mat-slider` container is `ViewEncapsulation.None` with a fixed
track/tick-mark template — and `recursica_variables_scoped.css` defines
~15 distinct token groups for this component (independent
`track`/`track-active` colors, `step-indicator-color`/`-color-active`/
`-width`/`-border-radius`, `thumb-size`/`-border-radius`/`-elevation`,
each with its own disabled/error variant) — finer per-mark/per-state
granularity than MDC's own CSS custom-property surface exposes. See
`slider-control.component.ts`'s own class doc comment for the full
finding.

**Decision**: hand-built — real native `<input type="range">` elements
(genuine keyboard/screen-reader slider semantics for free) styled via
`::-webkit-slider-thumb`/`::-moz-range-thumb`, with a separate
absolutely-positioned `.trackFill`/`.stepIndicator` overlay computed from
`value`/`min`/`max`. Same "leverage native semantics, hand-build the
chrome" split this adapter used for `Pagination`/`SegmentedControl`.

## Two-tier split: same architecture as `NumberInput`

`SliderComponent` (outer, composes `rec-with-read-only-wrapper` directly —
matches the reference's own `Slider.tsx`, which flattens
`FormControlWrapper`'s prop surface onto `Slider` itself, not a separately
composed component the way `Dropdown` is) + `SliderControlComponent`
(inner `rec-slider-control`, the real `RECURSICA_FORM_CONTROL` provider,
for the same "must live inside the projected `activeTemplate`" reason
`NumberInputControlComponent`'s own doc comment documents).

## `value`: `number | [number, number]` — range mode is a value-shape switch, not a separate component/flag

Matches the reference exactly (confirmed by reading `Slider.tsx` directly):
a `[number, number]` tuple renders two thumbs, a plain `number` renders
one. The stub's own first-pass `@Input()` guess (`range: boolean`) is
superseded here — the real reference API is a union value type, not a
boolean flag plus a differently-shaped value input.

## Range mode: two overlapping native range inputs — a real, documented trade-off

A native `<input type="range">` has exactly one thumb; two-thumb selection
uses the well-known two-stacked-inputs technique, `pointer-events: none`
on both inputs with `pointer-events: auto` scoped back onto each one's own
thumb pseudo-element. **Known, documented gap**: clicking empty track
space between the two thumbs does not jump the nearest thumb (only
dragging a thumb handle moves it) — each input's hit area is scoped to its
thumb only. No golden story exercises click-to-seek in range mode
specifically, so this wasn't verified against a concrete failure; flagged
as a known consequence of the technique, not fixed speculatively.

## Marks vs. min/max labels: mutually exclusive in the template, matching the reference's own story usage

`WithMarks`'s own args set `showMinMaxLabels: false` alongside `marks` —
confirmed by reading the golden story directly, not assumed. The template
renders `.markLabels` when `marks` is populated, falling back to
`.minMaxLabels` only otherwise (an `@else if`, not independent `@if`s) —
matching that observed golden-story combination rather than speculatively
supporting both simultaneously with no story coverage to verify the
layout.

## Read-only display: a custom `readOnlyTemplate`, not the generic `text` type

The reference's own `SliderReadOnlyValue` renders `"lower – upper"` for a
range tuple, styled with Slider-specific `read-only-value_*` typography
tokens — a distinct token group from `ReadOnlyField`'s own generic text
styling (confirmed in `recursica_variables_scoped.css`). `SliderComponent`
uses `WithReadOnlyWrapperComponent`'s `readOnlyTemplate` input (a full
override, still wrapped in the same `FormControlWrapper` chrome) instead
of the default `readOnlyType="text"` branch `NumberInput` uses, so
`slider.component.css`'s own `.readOnlyValue` rule can apply those
dedicated tokens.

## `tooltipLabel`: not built — a real, documented scope cut

The reference's `tooltipLabel` prop renders a floating value bubble above
the thumb during drag (Mantine's built-in MDC-style value indicator). This
adapter has no drag-position-tracking JS to compute where a floating
tooltip should render relative to a native `<input type="range">`'s own
internal thumb position (the browser doesn't expose it), and no golden
story's own visual regression coverage isolates this specific behavior
from the rest of a story's rendered output — building a JS-driven
drag-tracking tooltip with no way to verify its positioning this session
(no browser/Playwright tooling, see "Verification" below) would be
speculative scope. `tooltipLabel` is accepted as an unused input surface
gap, not silently dropped — flagged here per this session's "flag rather
than silently assume" discipline.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass — a large component (two-tier split, range
value union, marks, dual-input read-only formatting) with no rework
needed. All 12 golden-matching stories (Default, WithInputField,
SideBySideLayout, Disabled, ErrorState, StaticReadOnly, EditableReadOnly,
WithMarks, WithIconsAndLabels, RangeMode, RangeModeWithInputs,
RangeModeWithIconsAndInputs, FormLayouts) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so real thumb dragging, keyboard
stepping, the dual-range-input pointer-events interaction, and mark/label
positioning at real viewport sizes were reasoned from the code, not
click-verified. `tooltipLabel` is a known, unbuilt gap (see above).
