/**
 * CSS `printWidth` override: prettier's default 80-column wrap breaks
 * Angular's `ViewEncapsulation.Emulated` selector-scoping transform when it
 * splits a `:host-context(...)` selector chain across multiple lines (each
 * token except the last loses its own `[_ngcontent-*]` scoping attribute,
 * silently losing the specificity fight against the rule's own base
 * declaration — confirmed live via the compiled CSSOM, not assumed). 120
 * comfortably covers this codebase's longest real selector (~103 chars)
 * with headroom, without disabling CSS formatting altogether.
 */
export default {
  overrides: [
    {
      files: "*.css",
      options: {
        printWidth: 120,
      },
    },
  ],
};
