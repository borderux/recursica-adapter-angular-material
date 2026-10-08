# @recursica/adapter-angular-material

## 0.8.0

### Minor Changes

- 308c627: Modal gets `closeOnEscape`, `trapFocus`, `returnFocus`, `lockScroll`, `role`, `closeButtonLabel` and an accessible name. Popover, hover-card, tooltip and the menu trigger put their aria state on the real focusable child; popover no longer swallows the first outside click; tooltip delays are `openDelay`/`closeDelay` (`showDelay`/`hideDelay` are deprecated aliases). Add checkbox, radio and switch `description` and `error`, slider `changeEnd` and `tooltipLabel`, time-picker `minTime`/`maxTime`, dropdown `containerWidth`, menu `maxHeight`, accordion `variant`, panel `wrapHeaderText`, and translatable labels (number-input, dropdown, slider, transfer-list, tree). A non-interactive chip is no longer `aria-hidden`; table rows no longer set `aria-selected`.
- 4a75879: Add the standard accessibility passthrough (`ariaLabel`/`aria-label`, `ariaLabelledby`/`aria-labelledby`, `ariaDescribedby`/`aria-describedby`, `id`) to the components that wrap a native element, forwarded to the inner element. Tabs and accordion ids are now per instance. Button no longer exposes `disableRipple` or `disabledInteractive`, Menu no longer exposes `hasBackdrop`, and Menu item no longer exposes `disableRipple`.
- 8015216: Add Text `component` input (`p`, `span`, `label`, `div`); `h1` to `h6` throw, use Heading.

### Patch Changes

- ed2e269: Add Introduction stories (Welcome, Adapters, Version Info) to the Storybook, listing the Angular Material adapter alongside Mantine and MUI.

## 0.7.0

### Minor Changes

- 0be8d59: Link labels to AutoComplete, DatePicker, NumberInput, TextArea and TimePicker inputs and name the Slider; stop a static `align` leaking `text-align`; set the brand font on `<html>`; fix the Radio row height; add Dropdown `size`.
- a0c2d1d: Add Tabs `activateTabWithKeyboard` (manual activation), AutoComplete `filter` input and `optionSubmit` output, and a flip fallback for Popover.
- e829fcd: Add Link and Breadcrumb `routerLink` support (new `@angular/router` peer dependency), native `td[recTableTd]`/`th[recTableTh]` cells for `colspan`, and Panel `trapFocus`, `lockScroll`, `returnFocus` and `closeOnEscape` for a non-modal panel.
- b2cf608: Export the menu trigger, item, label and divider; add Button `type`/`form`/ARIA inputs and Link, Dropdown, Heading, Table and TextField a11y inputs; keep a loading Button's name; Toast defaults to `role="status"` for default/success.

### Patch Changes

- dfe33ce: Fixes to token analyzer and tokens

## 0.6.0

### Minor Changes

- c4dafdf: Replace `Grid` with `LayoutGrid` (`rec-layout-grid`, `rec-layout-grid-col`), driven by the Recursica layout-grid tokens. `columns`, gutter and margin inputs are removed.
- c4dafdf: Pagination renders Recursica Buttons whose style and size come from the Forge manifest. `rec-theme-provider` now needs `[manifest]` for it (it throws without one).

## 0.5.1

### Patch Changes

- db95291: Versioned with Container and Table fixes

## 0.5.0

### Minor Changes

- 679089a: Added Container and fixed tabs and stepper

## 0.4.1

### Patch Changes

- 61eb35f: Fixed accordion

## 0.4.0

### Minor Changes

- c0425a0: Every form-shaped component (`TextField`, `TextArea`, `NumberInput`, `Dropdown`, `DatePicker`, `TimePicker`, `AutoComplete`, `Checkbox`, `CheckboxGroup`, `Switch`, `SwitchGroup`, `RadioGroup`, `Slider`, `SegmentedControl`) now implements `ControlValueAccessor`, so `[formControl]`/`[(ngModel)]`/`formControlName` bind directly onto the Recursica element instead of throwing `NG01203`. `value`/`(valueChange)` (or `checked`/`(checkedChange)`) still work unchanged — this is additive, not a breaking change.

### Patch Changes

- c0425a0: Fixed `rec-heading` never rendering its projected content (five of six `@switch` branches each had their own `<ng-content>`, silently dropping children) and `rec-modal` throwing when `[opened]` starts `true` at creation (its `@ViewChild`-queried `TemplateRef` wasn't resolved yet when `ngOnChanges` tried to open the dialog).
- 02dc426: Fixed `rec-panel` throwing when `[opened]` starts `true` at creation (same `ngOnChanges`-before-`ngAfterViewInit` `@ViewChild` crash `rec-modal` had). Fixed `rec-switch`'s thumb never sliding and its check/close icon never swapping on toggle. Found and fixed the root cause behind both, plus 10 other components' silently-inert selectors: a `ViewEncapsulation.Emulated` selector-scoping transform mis-scopes a `:host-context(...)` selector chain split one-token-per-line, silently losing specificity against its own base declaration. Collapsed every affected selector to one line across `switch`, `checkbox`, `radio`, `dropdown`, `auto-complete`, `text-field`, `number-input`, `slider`, `segmented-control`, `menu-item`, `file-upload`, and `timeline-item`.

## 0.3.1

### Patch Changes

- da27761: Fixed readme and package.json

## 0.3.0

### Minor Changes

- c7c2e24: Fixed and corrected build output
- ff354d6: Addded Link, Accordion, and Toast components

### Patch Changes

- c7c2e24: Fixed dist build: 6 of 9 overlay CSS files (popover, modal, date-picker, panel, auto-complete, hover-card) weren't copied to dist, the published version was hardcoded to 0.0.0, and none of the overlay CSS files were resolvable via package.json's exports map. Added a `./*.css` wildcard export so every overlay CSS file resolves without needing an individual entry.

## 0.2.0

### Minor Changes

- f72d6f5: Working all components and debugging

This file is managed by [Changesets](https://github.com/changesets/changesets) — entries are added automatically here when a changeset-driven release runs (see `CONTRIBUTING.md` for how to add a changeset to a pull request). No releases have been published yet, so there is nothing to list.
