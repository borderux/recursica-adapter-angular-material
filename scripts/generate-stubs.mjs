#!/usr/bin/env node
/**
 * One-shot generator for `docs/CREATING_AN_ADAPTER.md` step 9 ("stub every
 * component first"), adapted for this Angular library.
 *
 * Generates, for every component in `docs/ADAPTER_INTEGRATION_REPORT.md`
 * §9's build order (excluding `Layer`/`RecursicaThemeProvider` — those need
 * real implementations, not stubs, per Crosscutting Finding A):
 *   - <kebab>.component.ts   (real standalone Angular component, stub body)
 *   - <kebab>.component.css  (empty, header comment only)
 *   - <kebab>.stories.ts     (CSF3 for @storybook/angular)
 *   - IMPLEMENTATION_NOTES.md (seeded from the integration report)
 *
 * Then (re)writes `src/lib/index.ts`, the barrel every stub is exported
 * from, and `src/public-api.ts`, which re-exports it.
 *
 * Throwaway-but-kept: rerunning this script regenerates every stub folder
 * from scratch (it does not touch folders outside `COMPONENTS`, so a real
 * implementation replacing a stub later is safe as long as it's removed
 * from this file's `COMPONENTS` array first).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIB_ROOT = join(
  __dirname,
  "..",
  "projects",
  "adapter-angular-material",
  "src",
  "lib",
);

/**
 * Report-seeded metadata for every component this pass stubs. `category`/
 * `equivalent`/`notes` are pulled from `docs/ADAPTER_INTEGRATION_REPORT.md`
 * §9's mapping table (or, for the components with no row of their own —
 * TextField/TextArea/ReadOnlyField/Label/AssistiveElement/
 * FormControlWrapper/FormControlLayout/Text/Heading/Flex/Stack/Group/Grid —
 * from its "Additional notable findings" section and Q5/Q6/Q7/Q8 answers).
 * `inputs` is a first-pass, non-exhaustive `@Input()` surface guessed from
 * those same notes — see each component's own IMPLEMENTATION_NOTES.md for
 * the explicit caveat that this is not step 10's real prop audit.
 */
const COMPONENTS = [
  {
    name: "Button",
    category: "EASY",
    equivalent: "`matButton` directive (`button.d.ts`)",
    notes:
      "Direct match: `appearance` (`text/filled/elevated/outlined/tonal`), `disabled`, `disableRipple`, `disabledInteractive`. Attribute-directive pattern (Crosscutting Finding C) — Recursica's wrapper renders a real `<button matButton>` internally. `color` input confirmed no-op under M3 theming — filter it anyway.",
    inputs: [
      { name: "appearance", type: "'text' | 'filled' | 'elevated' | 'outlined' | 'tonal'" },
      { name: "disabled", type: "boolean" },
      { name: "disableRipple", type: "boolean" },
      { name: "disabledInteractive", type: "boolean" },
    ],
  },
  {
    name: "Loader",
    category: "EASY",
    equivalent: "`MatProgressSpinner`/`MatSpinner` (`progress-spinner.d.ts`)",
    notes:
      "`mode` (`determinate/indeterminate`), `value`, `diameter`, `strokeWidth` — direct conceptual match to Mantine's Loader.",
    inputs: [
      { name: "mode", type: "'determinate' | 'indeterminate'" },
      { name: "value", type: "number" },
      { name: "diameter", type: "number" },
      { name: "strokeWidth", type: "number" },
    ],
  },
  {
    name: "Tooltip",
    category: "EASY",
    equivalent: "`MatTooltip` (`tooltip.d.ts`)",
    notes:
      "`position`, `showDelay`/`hideDelay`, `disabled`, `touchGestures` — built on CDK Overlay, full-featured.",
    inputs: [
      { name: "position", type: "string" },
      { name: "showDelay", type: "number" },
      { name: "hideDelay", type: "number" },
      { name: "disabled", type: "boolean" },
    ],
  },
  {
    name: "Menu",
    category: "EASY",
    equivalent: "`MatMenu`/`MatMenuTrigger`/`MatMenuItem` (`menu.d.ts`)",
    notes:
      "Direct, mature match: trigger directive + panel template + items, built on CDK Overlay.",
    inputs: [
      { name: "xPosition", type: "'before' | 'after'" },
      { name: "yPosition", type: "'above' | 'below'" },
      { name: "disabled", type: "boolean" },
    ],
  },
  {
    name: "Card",
    category: "EASY",
    equivalent:
      "`MatCard` (+ `.Header`/`.Title`/`.Subtitle`/`.Content`/`.Actions`/`.Footer`, `MatCardTitleGroup`) (`card.d.ts`)",
    notes:
      "Real compound match: `appearance` (`outlined`/`raised`), sub-components for header/title/content/actions/footer/avatar slotting. Notes flag building this should resolve two known `Grid` `adapter-tester` failures as a side effect (per the decisions log) — worth checking once `Grid` is real too.",
    inputs: [{ name: "appearance", type: "'outlined' | 'raised'" }],
  },
  {
    name: "Tabs",
    category: "EASY",
    equivalent: "`MatTabGroup`/`MatTab` (`tabs.d.ts`)",
    notes:
      "Direct match: `animationDuration`, dynamic tab content via `MatTabContent`, `(selectedTabChange)`.",
    inputs: [{ name: "animationDuration", type: "string" }],
  },
  {
    name: "Stepper",
    category: "EASY",
    equivalent: "`MatStepper` (`stepper.d.ts`)",
    notes:
      "Direct, rich match: `orientation` (horizontal/vertical via separate host elements `mat-horizontal-stepper`/`mat-vertical-stepper`), `labelPosition`, `headerPosition`, per-step completion/error state via `MatStep`.",
    inputs: [
      { name: "orientation", type: "'horizontal' | 'vertical'" },
      { name: "labelPosition", type: "'bottom' | 'end'" },
      { name: "headerPosition", type: "'top' | 'bottom'" },
    ],
  },
  {
    name: "Chip",
    category: "EASY",
    equivalent: "`MatChip`/`MatChipSet` (+ `MatChipRemove`) (`chips.d.ts`)",
    notes:
      "A standalone `MatChip` (not just `MatChipOption`/`MatChipRow`) exists and can sit in a plain `<mat-chip-set>` without selection semantics — dismissible via `MatChipRemove`. Minor compositional overhead (still needs a `mat-chip-set` wrapper even for one chip) but a strong match.",
    inputs: [
      { name: "disabled", type: "boolean" },
      { name: "removable", type: "boolean" },
    ],
  },
  {
    name: "Dropdown",
    category: "EASY",
    equivalent: "`MatSelect` (`select.d.ts`)",
    notes:
      "Mantine's `Dropdown` = Mantine's `Select` per mantine-adapter's own `Dropdown.tsx` (naming translation). `MatSelect` is a strong match: `multiple`, `disabled`, `placeholder`, `required`, `panelClass`, `compareWith`, works inside `<mat-form-field>`.",
    inputs: [
      { name: "multiple", type: "boolean" },
      { name: "disabled", type: "boolean" },
      { name: "placeholder", type: "string" },
      { name: "required", type: "boolean" },
    ],
  },
  {
    name: "SegmentedControl",
    category: "EASY",
    equivalent:
      "`MatButtonToggleGroup`/`MatButtonToggle` (`button-toggle.d.ts`)",
    notes:
      "Strong conceptual match: exclusive/multi-select button group, `appearance`, `disabled`, `value`/`(change)`. Not a literal naming match but functionally the closest thing Material has to a segmented control.",
    inputs: [
      { name: "appearance", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "multiple", type: "boolean" },
      { name: "value", type: "string" },
    ],
  },
  {
    name: "Slider",
    category: "EASY–REQUIRES WORK",
    equivalent:
      "`MatSlider`/`MatSliderThumb`/`MatSliderRangeThumb` (`slider.d.ts`, referenced from `core`)",
    notes:
      "Real, MDC-redesigned slider with single and dual-thumb (range) support — but Angular's version is thumb-directive-based (`<mat-slider><input matSliderThumb></mat-slider>`) rather than a single all-in-one component, some composition needed.",
    inputs: [
      { name: "min", type: "number" },
      { name: "max", type: "number" },
      { name: "step", type: "number" },
      { name: "disabled", type: "boolean" },
      { name: "range", type: "boolean" },
    ],
  },
  {
    name: "TextField",
    category: "EASY–REQUIRES WORK",
    equivalent: "`matInput` directive + `MatFormField` (`form-field.d.ts`, `input.d.ts`)",
    notes:
      "From the report's additional findings: `TextField` ≈ `matInput` + `MatFormField` (same composition tax as AutoComplete). `MatFormField` gives `appearance` (`fill`/`outline`), `floatLabel`, `subscriptSizing`, and content-projected `<mat-label>`/`<mat-hint>`/`<mat-error>` slots (Q7). Real form controls implement `ControlValueAccessor`/`Validator` and are meant to be driven by `ReactiveFormsModule` (Crosscutting Finding D) — a real per-component design decision for step 10, not resolved here.",
    inputs: [
      { name: "label", type: "string" },
      { name: "placeholder", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "required", type: "boolean" },
      { name: "error", type: "string" },
    ],
  },
  {
    name: "TextArea",
    category: "EASY–REQUIRES WORK",
    equivalent: "`matInput` on a `<textarea>` + `MatFormField`, `cdkTextareaAutosize` (`@angular/cdk/text-field`)",
    notes:
      "Same composition tax as TextField, with `cdkTextareaAutosize` available for auto-growing height — a built-in Recursica's own `TextArea` can lean on (per the report's additional findings).",
    inputs: [
      { name: "label", type: "string" },
      { name: "placeholder", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "autosize", type: "boolean" },
    ],
  },
  {
    name: "AutoComplete",
    category: "EASY–REQUIRES WORK",
    equivalent:
      "`MatAutocomplete` (+ `MatAutocompleteTrigger`) (`autocomplete.d.ts`)",
    notes:
      "Real match, but Material's version is a directive (`matAutocomplete` trigger on an `<input matInput>`) plus a separate `<mat-autocomplete>` panel template — two pieces to compose rather than one drop-in component. Naming mismatch: `AutoComplete` (mantine-adapter) vs. `MatAutocomplete`.",
    inputs: [
      { name: "label", type: "string" },
      { name: "placeholder", type: "string" },
      { name: "disabled", type: "boolean" },
    ],
  },
  {
    name: "TimePicker",
    category: "EASY–REQUIRES WORK",
    equivalent:
      "`MatTimepicker`/`MatTimepickerInput`/`MatTimepickerToggle` (`timepicker/index.d.ts`)",
    notes:
      "Notable finding: Angular Material has a real `Timepicker` component (distinct from `Datepicker`), confirmed present at v20.2.14 — a better starting position than Beam had (Beam had nothing at all). Still needs real integration work (`matTimepicker` + `<mat-timepicker>` panel pairing, same composition shape as Autocomplete/Datepicker). Its inputs mix Signal-based (`InputSignal`/`InputSignalWithTransform`) and classic decorator styles — worth deciding deliberately for step 10.",
    inputs: [
      { name: "label", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "interval", type: "number" },
    ],
  },
  {
    name: "Modal",
    category: "EASY–REQUIRES WORK",
    equivalent:
      "`MatDialog` (service) + `MatDialogRef`/`MatDialogContent`/`MatDialogActions` (`dialog.d.ts`)",
    notes:
      "Strong compound match (`MatDialog.open()` service API + templated content/actions), but Angular's dialog is opened imperatively via a service, not rendered declaratively as `<Modal opened={...}>` the way Mantine's is — a real API-shape difference worth designing deliberately (a declarative `<rec-modal [(opened)]>` wrapper calling `MatDialog.open()`/`close()` internally is achievable, just not a direct prop-for-prop mapping).",
    inputs: [
      { name: "opened", type: "boolean" },
      { name: "title", type: "string" },
    ],
  },
  {
    name: "Checkbox",
    category: "REQUIRES WORK",
    equivalent: "`MatCheckbox` (`checkbox.d.ts`)",
    notes:
      "No `description`/`helperText`/`error` input at all (Q7) — Mantine's native `Checkbox` supports `description` directly, a real parity gap. Needs `FormControlWrapper`-style composition (Q8) for anything beyond a bare checkbox+label. Same gap pattern as Radio/Switch — the label is bare projected content (`ngProjectAs: "*"`), no description/error slot on the bare control.",
    inputs: [
      { name: "label", type: "string" },
      { name: "description", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "checked", type: "boolean" },
    ],
  },
  {
    name: "Radio",
    category: "REQUIRES WORK",
    equivalent: "`MatRadioButton`/`MatRadioGroup` (`radio.d.ts`)",
    notes:
      "Same gap pattern as Checkbox — no description/helperText/error slot on the bare control.",
    inputs: [
      { name: "label", type: "string" },
      { name: "description", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "value", type: "string" },
    ],
  },
  {
    name: "Switch",
    category: "REQUIRES WORK",
    equivalent: "`MatSlideToggle` (`slide-toggle.d.ts`)",
    notes:
      "Same gap pattern as Checkbox/Radio; `MatSlideToggle` adds `hideIcon`/`fullWidth` but still no label/description/error beyond projected content.",
    inputs: [
      { name: "label", type: "string" },
      { name: "description", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "checked", type: "boolean" },
    ],
  },
  {
    name: "Label",
    category: "REQUIRES WORK",
    equivalent: "`MatLabel` (`form-field.d.ts`)",
    notes:
      "`MatLabel` is real, but it's a directive meant to live inside `<mat-form-field>`'s content projection, not a freestanding component usable next to an arbitrary control the way Recursica's `Label` is used with e.g. `Checkbox`/`Radio`/`Switch` (which don't use `MatFormField` at all — Q8). Needs an independent, freestanding implementation.",
    inputs: [
      { name: "text", type: "string" },
      { name: "required", type: "boolean" },
    ],
  },
  {
    name: "AssistiveElement",
    category: "REQUIRES WORK",
    equivalent: "`MatHint`/`MatError` (`form-field.d.ts`)",
    notes:
      "`MatHint`/`MatError` are real, but each is a directive meant to live inside `<mat-form-field>`'s content projection, not a freestanding component. Can borrow `MatFormField`'s markup/CSS conventions for text-like fields, but needs an independent implementation to serve choice controls (Checkbox/Radio/Switch) too.",
    inputs: [
      { name: "text", type: "string" },
      { name: "variant", type: "'hint' | 'error'" },
    ],
  },
  {
    name: "FormControlWrapper",
    category: "REQUIRES WORK",
    equivalent: "_(none — build new, per Q8)_",
    notes:
      "Required per Q8, for two independent reasons: (1) side-by-side label layout is architecturally unavailable from `MatFormField` at all — it would need to be faked by placing the label outside `<mat-form-field>`, losing its automatic `<label for>`/`aria-describedby` wiring; a `FormControlWrapper` that owns layout and manually wires that association itself is the only way to get a consistent side-by-side option across every control type. (2) `MatFormField` only covers text-like controls — `MatCheckbox`/`MatRadioButton`/`MatSlideToggle` are never `MatFormFieldControl`s, so even a purely-stacked adapter still needs a hand-built label+description+error layout for choice controls.",
    inputs: [
      { name: "label", type: "string" },
      { name: "description", type: "string" },
      { name: "error", type: "string" },
      { name: "required", type: "boolean" },
    ],
  },
  {
    name: "FormControlLayout",
    category: "REQUIRES WORK",
    equivalent: "_(none — build new, per Q8)_",
    notes:
      "Recommendation from Q8: for text-like controls, keep using `<mat-form-field>` internally for the stacked case, and only bypass it for the side-by-side case; for choice controls, bypass `MatFormField` entirely in both layouts. `formLayout: 'stacked'|'side-by-side'` has never existed natively in any UI kit surveyed so far (Mantine included) — this is a recommendation for step 8/10 to finalize with a human, not a decision this report closes.",
    inputs: [{ name: "orientation", type: "'stacked' | 'side-by-side'" }],
  },
  {
    name: "ReadOnlyField",
    category: "REQUIRES WORK",
    equivalent: "_(none)_",
    notes:
      "No Material equivalent for 'swap the interactive control for a plain, non-interactive display of its value' as a distinct presentational mode — native `readonly`/`disabled` HTML attributes exist but don't produce Recursica's distinct read-only visual treatment. Matches what was almost certainly true for mantine-adapter's own build of it against Mantine too (not a Material-specific regression).",
    inputs: [
      { name: "label", type: "string" },
      { name: "value", type: "string" },
    ],
  },
  {
    name: "Text",
    category: "DOES NOT EXIST",
    equivalent: "_(none — Sass typography mixins only, not a component; see Q6)_",
    notes:
      "Material's typography system (`_typography.scss`'s `body-small`/`title-large`/etc. mixins) is 100% a build-time Sass authoring convenience for an app's own stylesheets, not a UI-kit component Recursica could wrap. There is no `<mat-text>` element, no `matText` directive, nothing importable at the TS/component level. `Text`/`Heading` need to be built as genuinely new Angular components from scratch, rendering a native element with Recursica's own `recursica_brand_typography_*` classes applied directly.",
    inputs: [
      { name: "variant", type: "string" },
      { name: "weight", type: "string" },
    ],
  },
  {
    name: "Heading",
    category: "DOES NOT EXIST",
    equivalent: "_(none — Sass typography mixins only, not a component; see Q6)_",
    notes:
      "Same conclusion as Text (Q6) — no component-level typography primitive exists in Material at all. Build `<rec-heading [order]>` rendering a native `<h1>`–`<h6>` with Recursica's own typography classes, from scratch.",
    inputs: [{ name: "order", type: "1 | 2 | 3 | 4 | 5 | 6" }],
  },
  {
    name: "Flex",
    category: "DOES NOT EXIST",
    equivalent: "_(none; see Q5)_",
    notes:
      "Confirmed absent from both `@angular/material` and `@angular/cdk` (Q5) — no export anywhere resembling a generic flex/grid layout wrapper. `@angular/cdk/layout` only offers `BreakpointObserver`/`MediaMatcher` (responsive breakpoint detection, no markup/CSS). `Flex`/`Stack`/`Group`/`Grid` all need to be built as light wrappers around plain CSS flexbox/grid, as real Angular components (nothing to wrap).",
    inputs: [
      { name: "gap", type: "string" },
      { name: "direction", type: "string" },
      { name: "wrap", type: "boolean" },
    ],
  },
  {
    name: "Stack",
    category: "DOES NOT EXIST",
    equivalent: "_(none; see Q5)_",
    notes:
      "Same conclusion as Flex (Q5) — build as a light wrapper around plain CSS flexbox (column direction), as a real Angular component.",
    inputs: [
      { name: "gap", type: "string" },
      { name: "align", type: "string" },
    ],
  },
  {
    name: "Group",
    category: "DOES NOT EXIST",
    equivalent: "_(none; see Q5)_",
    notes:
      "Same conclusion as Flex (Q5) — build as a light wrapper around plain CSS flexbox (row direction), as a real Angular component.",
    inputs: [
      { name: "gap", type: "string" },
      { name: "justify", type: "string" },
    ],
  },
  {
    name: "Grid",
    category: "DOES NOT EXIST",
    equivalent:
      "_(none — `MatGridList`/`MatGridTile` is a fixed-row-height image/tile masonry widget, a false-friend name match, not a general CSS Grid primitive; see Q5)_",
    notes:
      "Confirmed a false-friend: `MatGridList` is Material's historical photo-grid widget, not a general-purpose layout primitive. Build as a light wrapper around plain CSS Grid, as a real Angular component. `@angular/cdk/layout`'s `BreakpointObserver` is worth using internally if `Grid` grows responsive breakpoint props.",
    inputs: [
      { name: "columns", type: "number" },
      { name: "gap", type: "string" },
    ],
  },
  {
    name: "Popover",
    category: "REQUIRES WORK",
    equivalent: "_(none — build on `@angular/cdk/overlay`)_",
    notes:
      "No standalone `Popover` component ships, but the exact toolkit Material's own `Menu`/`Select`/`Autocomplete`/`Tooltip` are built on (`@angular/cdk/overlay`'s `Overlay`/`OverlayRef`/positioning strategies) is real, documented, and proven — real work but with a solid low-level API to build on, not starting from raw DOM.",
    inputs: [
      { name: "opened", type: "boolean" },
      { name: "position", type: "string" },
    ],
  },
  {
    name: "HoverCard",
    category: "REQUIRES WORK",
    equivalent:
      "_(none — build on `@angular/cdk/overlay` + hover trigger, akin to Popover)_",
    notes:
      "Same toolkit as Popover; no packaged hover-triggered variant exists, needs a manual `mouseenter`/`FocusMonitor`-driven open state on top of the same Overlay primitives.",
    inputs: [
      { name: "position", type: "string" },
      { name: "openDelay", type: "number" },
      { name: "closeDelay", type: "number" },
    ],
  },
  {
    name: "Pagination",
    category: "REQUIRES WORK",
    equivalent: "`MatPaginator` (`paginator.d.ts`)",
    notes:
      "Real mismatch, not a naming one: `MatPaginator` is purpose-built for a data-table (`length`/`pageSize`/`pageSizeOptions` + prev/next + an optional page-size `<mat-select>`), not a generic numbered-page-pill control the way Mantine's `Pagination` is. Likely needs a custom-built numbered control rather than wrapping `MatPaginator` directly.",
    inputs: [
      { name: "length", type: "number" },
      { name: "pageSize", type: "number" },
      { name: "pageSizeOptions", type: "number[]" },
    ],
  },
  {
    name: "Panel",
    category: "REQUIRES WORK",
    equivalent: "`MatSidenav`/`MatDrawer` (`sidenav.d.ts`)",
    notes:
      "`MatDrawer`'s `mode` (`over/push/side`) and `position` give real drawer/side-panel semantics, but it's designed to live inside a `MatSidenavContainer` shell — a heavier structural commitment than a single drop-in `Panel` component; real composition work, not a 1:1 wrap.",
    inputs: [
      { name: "mode", type: "'over' | 'push' | 'side'" },
      { name: "position", type: "'start' | 'end'" },
    ],
  },
  {
    name: "Table",
    category: "REQUIRES WORK",
    equivalent:
      "`MatTable`/`MatTableDataSource` (+ `MatSort`, `MatPaginator`) (`table.d.ts`, `sort.d.ts`)",
    notes:
      "A real, stable, actively-maintained table (unlike Beam's unstable `wip/DataTable`) — genuine strength relative to Beam. But it's a headless, directive-composition-heavy API (`*matColumnDef`, `*matHeaderCellDef`, `*matCellDef` structural directives assembled per-column) rather than a single `<Table data={...} columns={...}>` drop-in — real composition/glue work to expose a simpler Recursica-shaped API on top.",
    inputs: [
      { name: "columns", type: "string[]" },
      { name: "dataSource", type: "unknown[]" },
    ],
  },
  {
    name: "Tree",
    category: "REQUIRES WORK",
    equivalent:
      "`MatTree`/`MatTreeFlatDataSource`/`MatTreeNestedDataSource`/`MatTreeNodeToggle`/`MatTreeNodePadding` (`tree.d.ts`)",
    notes:
      "A real, CDK-backed (`@angular/cdk/tree`) recursive tree exists — genuinely better starting material than Beam had (no generic recursive Tree at all). Still needs real work to add checkbox-selection semantics (no built-in tri-state-checkbox tree node) and to shape its flat/nested data-source API into whatever Recursica's `Tree` contract expects.",
    inputs: [{ name: "dataSource", type: "unknown[]" }],
  },
  {
    name: "DatePicker",
    category: "REQUIRES WORK",
    equivalent:
      "`MatDatepicker`/`MatDatepickerInput`/`MatCalendar`/`MatDateRangePicker` (`datepicker.d.ts`)",
    notes:
      "The most capable starting point of any 'hard' component surveyed across any adapter so far — a real calendar popup, single and range selection, all built in. Still real integration work (needs a `DateAdapter` provider configured for locale/format handling, and Material's month/year-grid UI needs restyling to match Recursica tokens), but categorically easier than Beam's 'no calendar UI exists anywhere.'",
    inputs: [
      { name: "label", type: "string" },
      { name: "disabled", type: "boolean" },
      { name: "min", type: "Date" },
      { name: "max", type: "Date" },
    ],
  },
  {
    name: "Container",
    category: "DOES NOT EXIST",
    equivalent: "_(none — plain CSS)_",
    notes:
      "No centered-max-width-breakpoint primitive anywhere in Material or CDK, same as Beam's finding.",
    inputs: [{ name: "maxWidth", type: "string" }],
  },
  {
    name: "Breadcrumb",
    category: "DOES NOT EXIST",
    equivalent: "_(none)_",
    notes:
      "Not in the package at all, at any capability level — no `mat-breadcrumb`, no CDK primitive for it either. Build from plain `<nav><ol>` + CDK a11y for keyboard/ARIA conventions.",
    inputs: [{ name: "items", type: "string[]" }],
  },
  {
    name: "FileInput",
    category: "DOES NOT EXIST",
    equivalent: "_(none)_",
    notes:
      "No file-upload/file-input component anywhere in `@angular/material` or `@angular/cdk`. Native `<input type=\"file\">` + custom styling/behavior, same conclusion Beam reached for its own kit (Beam at least had `FileUpload`; Material has nothing).",
    inputs: [
      { name: "accept", type: "string" },
      { name: "multiple", type: "boolean" },
      { name: "disabled", type: "boolean" },
    ],
  },
  {
    name: "FileUpload",
    category: "DOES NOT EXIST",
    equivalent: "_(none)_",
    notes:
      "Same as FileInput — build fully from scratch (native file input + drag-drop via CDK's `DragDropModule` is at least available as a building block for drag-to-upload, though `@angular/cdk/drag-drop` is a general reorder/drag toolkit, not file-upload-specific).",
    inputs: [
      { name: "accept", type: "string" },
      { name: "multiple", type: "boolean" },
      { name: "disabled", type: "boolean" },
    ],
  },
  {
    name: "NumberInput",
    category: "DOES NOT EXIST",
    equivalent: "_(none)_",
    notes:
      "No numeric input component anywhere. `matInput` + `type=\"number\"` on a native `<input>` gets basic browser numeric input; Mantine's clamping/formatting/increment-decrement-button parity needs full custom building.",
    inputs: [
      { name: "min", type: "number" },
      { name: "max", type: "number" },
      { name: "step", type: "number" },
      { name: "disabled", type: "boolean" },
    ],
  },
  {
    name: "Timeline",
    category: "DOES NOT EXIST",
    equivalent: "_(none)_",
    notes:
      "No Timeline component or CDK primitive. Build from scratch (custom CSS connectors + `MatList`/plain markup), same as Beam's finding.",
    inputs: [{ name: "items", type: "unknown[]" }],
  },
  {
    name: "TransferList",
    category: "DOES NOT EXIST",
    equivalent:
      "_(none — compose from `MatSelectionList`/`MatListOption` + `MatButton` + `MatFormField` search)_",
    notes:
      "`MatSelectionList`/`MatListOption` (`list.d.ts`) give a genuine multi-select list building block, but there's no packaged dual-list transfer component — same from-scratch composition mantine-adapter's own `TransferList` already required against Mantine. Depends on Checkbox/TextField patterns being settled first.",
    inputs: [{ name: "data", type: "unknown[]" }],
  },
  {
    name: "Avatar",
    category: "DOES NOT EXIST",
    equivalent: "_(none)_",
    notes:
      "Confirmed: `MatListItemAvatar`/`MatGridAvatarCssMatStyler`/`[mat-card-avatar]` are CSS-class-application directives for slotting an avatar image inside List/Card/GridList headers — none of them provide the avatar visual itself (circular image, initials fallback, icon fallback). No standalone Avatar component anywhere in the package. Full custom build, a real regression vs. the genesis kit (Mantine has a native `Avatar`).",
    inputs: [
      { name: "src", type: "string" },
      { name: "alt", type: "string" },
      { name: "initials", type: "string" },
    ],
  },
  {
    name: "Badge",
    category: "DOES NOT EXIST",
    equivalent: "`MatBadge` (`badge.d.ts`)",
    notes:
      "`MatBadge` is an overlay directive (`[matBadge]=\"'4'\"` decorates a host element with a small corner dot/number, e.g. a notification count on an icon) — not a freestanding colored label/pill component the way Mantine's `Badge` is. There is no Material component for 'a standalone badge/tag element' at all; needs a full custom build.",
    inputs: [
      { name: "content", type: "string" },
      { name: "color", type: "string" },
    ],
  },
];

const kebabCase = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function componentFile(meta, kebab) {
  const inputLines = meta.inputs
    .map((i) => `  @Input() ${i.name}?: ${i.type};`)
    .join("\n");
  return `import { Component, Input, ViewEncapsulation } from "@angular/core";
import { InDevelopmentStubComponent } from "../in-development-stub/in-development-stub.component";

/**
 * Recursica \`${meta.name}\` — Angular Material adapter.
 *
 * STUB (docs/CREATING_AN_ADAPTER.md step 9): no real behavior is
 * implemented yet. Renders the shared \`<rec-in-development-stub>\`
 * placeholder. See IMPLEMENTATION_NOTES.md in this folder for the
 * integration-report findings this stub was seeded from.
 */
@Component({
  selector: "rec-${kebab}",
  imports: [InDevelopmentStubComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./${kebab}.component.css",
  template: \`<rec-in-development-stub componentName="${meta.name}" />\`,
})
export class ${meta.name}Component {
${inputLines}
}
`;
}

function cssFile() {
  return "/* Styling not yet implemented. */\n";
}

function storiesFile(meta, kebab) {
  return `import type { Meta, StoryObj } from "@storybook/angular";
import { ${meta.name}Component } from "./${kebab}.component";

/**
 * STUB story (docs/CREATING_AN_ADAPTER.md step 9). The "🚧 " title prefix
 * is what makes in-development components visually distinct in Storybook's
 * sidebar — remove it (and rename the title to "UI-Kit/${meta.name}") only
 * once this component is implemented for real, per step 9 item 7 / step 10
 * item 3.
 */
const meta: Meta<${meta.name}Component> = {
  title: "Components/🚧 ${meta.name}",
  component: ${meta.name}Component,
};
export default meta;

type Story = StoryObj<${meta.name}Component>;

export const Default: Story = {};
`;
}

function notesFile(meta) {
  const inputsList = meta.inputs
    .map((i) => `- \`${i.name}\`: \`${i.type}\``)
    .join("\n");
  return `# ${meta.name} — Implementation Notes (pre-implementation stub)

**Status**: stub (\`docs/CREATING_AN_ADAPTER.md\` step 9). No real behavior
is implemented — this component renders the shared
\`<rec-in-development-stub>\` placeholder and declares only a first-pass
\`@Input()\` surface.

**Seeded from**: \`docs/ADAPTER_INTEGRATION_REPORT.md\` §9's
component-by-component mapping table (and, for components with no row of
their own there, its "Additional notable findings" section / the relevant
numbered Q&A). **This is a pre-implementation survey, not a substitute for
step 10's own prop audit against \`@angular/material\`'s real \`.d.ts\` at
implementation time** — re-verify every claim below before building.

## Integration report findings

- **Category**: ${meta.category}
- **Angular Material / CDK candidate**: ${meta.equivalent}
- **Notes**: ${meta.notes}

## First-pass \`@Input()\` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material \`.d.ts\` — step 10's own audit
(\`docs/CREATING_AN_ADAPTER.md\` step 10 item 1) supersedes this list.

${inputsList}
`;
}

for (const meta of COMPONENTS) {
  const kebab = kebabCase(meta.name);
  const dir = join(LIB_ROOT, kebab);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${kebab}.component.ts`), componentFile(meta, kebab));
  writeFileSync(join(dir, `${kebab}.component.css`), cssFile());
  writeFileSync(join(dir, `${kebab}.stories.ts`), storiesFile(meta, kebab));
  writeFileSync(join(dir, "IMPLEMENTATION_NOTES.md"), notesFile(meta));
}

// Barrel: src/lib/index.ts re-exports every stubbed component and the
// shared stub component.
const barrelLines = [
  'export { InDevelopmentStubComponent } from "./in-development-stub/in-development-stub.component";',
  ...COMPONENTS.map((meta) => {
    const kebab = kebabCase(meta.name);
    return `export { ${meta.name}Component } from "./${kebab}/${kebab}.component";`;
  }),
];
writeFileSync(join(LIB_ROOT, "index.ts"), barrelLines.join("\n") + "\n");

console.log(`Generated ${COMPONENTS.length} component stubs + barrel.`);
