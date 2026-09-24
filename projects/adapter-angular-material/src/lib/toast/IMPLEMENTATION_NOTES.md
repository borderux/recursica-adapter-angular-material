# Toast — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Integration report findings (pre-implementation survey)

- **Category**: Built from scratch, no wrapped Material component (same
  shape of finding as `AssistiveElement`).
- **Angular Material / CDK candidate audited**: `MatSnackBar`
  (`@angular/material/snack-bar`).
- **Finding**: **Wrong shape, not adopted.** `MatSnackBar` is an _injectable
  service_ (`inject(MatSnackBar).open(...)`) that opens a transient,
  auto-dismissing overlay via CDK Overlay — a dynamic popup-queue manager,
  structurally identical in intent to `@mantine/notifications` (the system
  the genesis adapter's own `Toast.tsx` deliberately did **not** wrap — see
  its `TOAST_IMPLEMENTATION_NOTES.md` §1, "Standalone Visual Wrapper":
  _"We wrap `@mantine/core`'s standalone `Notification` component instead of
  wrapping the `@mantine/notifications` provider... This allows developers
  to use `<Toast>` manually if they want a static or inline message."_).
  There is no standalone, non-queue-driven, directly-rendered "static
  notification card" component anywhere in `@angular/material` — confirmed
  against the full package listing, same as `AssistiveElement`'s "no
  counterpart" finding. `MatSnackBar`'s own internal template
  (`SimpleSnackBar`) is also not reusable in isolation — it's instantiated
  by the service into a CDK Overlay, not renderable as a plain inline
  element. Built from scratch as a plain `<div>` tree instead, matching the
  genesis adapter's own architectural decision one level down the stack:
  Mantine's `Notification` (what the genesis reference wraps) _is_ a
  standalone static component; Angular Material's closest equivalent
  concept (`MatSnackBar`) is not, so there is nothing structurally
  equivalent to wrap here at all.

## Standalone Visual Wrapper (ported decision, not re-derived)

**Decision:** `rec-toast` is a plain, directly-rendered component — place it
anywhere in a template, like `rec-card`/`rec-assistive-element` — never an
injectable popup/toast-stack service.

**Why:** This is a direct port of the genesis adapter's own explicit
decision (`Toast/TOAST_IMPLEMENTATION_NOTES.md` §1) to wrap Mantine's
standalone `Notification` rather than `@mantine/notifications`' dynamic
popup provider. The reasoning transfers unchanged: Recursica's UI Kit
defines variables for the `Toast` component itself
(`--recursica_ui-kit_components_toast_*`), styling a static element usable
for an inline or manually-controlled message — not a queue/timer/portal
system. If a consumer needs dynamic auto-dismissing popups, they compose
`MatSnackBar` themselves and point its panel class at this component's own
CSS/tokens (the Angular-side equivalent of the genesis notes' "developers
can configure `@mantine/notifications` to utilize this component" escape
hatch) — that composition is the consuming application's responsibility,
not this adapter's.

## The real Recursica contract (`RecursicaToastProps`, read directly)

```ts
// packages/adapter-common/src/components/Toast/RecursicaToastProps.ts
export interface RecursicaToastProps {
  variant?: "default" | "error" | "success";
  loading?: false; // forced-off, never a real toggle
}
```

Cross-referenced against the genesis adapter's real `Toast.tsx`, which
intersects this with `Omit<MantineNotificationProps, "color" | "radius" |
"variant" | "loading">` — i.e. the _actual_ full prop surface a consumer of
`<Toast>` gets is Mantine's real `NotificationProps` (read directly from
`@mantine/core`'s compiled `Notification.d.ts`) minus `color`/`radius`
(token-driven, not exposed) minus the canonical `variant`/`loading`
(replaced by Recursica's own semantics):

```ts
// @mantine/core NotificationProps, as consumed by Toast.tsx
onClose?: () => void;
icon?: React.ReactNode;
title?: React.ReactNode;
children?: React.ReactNode;        // main message
withCloseButton?: boolean;         // default true
withBorder?: boolean;              // forced false by Toast.tsx
closeButtonProps?: Record<string, any>;  // not exposed here (Material has no equivalent to forward into)
loaderProps?: LoaderProps;               // not exposed here (loading forced off)
```

## Angular translation of the prop surface

| Reference prop                   | This adapter                                  | Why                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`                        | `@Input() variant`                            | Direct port. `"default" \| "error" \| "success"`, drives `[attr.data-variant]` — same `data-variant` targeting technique the reference itself uses (its own §2 "Variant Mapping").                                                                                                         |
| `title`                          | `@Input() title?: string`                     | `React.ReactNode` → `string`, same simplification `Modal`'s own `title: string` `@Input()` already established (no generic "arbitrary renderable node as a plain value" type in Angular).                                                                                                  |
| `children`                       | `<ng-content />` (in `.description`)          | Angular's native content-projection idiom for "main message" — no `@Input()` needed, matches how every other adapter component here handles a text/body slot (`Card`, `AssistiveElement`).                                                                                                 |
| `icon`                           | `@Input() icon?: TemplateRef<unknown>`        | `React.ReactNode` → `TemplateRef`, same slot convention as `Button`/`Chip`/`Link`'s own `icon` inputs, rendered via `*ngTemplateOutlet`.                                                                                                                                                   |
| `withCloseButton`                | `@Input() withCloseButton = true`             | Direct port, same default.                                                                                                                                                                                                                                                                 |
| `onClose`                        | `@Output() closed = new EventEmitter<void>()` | Angular idiom for a dismiss callback is an `@Output()`, not a callback `@Input()`. Named `closed`, not `close` — `close` collides with `@angular-eslint/no-output-native` (a native DOM event name); `closed` also matches `Modal`'s own identical `onClose`-shaped `@Output()` precedent. |
| `withBorder`                     | not exposed                                   | `Toast.tsx` forces this `false` unconditionally — no reason to expose a prop whose only real value is never reachable.                                                                                                                                                                     |
| `color`/`radius`                 | not exposed                                   | Stripped by the reference's own `UNSUPPORTED_PROPS` — token-driven, not a raw prop. No Angular equivalent to strip; simply never declared (`docs/COMPONENT_DEV_GUIDE.md`'s "declare only what the contract exposes" rule, same precedent as `Button`'s `color`/`fullWidth`).               |
| `loading`                        | not exposed                                   | `RecursicaToastProps.loading` is typed `false` — forced off in the canonical contract itself, not just the wrapper. No loader composition built (unlike `Button`, which has a real, reachable `loading` state) since there is nothing that ever turns it on.                               |
| `closeButtonProps`/`loaderProps` | not exposed                                   | Internal Mantine prop-forwarding hooks with no Material equivalent to forward into (same reasoning as `Button` never exposing Mantine-internal loader plumbing beyond `loaderVariant`/`loaderSize`).                                                                                       |
| — (new)                          | `@Input() role?: string`                      | Not part of the canonical contract. Mantine's own compiled `Notification.mjs` (read directly) unconditionally defaults to `role: role                                                                                                                                                      |     | "alert"`regardless of variant — ported as a`role="alert"`default with the same caller-override escape hatch`AssistiveElement`'s own `role`input already established (though`AssistiveElement`only defaults to`"alert"`for its`error`variant; this defaults to`"alert"` for every variant, matching Mantine's own unconditional behavior exactly). |

`RecursicaOverStyled` (`overStyled`/`overClass`/`overStyle`) is present —
Toast is a protected/non-exempt component with a real "look" to guard, same
as `Card`/`AssistiveElement`/`Button`.

## Structural facts ported from Mantine's real compiled source (not guessed)

Read directly from `@mantine/core`'s real compiled `Notification.mjs`/
`Notification.css` (not the `.module.css` the genesis adapter overrides —
the _base_ component underneath it):

- Root is `display: flex; align-items: center` (not `flex-start` — this is
  why `Toast`'s root uses `align-items: center`, unlike `AssistiveElement`'s
  `flex-start`, even though both are "icon + text" compositions).
- Layout order is icon → body (title above description) → close button,
  left to right.
- `role` defaults to `"alert"` unconditionally (`role={role || "alert"}` in
  the real source), not variant-conditional.
- The close button's icon is hardcoded to `iconSize: 16` in the real
  source — no Recursica token governs this size (only its _color_, via the
  `..._colors_button` token below), so `16px` is ported as a literal, not
  guessed. See `toast.component.css`'s own "HARDCODED VALUES" header
  comment for this and the other two hardcoded values (`border-style:
solid`, `.title`'s `margin-bottom: 2px`).

## Full token → CSS property mapping

All 32 `--recursica_ui-kit_components_toast_*` custom properties (confirmed
via `grep -oE -- '--recursica_ui-kit_components_toast_[a-zA-Z0-9_-]+'
recursica_variables_scoped.css | sort -u`) are consumed below — none left
unmapped, none invented:

| Token (suffix after `..._toast_`)                                                                            | CSS property                                  | Applies to                                                                          |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `properties_border-radius`                                                                                   | `border-radius`                               | `.root`                                                                             |
| `properties_border-size`                                                                                     | `border-width`                                | `.root`                                                                             |
| `properties_elevation_layer-0`                                                                               | `box-shadow`                                  | `.root`                                                                             |
| `properties_elevation_layer-1/2/3`                                                                           | **ignored** (see `recursica-ignore` comments) | n/a — layer-agnostic, `layer-0` used for all                                        |
| `properties_horizontal-padding` / `vertical-padding`                                                         | `padding`                                     | `.root`                                                                             |
| `properties_icon`                                                                                            | `width`/`height`                              | `.iconWrapper`                                                                      |
| `properties_max-width` / `min-width` / `min-height`                                                          | `max-width`/`min-width`/`min-height`          | `.root`                                                                             |
| `properties_spacing`                                                                                         | `gap`                                         | `.root` (see CSS's "LAYOUT SIMPLIFICATION" comment)                                 |
| `properties_text_font-family/-size/-style/-weight/letter-spacing/line-height/text-decoration/text-transform` | matching CSS property                         | `.title`, `.description` (both — reference applies the identical token set to both) |
| `variants_styles_{default,error,success}_properties_colors_background-color`                                 | `background-color`                            | `.root` (per `[data-variant]`)                                                      |
| `variants_styles_{default,error,success}_properties_colors_border-color`                                     | `border-color`                                | `.root` (per `[data-variant]`)                                                      |
| `variants_styles_{default,error,success}_properties_colors_text-color`                                       | `color`                                       | `.root`, `.iconWrapper`, `.title`, `.description` (per `[data-variant]`)            |
| `variants_styles_{default,error,success}_properties_colors_button`                                           | `color`                                       | `.closeButton` (per `[data-variant]`)                                               |

Empirically confirmed `border-size`/`border-color` for the `default` variant
resolve to `0px`/`transparent` in the live theme (`getComputedStyle()` in
Storybook) — the rendered toast has no visible border by design, relying on
`box-shadow` alone; this is a real token value, not a rendering bug.

## A real bug found and fixed while building this: flat variant-descendant selectors silently don't match

While wiring the error/success variant overrides for `.iconWrapper`/
`.title`/`.description`/`.closeButton`, the first pass used flat,
hand-written selectors (`:host-context([data-recursica-theme])
.root[data-variant="error"] .iconWrapper { ... }`, each its own top-level
rule) — the same shape `assistive-element.component.css` already uses.
Verified via real `getComputedStyle()` in the live Storybook that these
silently never matched (icon color stayed on the `default` token even with
`data-variant="error"` confirmed present). Rewrote using **native CSS
nesting** instead (`&`-implied descendant rules nested inside the
`.root[data-variant="error"] { ... }` block) — the same convention
`button.component.css` already uses for its own variant overrides — and
confirmed via the same `getComputedStyle()` method that this compiles and
matches correctly. Full root-cause writeup, plus the finding that
`AssistiveElement` has this same live bug today (out of scope to fix here),
logged in `docs/DEVELOPMENT_ISSUES.md`.

## `RecursicaOverStyled`

`overStyled`/`overClass`/`overStyle` forward onto `.root` via
`resolveOverStyle()`, discarded unless `overStyled` is `true` — same
mechanism as every other protected component. No dedicated demo story
(`OverStyledEscapeHatch`-style stories were removed adapter-wide as unwanted
clutter — the `@Input()`s still exist on the component, just no story for
them).

## Verification (real Storybook, real headless Chromium)

Loaded each `UI-Kit/Toast` story's `iframe.html?id=...` against the shared
dev server already running at `http://localhost:6007` (not started or
killed by this session), via Playwright, and read real
`getComputedStyle()`/attribute values on the rendered `.root` element.

| Story                | `data-variant` | `role`  | `background-color`   | close button present | icon present |
| -------------------- | -------------- | ------- | -------------------- | -------------------- | ------------ |
| `Default`            | `default`      | `alert` | `rgb(249, 249, 249)` | yes                  | no           |
| `Success`            | `success`      | `alert` | `rgb(0, 108, 44)`    | yes                  | no           |
| `ErrorState`         | `error`        | `alert` | `rgb(157, 0, 0)`     | yes                  | no           |
| `WithoutCloseButton` | `default`      | `alert` | `rgb(249, 249, 249)` | no                   | no           |
| `WithIcon`           | `error`        | `alert` | `rgb(157, 0, 0)`     | yes                  | yes          |

Real, distinct, theme+layer-scoped token colors per variant (not one value
repeated). Zero `console.error`/`pageerror` events across all 6 stories.
Clicking the real rendered close button (`WithIcon`'s underlying `Default`
markup) fired no errors (the `closed` `@Output()` emits; stories don't wire
a handler, so nothing else is expected to happen — matches the "plain
directly-rendered component" design, no self-dismissal built in).

Additionally confirmed the error-variant fix directly: before the nesting
rewrite, `.iconWrapper`'s real computed `color` was `rgb(19, 19, 19)` (the
`default` variant's token, wrong); after, `rgb(252, 252, 252)` (matching
`--recursica_ui-kit_components_toast_variants_styles_error_properties_colors_text-color`'s
real resolved value `#fcfcfc`, correct) — and the close button's color
matched `--..._error_..._colors_button`'s real resolved value `#f6d5d8`.

`npx eslint 'projects/adapter-angular-material/src/lib/toast/**/*.ts'` and
`npx tsc --noEmit -p projects/adapter-angular-material/tsconfig.lib.json`
both clean. Throwaway Playwright scripts and screenshots deleted after
verification; shared Storybook instance left running (not killed).
