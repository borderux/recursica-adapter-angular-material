import { Directive } from "@angular/core";

/**
 * Marks an element as a custom `rec-panel` header, replacing the default header (title and Close
 * button). Discouraged: nothing then guarantees a title or a Close button, so the caller must
 * supply both, plus an `aria-label` or `aria-labelledby` on the panel.
 */
@Directive({ selector: "[recPanelHeader]" })
export class PanelHeaderDirective {}
