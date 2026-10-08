<critical_agent_directive>
STOP AND READ THIS FIRST.
If you are an AI agent building components:

1. You are forbidden from modifying Angular Material's own source, and from setting `ViewEncapsulation.None` on a Recursica component to sidestep scoping.
2. **Styling is done exclusively via Angular's own component-scoped CSS**: every component gets its own `<kebab-name>.component.css`, referenced via `styleUrl` on the `@Component` decorator, rendered with `ViewEncapsulation.Emulated` (Angular's default — set it explicitly anyway, matching the two real components' convention), and applies `class="root"` to the component's root element. Never inline `style` bindings for design-token values, never a CSS-in-JS library, never a `.module.css` — Angular's build tooling has no CSS-Modules-equivalent import convention at all (see `docs/STYLING_SYSTEM.md` §3).
3. You must use native CSS variables derived from `recursica_variables_scoped.css`. Where the relevant Angular Material component's own compiled CSS exposes an overridable `--mat-<component>-*`/`--mat-sys-*` custom property for the same visual concern, redeclare that variable inside your own scoped selector rather than writing a rule against Material's `.mat-mdc-*` class and relying on specificity (`docs/STYLING_SYSTEM.md` §4). Only fall back to a direct property override for whatever Material doesn't expose as a variable.
4. If you do not see a relevant CSS variable in the design tokens, you must inform the developer and PAUSE implementation.
5. You must document integration and usage details in a `USAGE.md` file, and internal technical decisions in an `IMPLEMENTATION_NOTES.md` file, both in the component's own folder.
   </critical_agent_directive>

# Component Development Guide — Angular Material Adapter

This document covers what's specific to building components in `adapter-angular-material`. The canonical shared rulebook lives in the `recursica` monorepo: [`packages/adapter-common/docs/COMPONENT_DEV_GUIDE.md`](https://github.com/borderux/recursica/blob/main/packages/adapter-common/docs/COMPONENT_DEV_GUIDE.md) — read it for the **shared architectural intent** (a single Recursica prop layer across adapters, token discipline, testing discipline, the general shape of a component/story/docs folder). The genesis adapter, [`recursica-adapter-mantine-v8`](https://github.com/borderux/recursica-adapter-mantine-v8), is the reference implementation of that shared intent for React/Mantine.

**Read that canonical guide as background on shared intent, not as literal mechanism to copy.** Unlike `mantine-adapter`'s or `beam-adapter`'s own delta docs — which genuinely are thin, because Mantine and Beam are both React component libraries the canonical guide's React-shaped rules (CSS Modules, `filterStylingProps`, JSX examples) apply to directly — this adapter has no `@recursica/adapter-common` dependency to import types/utilities from (see `ARCHITECTURE.md` and `docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A), and Angular's own component/styling/forms model differs from React's in ways that change the actual mechanism, not just the syntax. This document is therefore substantial, not a thin delta — treat everything below as this adapter's own authoritative rule set.

For the core architectural philosophy, read [`PHILOSOPHY.md`](./PHILOSOPHY.md) (a full rewrite for Angular Material, not a delta).

## Folder & naming conventions

- **Kebab-case, not PascalCase.** `projects/adapter-angular-material/src/lib/<kebab-name>/<kebab-name>.component.ts` / `.component.css` / `.stories.ts` / `IMPLEMENTATION_NOTES.md` (and, once written, `USAGE.md`) — not `<Name>/<Name>.tsx`.
- **Element selector `rec-<kebab-name>`**, enforced by `eslint.config.mjs`'s `@angular-eslint/component-selector` rule and `angular.json`'s `"prefix": "rec"`. Recursica components in this adapter are elements (`<rec-button>`), not attribute directives, even when the Angular Material API they wrap internally _is_ an attribute directive (see below).
- **Standalone components only.** Every `@Component` declares its own `imports: [...]` array (the Angular Material module/directive it wraps, plus any other Recursica component it composes) — no NgModules anywhere in this adapter.

## Styling (read `docs/STYLING_SYSTEM.md` first — this section only summarizes it)

- `ViewEncapsulation.Emulated`, explicit on every component (see `layer.component.ts`/`theme-provider.component.ts` for the established convention). Angular's compiler scopes a plain, unprefixed `.root` class in the component's own CSS automatically — no build configuration needed, and no `styles.root`-shaped JS object to reference in the template the way CSS Modules requires; `class="root"` in the template just works, scoped.
- Before writing a component's own CSS, check the relevant Angular Material component's compiled CSS (`node_modules/@angular/material/fesm2022/<component>.mjs`'s `styles: [...]` array) for the `--mat-<component>-*`/`--mat-sys-*` custom properties it already reads. Override those, redeclared under this adapter's own scoped selector — Angular's compiler further scopes that selector with `_ngcontent-<hash>` automatically, so the two scoping layers compose with no extra work. Fall back to a direct property override only for whatever Material doesn't expose as a variable (e.g. `letter-spacing`/`text-transform`, which a component-level `font` shorthand variable typically doesn't cover).
- **`HARDCODED VALUES` comments**: when a value genuinely has no Recursica token to back it (e.g. `Layer`'s `.root { display: block; }`, which exists purely so the element is a box that can receive padding/background — there's no "is this a box" token), document it inline with an explicit comment explaining why, following `layer.component.css`'s established convention. Don't silently hardcode without a comment, and don't invent a token that doesn't exist just to avoid one.

## Component structure

- **Wrap the real underlying element, don't reimplement Material's behavior.** For directive-shaped Material APIs (`matButton`, `matInput`, `matTooltip`, …), render the real native element with the Material directive applied inside this component's own template — e.g. `<rec-button>`'s template renders `<button matButton [attr.appearance]="appearance">…</button>` internally. Don't try to recreate Material's own interaction/accessibility behavior by hand when the directive already provides it.
- **Declare only the `@Input()`s Recursica's contract exposes.** A Material prop this adapter blocks — appearance-affecting or otherwise unsupported — is blocked simply by never declaring it as an `@Input()`. There is no `Omit<>`-on-a-type-plus-runtime-deletion step to also implement the way a React adapter's `filterStylingProps`/`omitUnsupportedProps` requires; Angular components don't spread unknown caller values onto their rendered output at all (see `docs/PHILOSOPHY.md` §1 and `docs/STYLING_SYSTEM.md` §6/§7).
- **Lifecycle pattern for an effect that must apply both on first render and reactively when a bound input changes** (e.g. `RecursicaThemeProvider` setting `data-recursica-theme`): use `OnInit` **and** `OnChanges` together, sharing a private method — not `OnChanges` alone, and not a plain `@Input()` setter. Angular only invokes `ngOnChanges` for an `@Input()` that is actually _bound_ in the caller's template; a component used with no binding at all (relying on a default value) never fires `ngOnChanges`, so relying on it alone silently skips the common "just use the default" case. `ngOnInit` covers that first-render case unconditionally; `ngOnChanges` (skipping `firstChange`, since `ngOnInit` already applied the initial value) covers reactively re-applying the effect when a _bound_ value changes later — see `theme-provider.component.ts`'s own doc comment for the full reasoning, including why a plain `@Input()` setter was considered and rejected (it has the same "only fires when bound" gap, and mixes assignment semantics with side-effecting DOM work).
- **Content-projection gotcha, reproduced and confirmed in this repo's toolchain**: don't put `<ng-content />` inside two conditional template branches (either the modern `@if`/`@else` block syntax or classic `*ngIf`/`else`). In this repo's Storybook setup (`@storybook/angular` 9.1.20, which JIT-compiles story components rather than using Angular's AOT pipeline), having `<ng-content>` in two conditional branches of the same component reliably renders the projected content as **empty from both branches**, not just the inactive one. Render exactly one `<ng-content />`, and drive the "inert" case through a boolean input that toggles behavior on the single always-rendered element instead — see `theme-provider.component.ts`'s `contentsOnly` pattern (delegated to `LayerComponent`, which already supports rendering `display: contents` with no layer styling applied) for the concrete example. This wasn't traced to a specific upstream issue; it's reported here as a reproduced, verified fact about this repo's current toolchain, not a general Angular limitation to assume holds everywhere.
- **Form controls are Angular's own concern — see "Forms integration" below for the resolved standard.** Every form-shaped component implements `ControlValueAccessor` itself; don't default to local component state (a `value`/`(valueChange)` pair with no forms integration) the way a React `useState`-based wrapper naturally would.
- **`MatFormField` covers text-like/selectable controls only, not choice controls.** `MatInput`/`MatSelect`/`MatDatepickerInput`/`MatChipGrid` all implement `MatFormFieldControl<T>` and can plug into `<mat-form-field>` for label/hint/error layout; `MatCheckbox`/`MatRadioButton`/`MatSlideToggle` do not, and are never placed inside one in Material's own design. A `FormControlWrapper`/`FormControlLayout` (mirroring the genesis adapter's own architecture) is required for both control families, and `MatFormField` is also structurally stacked-only (no side-by-side label option) — see `docs/ADAPTER_INTEGRATION_REPORT.md` Q7/Q8 for the full evidence before implementing either family.

## Component API: explicit inputs, passthrough and accessibility

The canonical guide's §3.5 (`@recursica/adapter-common` `docs/COMPONENT_DEV_GUIDE.md`) sets the policy: which native attributes a component forwards, to which element, and which it never exposes. This section is the Angular mechanics.

**There is no `...rest`.** In React a wrapper spreads unknown props onto the base component. In Angular a component's API is exactly its declared `@Input()`s and `@Output()`s, and a native attribute written on `<rec-x aria-label="Save">` lands on the `rec-x` **host**, not on the native element inside the template. So:

- A passthrough exists only if the component declares an input and binds it on the inner element (`[attr.aria-label]="…"`). Anything not declared is silently unavailable.
- "Removing" a library prop is not declaring it (see "Component structure"). That does not hide anything native from the host.

**Use the shared host directives, not hand-written inputs.** `src/lib/utils/recursica-aria.ts`:

- `RecursicaAriaLabelling` adds `ariaLabel`/`aria-label`, `ariaLabelledby`/`aria-labelledby` and `ariaDescribedby`/`aria-describedby` (both spellings are inputs, so the natural HTML spelling works and the camelCase one older components shipped still works) and clears the host's own attributes so the name is not duplicated on an element with no role.
- `RecursicaElementId` adds `id` and clears the host `id`.

```ts
@Component({
  selector: "rec-thing",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  template: `<button
    [attr.id]="elementId.id ?? null"
    [attr.aria-label]="aria.ariaLabel ?? null"
  >
    …
  </button>`,
})
export class ThingComponent {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);
}
```

To accept only some inputs, list only those names in `inputs`. A component that already has an `id` input with a generated default keeps it and adds `host: { "[attr.id]": "null" }`.

**Rules that follow from the host/inner split:**

- Forward to the element that carries the semantics: the `<input>`, the `<button>`, the `role="dialog"` node. For a form control composed of a public component and an inner `*-control` component, the directive goes on the public component and the values are passed down to the control through inputs.
- A form control's `aria-describedby` must be merged with the form-control wrapper's ids: use `aria.describedBy(wrapperIds)`. The wrapper rewrites its own ids on every change-detection pass, so a caller's value must never replace them.
- An input named like a native attribute (`title`, `role`, `id`, `tabindex`) also leaves a static attribute on the host. Null it in `host` (`"[attr.title]": "null"`) or give the input a different name (Button's `buttonTabIndex`).
- Overlays render outside the component (CDK portal), so host attributes cannot reach them. Forward through the overlay's own config (`MatDialogConfig.ariaLabel`/`ariaLabelledBy`/`ariaDescribedBy`, `role`, …) or onto the panel template's root element.
- Trigger components (menu, popover, hover-card) put `aria-haspopup`/`aria-expanded`/`aria-controls`/`aria-describedby` on the real focusable child of the trigger, never on a wrapper or on a `rec-button` host.
- `host` bindings of a host directive and consumer bindings on the same attribute can conflict: document the supported spellings (`aria-label="…"`, `[aria-label]="…"`, `ariaLabel`, `[ariaLabel]`), and do not tell integrators to use `[attr.aria-label]` on a `rec-*` element.
- Hard-coded English strings rendered for assistive technology ("Close", "Clear selection", pagination labels) are defaults of inputs, never literals, so integrators can translate them.

**Verify where it landed.** Add an `Accessibility` story that sets the standard attributes on the component (literal values `aria-label="A11Y-LABEL"`, `aria-describedby="a11y-desc"`, `id="a11y-id"`), and check in a browser that each appears on exactly one inner native element and on no `rec-*` host.

## The generic styling escape hatch — resolved: `RecursicaOverStyled`

Every component wrapping a Material element with a protected look implements `RecursicaOverStyled` (`src/lib/utils/recursica-over-styled.ts`): `overStyled?: boolean`, `overClass?: string`, `overStyle?: Record<string, string>`. Forward `overClass`/`overStyle` onto the wrapped Material element only when `overStyled` is `true` — use the shared `resolveOverStyle()` helper rather than re-implementing the check per component. `Layer`/`RecursicaThemeProvider` (and, once built, `Flex`/`Stack`/`Group`/`Grid`) don't implement this — they're styling plumbing, not a component with a look to protect. Also prefix every override selector with `:host-context([data-recursica-theme])` for a real (not absolute) specificity edge against casual consumer overrides — see `docs/STYLING_SYSTEM.md` §4/§6 and `../OVERSTYLING.md` for the full rationale and live verification.

## Forms integration — resolved: `ControlValueAccessor`, via the shared `RecursicaValueAccessor` helper

Every component with a value that belongs in a form (`text-field`, `text-area`, `number-input`, `dropdown`, `date-picker`, `time-picker`, `auto-complete`, `checkbox`, `checkbox-group`, `switch`, `switch-group`, `radio-group`, `slider`, `segmented-control`, …) implements Angular's own `ControlValueAccessor` and registers itself as `NG_VALUE_ACCESSOR`, so `[formControl]`/`[(ngModel)]`/`formControlName` bind directly onto the Recursica element (`<rec-text-field [formControl]="ctrl">`) — exactly like a caller would bind onto `<mat-select>`/`<mat-checkbox>`/`<mat-slide-toggle>`/`<mat-radio-group>` directly in a plain Material app.

**This is the standard, not a per-component judgment call.** React has no equivalent contract, so a prior pass at several form components (`TextField`, `Dropdown`, `NumberInput`, `TextArea`, `DatePicker`) defaulted to a `value`/`(valueChange)` pair only, reasoning "Recursica owns its own value model, doesn't need `ControlValueAccessor`" — natural coming from a React `useState`-shaped mental model, but the wrong call here: `ControlValueAccessor` _is_ Angular's own idiomatic mechanism for exactly this, not a foreign concept being grafted on, and skipping it is what actually diverges from platform convention. Corrected across every form-shaped component (2026-09-24, prompted by a real crash: `[formControl]` on these components threw `NG01203` at runtime). Don't reintroduce a value/valueChange-only form component going forward.

**Which real components self-implement it, confirmed directly against the compiled bundles, not assumed:** `grep -rn "^\s*writeValue(" node_modules/@angular/material/fesm2022/*.mjs node_modules/@angular/cdk/fesm2022/*.mjs` finds it on `MatCheckbox`, `MatSlideToggle`, `MatRadioGroup` (the group, not the individual `MatRadioButton` — confirmed by class name), `MatSelect` (in `select-module.mjs`, re-exported through `select.mjs`), `MatSlider`, `MatButtonToggleGroup`, `MatChipListbox`, `MatListbox`, datepicker's own internals, and autocomplete/timepicker's own internals. The one real exception is `MatInput`: zero `writeValue` in `input.mjs`/`input-value-accessor.mjs` — it's a bare attribute directive on a native `<input>`/`<textarea>`, not a wrapping component, so it relies on Angular's own built-in `DefaultValueAccessor` attaching straight to the native element instead (`MAT_INPUT_VALUE_ACCESSOR`, the token that file does export, is an unrelated mechanism letting `MatDatepickerInput` etc. delegate value reads onto `MatInput` — not a `ControlValueAccessor`). **This exception doesn't carry over to any Recursica component**: `rec-text-field`/`rec-text-area`/`rec-number-input` are wrapping components with their own template (an internal `<input matInput>`, never the caller's own element), which puts them in the same category as every self-implementing Material component above, not `MatInput`'s bare-directive category.

**Mechanism**: use the shared `RecursicaValueAccessor<T>` helper (`src/lib/utils/recursica-value-accessor.ts`) to hold the `onChange`/`onTouched` callbacks — don't hand-roll per-component storage for these. Register the component as its own `NG_VALUE_ACCESSOR` via `recursicaValueAccessorProvider(MyComponent)` in the `@Component`'s `providers` array (`forwardRef` included, since the component references its own not-yet-defined class). Each component still owns four short methods:

- `writeValue(value)`: assign the component's own `value` (or `checked`, for boolean toggles) property.
- `registerOnChange(fn)` / `registerOnTouched(fn)`: one-line delegation to the shared helper.
- `setDisabledState(isDisabled)`: assign the component's own `disabled` `@Input()`.

— and calls the helper's `notifyChange(value)` from wherever it already emits its own `valueChange`/`checkedChange` `@Output()` (both fire together, from the same call site), plus `notifyTouched()` on blur (or the closest equivalent "user is done interacting" signal — dialog close for `date-picker`, selection commit for `dropdown`).

**`value`/`(valueChange)` (or `checked`/`(checkedChange)`) stay too — this is additive, not a breaking replacement.** A caller not using reactive forms still binds `[value]`/`(valueChange)` directly, exactly like `matInput` itself still works with plain property binding when no `NgControl` is present. `ControlValueAccessor` makes `[formControl]` also work, on top of the simpler path, not instead of it.

## Verification

There is no test script in this adapter yet (unlike `mantine-adapter`/`beam-adapter`, which both have `vitest` unit and DOM tests) — this repo has revisited test infrastructure more than once elsewhere in its history; don't add a test script or test files speculatively without asking a human first. In the meantime, verification means booting a real Storybook instance (`npm run dev`) and checking real rendered/computed output — reading the code back and confirming it "looks right" is not verification. Both real components' own `IMPLEMENTATION_NOTES.md` "Verification" sections document the standard this repo already holds itself to (real `getComputedStyle()` checks via a headless browser, not just DOM-attribute presence) — match that rigor for every new component.

## Keeping `llms.txt` in sync

Same convention as every other adapter: alphabetical by component name, one entry per component. Update the status marker (🚧 → ✅) and add the `USAGE.md` link once a component moves from stub to real implementation.
