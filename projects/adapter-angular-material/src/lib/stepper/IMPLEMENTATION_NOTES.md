# Stepper — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## The step-9 stub's `MatStepper` guess ("EASY") didn't survive contact with the real compiled source

The stub's own findings row (`docs/ADAPTER_INTEGRATION_REPORT.md` §9) called this **EASY**
("Direct, rich match: `orientation` ... `labelPosition`, `headerPosition`, per-step
completion/error state via `MatStep`"). Reading `MatStepper`/`MatStep`/`MatStepHeader`'s real
compiled output (`node_modules/@angular/material/fesm2022/stepper.mjs`) before writing any code
turned up the same category of problem `Tabs`'s own notes already document for `MatTabGroup`, plus
one specific to `Stepper`:

1. **`MatStepper`'s own template builds its entire header _and_ content DOM itself**, inside its
   own component view. Confirmed directly from the compiled metadata: both `MatStepper` and
   `MatStepHeader` declare `encapsulation: ViewEncapsulation.None` (`args: [{ selector:
'mat-stepper, mat-vertical-stepper, mat-horizontal-stepper, [matStepper]', ...,
encapsulation: ViewEncapsulation.None, ...}]` / same for `mat-step-header`). Every
   `.mat-step-icon`/`.mat-step-label`/`.mat-horizontal-stepper-header` element `MatStepper`
   renders (via its own `<ng-template let-step #stepTemplate><mat-step-header .../></ng-template>`,
   instantiated with `*ngTemplateOutlet` from inside `MatStepper`'s _own_ template) belongs to
   `MatStepper`'s own view, never this adapter's — the identical "Emulated-scoped CSS written
   here can never reach it" problem `tabs/IMPLEMENTATION_NOTES.md` already documents for
   `MatTabGroup`'s header, just for a stepper's header/icon markup instead of a tab list's.

2. **`MatStep` fuses one step's label/state _and_ its lazily-rendered body into a single
   `<mat-step>` element.** Its real compiled template is `<ng-template><ng-content></ng-content>
<ng-template [cdkPortalOutlet]="_portal"></ng-template></ng-template>` — the label comes from a
   `ContentChild(MatStepLabel)` or a plain string `label` input, the body from `<ng-content>` fed
   into a `CdkPortalOutlet` that `MatStepper` renders lazily per-step (`MatStep.ngAfterContentInit`
   only creates the `TemplatePortal` once the step becomes selected). This matters **more** here
   than the equivalent finding mattered for `Tabs`, not less: the source-of-truth's own
   `Stepper.module.css` ships `.content { display: none; }` with the comment "Recursica Steppers
   are purely navigational/structural. Content should be managed by the parent layout outside of
   the Stepper DOM" (confirmed directly in
   `recursica-adapter-mantine-v8/src/components/Stepper/Stepper.module.css`, and in every golden
   screenshot — none of `ui-kit-stepper--*.png` show any step body or `Stepper.Completed` text).
   Recursica's `Stepper` **never renders step body content at all** — so `MatStep`'s entire lazy-
   content/`CdkPortalOutlet`/animated-container/transition-event system (the large majority of
   `MatStepper`'s real compiled template — the `@switch (orientation)` block building
   `.mat-horizontal-stepper-content`/`.mat-vertical-content-container` with `[attr.inert]`,
   `transitionend` handling, `animationDone`, etc.) would be pure unused machinery wrapped around a
   component that structurally only ever needed the header/icon/label part.

3. **`MatStepper` selects by numeric `selectedIndex`**, which — unlike `Tabs`'s finding 3 for
   `MatTabGroup`'s numeric-vs-string mismatch — actually _does_ match Recursica's own contract:
   confirmed against the real `@mantine/core` `StepperProps.active: number` /
   `StepperStepProps.state: 'stepInactive' | 'stepProgress' | 'stepCompleted'` (read directly from
   `node_modules/@mantine/core/lib/components/Stepper/Stepper.d.ts` and `.../StepperStep/
StepperStep.d.ts` in `recursica-adapter-mantine-v8`), and the real `Stepper.mjs`'s own
   `active === index ? "stepProgress" : active > index ? "stepCompleted" : "stepInactive"`. This
   is the one place the step-9 stub's guess was directionally right — doesn't change the outcome
   given (1) and (2).

**Decision**: build `Stepper` from scratch — `StepperComponent` (`rec-stepper`, state owner:
`active`/`size`/`orientation`/`(stepClick)`) + `StepComponent` (`rec-stepper-step`, the clickable
step: icon + label/description) + `StepperCompletedComponent` (`rec-stepper-completed`,
API-parity-only, see its own doc comment) — the same category of decision `Tabs` already made,
just triggered by a stronger version of the same root cause (view-encapsulation + fused-element
shape, _plus_ an entire content-rendering subsystem this component structurally has no use for at
all, since Recursica's own CSS already suppresses every bit of step/completed body content).

## State: DI-based context, index-based (not value-based like `Tabs`)

`StepperComponent` provides itself under `STEPPER_CONTEXT` (`stepper-context.ts`, `useExisting`) —
the same DI-context pattern `TABS_CONTEXT` established, `StepComponent` injects it `@Optional()`.
The one real difference from `Tabs`: Recursica's `Stepper` contract is **index-based**
(`active: number`, `onStepClick(index: number)`), not matched by a caller-supplied string `value`
the way `Tabs.Tab`/`Tabs.Panel` are. `StepComponent.index`/`.isLast` are therefore assigned by
`StepperComponent`, from real `ContentChildren(StepComponent, { descendants: true })` order, in
`ngAfterContentInit` (and re-assigned on `.changes`, in case steps are added/removed/reordered at
runtime) — not caller-provided `@Input()`s, matching Mantine's own `index` (array position, not a
prop on `Stepper.Step`) exactly.

`shouldAllowSelect()` — the real click-gating logic from `Stepper.mjs` — was ported 1:1 into
`StepComponent.isClickable`:

```
if (!ctx.hasClickListener) return false;
if (allowStepSelect !== undefined) return allowStepSelect;
return state === 'completed' || ctx.allowNextStepsSelect;
```

`hasClickListener` mirrors Mantine's own `typeof onStepClick !== "function"` check — Angular has no
prop-existence check to mirror directly, so this uses `EventEmitter.observed` (Angular's
`EventEmitter<T>` extends RxJS `Subject<T>`, which exposes a real `observed` getter in the
installed `rxjs@~7.8.0`, confirmed in `node_modules/rxjs/dist/types/internal/Subject.d.ts`) —
`StepperComponent.hasClickListener` returns `this.stepClick.observed`. Verified live: a step
rendered with no `(stepClick)` binding at all (the `OverStyledEscapeHatch` story) renders with
`tabindex="-1"` and no `[data-allow-click]` attribute even on its already-completed first step,
confirmed via `rec-stepper-step` → `button.step` outer HTML in a real running Storybook —
clicking never fires regardless of a step's own state, exactly matching the real source-of-truth's
behavior when no `onStepClick` is passed.

## DOM shape: `display: contents` instead of a `Tabs.List`-style wrapper component

`Tabs` solved "how do a compound component's separately-rendered pieces end up as real flex-item
siblings in the right container" with a dedicated `TabsListComponent` owning a real `.list`
wrapper element. `Stepper` doesn't have an equivalent wrapper in its own contract (no
`Stepper.List` — steps are direct children of `<Stepper>`/`<rec-stepper>`), and the real
`Stepper.mjs` interleaves two _different kinds_ of flex item as _direct_ siblings inside one
`.steps` container: one `<StepperStep>` per step, plus (horizontal orientation only) a separate
`.separator` `<div>` between each non-last pair (`items.push(step); if (orientation ===
'horizontal' && index !== length-1) items.push(separator)`, confirmed directly in the real
`Stepper.mjs`).

`StepComponent` (`stepper-step.component.ts`) reproduces that exact shape by giving its own host
`display: contents` (`stepper-step.component.css`) and rendering **two top-level sibling elements**
in its own template — `<button class="step">...</button>` and, only for horizontal orientation and
only when not the last step, a trailing `<div class="separator">`. `display: contents` removes
`<rec-stepper-step>` itself from the box/formatting tree entirely, so both of its real children
become direct flex-item siblings of `<rec-stepper>`'s `.steps` container — the same practical DOM
participation the real `Stepper.mjs` achieves by never wrapping the step/separator pair in
anything at all. Because both elements are rendered by **this component's own template**, there is
no `Tabs`-style cross-component-view CSS boundary between `.step` and its own `.separator` sibling
— only `.step`/`.separator` reaching _up_ to `<rec-stepper>`'s own `[data-orientation]`/
`[data-size]` (a different component's view) needs `:host-context()`.

For **vertical** orientation, the real `Stepper.mjs` renders no `.separator` sibling at all — the
connecting line (`.verticalSeparator`) lives _inside_ each step's own `.stepWrapper`, confirmed
directly in `StepperStep.mjs` (`orientation === "vertical" && <span
{...ctx.getStyles("verticalSeparator", ...)} data-active={...} />`, nested inside the same
`stepWrapper` span as `.stepIcon`). `StepComponent`'s template matches this exactly: a
`.verticalSeparator` span is only ever added when `ctx.orientation === 'vertical' && !isLast` —
there's no shared/reused separator-rendering path between the two orientations, matching the
source-of-truth's own separate DOM shapes rather than approximating one with the other.

## Vertical connector line height: no Mantine base to inherit — reasoned from first principles, then confirmed live

Mantine's own **base** (non-Recursica) `Stepper.css` gives `.verticalSeparator` (`m_6496b3f3`) a
`height: 100vh` deliberately-oversized line, clipped by its `.stepWrapper` parent's own
`overflow: hidden` + a `min-height` computed from `--stepper-icon-size` + spacing tokens
(`.m_833edb7e { min-height: calc(var(--stepper-icon-size) + var(--mantine-spacing-xl) +
var(--separator-spacing)); overflow: hidden; }`, confirmed by reading the real installed
`node_modules/@mantine/core/styles/Stepper.css` in `recursica-adapter-mantine-v8`) — the same
category of gap `Tabs`'s own notes flag for the active-tab underline/baseline divider ("no Mantine
base to inherit"), just for a vertical connector line's height instead of a border. This adapter
has no equivalent base stylesheet, and reimplementing Mantine's exact `100vh`-plus-clipping trick
would have required matching its `min-height` formula (which itself depends on Mantine-only spacing
tokens, not any Recursica one) for no visual benefit.

Instead: `.step` (the button) is never given an explicit `align-items` override, so its default
`align-items: stretch` (a real CSS default, not something this adapter sets) stretches
`.stepWrapper` (a normal, non-absolutely-positioned flex child) to match the height of the row's
tallest sibling — `.stepBody`, whenever a step's `description` wraps to more than one line.
`.verticalSeparator` is `position: absolute` inside `.stepWrapper` (`position: relative`) with
`top: var(--stepper-icon-size)` (starts at the bottom of the indicator) and `bottom: calc(-1 *
var(--stepper-step-gap))` (extends _below_ `.stepWrapper`'s own stretched bottom edge by exactly
one step-gap). With both `top` and `bottom` set and `height: auto`, the browser computes this
element's height directly from its containing block's height minus those two offsets — which lands
the line's bottom edge exactly at the top of the next step's indicator, spanning through
`.step`'s own `padding-bottom: var(--stepper-step-gap)` (the mechanism the source-of-truth's own
CSS comment already documents using, just for the un-stretched Mantine base case: `/* Move gap
inside the step so the separator line can stretch through it */`).

**Confirmed live, not just reasoned through**: screenshotted the real running `Vertical` story via
Playwright (`.scratch/stepper-vertical.png`) — the connector line reaches continuously from each
step's icon to the next with no visible gap or overlap, including through the second step's
two-line description, matching the golden `ui-kit-stepper--vertical.png` read closely (checkmark +
solid maroon line from step 1 into step 2, thinner grey line — matching the upcoming-vs-completed
connector color/size split — from step 2 into step 3, no line after step 3).

## `Stepper.Completed`: renders nothing, matching the source-of-truth's own CSS exactly

`StepperCompletedComponent` (`stepper-completed.component.ts`) accepts projected content (so
existing `<rec-stepper-completed>...</rec-stepper-completed>` call sites compile and match the
compound-API shape) but its template is empty — content is never rendered into the DOM at all. This
isn't a gap introduced by this adapter: the source-of-truth's own `Stepper.module.css` already
suppresses `Stepper.Completed`'s (and every step's own) content with `.content { display: none; }`
and the explicit comment "Recursica Steppers are purely navigational/structural" — confirmed in
every golden screenshot (`ui-kit-stepper--*.png`), none of which show any "Completed, click back
button..." text despite every story passing it as `Stepper.Completed`'s children. This adapter
reaches the identical visual outcome (content invisible) more directly, since it never had
`MatStep`'s content/portal machinery to render-then-hide through in the first place.

## `label`/`description`: plain strings only — `StepFragmentComponent` render-prop not implemented

Mantine's real `StepperStepProps.label`/`.description` types are `React.ReactNode |
StepFragmentComponent` (`StepFragmentComponent = React.FC<{ step: number }>` — confirmed in
`node_modules/@mantine/core/lib/components/Stepper/Stepper.d.ts`), letting a caller pass a
render-function that receives the step's own index. `StepComponent.label`/`.description` here are
typed as plain `string` only. **Flagged honestly rather than silently dropped**: no story in the
source-of-truth's own `Stepper.stories.tsx` exercises the function-render-prop form (every story
passes a plain string), and the Angular equivalent (a `TemplateRef<{ $implicit: number }>` +
`*ngTemplateOutlet`, the same translation `Tabs`'s `leftSection`/`rightSection` already
establishes) was judged not worth the added surface area for a form no consumer or story currently
needs. Follow-up if a real per-step dynamic-label use case turns up.

Similarly not implemented: Mantine's `Stepper`-level and `Stepper.Step`-level `icon`/
`completedIcon`/`progressIcon` overrides (`StepperProps.icon`/`.completedIcon`/`.progressIcon`,
`StepperStepProps` same three) — this component always shows the step number (upcoming/current) or
a fixed checkmark SVG (completed), matching every story and every golden screenshot exactly (none
exercise a custom icon), but the override inputs themselves don't exist here. The checkmark SVG
markup (`viewBox="0 0 10 7"`, `M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414
0l5-5A1 1 0 1 0 8.293.293L4 4.586z`) is copied directly from Mantine's own real `CheckIcon`
(`node_modules/@mantine/core/esm/components/Checkbox/CheckIcon.mjs` in
`recursica-adapter-mantine-v8`), not approximated, so the completed-state icon itself matches the
golden screenshots pixel-for-pixel in shape.

## `loading` (per-step spinner) not implemented

Mantine's `StepperStepProps.loading` swaps the icon for a `Loader` and is independent of
`state`/`completedIcon`. No story exercises it and this adapter has no `Loader`-equivalent wired
into `Stepper` yet (a real `LoaderComponent` already exists elsewhere in this adapter, per
`llms.txt`, but wiring it into `Stepper.Step` specifically was out of scope here) — flagged rather
than silently dropped.

## `iconPosition`/`iconSize`/`color`/`radius`/`contentPadding`/`autoContrast`/`wrap` not implemented

None of these `StepperProps`/`StepperStepProps` fields are part of the canonical
`RecursicaStepperProps` contract (`packages/adapter-common/src/components/Stepper/
RecursicaStepperProps.ts` only declares `size`), aren't exercised by any source-of-truth story, and
have no corresponding Recursica design token in `Stepper.module.css` (every token there is reached
unconditionally or via `size`/`orientation` only — never `color`/`radius`/etc.). Same category of
"Mantine prop with no Recursica contract behind it" `Tabs`'s notes already document for
`animationDuration`/`dynamicHeight` — not declared here at all, following the same
`docs/STYLING_SYSTEM.md` §6/§7 reasoning ("simply not declaring an `@Input()` for a blocked
Material prop is sufficient").

## `overStyled`/`overClass`/`overStyle`

Only on the root (`StepperComponent`) — same `RecursicaOverStyled` interface every other real
component implements. `StepComponent`/`StepperCompletedComponent` don't implement it, same
reasoning `Tabs`'s notes already give for `TabComponent`/`TabPanelComponent`/`TabsListComponent`:
neither wraps a single, identifiable "protected look" element the way `Card`'s sub-components do,
and the source-of-truth's own `Stepper.Step` doesn't accept `overStyled` independently either
(`StepperStepProps` in the real Mantine reference has no styling-escape-hatch fields at all beyond
what `RecursicaOverStyled<MantineStepperStepProps>` already wraps at the outer `StepperStep`
wrapper level in the React adapter — this adapter's `StepComponent` mirrors that boundary).
Verified via a real Playwright screenshot (`.scratch/stepper-overstyled.png`) and the live rendered
`outerHTML` (`style="background-color: rgb(255, 243, 245);"` present on `.root` only when
`overStyled="true"`) — not just read from the code.

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean. Verified visually against a
real running Storybook (this adapter's own instance on port 6007 — Matt's own instance on the
default port 6006 was confirmed running both before and after, and was never touched) via
Playwright (chromium), screenshotted to `.scratch/` and compared directly against the golden
reference images (`recursica-adapter-mantine-v8/test/golden/ui-kit-stepper--*.png`):

- `.scratch/stepper-default.png` — Default (large, horizontal): checkmark/current-number/upcoming-
  number indicators, completed vs. upcoming connector color/weight, label/description typography
  and colors, all match the golden `--default.png` read closely.
- `.scratch/stepper-small.png` — Small size variant; confirmed via `getComputedStyle` (not just
  eyeballed) that the indicator actually resizes (`42px` large vs. `32px` small `.stepIcon` width/
  height), since the two look close at a glance in a static screenshot.
- `.scratch/stepper-vertical.png` — Vertical orientation, connector line spanning correctly through
  a wrapped two-line description (see the dedicated section above).
- `.scratch/stepper-layout-stress-test.png` — an extremely long first-step label wraps to five
  lines; the horizontal separator's vertical position stays pinned to the indicator's own center
  (not the wrapped label block's), matching the golden `--layout-stress-test.png` read.
- `.scratch/stepper-default-after-next-click.png` — real Playwright click on "Next step" against
  the `Default` story, confirming `(stepClick)` actually drives `[active]` end-to-end (not just a
  static render): the previously-current step 2 becomes completed (checkmark) and step 3 becomes
  current, queried directly via `.stepIcon[data-progress]` textContent before (`"2"`) and after
  (`"3"`) the click.
- `.scratch/stepper-overstyled.png` — the `overStyled`/`overStyle` escape hatch story, confirming
  the forwarded background color actually paints `.root`.

No console errors or Angular template errors observed across any story (`Default`/`Small`/
`Vertical`/`LayoutStressTest`/`OverStyledEscapeHatch`), checked via a real Playwright `console`/
`pageerror` listener across all five, not just the visual screenshots.
