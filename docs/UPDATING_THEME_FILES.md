<critical_agent_directive>
STOP AND READ THIS FIRST.
If you are an AI agent tasked with updating this repo's Recursica theme files:

1. You do NOT generate, mock, or hand-write these files yourself. They come from a real [Forge Recursica](https://forge.recursica.com) export, dropped into the project root by a human. Your job starts once the new files are already there.
2. You MUST run `npm run analyze-tokens` before touching any component code. Its output (`token-analysis.json`) is the source of truth for what actually broke — never guess from the raw `git diff`.
3. If `analyze-tokens` reports broken/missing variables, you MUST NOT silently invent a replacement value or delete the referencing CSS declaration on your own judgment. Per `CONTRIBUTING.md` rule 4: inform the developer and pause. A missing variable usually means the design system changed something structurally, not just a value — confirm the intended fix before editing 1 file or 30.
4. If `analyze-tokens` reports new/added variables (a "diff" step you do by hand — the tool doesn't currently flag this), do NOT wire them into components unasked. Present the list to the developer and get an explicit go/no-go before touching any `.module.css`.
5. Never publish (`npm run release`) with `analyze-tokens` failing. It runs automatically as `prebuild`, so a broken build is also a broken release — but check it explicitly and early, not just by waiting for `npm run build` to fail.
   </critical_agent_directive>

# Updating Theme Files

This repo checks in five files generated from the Recursica design system, at the project root:

- `recursica.json`
- `recursica_tokens.json`
- `recursica_brand.json`
- `recursica_ui-kit.json`
- `recursica_variables_scoped.css`

They're bootstrapped once via `@recursica/official-release`'s postinstall script (see `docs/CREATING_AN_ADAPTER.md`), but after that first install **they are not touched by any package manager** — updating them is a manual, human-initiated act: export the current theme from [Forge Recursica](https://forge.recursica.com) and replace the four JSON/CSS files at the project root (`recursica.json` is hand-authored per-project and is not part of a Forge export). This document is the process to follow once those replacement files are in place, before committing them.

## The process

### 1. Run the token analyzer

```sh
npm run analyze-tokens
```

This diffs every component's `.module.css` `var(--recursica_...)` references against what the new `recursica_variables_scoped.css` actually defines, and writes the full detail to `token-analysis.json` (gitignored — regenerate on demand, don't commit it). Four things to check in its output, in order:

**a. Layer violations** (`layerViolations` / the "❌ layer violations" banner) — a component CSS file reading a `--recursica_brand_*` variable directly without a `recursica-allow-brand:` exemption header. These must be zero before proceeding; if not, this is a preexisting problem unrelated to the new export and should be fixed on its own first.

**b. Broken/missing variables** (`missingVariables` / brokenComponents) — a component references a `--recursica_...` variable that no longer exists in the new CSS. **This blocks publishing.** For each one:

- Find out _why_ it's gone: check the corresponding token in the new `recursica_ui-kit.json`/`recursica_brand.json`/`recursica_tokens.json` against the previous version (`git show HEAD:recursica_ui-kit.json`, etc.). If the JSON model still defines the property but the compiled CSS dropped it, that's a strong signal of an upstream Forge/export bug, not an intentional design change — worth flagging back to whoever owns the Forge export, not just patching around silently.
- Do not fix the reference on your own judgment (see directive #3 above). Report the affected variables/components and your root-cause read to the developer, and propose the fix (e.g. drop the declaration, hardcode a literal, wait for a corrected export) rather than picking one and moving on.
- Only after the developer confirms a direction, make the change per-component, re-running `analyze-tokens` until `totalMissing` is 0.

**c. Stale exemptions** (`staleExemptions`) — a `recursica-allow-brand:` header naming a variable that no longer needs the exemption (e.g. the design system moved it into the `ui-kit` layer for real). Remove exemptions the analyzer flags as stale; leave the rest.

**d. Unused variables** (`unusedByComponent`) — non-blocking, informational. A large count is expected for any component that's still a stub or that intentionally doesn't consume every property the design system defines for it (see `analyze-tokens`' own docs — this never fails the build). Skim it for anything surprising, but it's not a gate.

### 2. Check for new CSS variables

The analyzer doesn't currently surface "added since last time" as its own report — diff the variable names by hand:

```sh
grep -o -- '--recursica[a-zA-Z0-9_-]*' recursica_variables_scoped.css | sort -u > /tmp/new_vars.txt
git show HEAD:recursica_variables_scoped.css | grep -o -- '--recursica[a-zA-Z0-9_-]*' | sort -u > /tmp/old_vars.txt
comm -13 /tmp/old_vars.txt /tmp/new_vars.txt   # new variables
comm -23 /tmp/old_vars.txt /tmp/new_vars.txt   # removed variables
```

Bring the new-variable list to the developer and ask whether they should be wired up. **Do not decide this yourself and do not start editing components until you get a yes.** New variables are usually a genuinely new Figma feature (a new size, a new state, a new sub-part of a component) — implementing one means making the same kind of judgment call as building a new component, not a mechanical token swap.

### 3. If the developer says yes to wiring up new variables

Step through each affected component individually:

1. Read the new variable(s) in context — what property, what variant/state, what component sub-part.
2. Wire it into the component's `.module.css`, following the existing rules in `docs/COMPONENT_DEV_GUIDE.md` (CSS Modules only, no hardcoded values, no `var(--x, fallback)`).
3. Verify with `npm run adapter-tester:automated` for that component specifically before moving to the next one — don't batch several components' changes together and verify once at the end; a failure should be traceable to the one component that caused it.
4. Update that component's `IMPLEMENTATION_NOTES.md` with what changed and why.
5. Add a changeset (see `CONTRIBUTING.md`).

### 4. Before committing the updated theme files

- `npm run analyze-tokens` reports zero broken variables and zero layer violations.
- `npm run check-types && npm run lint` both pass.
- `npm run adapter-tester:automated` passes for any component touched.
- A changeset is staged summarizing the theme update (and, separately, one per component if new variables were wired up — keep them as distinct changesets per `CONTRIBUTING.md`'s brevity rule, not one giant entry).
