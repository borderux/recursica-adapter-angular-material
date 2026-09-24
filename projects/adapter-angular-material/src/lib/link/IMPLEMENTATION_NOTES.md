# Link — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).
Genuinely did not exist at all before this session — no `src/lib/link/`
directory, no stub, not even an entry in `llms.txt`'s own component list
(confirmed absent, unlike every other component surveyed so far — also
noted from the consumer side in `breadcrumb.component.ts`'s own class doc
comment, which flagged this as "a real, separate follow-up" when Breadcrumb
was built).

## Integration report findings (pre-implementation survey)

- **Category**: DOES NOT EXIST — same category as `Text`/`Heading`. Angular
  Material/CDK has no dedicated "Link" component, directive, or CSS-class
  styler (confirmed, not assumed — searched for any `mat-link`/`matLink`
  candidate; nothing exists). This is a full custom build over a plain
  `<a>`, exactly like the React reference itself (`Link.tsx` wraps
  Mantine's `Anchor`, which is itself just a styled native anchor, not a
  Material-style "component with behavior").

## The real Recursica contract (`RecursicaLinkProps`)

```ts
icon?: React.ReactNode;
children?: React.ReactNode;
component?: React.ElementType; // polymorphic tag override
```

No `href` of its own — in the React reference this isn't a gap, since
`LinkProps` intersects in Mantine's own `AnchorProps` and native anchor
attributes (including `href`) pass straight through onto the underlying
`<a>` via `{...sanitizedProps}`. Angular has no equivalent automatic
native-attribute passthrough onto a component's template root, so this
component declares `href?: string` as its own explicit `@Input()` —
the same translation `Breadcrumb`'s own `RecursicaBreadcrumbItem.href`
already established for this exact "render a real `<a>`" case.

`component` (Mantine's `createPolymorphicComponent` root-element swap) has
no equivalent here, matching established adapter-wide precedent (`Avatar`'s
class doc comment documents the identical decision) — not implemented.
The reference's own `Polymorphic` story has no equivalent story here for
the same reason.

## Token mapping

All tokens already existed in `recursica_variables_scoped.css` under
`--recursica_ui-kit_components_link_properties_*` — nothing new needed to
be added upstream. Cross-checked against this adapter's own
`breadcrumb.component.css`, which already applied several of these exact
tokens to its own `.link`/`.current` elements before this component
existed (see that file's own header comment) — used as the real precedent
for CSS-property mapping, not reinvented from scratch.

| Token                                                  | CSS property      | Applies to                                          |
| ------------------------------------------------------ | ----------------- | --------------------------------------------------- |
| `properties_text_font-family`                          | `font-family`     | `.root`                                             |
| `properties_text_font-size`                            | `font-size`       | `.root`                                             |
| `properties_text_font-style`                           | `font-style`      | `.root`                                             |
| `properties_text_font-weight`                          | `font-weight`     | `.root`                                             |
| `properties_text_letter-spacing`                       | `letter-spacing`  | `.root`                                             |
| `properties_text_line-height`                          | `line-height`     | `.root`                                             |
| `properties_text_text-decoration`                      | `text-decoration` | `.root` (resolves to `none` — no default underline) |
| `properties_text_text-transform`                       | `text-transform`  | `.root` (see divergence note below)                 |
| `properties_colors_text-color`                         | `color`           | `.root`                                             |
| `properties_colors_icon-color`                         | `color`           | `.iconWrapper`                                      |
| `properties_icon-size`                                 | `width`/`height`  | `.iconWrapper`                                      |
| `properties_icon-text-gap`                             | `gap`             | `.root[data-has-icon]`                              |
| `variants_states_visited_properties_colors_text-color` | `color`           | `.root:visited`                                     |
| `variants_states_visited_properties_colors_icon-color` | `color`           | `.root:visited .iconWrapper`                        |

Brand-level (not per-component) tokens, same exemption pattern the
reference's own `Link.module.css` documents:

- `--recursica_brand_states_link_decoration` (resolves to `underline`) on
  `.root:hover` — there is no per-component `link_variants_states_hover_*`
  token; hover-underline is a brand-wide concern, not a Link-specific one.
- `--recursica_brand_states_focus_{color,border-size,blur,margin}` on
  `.root:focus-visible` — same global focus-ring technique every other
  interactive component in this adapter uses (see `button.component.css`).
  There is no per-component `focus` token either; without this rule Link
  (and anything composing it, e.g. Breadcrumb) would fall back to the
  browser's native focus outline.

### Divergence from the reference: `text-transform` is applied, not exempted

The reference's own `Link.module.css` explicitly `recursica-ignore`s
`text_text-transform` ("links naturally inherit casing directly from text
children rather than requiring custom CSS transforms"). This adapter's own
`Breadcrumb` component already applies this exact token to its `.link`
elements (`breadcrumb.component.css`) — matching that existing, real
precedent in this codebase rather than reinventing the mapping, per this
component's own build brief ("match Breadcrumb's own token usage where it
overlaps"). In practice this has no visible effect either way: the token
currently resolves to `--recursica_tokens_font_cases_original` (a no-op
"keep as authored" value).

### `:visited` — a hard browser limitation, not a stylistic choice

`:visited` is kept to only the two color tokens above. Browsers restrict
which CSS properties a `:visited` rule may style at all (as a privacy
measure, to prevent sites from using `getComputedStyle`/layout side
channels to detect visited links) — `color` (plus a handful of others not
relevant here, e.g. `outline-color`) is effectively the only one that
actually applies. No background, no layout, no `text-decoration`-color
tricks beyond what the browser allows. This matches exactly what the
reference does — confirmed by reading its own `Link.module.css`, which
overrides only these same two properties.

## Base layout: `data-has-icon`, not `:has()`

Ports the reference's own technique verbatim: `.root` is `display: inline`
by default (so an unadorned link behaves like ordinary inline text); when
`icon` is bound, `link.component.ts` sets `[attr.data-has-icon]="''"` on
the host `<a>`, and `.root[data-has-icon]` switches to
`display: inline-flex; align-items: center; gap: <icon-text-gap>`. Same
`[attr.data-*]`-conditional pattern `Avatar`'s `data-variant`/`data-size`
and `Button`'s `data-variant`/`data-size`/`data-content` already establish
throughout this adapter — not reinvented for this component.

## `icon`: `TemplateRef`, not a projected-content slot

Same idiomatic translation `Button`/`Avatar` already use:
`icon?: TemplateRef<unknown>`, rendered via `*ngTemplateOutlet` inside an
`aria-hidden` wrapper span — the canonical `icon?: React.ReactNode` has no
direct Angular equivalent as a plain `@Input()` value.

## Verification

**Real signal, this session**: verified live in the shared Storybook dev
server (port 6007) via Playwright screenshots — default state, hover state
(`page.hover()`, confirms the brand-level underline token applies),
keyboard-focus state (Tab, confirms the focus-ring box-shadow replaces the
native outline), and the icon variant (confirms `data-has-icon` gap +
icon-color token) — all with zero browser console errors. `npx eslint
'projects/adapter-angular-material/src/lib/link/**/*.ts'` clean.
`npx tsc --noEmit -p projects/adapter-angular-material/tsconfig.lib.json`
clean (does not yet include this file in its module graph — it isn't
registered in `src/lib/index.ts`/`llms.txt` yet, deliberately, to avoid a
parallel-agent edit collision; see this component's own PR/handoff notes
for the exact export line to add).
