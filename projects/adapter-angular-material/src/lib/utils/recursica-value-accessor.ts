import { Provider, Type, forwardRef } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

/**
 * Shared `onChange`/`onTouched` callback storage for a component's own
 * `ControlValueAccessor` implementation — see `docs/COMPONENT_DEV_GUIDE.md`'s
 * "Forms integration" section for the full rationale and the per-component
 * contract this pairs with (`writeValue`/`setDisabledState` still live on
 * the component itself, since only it knows its own `value`/`disabled`
 * property names).
 */
export class RecursicaValueAccessor<T> {
  private onChangeFn: (value: T) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private bound = false;

  /**
   * @param syncValue Called with each user-driven value while a form control is bound. A bound
   *   control's value was last set by `writeValue`, which makes the component's own value input
   *   "controlled"; without syncing it here the component would keep rendering the stale value
   *   after the user interacts (Angular forms only calls `writeValue` for model-to-view changes).
   */
  constructor(private readonly syncValue?: (value: T) => void) {}

  registerOnChange(fn: (value: T) => void): void {
    this.onChangeFn = fn;
    this.bound = true;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  /** Call alongside the component's own `valueChange`/`checkedChange` emit. */
  notifyChange(value: T): void {
    if (this.bound) {
      this.syncValue?.(value);
    }
    this.onChangeFn(value);
  }

  /** Call on blur, or the closest equivalent "done interacting" signal. */
  notifyTouched(): void {
    this.onTouchedFn();
  }
}

/**
 * `providers: [recursicaValueAccessorProvider(MyComponent)]` — registers the
 * component as its own `NG_VALUE_ACCESSOR`, so `[formControl]`/`ngModel`
 * bind directly onto it.
 */
export function recursicaValueAccessorProvider(
  component: Type<unknown>,
): Provider {
  return {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => component),
    multi: true,
  };
}
