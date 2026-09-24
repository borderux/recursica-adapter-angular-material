---
"@recursica/adapter-angular-material": patch
---

Fixed dist build: 6 of 9 overlay CSS files (popover, modal, date-picker, panel, auto-complete, hover-card) weren't copied to dist, the published version was hardcoded to 0.0.0, and none of the overlay CSS files were resolvable via package.json's exports map. Added a `./*.css` wildcard export so every overlay CSS file resolves without needing an individual entry.
