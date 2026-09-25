# Container — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).
This component didn't exist at all before this change (no stub, no
`src/lib/container/` directory, no `llms.txt` entry) — same situation
`Accordion`/`Link`/`Toast` were in.

## Genuinely does not exist in Angular Material — same category as Flex/Stack/Group/Grid

Angular Material has no max-width-centering layout primitive; `@angular/cdk/layout`
only offers `BreakpointObserver`/`MediaMatcher` (media-query utilities, no
markup/CSS). Confirmed, not assumed.

## Every pixel value is Mantine's own hardcode, not a Recursica token

The source-of-truth's own `Container.module.css` has **zero** hardcoded
values ("Mantine handles container constraints natively") — it's a pure
passthrough to `@mantine/core`'s `Container`. Confirmed by reading that
component's actual compiled `Container.css`:

```css
.m_7485cace {
  --container-size-xs: 540px;
  --container-size-sm: 720px;
  --container-size-md: 960px;
  --container-size-lg: 1140px;
  --container-size-xl: 1320px;
}
.m_7485cace:where([data-strategy="block"]) {
  max-width: var(--container-size);
  padding-inline: var(
    --mantine-spacing-md
  ); /* = 1rem at Mantine's default scale */
  margin-inline: auto;
}
.m_7485cace:where([data-strategy="block"]):where([data-fluid]) {
  max-width: 100%;
}
```

Grepped `recursica_variables_scoped.css` for "container" — zero matches, so
there is no Recursica design token to map `size` onto (unlike every other
component, which maps onto real `--recursica_ui-kit_components_*` tokens).
The five breakpoint widths and the `1rem` padding above are ported directly
as literal hardcodes, matching what the reference itself hardcodes. The
`'grid'` `strategy` (an unrelated breakout-layout mode, `display: grid` with
`grid-template-columns`) is untested by any Recursica story on either
adapter and wasn't built — only the default `'block'` centering behavior.

## `size`: `rec-*` alias, Mantine keyword, or raw passthrough

Ported the reference's own `mapSize` table exactly (`rec-sm`→`sm`,
`rec-default`→`md`, `rec-md`→`md`, `rec-lg`→`lg`, `rec-xl`→`xl`,
`rec-2xl`→`xl`), then resolved to the literal pixel value above (Angular has
no Mantine `--container-size-*` CSS variables available to reference at
runtime, unlike the React adapter which stays inside Mantine's own
`MantineProvider`). Anything not in the map passes straight through as a raw
CSS length — same "free passthrough" convention `resolveSpacing` uses for
every other layout primitive's `gap`.

## Two real bugs found live, neither visible from source alone

1. **Missing `display: block` collapsed the whole component.** Every other
   layout primitive (`Flex`/`Stack`/`Group`) sets `[style.display]:
"'flex'"` on its host, so this never came up before — I assumed a bare
   custom element defaults to block and left `display` unset. It doesn't:
   absent a stylesheet rule, an unknown custom element is `display: inline`
   per the UA stylesheet, and a `<p>` (rendered by the projected
   `<rec-text>`) can't validly lay out inside inline content — confirmed
   live via screenshot, the background/border collapsed to two ~1px-wide
   slivers with the actual text rendered outside them. Fixed with an
   explicit `[style.display]: "'block'"` host binding.
2. **A `rec-stack`-wrapped story collapsed to ~160px regardless of
   `size`/`fluid`.** `Container`'s centering CSS (`margin-inline: auto` +
   `max-width`, no explicit `width`) is the classic block-box auto-margin
   technique. As a flex item it stops working: `rec-stack`'s own default
   `align-items: stretch` overrides the auto margins outright, and even a
   non-stretched flex item sizes its main/cross axis to content by default
   rather than filling available space. Only a plain block formatting
   context reproduces the reference's own behavior — which is exactly why
   the reference's own story uses a raw `<div>` wrapper rather than its own
   `Stack`/`Flex`. Fixed by keeping the raw `<div>` in this adapter's
   stories too (documented as a deliberate, narrow exception to the usual
   raw-div-chrome playbook in `container.stories.ts`'s own header comment),
   rather than trying to force `Container` to work inside a flex parent it
   was never designed for.

## `RecursicaOverStyled` gate skipped, no wrapper `<div>`

Same reasoning as `Flex`/`Stack`/`Group`/`Grid` (see `flex/IMPLEMENTATION_NOTES.md`) —
confirmed directly in the reference's own `Container.tsx` doc comment:
"Unlike complex UI components, primitive layout components (Flex, Stack,
Group, Container) DO NOT use the `RecursicaOverStyled` gatekeeper." The host
element itself carries `max-width`/`padding-inline`/`margin-inline` via host
bindings — a caller's own `style="background:white;padding:16px"` on
`<rec-container>` merges directly through ordinary Angular host-binding
behavior, no escape-hatch input needed.

## Verification

**Real signal, this session**: fresh `tsc --noEmit` and `eslint` both clean.
All 3 golden-matching stories (Default, SmallContainer, FluidContainer)
confirmed registered and rendering correctly in a live Storybook dev server
(port 6007), verified with Playwright screenshots and computed-style/
bounding-rect inspection, not just visually:

- Default (`size` unset → `md`): border-box width `994px` = `960 + 2×16
padding + 2×1 border`, exact.
- SmallContainer (`size="sm"`): `754px` = `720 + 34`, exact.
- FluidContainer (`fluid`): `1144px` at a 1400px viewport — clearly not
  clamped to the 960px `md` default, confirming `fluid` actually overrides
  `size` rather than silently falling back to it.

Both bugs above (missing `display: block`, the `rec-stack` flex collapse)
were caught by this live verification, not by reading the code — the first
render looked plausible from source but was completely broken in the
browser.
