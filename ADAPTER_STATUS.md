# Recursica Angular Material Adapter Status

_Last updated: 2026-09-30_

<!-- recursica:meta adapter="angular-material" -->

## What this document is

This is the **adapter status document** for `recursica-adapter-angular-material` — the source of
truth for how this adapter's Recursica components relate to the underlying UI kit
(`@angular/material` + `@angular/cdk`) it wraps.

1. Which Recursica components map directly onto an Angular Material component, and what that mapping is.
2. Which Recursica components have no usable Angular Material equivalent and are hand-built instead.
3. Which Angular Material components/directives this adapter uses internally without exposing them as a first-class Recursica component.
4. Which Angular Material components have no Recursica equivalent at all, and why.

## Format, for parsers

This file is both human-readable Markdown and machine-parsable. Everything a parser needs is
delimited by HTML comments, which render invisibly wherever this file is viewed as Markdown:

- **Document metadata**: a single `<!-- recursica:meta adapter="..." -->` comment right below the
  title, carrying `adapter` (this adapter's short name). Kit versions live in `package.json`.
- **Structured tables**: each of the 4 categories above is wrapped in a matched pair of markers —

  ```
  <!-- recursica:table id="..." -->
  | Column A | Column B |
  |---|---|
  | ... | ... |
  <!-- /recursica:table -->
  ```

  `id` is always exactly one of 4 fixed values, each present exactly once, in any order:
  `direct-mappings`, `hand-built`, `internal-only`, `unsupported`. Every table is exactly 2
  columns — a component name, then a description — standard GFM table syntax.

- **Everything else** is human context only, not structured data.

This shape is enforced automatically: `npm run validate-adapter-status` (wired into both this
repo's pre-commit hook and CI) fails if the meta comment, table ids, or table shape don't match
this spec.

## Methodology

Source: `projects/adapter-angular-material/src/lib/*` (each component's imports and
`IMPLEMENTATION_NOTES.md`) cross-checked against `@angular/material` / `@angular/cdk`. Many
Material candidates suggested by `docs/ADAPTER_INTEGRATION_REPORT.md` §9 were investigated and
**rejected** on evidence (e.g. `MatSelect`, `MatCheckbox`, `MatTabGroup`) — those Recursica
components are listed under §2, with the reason in their own `IMPLEMENTATION_NOTES.md`.

---

## 1. Recursica components that map directly to an Angular Material component

<!-- recursica:table id="direct-mappings" -->

| Recursica component | Angular Material equivalent                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| Button              | `matButton` directive (`MatButtonModule`)                                    |
| Card                | `MatCard` (`MatCardModule`)                                                  |
| DatePicker          | `MatDatepicker` / `MatDatepickerInput` / `MatCalendar`                       |
| Loader              | `MatProgressSpinner`                                                         |
| Menu                | `MatMenu` / `MatMenuTrigger` / `MatMenuItem` (incl. submenus)                |
| Modal               | `MatDialog` (+ `MatDialogRef`)                                               |
| NumberInput         | `matInput` (`MatInput`) — Material has no number-stepper component           |
| Panel               | `MatDialog` (positioned as a side panel) — `MatSidenav`/`MatDrawer` rejected |
| TextArea            | `matInput` + `CdkTextareaAutosize`                                           |
| TextField           | `matInput` (`MatInput`) — not `MatFormField`                                 |
| Tooltip             | `MatTooltip`                                                                 |

<!-- /recursica:table -->

---

## 2. Recursica components with no usable Angular Material equivalent

<!-- recursica:table id="hand-built" -->

| Recursica component | Why                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Accordion           | `MatExpansionPanel` / `MatAccordion` investigated and rejected — see `accordion/IMPLEMENTATION_NOTES.md`. |
| AssistiveElement    | No standalone helper/error text row in Material; only a part of `MatFormField`.                           |
| AutoComplete        | `MatAutocomplete` rejected (overlay/styling constraints) — built on CDK Overlay.                          |
| Avatar              | Nothing equivalent (`MatListItemAvatar` is list-scoped).                                                  |
| Badge               | `MatBadge` is an overlay directive with a different shape; hand-built.                                    |
| Breadcrumb          | Does not exist in Material/CDK.                                                                           |
| Checkbox            | `MatCheckbox` investigated and rejected — see `checkbox/IMPLEMENTATION_NOTES.md`.                         |
| Chip                | `MatChip` rejected — see `chip/IMPLEMENTATION_NOTES.md`.                                                  |
| Container           | No max-width centering primitive in Material.                                                             |
| Dropdown            | `MatSelect` rejected — see `dropdown/IMPLEMENTATION_NOTES.md`; built on CDK Overlay.                      |
| FileInput           | Does not exist in Material/CDK; built on a native hidden file input.                                      |
| FileUpload          | Does not exist in Material/CDK; reuses FileInput's item model.                                            |
| Flex                | Material has no flex primitive (CDK layout is media-query only).                                          |
| FormControlLayout   | Recursica-specific label/field/assistive composition; no Material concept.                                |
| FormControlWrapper  | Composes Label + FormControlLayout + AssistiveElement instead of `MatFormField`.                          |
| Grid                | `MatGridList` is a false friend (different model); hand-built.                                            |
| Group               | No Material equivalent.                                                                                   |
| Heading             | Material typography is Sass-only; no heading component.                                                   |
| HoverCard           | `MatTooltip` only takes a string; built on CDK Overlay.                                                   |
| Label               | `MatLabel` only works inside `MatFormField`.                                                              |
| Layer               | Recursica-specific token-scoping primitive.                                                               |
| Link                | No Material link component or styler.                                                                     |
| Pagination          | `MatPaginator` rejected — see `pagination/IMPLEMENTATION_NOTES.md`.                                       |
| Popover             | No packaged Material candidate; built on CDK Overlay.                                                     |
| Radio               | `MatRadioButton` rejected — see `radio/IMPLEMENTATION_NOTES.md`.                                          |
| ReadOnlyField       | No Material read-only rendering primitive.                                                                |
| SegmentedControl    | `MatButtonToggleGroup` rejected — see `segmented-control/IMPLEMENTATION_NOTES.md`.                        |
| Slider              | `MatSlider` rejected — see `slider/IMPLEMENTATION_NOTES.md`.                                              |
| Stack               | No Material equivalent.                                                                                   |
| Stepper             | `MatStepper` rejected — see `stepper/IMPLEMENTATION_NOTES.md`.                                            |
| Switch              | `MatSlideToggle` rejected — see `switch/IMPLEMENTATION_NOTES.md`.                                         |
| Table               | `MatTable` rejected (wrong shape) — see `table/IMPLEMENTATION_NOTES.md`.                                  |
| Tabs                | `MatTabGroup` rejected — see `tabs/IMPLEMENTATION_NOTES.md`.                                              |
| Text                | No Material text component.                                                                               |
| ThemeProvider       | Recursica-specific; sets `data-recursica-theme`.                                                          |
| TimePicker          | `MatTimepicker` rejected on design fit — see `time-picker/IMPLEMENTATION_NOTES.md`.                       |
| Timeline            | Does not exist in Material/CDK.                                                                           |
| Toast               | `MatSnackBar` audited, not wrapped; built from scratch.                                                   |
| TransferList        | Composed from this adapter's own components.                                                              |
| Tree                | `MatTree` / CDK tree rejected — see `tree/IMPLEMENTATION_NOTES.md`.                                       |

<!-- /recursica:table -->

---

## 3. Angular Material pieces used internally but not exposed as Recursica components

<!-- recursica:table id="internal-only" -->

| Angular Material piece                   | Notes                                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatMenuItem` submenu internals          | `rec-menu-item`'s `[subMenu]` wires `_parentMenu` / `_parentMaterialMenu` and `MatMenu._directDescendantItems` directly; see `menu/menu-item.component.ts`. |
| `OverlayModule` (`@angular/cdk/overlay`) | Powers AutoComplete, Dropdown, HoverCard and Popover panels.                                                                                                |

<!-- /recursica:table -->

---

## 4. Angular Material components with no Recursica equivalent

<!-- recursica:table id="unsupported" -->

| Angular Material component | Why                                                               |
| -------------------------- | ----------------------------------------------------------------- |
| `MatBottomSheet`           | Not part of Recursica's component set.                            |
| `MatDivider`               | No standalone divider component (Menu has its own `MenuDivider`). |
| `MatIcon`                  | Recursica passes icons as template refs, not an icon component.   |
| `MatList`                  | Not part of Recursica's component set.                            |
| `MatProgressBar`           | Not part of Recursica's component set.                            |
| `MatSidenav` / `MatDrawer` | Rejected for Panel; no standalone layout-shell equivalent.        |
| `MatSort`                  | Not part of Recursica's component set.                            |
| `MatToolbar`               | Not part of Recursica's component set.                            |

<!-- /recursica:table -->
