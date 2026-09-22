# FormControlLayout — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

No Angular Material equivalent — same conclusion as `AssistiveElement`/
`Label`, confirmed for the composed case too: `MatFormField`'s real
compiled template only ever renders its label inside the same flex
container as the input (Material's floating-label model), with no
supported way to place it as an independent side-by-side column. Full
investigation in `label/IMPLEMENTATION_NOTES.md`. Built from scratch,
directly matching the genesis adapter's real
`FormControlLayout.tsx`/`.module.css` structure and tokens — note the
layout tokens live under the `recursica_ui-kit_components_label_variants_layouts_*`
tree, not a `form-control-layout`-named one, matching the React reference.

`leftSection` is a `TemplateRef`, not a projected-content slot — same
translation as `Button`'s `icon`. Typically a `<rec-label>`, but not typed
as one, matching the React reference accepting any node (e.g. for aligning
a standalone `Switch`/`Checkbox` with no label present).
