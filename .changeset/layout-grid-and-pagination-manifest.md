---
"@recursica/adapter-angular-material": minor
---

`rec-grid`/`rec-grid-col` are now `rec-layout-grid`/`rec-layout-grid-col` (`LayoutGridComponent`/`LayoutGridColComponent`) and follow Forge's breakpoint-aware layout-grid tokens (columns, gutters, margin); the `columns`, `columnGutter`, `rowGutter` and `margin` inputs are removed. `rec-pagination` now renders Recursica Buttons whose style and size come from the Forge manifest, so `rec-theme-provider` needs the new `[manifest]` input or Pagination throws. New `breakpointsFromRecManifest` helper. `FormControlLayout`'s `controlMaxWidth`/`controlMinWidth` now constrain only the control, not the label. Theme files updated from the latest Forge export.
