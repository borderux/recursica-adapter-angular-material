import { Directive } from "@angular/core";

/**
 * Marks an element as a custom `rec-modal` header, replacing the default header (title and Close
 * button). Discouraged: nothing then guarantees a title or a Close button, so the caller must
 * supply both, plus an `aria-label` or `aria-labelledby` on the modal.
 */
@Directive({ selector: "[recModalHeader]" })
export class ModalHeaderDirective {}
