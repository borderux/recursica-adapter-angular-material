# Recursica Angular Material Adapter: Core Philosophy

Recursica's component architecture isn't just a wrapper; it's a strict enforcing layer over Angular Material's API surface. Our primary goal is to ensure consistency, eliminate "design system rot," and provide clear boundaries for application developers using the UI Kit.

This document serves as the governing framework for why `adapter-angular-material`'s components are built the way they are.

## 1. Strict Separation of Props (The Unified Recursica Prop Layer)

Recursica has a **single universal API surface** internally, regardless of which underlying UI kit backs a given adapter.

- We decouple our visual properties from Angular Material's own: instead of mapping perfectly to Material's `appearance`/`color` inputs, we intentionally use Recursica's own semantic and behavioral structures.
- We never declare an `@Input()` for an Angular Material property that collides with or circumvents Recursica's tokens. `MatButton`'s `color` input is a concrete example: Angular Material documents it as having no effect under Material 3 theming, but this adapter still never exposes it. If its behavior changes in a later release, it cannot leak through.
- A caller can only set the `@Input()`s a component actually declares, so not declaring an input for a blocked Angular Material property is a complete, compiler-enforced block.

## 2. Component Wrappers (Leaving Angular Material Alone)

We never mutate or patch Angular Material's own source, and we never try to out-specify its CSS by rewriting its selectors.

- Angular Material renders its components with `ViewEncapsulation.None` and reads nearly every visual value (color, size, radius, shadow, typography) through a two-tier custom-property system: component-level variables (`--mat-button-*`, `--mat-checkbox-*`, …) that fall back to system-level semantic variables (`--mat-sys-*`). Recursica's overrides redeclare those same variables, scoped to the adapter's own component root, rather than writing rules against Material's `.mat-mdc-*` classes. See [`STYLING_SYSTEM.md`](STYLING_SYSTEM.md) §4.
- Recursica's own additions are scoped with Angular's native `ViewEncapsulation.Emulated`, which stamps a non-guessable `_ngcontent-<hash>` attribute onto every selector and rendered element. See `STYLING_SYSTEM.md` §3.
- Many Angular Material "components" are attribute directives applied to a native element (`<button matButton>`). A Recursica wrapper (e.g. `<rec-button>`) renders that Material-decorated element internally, so consumers never touch Material's selectors directly.

## 3. The `overStyled` Property

By default, a Recursica component should not be trivially overridable from outside, and any deliberate exception should be a loud, greppable signal in the codebase.

In Angular, `[ngClass]`/`[style]`/`[class]` are template-level host bindings that work on any element or component host, independent of the component's declared `@Input()`s. Blocking or deliberately permitting them depends on each component's template structure: whether and how a binding on the Recursica host element propagates to the Angular Material element rendered inside it.

The mechanism is still an open question, to be settled with the first component that genuinely needs it. See [`STYLING_SYSTEM.md`](STYLING_SYSTEM.md) §6 and [`../OVERSTYLING.md`](../OVERSTYLING.md) for the current status.

## 4. Expectations for External Developers (Modifying Recursica)

If a component does not fit a developer's needs and styling must be modified, they should follow these principles in order:

1. **Leverage native Angular Material first.** If a Recursica component lacks the functionality or variant needed for a genuinely custom, one-off case (e.g. a marketing hero button with an arbitrary height), do not hack the Recursica component. Import `@angular/material`'s own directive or component (e.g. `MatButtonModule`'s `matButton`) and style it manually. Use Recursica for standard, systematic needs, and Angular Material's primitives for isolated one-offs.
2. **Contribute to the kit, don't build private wrappers.** If the system is genuinely missing a variant, that's a shared deficit: raise it and have it integrated into the component/token set, rather than maintaining a private wrapper around a Recursica component.
3. **Forms are Angular's own concern, and Recursica's wrappers follow that convention.** Most Angular Material form controls (`MatInput`, `MatCheckbox`, `MatSelect`, `MatSlideToggle`, `MatRadioButton`, `MatDatepickerInput`, …) implement `ControlValueAccessor`/`Validator` and are driven by `ReactiveFormsModule`'s `FormControl`/`formControlName`, not local component state. A Recursica field wrapper either accepts a caller-supplied `FormControl`/`ngModel` and lets Angular's forms machinery own state, or implements `ControlValueAccessor` itself. It does not manage `value`/`onChange` in isolated component state.
