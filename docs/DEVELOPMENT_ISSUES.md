# Development Issues

Notable gaps found during development that were investigated and consciously
left unresolved, with the reasoning for why — not guesses, verified findings.

## AutoComplete/Dropdown story containers cap width below the `max-width` token

**Context**: Matt's visual-discrepancy report (`ui-kit-autocomplete--with-leading-icon`,
`ui-kit-dropdown--default`) flagged the rendered control as narrower than the
Mantine reference, and asked for the control to "expand until the max-width."

**What was fixed**: Both `AutoCompleteControlComponent` and `DropdownComponent`
correctly fill 100% of their available container width, capped by their
respective `--recursica_ui-kit_components_{autocomplete,dropdown}_variants_layouts_stacked_properties_max-width`
tokens (464px) — `dropdown.component.css`'s `.root` previously had no
`max-width`/`min-width` at all; that's now fixed (see this component's own
`.root` rule). Verified live: temporarily widening each story's `<rec-stack>`
container past 464px, the trigger's own `.root`/`.input` correctly stopped
growing at exactly 464px in both components.

**What's still visually narrower than the golden screenshots, and why it
wasn't touched**: every AutoComplete/Dropdown story (`Default`,
`WithLeadingIcon`, etc.) wraps its component in `<rec-stack style="width:
320px;">`. Mantine's own equivalent stories (`AutoComplete.stories.tsx`,
`Dropdown.stories.tsx`) impose **no** container width at all, so its
`max-width: 464px` token visibly governs the rendered width in the golden
screenshots. This repo's own `320px` wrapper is a **pre-existing, repo-wide
convention** — confirmed via `grep -rn 'rec-stack style="width:'
projects/adapter-angular-material/src/lib --include="*.stories.ts"`: the same
`320px` pattern is used by `text-field`, `date-picker`, `time-picker`,
`text-area`, `number-input`, `file-input` stories too (9 files total), not
something specific to AutoComplete/Dropdown. Changing it only for the two
components in this bug report would create an inconsistency with every other
field's `Default` story; changing it everywhere is a much larger, deliberate
call belonging to whoever owns that convention, not something to silently
do as a side effect of an unrelated CSS bug fix. Left as-is — the underlying
component `max-width` mechanism is fixed and verified working, the visual
gap remaining in these specific story screenshots is entirely attributable to
this separate, intentional story-authoring convention.
