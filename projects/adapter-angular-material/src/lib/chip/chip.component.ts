import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
  signal,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

/**
 * Recursica `Chip` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The step-9
 * stub's own findings row (`MatChip`/`MatChipSet`/`MatChipRemove`, category
 * EASY, "A standalone `MatChip`... can sit in a plain `<mat-chip-set>`...
 * Minor compositional overhead... but a strong match") did not survive
 * reading the real compiled source (`@angular/material/fesm2022/chips.mjs`)
 * — this component is **hand-built**, not a wrapper around `mat-chip`/
 * `mat-chip-option`. See IMPLEMENTATION_NOTES.md for the full investigation;
 * short version:
 *
 * 1. `MatChip`'s real compiled component metadata declares
 *    `encapsulation: i0.ViewEncapsulation.None` (confirmed directly, both in
 *    the `ɵcmp` call and the `@Component` decorator args) — the same
 *    category of problem `Tabs`/`Stepper`/`Menu`'s own notes already
 *    document for `MatTabGroup`/`MatStepper`/`MatMenu`: every element
 *    `MatChip`'s own template renders (`.mat-mdc-chip-focus-overlay`,
 *    `.mdc-evolution-chip__cell`, `.mdc-evolution-chip__action`,
 *    `.mdc-evolution-chip__text-label`, `.mdc-evolution-chip__graphic`, the
 *    built-in `.mdc-evolution-chip__checkmark` SVG) belongs to `MatChip`'s
 *    own view, never this adapter's — Emulated-scoped CSS written here can
 *    never reach it. Worse than `Tabs`/`Stepper`'s finding in one respect:
 *    because `MatChip` ships `ViewEncapsulation.None`, its own ~9KB of
 *    baked-in MDC styles (`--mat-chip-*`/`--mat-sys-*` custom properties,
 *    all the `.mdc-evolution-chip--selected`/`--disabled`/`--with-*`
 *    state-class combinators) load as **unscoped global CSS**, so simply
 *    importing the Material chip module leaks selectors like
 *    `.mat-mdc-chip-focus-overlay` onto the page with no scoping at all.
 * 2. `MatChip`'s trailing-icon padding (`8px`/`12px`), graphic padding
 *    (`4px`/`6px`), icon sizes (`18px`/`24px` hardcoded pixel fallbacks
 *    behind `--mat-chip-with-icon-icon-size`/`--mat-chip-with-avatar-avatar-size`)
 *    and its selected/unselected/disabled color story are all expressed as
 *    `--mat-chip-*` MDC custom properties chained to `--mat-sys-*` Material
 *    System tokens, activated by class-combinator selectors
 *    (`.mdc-evolution-chip--selected:not(.mdc-evolution-chip--disabled)`,
 *    etc.) — a completely different shape from Recursica's own
 *    unselected/selected × default/error 2×2 state matrix, each cell a flat
 *    set of `--recursica_ui-kit_components_chip_variants_selection-states_*`
 *    background/border/text/icon color tokens applied via a handful of CSS
 *    custom properties. There is no `--mat-chip-*` slot for "error" at all
 *    (Material chips have no error/invalid concept — only
 *    selected/highlighted/disabled). Reaching Recursica's exact 2×2 matrix
 *    through `MatChip`'s API would mean overriding a dozen-plus
 *    `--mat-chip-*` variables per state combination while fighting its own
 *    unscoped, `:not()`-chained cascade, rather than swapping a handful of
 *    custom properties the way `.label[data-checked]`/`.root[data-error]`
 *    do here.
 * 3. Selection (`MatChipOption`) only exists inside `MatChipListbox`, and
 *    removal (`MatChipRemove`) is documented as working with `MatChipRow`
 *    inside `MatChipGrid` — real compositional overhead even for a single
 *    standalone toggle/dismiss chip, exactly the caveat the stub's own
 *    "Notes" row already flagged ("still needs a mat-chip-set wrapper even
 *    for one chip"), compounded by finding 1 once actually read.
 *
 * Given all three, this hand-built `<span>`-based component (no Material
 * import at all) mirrors the React reference's own DOM shape
 * (`.root` → `.label` → `.innerWrapper` → leading/check icon, label text,
 * delete affordance) directly, giving full control over the exact class
 * names the ported CSS (from `Chip.module.css`) expects.
 *
 * ## `checked`/`defaultChecked`/`(checkedChange)`: same controlled/
 * uncontrolled convention as `Tabs`'s `value`/`defaultValue`/`(valueChange)`
 *
 * `checked` left unbound (`undefined`) means uncontrolled — an internal
 * signal (seeded from `defaultChecked`) tracks it, toggled on click.
 * Explicitly binding `[checked]` makes this a controlled component: clicks
 * still emit `(checkedChange)`, but the visible state only changes once the
 * caller updates the bound value — matching Mantine's own
 * `useUncontrolled`-backed `checked`/`defaultChecked`/`onChange` trio that
 * the React reference's `Chip.tsx` forwards through to `MantineChip`.
 *
 * ## `icon`: `TemplateRef`, not a projected-content slot
 *
 * Same translation as `Button`'s `icon` / `Tabs.Tab`'s `leftSection`/
 * `rightSection` — the canonical `RecursicaChipProps.icon?: React.ReactNode`
 * has no direct Angular equivalent. Rendered via `NgTemplateOutlet`, and
 * only shown while `!checkedValue` — a checked chip's checkmark replaces
 * it rather than sitting beside it (matching the React reference's own
 * `{icon && !checked && ...}` swap, itself added specifically to match
 * `mui-adapter`'s `icon={checked ? checkIcon : icon}` behavior — see
 * `CHIP_IMPLEMENTATION_NOTES.md`'s 2026-08-28 entry in the reference repo).
 *
 * ## `(remove)`/`isRemovable`: `EventEmitter.observed`, same trick as `Stepper`'s `hasClickListener`
 *
 * The canonical contract shows the delete ("x") affordance only when a
 * caller actually supplies `onDelete` (`!!onDelete`, a real prop-presence
 * check React can make that Angular can't mirror directly for an
 * `@Output()`). `isRemovable` therefore reads `this.remove.observed`
 * (`EventEmitter<T>` extends RxJS `Subject<T>`, which exposes a real
 * `observed` getter) — the identical translation `Stepper`'s own
 * `hasClickListener`/`StepperComponent.stepClick.observed` already
 * established for the same category of "is anything actually listening"
 * check.
 */
@Component({
  selector: "rec-chip",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./chip.component.css",
  template: `
    <span
      class="root"
      [attr.data-error]="error ? '' : null"
      [attr.data-interactive]="isInteractive ? '' : null"
      [attr.data-disabled]="disabled ? '' : null"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <span
        class="label"
        role="checkbox"
        [attr.aria-checked]="isInteractive ? checkedValue : null"
        [attr.aria-disabled]="disabled ? true : null"
        [attr.aria-hidden]="!isInteractive ? true : null"
        [attr.data-checked]="checkedValue ? '' : null"
        [attr.data-disabled]="disabled ? '' : null"
        [attr.tabindex]="isInteractive && !disabled ? 0 : -1"
        (click)="onClick($event)"
        (keydown)="onKeydown($event)"
      >
        <span class="innerWrapper">
          @if (checkedValue) {
            <span class="leadingIcon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 10 7"
                fill="currentColor"
              >
                <path
                  d="M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"
                />
              </svg>
            </span>
          } @else if (icon) {
            <span class="leadingIcon" aria-hidden="true">
              <ng-container [ngTemplateOutlet]="icon" />
            </span>
          }

          <span class="children"><ng-content /></span>

          @if (isRemovable) {
            <span
              class="deleteIcon"
              role="button"
              [attr.aria-label]="deleteLabel"
              [attr.tabindex]="disabled ? -1 : deleteTabIndex"
              (click)="onRemoveClick($event)"
              (keydown)="onRemoveKeydown($event)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </span>
          }
        </span>
      </span>
    </span>
  `,
})
export class ChipComponent implements RecursicaOverStyled, OnInit {
  /** `RecursicaChipProps.error` — applies the error-state token variant. */
  @Input() error = false;

  /**
   * Not part of the canonical `RecursicaChipProps` contract (inherited in
   * the React reference from Mantine's own native `disabled` input, which
   * has no equivalent underlying type to inherit from here — same situation
   * `Button`'s own notes document for `loading`). Declared directly:
   * `Chip.module.css`'s own `.root[data-disabled]` rule (opacity +
   * `cursor: not-allowed`) has no other trigger otherwise.
   */
  @Input() disabled = false;

  /** `RecursicaChipProps.icon` — leading icon, `TemplateRef` translation (see class doc comment). */
  @Input() icon?: TemplateRef<unknown>;

  /** `RecursicaChipProps.deleteLabel`, defaults to `"Delete"`. */
  @Input() deleteLabel = "Delete";

  /** `RecursicaChipProps.deleteTabIndex` — roving-tabindex escape hatch for a caller-managed chip group. */
  @Input() deleteTabIndex = 0;

  /** Controlled `checked`. Leave unbound for uncontrolled (see class doc comment). */
  @Input() checked?: boolean;

  /** Initial `checked` for the uncontrolled case. */
  @Input() defaultChecked = false;

  /** Emitted on every click, whether controlled or uncontrolled. */
  @Output() checkedChange = new EventEmitter<boolean>();

  /**
   * `RecursicaChipProps.onDelete` translation — emits on click/Enter/Space
   * on the delete affordance. Its presence (`.observed`) is what makes the
   * affordance render at all — see class doc comment.
   */
  @Output() remove = new EventEmitter<MouseEvent>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly _uncontrolledChecked = signal(false);

  ngOnInit(): void {
    this._uncontrolledChecked.set(this.defaultChecked);
  }

  get checkedValue(): boolean {
    return this.checked !== undefined
      ? this.checked
      : this._uncontrolledChecked();
  }

  get isRemovable(): boolean {
    return this.remove.observed;
  }

  /**
   * A chip only counts as interactive when something actually responds —
   * matches the React reference's own `isInteractive` (2026-08-18 fix,
   * documented in `CHIP_IMPLEMENTATION_NOTES.md`): merely binding `checked`
   * to pin a display-only chip to a fixed visual state isn't itself an
   * interaction.
   */
  get isInteractive(): boolean {
    return this.isRemovable || this.checkedChange.observed;
  }

  onClick(event: MouseEvent): void {
    if (this.disabled || !this.isInteractive) return;
    void event;
    const next = !this.checkedValue;
    if (this.checked === undefined) {
      this._uncontrolledChecked.set(next);
    }
    this.checkedChange.emit(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    this.onClick(event as unknown as MouseEvent);
  }

  onRemoveClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;
    this.remove.emit(event);
  }

  onRemoveKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;
    this.remove.emit(event as unknown as MouseEvent);
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
