---
"@recursica/adapter-angular-material": patch
---

Fixed `rec-heading` never rendering its projected content (five of six `@switch` branches each had their own `<ng-content>`, silently dropping children) and `rec-modal` throwing when `[opened]` starts `true` at creation (its `@ViewChild`-queried `TemplateRef` wasn't resolved yet when `ngOnChanges` tried to open the dialog).
