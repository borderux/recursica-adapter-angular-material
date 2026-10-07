# Over Styling (`overStyled`)

## What it is

`overStyled` is the one sanctioned way to put your own styling on a Recursica component. By default, components ignore external styling.

## Why it exists

Component styles are driven by Forge and the Recursica JSON, not by whoever happens to be writing the template. If anyone (or any AI) can drop arbitrary classes and inline styles onto a component, the design system stops being the source of truth and output drifts outside its bounds.

So the default is locked: styling that doesn't come from the design system is discarded. Overriding is still possible, but only through an explicit escape hatch with two properties:

- **Greppable.** `grep -r overStyled` finds every place a component's styles have been altered.
- **Lintable.** A linter can flag any use of `overStyled`, so altered components are easy to audit and review.

Quiet by default, loud and auditable when overridden.

## How it works in Angular

Angular needs a different mechanism than a prop-filtering approach. `[class]`, `[style]` and `[ngClass]` written on `<rec-button>` in a caller's template are host bindings that Angular applies straight to the host element. They never reach the component's TypeScript instance, so the component can't inspect or drop them. They also land on the `<rec-button>` tag rather than the real Material element inside it (`<button matButton>`).

So the escape hatch is a dedicated set of inputs, declared by every component that wraps a Material element with a protected look (`RecursicaOverStyled`, in `src/lib/utils/recursica-over-styled.ts`):

```ts
export interface RecursicaOverStyled {
  overStyled?: boolean;
  overClass?: string;
  overStyle?: Record<string, string>;
}
```

The shared `resolveOverStyle()` helper forwards `overClass`/`overStyle` onto the wrapped Material element **only** when `overStyled` is `true`. Otherwise they are discarded, even if set. Appearance-affecting Material inputs we don't want exposed (such as `MatButton`'s `color`) are blocked by never declaring them.

Layout primitives (`Layer`, `RecursicaThemeProvider`, and `Flex`/`Stack`/`Group`/`Grid` once built) are exempt. They have no look to protect, so their native `class`/`style` pass through.

## How to use it

```html
<!-- Ignored: no overStyled -->
<rec-button overClass="my-class">Save</rec-button>

<!-- Applied to the underlying Material button -->
<rec-button
  overStyled
  overClass="my-class"
  [overStyle]="{ 'min-width': '200px' }"
>
  Save
</rec-button>
```

Prefer design-system props and tokens first. Reach for `overStyled` only when the system can't express what you need.

## What we can't prevent

No CSS-based mechanism, in any framework, can make a component truly un-overridable. A global stylesheet can target Angular Material's global classes (for example `.mat-mdc-button`, since Material renders with `ViewEncapsulation.None`), and `::ng-deep` can pierce this adapter's `ViewEncapsulation.Emulated` scoping. A determined developer can always affect Recursica styles this way.

We get very close. Every override selector is prefixed with `:host-context([data-recursica-theme])` (see [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §4). `RecursicaThemeProvider` always sets that attribute on `<html>`, so it costs nothing in real use, but it adds a specificity qualifier that a casual or accidental override won't replicate.

Bypassing `overStyled` through a native binding plus global CSS takes real, deliberate effort, and it leaves nothing to grep for. It also breaks the moment a component's internal markup changes. Use `overStyled`.
