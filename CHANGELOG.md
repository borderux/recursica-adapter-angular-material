# @recursica/adapter-angular-material

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
