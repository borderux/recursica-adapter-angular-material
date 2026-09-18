# Button — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).
Built **after** `Loader`, even though the integration report's build order
lists Button first — the real React reference
(`recursica-adapter-mantine-v8`'s `Button.tsx`) composes `Loader` internally
for its loading state, so `Loader` had to exist first. See
`loader.component.ts`/`Loader/IMPLEMENTATION_NOTES.md`.

## Integration report findings (pre-implementation survey)

- **Category**: EASY
- **Angular Material / CDK candidate**: `matButton` directive (`button.d.ts`)
- **Notes**: Direct match: `appearance` (`text/filled/elevated/outlined/tonal`), `disabled`, `disableRipple`, `disabledInteractive`. Attribute-directive pattern — this component's template root is a real `<button matButton>`, not a wrapper. `color` confirmed no-op under M3 theming — filter it anyway.

Re-verified against the real `.d.ts`/compiled source at implementation time.

## The real Recursica contract (`RecursicaButtonProps`)

```ts
variant?: "solid" | "outline" | "text";
size?: "default" | "small";
icon?: React.ReactNode;
loaderVariant?: "oval" | "bars" | "dots";
loaderSize?: "sm" | "md" | "lg" | "small" | "default" | "large";
useRecursicaLoader?: boolean;
```

**No `loading` boolean of its own.** Verified directly against the real
`RecursicaButtonProps.ts` — it does not declare one. In the React
reference, `loading` (and its native visual behavior) comes from Mantine's
own `ButtonProps`, which `Button.tsx`'s `ButtonProps` type intersects in and
forwards straight through via `{...sanitizedProps}` — Recursica's own
contract only adds the loader-customization props on top of an
already-loading-capable underlying component. `matButton` has **no**
underlying loading concept to inherit from at all
(`docs/ADAPTER_INTEGRATION_REPORT.md`'s Button row: only `appearance`/
`disabled`/`disableRipple`/`disabledInteractive`). This adapter therefore
declares its **own** `loading: boolean` `@Input()` — real, new surface, not
part of the canonical contract, needed simply to have somewhere to hang the
loading-state composition described below.

## Loading-state composition — design and why

Since there is nothing to "forward into" (unlike Mantine's built-in
`loading`/`loaderProps`), this had to be designed from scratch:

1. `[disabled]="disabled || loading"` on the real `<button>` — loading
   implies non-interactive, matching the React reference's own
   `disabled={!!restRecord.disabled || !!restRecord.loading}`.
2. `<rec-loader>` renders as a conditional sibling (`@if (loading && useRecursicaLoader)`)
   next to the label — **not** replacing it via a second `<ng-content>`
   branch. The label (`<span class="labelText"><ng-content /></span>`) is
   always rendered, unconditionally, and only visually hidden via
   `.root[data-loading="true"] .labelText { visibility: hidden; }` in CSS.
   This keeps exactly one `<ng-content />` in the template, never inside two
   conditional branches — the reproduced, documented gotcha
   (`docs/COMPONENT_DEV_GUIDE.md`, `theme-provider.component.ts`'s own
   precedent) where `<ng-content>` in two conditional branches renders empty
   from both. `<rec-loader>` itself is absolutely positioned centered over
   the button (`.loader { position: absolute; inset: 0; margin: auto; }`),
   the same practical visual outcome as Mantine's own loading overlay.
3. **Composed `<rec-loader>` color matches the button's own text color,
   internally, via the escape hatch — not exposed to callers.** Mirrors the
   React reference's `<Loader overStyled color="var(--button-color)" />`
   exactly, translated to this adapter's mechanism: `button.component.css`
   declares `--rec-button-color` per variant (equal to that variant's real
   `..._colors_text-color` token), and `button.component.ts`'s
   `loaderOverStyleStyle` getter passes
   `{ "--loader-color": "var(--rec-button-color)" }` to `<rec-loader>`'s own
   `overStyle`, with `overStyled: true`. `--loader-color` is
   `LoaderComponent`'s own uniform color variable (see `Loader/
IMPLEMENTATION_NOTES.md`) — it drives `oval`'s ring, `bars`' bar fill, and
   `dots`' dot fill alike, so this composition works correctly regardless of
   which `loaderVariant` is chosen, not just `oval`. This is fully
   internal — `--rec-button-color` is never a public `@Input()`, and
   `Loader`'s own `overStyled`/`overClass`/`overStyle` inputs are
   never exposed on `Button`'s own public surface either.
4. **`useRecursicaLoader = false`: a real, documented divergence from the
   React reference.** In Mantine, `false` means "use Mantine's own built-in
   default loader instead of Recursica's." Material has **no** built-in
   loader to fall back to — there is nothing to fall back onto. Here,
   `false` means the button still disables itself while `loading`, but
   renders no visual loading indicator at all. This is a deliberate,
   necessary divergence (the underlying kit genuinely doesn't have what the
   React reference's fallback path relies on), not an oversight.

## `icon`: `TemplateRef<unknown>`, not `React.ReactNode`

The canonical contract's `icon?: React.ReactNode` has no Angular
equivalent — Angular doesn't have a generic "pass an arbitrary renderable
node as a plain `@Input()` value" type the way React's `ReactNode` prop
convention works. `icon?: TemplateRef<unknown>`, rendered via
`*ngTemplateOutlet` (not `<ng-content>`, so the content-projection gotcha
above doesn't even apply to it), is the idiomatic Angular translation:
callers declare `<ng-template #icon>...</ng-template>` and bind
`[icon]="icon"` — see `button.stories.ts`'s `WithIcon` story.

## `iconOnly`: explicit input, not automatic children detection

The React reference's `contentType`/`isIconOnly` logic automatically
inspects `children` (`hasVisibleChildren()`) to decide whether a button is
icon-only. Angular has no equivalent runtime introspection of
`<ng-content>`'s actual projected children (no text-node-aware
`ContentChild` query). Rather than build a fragile workaround (e.g.
`ContentChild` + `AfterContentChecked` diffing `textContent`, which still
can't reliably see raw projected text nodes), this adapter exposes an
explicit `iconOnly: boolean` `@Input()` — the caller declares icon-only mode
directly. A deliberate simplification, not an oversight; documented here
per the task's "don't invent silently" guidance.

## `color`: intentionally not exposed

`MatButton`'s `color` input (`ThemePalette`) is documented in the real
`.d.ts` itself as having no effect under M3 theming
(`docs/ADAPTER_INTEGRATION_REPORT.md`'s Button row). Not declared as a
Recursica `@Input()` at all — per `docs/COMPONENT_DEV_GUIDE.md`'s "declare
only what the contract exposes" rule, there is no runtime-deletion step to
also implement the way a React adapter's `omitUnsupportedProps()` needs;
simply never declaring the `@Input()` is sufficient (Angular doesn't spread
unknown caller values onto rendered output).

## `fullWidth`: intentionally not exposed

Not part of `RecursicaButtonProps` (the React reference blocks Mantine's own
`fullWidth` via `UNSUPPORTED_PROPS`). Same reasoning as `color` — never
declared here.

## `RecursicaOverStyled`

`overStyled`/`overClass`/`overStyle` forward onto the wrapped
`<button matButton class="root">` via `resolveOverStyle()`, discarded
unless `overStyled` is `true` — see `button.stories.ts`'s
`OverStyledEscapeHatch` story.

## Verification (real Storybook, real headless Chromium)

Booted `npm run storybook`, loaded each `UI-Kit/Button` story's
`iframe.html?id=...` in a real Chromium instance (Playwright, borrowed
read-only from the `recursica` monorepo's `node_modules` — not installed as
a dependency here), and read real `getComputedStyle()`/attribute values on
the rendered `.root` (`<button matButton>`) element. Actual results:

| Story     | `background-color` | `color`              | `border-color`     | `border-width` | `border-radius` | `height` | `appearance` |
| --------- | ------------------ | -------------------- | ------------------ | -------------- | --------------- | -------- | ------------ |
| `Solid`   | `rgb(194, 27, 67)` | `rgb(249, 249, 249)` | `rgba(0, 0, 0, 0)` | `1px`          | `24px`          | `48px`   | `filled`     |
| `Outline` | `rgba(0, 0, 0, 0)` | `rgb(194, 27, 67)`   | `rgb(194, 27, 67)` | `1px`          | `24px`          | `48px`   | `outlined`   |
| `Text`    | `rgba(0, 0, 0, 0)` | `rgb(194, 27, 67)`   | `rgba(0, 0, 0, 0)` | `1px`          | `24px`          | `48px`   | `text`       |

Real, distinct, theme+layer-scoped token colors per variant (not one value
repeated, not `initial`/unset) — confirms the `--mat-button-<appearance>-*`
overrides took effect over Material's own `--mat-sys-*` defaults.
`border-radius: 24px` on a `48px`-tall button (exactly half) confirms the
per-content-type pill-radius token resolved, not a `9999px`-clamped guess.

Other findings:

- `Loading` (`loaderVariant: "oval"`, the default): `<rec-loader>` present in
  the DOM with `data-size="default"`; its wrapped `.root`'s computed
  `--loader-color` is `#f9f9f9`, and the button's own computed `color` is
  `rgb(249, 249, 249)` — the **same** color (`#f9f9f9` = `rgb(249,249,249)`),
  confirming the internal `overStyled` composition (`--rec-button-color` →
  `loaderOverStyleStyle`) actually applied, not just present as an unused
  prop. `<button>.disabled` is `true`; `.labelText`'s computed `visibility`
  is `hidden`; `data-loading` is `"true"`.
- `Loading` with `loaderVariant: "bars"` (separate check, after `bars`/`dots`
  were built for real — see `Loader/IMPLEMENTATION_NOTES.md`): 3 real `.bar`
  elements render inside the button; each bar's computed
  `background-color` is `rgb(249, 249, 249)` — the same color as the
  button's own `color`, confirming `--loader-color`'s uniform design works
  through the composition for `bars` too, not just `oval`. Screenshot:
  `/tmp/recursica-angular-material-button-loading-bars.png`.
- `LoadingWithoutRecursicaLoader`: no `<rec-loader>` in the DOM at all;
  `<button>.disabled` is still `true`.
- `IconOnly`: `data-content="icon-only"`; `.labelText`'s computed `display`
  is `none`.
- `OverStyledEscapeHatch`: with `overStyled: true`, the rendered
  `<button>`'s inline `style` attribute is
  `"border-style: dashed; border-width: 4px;"` and computed `border-width`/
  `border-style` are `4px`/`dashed`; a separate check on the `Solid` story
  with `overStyled` unset confirmed no inline `style` attribute at all and
  computed `border-width` back to the real `1px` token value — discarded as
  designed.

Screenshots saved to `/tmp/recursica-angular-material-button-variants.png`
(solid/outline/text side by side — real pill-shaped filled, outlined, and
plain-text buttons in the real brand red), and
`/tmp/recursica-angular-material-button-loading.png` (loading state, real
composed `<rec-loader>` ring visible inside the button, label hidden) and
`/tmp/recursica-angular-material-button-icon-only.png` (icon-only pill with
a real projected SVG icon). Server killed after verification — not left
running.
