---
"@recursica/adapter-angular-material": patch
---

Fixed `rec-panel` throwing when `[opened]` starts `true` at creation (same `ngOnChanges`-before-`ngAfterViewInit` `@ViewChild` crash `rec-modal` had). Fixed `rec-switch`'s thumb never sliding and its check/close icon never swapping on toggle. Found and fixed the root cause behind both, plus 10 other components' silently-inert selectors: a `ViewEncapsulation.Emulated` selector-scoping transform mis-scopes a `:host-context(...)` selector chain split one-token-per-line, silently losing specificity against its own base declaration. Collapsed every affected selector to one line across `switch`, `checkbox`, `radio`, `dropdown`, `auto-complete`, `text-field`, `number-input`, `slider`, `segmented-control`, `menu-item`, `file-upload`, and `timeline-item`.
