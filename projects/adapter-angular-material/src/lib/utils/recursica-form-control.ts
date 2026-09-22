import { InjectionToken } from "@angular/core";

/**
 * The Angular-native replacement for React's `cloneElement()`-based
 * id/ARIA wiring (`FormControlWrapper.tsx`'s `content = React.cloneElement(children, {...})`)
 * — Angular has no way for a parent to mutate attributes onto opaque
 * `<ng-content>`-projected content, so there's nothing to clone onto.
 *
 * Modeled on Angular Material's own real solution to the identical problem:
 * `MatFormField` declares a `ContentChild(MatFormFieldControl)` and calls
 * `setDescribedByIds()` on whatever it finds directly — a DI query, not
 * prop-cloning. This is the same pattern, deliberately lighter than
 * `MatFormFieldControl` itself: that interface also carries `stateChanges`/
 * `ngControl`/`errorState`/floating-label state built for `<mat-form-field>`'s
 * own visual chrome, which `FormControlWrapper` doesn't use at all (same as
 * the genesis adapter's own `FormControlWrapper` not rendering Mantine's
 * `Input.Wrapper` chrome either — it only borrows prop *types*).
 *
 * Every real Recursica input component (`TextField`, `Checkbox`, etc., once
 * built) provides itself under this token — e.g.:
 *
 * ```ts
 * providers: [{ provide: RECURSICA_FORM_CONTROL, useExisting: forwardRef(() => TextFieldComponent) }]
 * ```
 *
 * `id` is a read-only getter the control owns and generates itself if the
 * caller didn't supply one (mirroring `MatFormFieldControl.id`/`MatInput`'s
 * own `_uniqueId` fallback) — `FormControlWrapper` reads it for the label's
 * `for`, it does not invent or inject one, unlike the React reference's
 * `useId()`-generated id.
 */
export interface RecursicaFormControl {
  readonly id: string;
  setDescribedByIds(ids: string[]): void;
}

export const RECURSICA_FORM_CONTROL = new InjectionToken<RecursicaFormControl>(
  "RecursicaFormControl",
);
