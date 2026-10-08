---
"@recursica/adapter-angular-material": minor
---

Add the standard accessibility passthrough (`ariaLabel`/`aria-label`, `ariaLabelledby`/`aria-labelledby`, `ariaDescribedby`/`aria-describedby`, `id`) to the components that wrap a native element, forwarded to the inner element. Tabs and accordion ids are now per instance. Button no longer exposes `disableRipple` or `disabledInteractive`, Menu no longer exposes `hasBackdrop`, and Menu item no longer exposes `disableRipple`.
