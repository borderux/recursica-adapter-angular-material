import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
} from "@angular/core";
import {
  MAT_NATIVE_DATE_FORMATS,
  provideNativeDateAdapter,
} from "@angular/material/core";
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerInputEvent,
} from "@angular/material/datepicker";
import { MatInput } from "@angular/material/input";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

let nextId = 0;

/**
 * Internal `<input matDatepicker>` + `<mat-datepicker>` primitive backing
 * `rec-date-picker` — same two-tier split as `TextArea`/`NumberInput` (see
 * `text-area-control.component.ts`'s own doc comment for why the
 * `RECURSICA_FORM_CONTROL` provider has to live on a node *inside*
 * `rec-with-read-only-wrapper`'s projected `activeTemplate`, not on the
 * outer public component).
 *
 * ## `MatDatepicker`/`MatDatepickerInput` — adopted, unlike the popup family rejected elsewhere
 *
 * The stub's own `IMPLEMENTATION_NOTES.md` already flagged this as the
 * "most capable starting point of any 'hard' component surveyed" (a real
 * calendar, month/year navigation, keyboard nav, min/max, i18n — all
 * genuinely working), unlike `MatTabGroup`/`MatSelect`/`MatChip`/
 * `MatStepper`/`MatSlideToggle`, which were all rejected because their
 * `ViewEncapsulation.None` DOM had no usable shape to begin with (wrong
 * fusion of concerns, fixed index-based selection, etc.). Re-confirmed
 * directly against the compiled source before building, same rigor as
 * every other adoption/rejection call in this adapter:
 *
 * 1. **`MatDatepickerInput` (`input[matDatepicker]`) is a bare directive**,
 *    same category as `matInput`/`cdkTextareaAutosize` — it attaches to
 *    *this component's own* `<input>`, no DOM ownership conflict. Its base
 *    class (`MatDatepickerInputBase`, separately compiled) declares real
 *    `@Input() value`/`@Input() disabled`/`@Output() dateChange` — bindable
 *    directly via plain property/event binding (confirmed in
 *    `@angular/material/datepicker/index.d.ts`'s own `ɵɵDirectiveDeclaration`
 *    for the base class), no `[formControl]`/`ControlValueAccessor` wiring
 *    required, matching this adapter's "Recursica owns its own value model"
 *    convention every other real field component already uses.
 * 2. **The calendar popup itself (`MatDatepickerContent` → `MatCalendar` →
 *    `MatMonthView`/`MatCalendarHeader`) genuinely is `ViewEncapsulation.None`**
 *    (confirmed directly, not assumed) — but unlike the outright rejections,
 *    this is a *reachability* problem, not a structural mismatch: the
 *    calendar's real behavior (keyboard grid navigation, month/year
 *    picking, disabled-date logic, i18n) is worth keeping, so this is
 *    styled the same way `Dropdown`/`Menu`/`Tooltip` already solve
 *    "portaled content my own scoped CSS can't reach" — a plain global
 *    stylesheet (`date-picker-overlay.css`) targeting Angular Material's
 *    own published class names directly, not a hand-rebuild.
 * 3. **`MatDatepicker` itself renders nothing** (`template: ''`,
 *    `exportAs: "matDatepicker"`) — it's a headless overlay manager,
 *    referenced from the input via `[matDatepicker]="picker"` and opened
 *    programmatically. There is no native mouse-click trigger built in
 *    (confirmed: no click host listener on `MatDatepickerInput` in the
 *    compiled source — it does ship a keyboard one, `Alt+↓`, in
 *    `_onKeydown`, already fully accessible without any of this component's
 *    own wiring). Mouse-click opening is wired via `(click)="picker.open()"`
 *    on the `<input>` itself (not `.root` — a plain non-interactive `div`
 *    with its own click handler correctly fails
 *    `@angular-eslint/template/interactive-supports-focus`, since it isn't
 *    part of the tab order), matching the reference's own "click anywhere
 *    in the field" UX — the leading icon's `.section` box sits
 *    `pointer-events: none` (see `date-picker.component.css`), so clicks
 *    over it still land on the input underneath. No separate
 *    `mat-datepicker-toggle` button, unlike most Material datepicker
 *    examples.
 *
 * ## Real, documented scoping gap vs. `Dropdown`/`Menu`/`Tooltip`'s overlay CSS
 *
 * `Dropdown`'s own portaled panel gets a custom marker class
 * (`.rec-dropdown-panel`) applied directly in `dropdown.component.ts`'s own
 * template, so its overlay CSS only ever affects Recursica's own instances.
 * `MatDatepickerContent` (the outer popup surface) offers no equivalent
 * hook — I don't own its template, and `MatDatepicker`'s own `panelClass`
 * input only reaches `<mat-calendar>` itself (confirmed by reading
 * `MatDatepickerContent`'s compiled template: `panelClass` is bound to
 * `<mat-calendar [class]="datepicker.panelClass">`, not the
 * `mat-datepicker-content` host). `panelClass` is used here
 * (`rec-date-picker-calendar`) to scope the calendar-interior rules
 * (header/day-cell) safely, but the popup *surface itself*
 * (`mat-datepicker-content`'s background/border/shadow/padding) has to be
 * styled globally, by that real Angular Material class name, unscoped — a
 * real, narrower-than-usual limitation of this one component, not present
 * in `Dropdown`/`Menu`/`Tooltip`. Documented in
 * `date-picker-overlay.css`'s own header comment too.
 *
 * ## Date format: fixed `MM/DD/YY`, not per-instance configurable
 *
 * The reference's `valueFormat` is a per-instance `dayjs` format-string
 * prop; Angular's `DateAdapter`/`MAT_DATE_FORMATS` system formats via
 * `Intl.DateTimeFormatOptions` objects, not arbitrary pattern strings, and
 * is normally configured once at the app root, not per-component-instance.
 * `provideNativeDateAdapter(...)` is supplied here as a **component-level**
 * provider instead (scoped to just this component's own view, so it works
 * standalone without requiring host-app setup) with `display.dateInput`
 * overridden to `{ month: "2-digit", day: "2-digit", year: "2-digit" }` —
 * `Intl.DateTimeFormat("en-US", ...)` with those options already produces
 * exactly `MM/DD/YY`-shaped output (verified: `08/26/26` for `Aug 26 2026`),
 * so no custom formatter was needed. Not exposed as a `valueFormat` input;
 * no golden story needs a different format, so building per-instance
 * override plumbing would be speculative scope.
 */
@Component({
  selector: "rec-date-picker-control",
  imports: [MatInput, MatDatepickerInput, MatDatepicker, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./date-picker.component.css",
  providers: [
    provideNativeDateAdapter({
      ...MAT_NATIVE_DATE_FORMATS,
      display: {
        ...MAT_NATIVE_DATE_FORMATS.display,
        dateInput: { year: "2-digit", month: "2-digit", day: "2-digit" },
      },
    }),
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => DatePickerControlComponent),
    },
  ],
  template: `
    <div
      class="root"
      [attr.data-with-left-section]="
        leftSection || defaultLeftSection ? '' : null
      "
      [attr.data-disabled]="disabled ? '' : null"
      [attr.data-error]="error ? '' : null"
    >
      <span class="section" data-position="left">
        <ng-container [ngTemplateOutlet]="leftSection ?? defaultLeftSection" />
      </span>
      <input
        matInput
        [matDatepicker]="picker"
        class="input"
        [id]="id"
        [placeholder]="placeholder ?? 'MM / DD / YY'"
        [disabled]="disabled"
        [required]="required"
        [min]="min ?? null"
        [max]="max ?? null"
        [attr.name]="name ?? null"
        [attr.aria-describedby]="describedByAttr"
        [value]="value ?? null"
        (dateChange)="onDateChange($event)"
        (click)="picker.open()"
      />
      <mat-datepicker
        #picker
        panelClass="rec-date-picker-calendar"
        [opened]="opened"
      ></mat-datepicker>
    </div>
    <ng-template #defaultLeftSection>
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </ng-template>
  `,
})
export class DatePickerControlComponent implements RecursicaFormControl {
  @Input() value?: Date | null;
  @Output() valueChange = new EventEmitter<Date | null>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;

  /** Visual-only error flag — mirrors `TextField`/`TextArea`/`NumberInput`'s identical `error` input. */
  @Input() error = false;

  @Input() min?: Date;
  @Input() max?: Date;

  @Input() leftSection?: TemplateRef<unknown>;

  /**
   * Forces the calendar open on render, with no click required — used by
   * the `OpenedCalendar` story to review calendar styling, mirroring the
   * reference's own `popoverProps: { opened: true }` convention (same as
   * `Menu`'s identical `opened: true` stories).
   */
  @Input() opened = false;

  private readonly baseId = `rec-date-picker-${nextId++}`;
  private _id?: string;

  @Input()
  set id(value: string | undefined) {
    this._id = value;
  }
  get id(): string {
    return this._id ?? this.baseId;
  }

  private describedByIds: string[] = [];

  get describedByAttr(): string | null {
    return this.describedByIds.length ? this.describedByIds.join(" ") : null;
  }

  setDescribedByIds(ids: string[]): void {
    this.describedByIds = ids;
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.valueChange.emit(event.value);
  }
}
