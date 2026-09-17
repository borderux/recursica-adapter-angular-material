# Over Styling (`overStyled`) — status: not yet implemented for this adapter

Every other Recursica adapter (`mantine-adapter`, `beam-adapter`) sandboxes its components against arbitrary styling by default, with a single, explicit, auditable escape hatch: `overStyled={true}`, backed by a `RecursicaOverStyled<T>` TypeScript type and runtime prop-stripping (`filterStylingProps()`/`omitUnsupportedProps()`). **This adapter has not yet built that runtime mechanism**, and this document says so plainly rather than describing a feature that doesn't exist yet — see [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6 for the full open design question.

## Why this doesn't just port over from Mantine/Beam

Both React-based adapters' escape hatch works because `className`/`style` arrive as ordinary props on a plain JavaScript object — a runtime function can inspect that object and delete keys from it before they reach the underlying component.

Angular has no equivalent object to intercept. `[ngClass]`/`[style]`/`[class]` are **template-level host bindings** that work on _any_ element or component host, independent of what `@Input()`s a component declares — a caller can always write `<rec-button [style.background]="'red'">`, whether or not `RecButtonComponent` "supports" it, because it's Angular's own template syntax operating on the host element, not a prop `RecButtonComponent` chose to accept. Blocking (or deliberately allowing) that isn't a matter of typing an `Omit<>` on a props interface; it depends on how each component's own template is structured — specifically, whether and how a binding on the Recursica host element propagates to the underlying Angular Material element inside it.

## What's already true, without needing that mechanism

Angular components don't spread unknown caller props onto their rendered output the way a React component can via JSX rest-prop spreading. An appearance-affecting Angular Material `@Input()` this adapter doesn't want to expose — e.g. `MatButton`'s `color`, which the integration report confirms is already a no-op under Material 3 theming — is blocked simply **by never declaring it**, with no runtime deletion step needed the way `omitUnsupportedProps()` provides for React's prop-spreading model. See [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6/§7 for the full breakdown of what's closed vs. still open.

## What's still genuinely open

Whether — and how — a caller's `[ngClass]`/`[style]`/`[class]` bound directly onto a Recursica component (e.g. `<rec-button [style.height.px]="120">`) should be allowed through unconditionally, blocked outright, or gated behind an explicit `overStyled` input; and if gated, what mechanism actually intercepts a template-level host binding before it reaches the underlying Material-decorated element. This needs a real design pass at component-implementation time (`docs/CREATING_AN_ADAPTER.md` step 10), starting with whichever component first genuinely needs it — not invented in the abstract here. `RecursicaThemeProvider`'s own port deliberately does **not** call the React source's `injectOverStyledStyles()`/`registerOverStyledConsoleCommand()` dev-tooling for the same reason (see `theme-provider/IMPLEMENTATION_NOTES.md`) — porting that tooling ahead of the mechanism it supports would build on a foundation that isn't there yet.

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

Once built, `Flex`/`Stack`/`Group`/`Grid` will be exempt from whatever gatekeeper mechanism `overStyled` ends up being for this adapter — the same precedent `mantine-adapter`/`beam-adapter` already set (a layout primitive has no internal "look" to protect, so its own native layout inputs should pass through freely).

## Visual auditing (`recursica.toggleOverStyled()`) — not ported

`mantine-adapter`'s and `beam-adapter`'s `RecursicaThemeProvider` unconditionally call `injectOverStyledStyles()`/`registerOverStyledConsoleCommand()` dev-tooling, which lets a developer run `recursica.toggleOverStyled()` in the browser console to highlight every over-styled component on the page. This adapter's `RecursicaThemeProvider`/`rec-theme-provider` deliberately omits both calls, since the `overStyled` mechanism they support doesn't exist here yet. Revisit once the generic escape hatch above is resolved.
