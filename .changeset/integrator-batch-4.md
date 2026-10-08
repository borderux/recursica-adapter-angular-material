---
"@recursica/adapter-angular-material": minor
---

Add Link and Breadcrumb `routerLink` support (new `@angular/router` peer dependency) and native `td[recTableTd]`/`th[recTableTh]` cells for `colspan`. Panel is now always non-modal, as in React: Escape closes it, clicking the page behind does not. Breaking: the `withOverlay` and `closeOnClickOutside` inputs are removed.
