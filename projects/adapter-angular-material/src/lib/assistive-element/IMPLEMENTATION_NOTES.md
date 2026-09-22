# AssistiveElement — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

No Angular Material counterpart exists — confirmed against the full
`@angular/material` package: there's no standalone "helper/error text row"
component or directive anywhere in it (Material's own form-field hint/error
text renders internally inside `MatFormField`, not as a reusable element).
Built from scratch as a plain `<div>`, directly matching the genesis
adapter's real `AssistiveElement.tsx`/`.module.css` — same tokens
(`recursica_ui-kit_components_assistive-element_*`), same fixed
variant-specific icon (no custom-icon slot), same `error` → `role="alert"`
default.
