# Stack — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, not carried over

The stub's own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES
NOT EXIST` ("same conclusion as Flex"). Re-confirmed at build time.

## Real default CSS reproduced

Confirmed directly in `@mantine/core`'s compiled `styles.css`:
`align-items: stretch`, `justify-content: flex-start` — reproduced here as
this component's own defaults (matching flexbox's own natural defaults for
these two properties, unlike `Group`'s non-default `align-items: center`).

## `RecursicaOverStyled` gate skipped, shared `resolveSpacing` utility

Same reasoning as `Flex`/`Group` — see `flex/IMPLEMENTATION_NOTES.md`, not
repeated here.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 3 golden-matching stories (Default,
StaticGapSmall, StaticGapLarge) confirmed registered and compiling with
zero webpack errors in a live Storybook dev server (port 6007, isolated
from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual rendered layout was
reasoned from the code, not visually verified.
