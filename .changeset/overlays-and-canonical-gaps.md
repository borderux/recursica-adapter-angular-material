---
"@recursica/adapter-angular-material": minor
---

Modal gets `closeOnEscape`, `trapFocus`, `returnFocus`, `lockScroll`, `role`, `closeButtonLabel` and an accessible name. Popover, hover-card, tooltip and the menu trigger put their aria state on the real focusable child; popover no longer swallows the first outside click; tooltip delays are `openDelay`/`closeDelay` (`showDelay`/`hideDelay` are deprecated aliases). Add checkbox, radio and switch `description` and `error`, slider `changeEnd` and `tooltipLabel`, time-picker `minTime`/`maxTime`, dropdown `containerWidth`, menu `maxHeight`, accordion `variant`, panel `wrapHeaderText`, and translatable labels (number-input, dropdown, slider, transfer-list, tree). A non-interactive chip is no longer `aria-hidden`; table rows no longer set `aria-selected`.
