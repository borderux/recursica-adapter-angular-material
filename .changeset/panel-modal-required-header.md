---
"@recursica/adapter-angular-material": minor
---

Panel and Modal now require `title` and a `(closed)` or `(openedChange)` listener and always render a header with a Close button (`aria-label` "Close"); `withCloseButton` is removed and `closeButtonLabel` is renamed `closeButtonAriaLabel`.
