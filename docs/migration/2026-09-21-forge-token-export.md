# Migration: 2026-09-21 Forge Token Export

This documents one specific theme-file update (`recursica_brand.json`, `recursica_tokens.json`,
`recursica_ui-kit.json`, `recursica_variables_scoped.css`), applied to mantine-v8 on 2026-09-21,
following the general process in `docs/UPDATING_THEME_FILES.md`. It exists so mui-v7 and beam can
apply the _same_ export without re-discovering the same findings from scratch.

Read `docs/UPDATING_THEME_FILES.md` first — this doc assumes that process and only records what
was specific to this particular export.

## 0. Prerequisite: bump `@recursica/token-analyzer` to 1.8.0+ first

Do this **before** running `npm run analyze-tokens` on this export, or the unused-variable count
will be wildly wrong (we saw 1659 instead of the real 11 on mantine-v8).

This export renamed the internal theme/layer backing-variable segment from `_themes_` to
`_modes_` (see §1 below). `token-analyzer` versions before 1.8.0 only filter `_themes_` out of
their "used" tracking, so every legitimate `_modes_`-backed variable this export produces gets
miscounted as unused. 1.8.0 filters both. Bump the dependency, run a fresh `npm install`, and
**verify the actual installed version** — `npm install` can leave a stale cached copy in
`node_modules` even after `package.json`/`package-lock.json` show the new version, and `npm ls`
can misreport it as updated. Confirm by reading `node_modules/@recursica/token-analyzer/package.json`
directly; if it's stale, `rm -rf node_modules/@recursica/token-analyzer` and reinstall.

## 1. Cosmetic rename: `_themes_` → `_modes_` (no action needed)

Brand/ui-kit theme-and-layer backing variables were renamed:

- Old: `..._themes_<mode>_layer_<n>_ui-kit_components_X...`
- New: `..._modes_<mode>_layer_<n>_components_X...` (also dropped a redundant duplicate `ui-kit_`
  segment)

~977 of the ~2057 added / ~4090 removed variables are this rename. Component `.module.css` files
never reference these directly (they use the flat `--recursica_ui-kit_components_X...` name; the
mode/layer rebinding happens via `[data-recursica-theme]`/`[data-recursica-layer]` cascade blocks
in the CSS) — confirmed zero direct references anywhere in `src/components`. Nothing to change.

## 2. Layer emission changed: some components dropped their `_layer_N_` segment (no action needed)

Forge used to emit every mode+layer combination for every component even if the value never
changed by layer. Now it only emits `layer-0` by default, and only emits other layers if their
value actually differs — so any component whose color/variant tokens don't vary by layer now
gets `modes_<mode>_components_X` (no `_layer_` segment at all) instead of
`modes_<mode>_layer_<n>_components_X`.

This affected ~13 components (autocomplete, badge, chip, date-picker, dropdown, number-input,
segmented-control, slider, text-field, textarea, time-picker, tooltip, transfer-list) — they did
**not** lose their color/state tokens, the tokens just collapsed to one mode-scoped shape instead
of four layer-scoped ones. Verify end-to-end (flat var → cascade rebinding block → mode-scoped
source var) for a component or two before assuming a real gap; don't conclude "component X lost
its tokens" from a raw name diff alone — that was a false alarm here.

## 3. Before trusting any "new variable is unwired" finding: check `recursica-ignore` first

Recursica has a sanctioned exemption mechanism: a `/* recursica-ignore: --recursica_var_name */`
comment in a component's `.module.css` marks a variable as "seen, not implementing on purpose"
(see `packages/recursica-token-analyzer/README.md` in the monorepo, "The Exemption System").
`analyze-tokens` already excludes these from its own unused-variable count — but if you do any
_manual_ diffing of old-vs-new CSS variable names (which you will need to, per
`docs/UPDATING_THEME_FILES.md` §2, since the analyzer doesn't surface "added since last time" on
its own), **grep every candidate "new variable" against existing `recursica-ignore:` directives
before reporting it as an unwired gap.**

On this export, 14 variables that looked like genuinely new, unwired component props turned out
to be pre-existing, deliberately-documented exemptions unrelated to this update at all:

- Chip (7 vars, `properties_close-icon-color`/`leading-icon-color` + 5 selection-state variants):
  leading icon and selected/check icon are mutually exclusive by design — only one ever applies
  per state.
- FileInput (3 vars, `properties_colors_trailing-icon` + disabled/error variants): the trailing
  icon is a real nested `Button` that owns its own color/disabled tokens; FileInput never
  recolors it directly.
- Toast (3 vars, `properties_elevation_layer-1/2/3`): documented in `Toast.module.css` — a
  toast's elevation doesn't depend on the layer it's summoned from, all layer variants resolve to
  the same brand elevation value, only `layer-0` is used.

None of these need touching. Implementing them would contradict decisions already made and
written down in the code.

## 4. Confirmed real gap: grid tokens (4 vars)

New brand-layer tokens, never referenced by any `ui-kit` variable and not `recursica-ignore`d
anywhere:

- `--recursica_brand_layout-grids_default_columns: 6`
- `--recursica_brand_layout-grids_default_column-gutter`
- `--recursica_brand_layout-grids_default_margin`
- `--recursica_brand_layout-grids_default_row-gutter`

**Resolved 2026-09-21 (Matt):** wire them for real, as a proper implementation, not an exemption.

> Note (2026-10-02): `Grid` was later renamed `LayoutGrid`, and `RecursicaGridProps`/`RecursicaGridColProps` became `RecursicaLayoutGridProps`/`RecursicaLayoutGridColProps`. The text below keeps the original names.

`Grid`'s old policy ("generic layout wrapper... no intrinsic design-system styles required",
passing Mantine's native 12-column default straight through) was a real historical gap, not a
deliberate cross-cutting rule for primitive layout components — `Container` (also a primitive
layout component) already had a formal `RecursicaContainerProps` contract in `adapter-common`;
`Grid` just never got one. Added `RecursicaGridProps` to `adapter-common` and rebuilt `Grid.tsx`/
`Grid.module.css` around it — see `src/components/LayoutGrid/LAYOUT_GRID_IMPLEMENTATION_NOTES.md` in this repo
for the full implementation.

Column-gutter/row-gutter/margin are design-system-managed values, not integrator settings — an
earlier draft of this exposed them as `columnGutter`/`rowGutter`/`margin` props, but Matt flagged
that Forge already manages these via CSS variables and the integrator has no reason to alter them
per-instance. Only `columns` is exposed as a Recursica-contract override (matching
`Container.size`); `columnGutter`, `rowGutter`, and `margin` are applied unconditionally from the
design tokens with no prop at all. This is still a breaking change for any adapter applying this
same export: Mantine's native `gutter` prop is no longer accepted (not renamed to anything —
simply removed, since Grid now sets it internally from the token).

**Follow-up 2026-09-22:** while auditing whether mui-v7's Grid interface should share a prop
contract with mantine-v8's, found that both adapters had already independently built matching
`span`/`order`/`visibleFrom`/`hiddenFrom` behavior on `Grid.Col` with no shared contract behind
any of them — a real signal worth formalizing as `RecursicaGridColProps` in `adapter-common`.
Along the way, `span` (Mantine's name) vs `size` (mui-v7's name) for the column-width prop got
resolved (Matt: use Mantine's naming), and `visibleFrom`/`hiddenFrom` turned out to need a
Recursica-specific breakpoint naming convention that doesn't exist yet (their `xs`/`sm`/`md`/`lg`/
`xl` values are Mantine's own, not Recursica's).

**Paused 2026-09-22 (Matt):** rather than resolve everything before merging, all four fields
(`span`, `order`, `visibleFrom`, `hiddenFrom`) are drafted in
`adapter-common/src/components/LayoutGrid/RecursicaLayoutGridColProps.ts`, commented out, with a TODO.
`RecursicaGridColProps` currently only contributes `children`; mantine-v8's `Grid.Col` still types
all four straight off Mantine's own `GridColProps`, identical behavior to before this work started.
**mui-v7 is not touched at all.** When this gets picked back up: `span`/`order` just need
uncommenting and wiring (mui-v7 will need a breaking `size` → `span` rename); `visibleFrom`/
`hiddenFrom` need a real Recursica breakpoint naming convention first, and that convention should
also address the same `xs`/`sm`/`md`/`lg`/`xl` gap inside `span`/`order`'s own per-breakpoint map
variants. `offset` was never drafted — still undiffed between the two adapters.

## 5. Confirmed absent, not just unmapped: breakpoints

Zero hits for `breakpoint`, `viewport`, or `screen-size` (case-insensitive) anywhere in
`recursica_brand.json`, `recursica_tokens.json`, `recursica_ui-kit.json`, or the compiled CSS.
Confirm with whoever owns the Forge export config whether breakpoint tokens were meant to be part
of this export before assuming an adapter needs to build support for them.

## 6. Larger open architecture question: new brand-level palette/layer system (165 vars)

Two new, non-`recursica-ignore`d groups, referenced by nothing:

- `brand_palettes_*` (95 vars) — a new brand-level color/tone scale (`core-colors`, `neutral`,
  `palette-1`, `palette-2`).
- `brand_layer_*` (70 vars) — a new brand-level "what does layer N mean" semantic system
  (interactive/text colors, border/padding/surface properties per `layer-0`..`layer-3`, plus an
  unnumbered "current" variant).

Both are flat, mode-cascade-resolved aliases (`--recursica_brand_layer_0_properties_surface`,
no mode segment) sitting _alongside_ fully-qualified per-mode variables
(`--recursica_brand_modes_light_layers_layer-0_properties_surface`) that existing components
(Card, Avatar, etc.) already reference directly today, unchanged from the previous export. The
new flat alias is structurally identical to the existing flat/cascade pattern already used for
`ui-kit_components_*` — it isn't broken, it's just not consumed by anything yet.

Whether this is (a) Forge's export tool now generically producing a flat alias for _any_
moded/layered collection it finds (not specifically meant to be wired into anything), or (b)
intentional new public API meant to let consuming apps build custom surfaces against brand-level
tokens directly, isn't answerable from the code — it needs an answer from whoever owns the Forge
export config/design intent. Hold off on wiring anything in this group until that's resolved.

## 7. Remaining scale/global additions (44 vars), not yet applied anywhere

Real, non-exempted, but lower priority than the grid tokens — nothing consumes these yet and none
have a documented reason not to:

- `brand_elevations_*` (35): a full `elevation-0`..`elevation-4` shadow scale (x/y/blur/spread/
  color/opacity per step) — no component currently applies `box-shadow` via these. Note the
  `elevation-N` bare value is already a ready-to-use box-shadow shorthand
  (`x y blur spread color`), so wiring a component just means `box-shadow: var(--recursica_..._elevation-N);`
  once a component/property is identified as needing it.
- `brand_states_link_style` / `brand_states_link_weight` (2)
- `brand_text-emphasis_high` / `brand_text-emphasis_low` (2)
- `tokens_font_line-heights_taller` (1)

## 8. Story cleanup + a real layout bug found along the way (2026-09-23)

Matt manually cleaned up two stories that were carrying ad-hoc inline styling instead of relying
on the design system's own layout:

- `Button.stories.tsx` (`TruncatedLabel`): removed a wrapper `<div style={{ maxWidth: "250px" }}>`
  around the `Button` — the truncation the story is meant to demonstrate should come from the
  component/token system, not a hand-picked pixel value in the story itself.
- `Card.stories.tsx` (`Default`, `HeaderlessAndFooterless`): removed wrapper `<div style={{
padding, backgroundColor }}>` + `<Layer>` scaffolding around each card. Also dropped the
  `LayerDemonstration` story entirely (it existed solely to show the removed scaffolding).

While regenerating goldens for these, Matt separately flagged that `CheckboxGroup`'s
`side-by-side` layout story had its **entire control (label + items) artificially squeezed by a
max-width** — visually indistinguishable from a story-level styling mistake, but the cause was a
real bug in `FormControlLayout.module.css`: `max-width`/`min-width` (driven by the
`controlMaxWidth`/`controlMinWidth` props) were applied to `.root`, which wraps **both**
`.leftSection` (the label) and `.rightSection` (the actual control). That constrains the label too,
not just the control, most visibly in `side-by-side` layout where they sit in a row.

Fixed by moving `max-width`/`min-width` off `.root` onto `.rightSection` only. This is not
CheckboxGroup-specific — `controlMaxWidth`/`controlMinWidth` is threaded through
`FormControlWrapper` → `FormControlLayout` and set by `Dropdown`, `AutoComplete`, `TextField`,
`TextArea`, `NumberInput`, `FileInput`, and `RadioGroup` too, so all of them had the same latent
bug in `side-by-side` layout (and, less visibly, in `stacked` layout, where it constrained the
label's column above the control instead of a row beside it).

**Needs to fan out to mui-v7 and beam**: if either adapter has an equivalent shared
label+control layout primitive with a similar max-width knob, check it for the same "constrains
the whole row instead of just the control" mistake before assuming this was mantine-specific.

## Recommended order of operations for another adapter repo applying this same export

1. Bump `@recursica/token-analyzer` to 1.8.0+ first (§0) — verify `node_modules`, not just the
   lockfile.
2. Drop in the new theme files, run `npm run analyze-tokens`, confirm zero layer violations and
   zero broken/missing variables per `docs/UPDATING_THEME_FILES.md` §1.
3. Diff variable names by hand (`docs/UPDATING_THEME_FILES.md` §2). Expect the same `_themes_` →
   `_modes_` rename noise (§1) and the same ~13-component layer-collapse pattern (§2) — verify
   end-to-end on a component before treating either as a real change.
4. For anything that looks like a genuinely new, unwired variable: grep for an existing
   `recursica-ignore:` directive before reporting it as a gap (§3).
5. Grid tokens (§4) and the palette/layer question (§6) are cross-adapter decisions, not
   per-repo ones — check whether mantine-v8 already has an answer recorded here before
   re-litigating them.
