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

## Link build (this session): shared Storybook instance at :6007 was not actually running — visual verification not completed

**Context**: building the new `Link` component
(`projects/adapter-angular-material/src/lib/link/`). The task brief stated a
shared Storybook dev server was already running at `http://localhost:6007`
(used in parallel by other agents building Toast/Accordion) and explicitly
forbade starting a new instance or using any other port, so visual
verification via Playwright had to go through that existing instance.

**What was checked**: `curl -o /dev/null -w '%{http_code}' http://localhost:6007/`
returned `000` (connection refused) on the first attempt; `lsof -iTCP
-sTCP:LISTEN -P` showed no process listening on port 6007 (or any `600x`
port) at all; polled every 5s for 60s (12 attempts) — connection refused
every time, no server ever came up during that window. Not a transient
race — genuinely nothing bound to that port for the full minute observed.

**What wasn't done, and why**: did not start a Storybook instance on 6007
myself, since the task explicitly forbade it (risk of a port collision
crashing another agent's in-flight session if theirs started moments
later) and did not use a different port either (explicitly forbidden, and
would defeat the purpose of a _shared_ instance). As a result, the
Playwright default/hover/focus/icon-variant screenshots described in the
task brief were **not captured** — this is a real, unresolved verification
gap, not a false "confirmed working" claim.

**What was verified instead (real signal, just not the visual one)**:
`npx eslint 'projects/adapter-angular-material/src/lib/link/**/*.ts'` and
`npx tsc --noEmit -p projects/adapter-angular-material/tsconfig.lib.json`
both clean. The component was built by directly matching this adapter's
own established, real precedents token-for-token/pattern-for-pattern
(`breadcrumb.component.css`'s existing `recursica_ui-kit_components_link_*`
usage, `button.component.css`'s focus-ring block, `avatar.component.ts`'s
`[attr.data-*]`/`TemplateRef` icon convention) rather than freehand, but
that is source-reading confidence, not a rendered-pixel confirmation.
**Follow-up**: re-run the Playwright visual check (`Default`, hover via
`page.hover()`, focus via Tab, and the `WithIcon` story) once the shared
:6007 instance is confirmed actually up.

## Pre-existing bug found in `AssistiveElement`: flat `:host-context(...) .root[data-variant="x"] .descendant` rules silently don't match (out of scope to fix here)

**Context**: building `Toast` (`projects/adapter-angular-material/src/lib/toast/`).
Its CSS initially wrote per-variant descendant overrides the same way
`assistive-element.component.css` does — flat, hand-written multi-part
selectors like `:host-context([data-recursica-theme]) .root[data-variant="error"] .iconWrapper { color: ...; }`
as their own top-level rule.

**What was found**: real `getComputedStyle()` in the live Storybook (:6007)
showed the error/success variant's icon color never applying — the icon
stayed on the _default_ variant's color token even though `data-variant="error"`
was confirmed present on `.root` and the rule's compiled `cssText` was
confirmed present in the stylesheet (checked via `document.styleSheets` →
`cssRules`). Angular's emulated `ViewEncapsulation` compiler expands that
specific selector shape (a `:host-context(...)` selector list, then a
compound carrying an attribute selector, then a _further_ descendant
compound) into a form containing a stray extra `[_ngcontent-xxx]` ancestor
requirement that no real element in the rendered DOM satisfies — so the rule
compiles fine and sits in the stylesheet, but zero elements ever match it.
Not a specificity/cascade loss; a silent non-match.

**Confirmed this is not new/Toast-specific**: ran the identical check against
the already-shipped `AssistiveElement`'s `ErrorState` story
(`ui-kit-assistiveelement--error-state`) — its icon's real computed `color`
is `rgb(19, 19, 19)` (the `help`/default token), not `#9d0000` (the real,
confirmed value of `--recursica_ui-kit_components_assistive-element_variants_types_error_properties_colors_icon-color`
read directly off the element via `getComputedStyle(...).getPropertyValue(...)`).
So `AssistiveElement`'s own `.root[data-variant="error"] .iconWrapper svg`
rule has the same silent-non-match bug today, in the already-shipped
component.

**Confirmed the working alternative**: `button.component.css`'s equivalent
variant overrides use _native CSS nesting_ (`&`-implied descendant rules
inside `:host-context([data-recursica-theme]) .root[data-variant="solid"] { ... .iconWrapper { color: ...; } }`)
rather than flat selector strings — verified via the same live
`getComputedStyle()` method that Button's per-variant `.iconWrapper` color
_does_ apply correctly (`Solid`: real token-driven `#f9f9f9`, matching
`getComputedStyle`). `Toast`'s own variant CSS was written using this nested
form specifically because of this finding — see
`toast/toast.component.css`'s "ERROR VARIANT" section comment.

**Why not fixed in `AssistiveElement` itself**: out of scope for this task
(building `Toast` only; `AssistiveElement` is a different, already-shipped
component with its own owner/history). Flagging here per the "document,
don't guess" instruction rather than silently leaving a known live bug
unreported. The fix, if picked up: convert
`assistive-element.component.css`'s `.root[data-variant="help"/"error"]
.textWrapper` / `.iconWrapper svg` flat rules to the same nested `&` form
`toast.component.css` now uses, then re-verify both variants' real
`getComputedStyle()` colors in Storybook.
