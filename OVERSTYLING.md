# Over Styling (`overStyled`) — status: resolved, Angular-native mechanism

Every Recursica adapter sandboxes its components against arbitrary styling by default, with a single, explicit, auditable escape hatch. In the genesis adapter (`recursica-adapter-mantine-v8`) that's `overStyled={true}`, backed by a `RecursicaOverStyled<T>` TypeScript type and runtime prop-stripping (`filterStylingProps()`/`omitUnsupportedProps()`). **This adapter uses a different mechanism**, because Angular's own component model doesn't give it the same runtime hook to work with — see [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6 for the full design writeup this document summarizes.

## Why this doesn't just port over from the genesis adapter

Both React-based adapters' escape hatch works because `className`/`style` arrive as ordinary props on a plain JavaScript object — a runtime function can inspect that object and delete keys from it before they reach the underlying component.

Angular has no equivalent object to intercept, and it's worse than just "no runtime hook": `[ngClass]`/`[style]`/`[class]` written directly on `<rec-button>` in a caller's own template are **template-level host bindings that Angular's renderer applies straight to the host DOM element** — not delivered to `RecButtonComponent`'s TypeScript instance at all. There is no lifecycle hook, no setter, nothing on the component's side that even fires; the binding is compiled and applied before our own code ever runs. And even if we could somehow intercept it, it lands on `<rec-button>`'s own host tag, not automatically on the real `<button matButton>` nested inside our template — CSS inheritance only carries a handful of properties (color, font), not background/border/padding.

## The resolution: a dedicated, greppable `@Input()` trio

Every component that wraps a Material element with a protected look implements `RecursicaOverStyled` (`src/lib/utils/recursica-over-styled.ts`):

```ts
export interface RecursicaOverStyled {
  overStyled?: boolean;
  overClass?: string;
  overStyle?: Record<string, string>;
}
```

`overClass`/`overStyle` are forwarded onto the component's own wrapped Material element **only** when `overStyled` is `true`, via the shared `resolveOverStyle()` helper — every component enforces the same rule identically instead of hand-rolling it. If `overStyled` is `false` or unset (the default), both are **discarded entirely**, even if a caller set them. This is the direct Angular-native translation of React's "blocked unless explicitly unlocked" default: since Angular gives us no way to intercept an ambient host binding, the mechanism is a component-declared input pair instead of a prop-object filter — but the actual policy (quiet by default, loud and auditable when overridden) is identical. The name is deliberately greppable: `grep -r overStyled` finds every place a consumer is reaching past Recursica's own design surface.

## What's already true, without needing a runtime step

Angular components don't spread unknown caller props onto their rendered output the way a React component can via JSX rest-prop spreading. An appearance-affecting Angular Material `@Input()` this adapter doesn't want to expose — e.g. `MatButton`'s `color`, which the integration report confirms is already a no-op under Material 3 theming — is blocked simply **by never declaring it**, with no runtime deletion step needed the way `omitUnsupportedProps()` provides for React's prop-spreading model. See [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6/§7 for the full breakdown.

## Raising the bar against overrides that don't go through `overStyled` at all

Nothing prevents a determined consumer from reaching a component's internals outside the sanctioned path entirely — a global stylesheet targeting Angular Material's own global classes (`.mat-mdc-button`, since Material renders with `ViewEncapsulation.None`), or `::ng-deep` piercing this adapter's `ViewEncapsulation.Emulated` scoping from the consumer's own component. **No CSS-based mechanism, in any framework, can make a component truly un-overridable** — global CSS and cascade/specificity are always available to a sufficiently motivated caller. What this adapter does instead: prefix every override selector with `:host-context([data-recursica-theme])` (`docs/STYLING_SYSTEM.md` §4) — since `RecursicaThemeProvider` always sets that attribute on `<html>`, requiring it costs nothing in real usage but adds a real specificity qualifier a casual, accidental override is unlikely to replicate. Verified live (not just that it compiles): booted a real Storybook instance — every story is already wrapped in the real `RecursicaThemeProvider` via the global decorator, so `data-recursica-theme` is genuinely present on `<html>` in every running story — and confirmed via `getComputedStyle()` that a `:host-context([data-recursica-theme])`-scoped rule actually matches and applies. This raises the bar on the casual case; it is not, and was never meant to be, an unbreakable lock.

## Permitted layout properties (once layout components are implemented)

Angular Material has no native margin/padding/gap props on any component — spacing is entirely the caller's own CSS responsibility (`docs/ADAPTER_INTEGRATION_REPORT.md` Q4). This adapter's own `Flex`/`Stack`/`Group`/`Grid` (currently `🚧` stubs, see `llms.txt`) will be the only place `rec-*` spacing tokens have anywhere to attach, matching the layout-prop scaling convention already shared across every Recursica adapter:

- `rec-none` (0px limit)
- `rec-sm` (0.5x scaling)
- `rec-default` (1.0x scaling)
- `rec-md` (1.5x scaling)
- `rec-lg` (2.0x scaling)
- `rec-xl` (3.0x scaling)
- `rec-2xl` (4.0x scaling)

## Primitive layout components exemption

`Layer`/`RecursicaThemeProvider` (already built) and, once built, `Flex`/`Stack`/`Group`/`Grid` are exempt from `RecursicaOverStyled` — the same precedent the genesis adapter already set (a layout/plumbing primitive has no internal "look" to protect, so its own native `class`/`style` inputs pass through freely, unconditionally).

## Do not do this: bypassing `overStyled` with native bindings + global CSS

Verified directly against the real `Button` component: a native `[class]`/`[style]` binding written straight onto `<rec-button>` lands on the host tag and has **no visible effect on its own** — the real `<button matButton>` inside is untouched. But combined with a real global stylesheet rule using a descendant selector (`.some-class button { ... }`), it **does** reach in and restyle the actual button — Angular's `ViewEncapsulation.Emulated` is attribute-based scoping, not a Shadow DOM boundary, so nothing stops an external stylesheet from targeting a native element by tag name once it has a host-level class to hook onto.

**Getting past this default takes real, deliberate effort — a native binding alone does nothing.** That's the intended design, not an oversight to close further. Application developers should not do this: it bypasses Recursica's design system silently from this component's own perspective (no `overStyled` in sight, nothing to `grep` for) and will break without warning the moment this component's internal markup changes. Use `overStyled`/`overClass`/`overStyle` instead — it's the only path that stays visible in the codebase and stable across implementation changes.
