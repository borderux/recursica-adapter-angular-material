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
import { DropdownComponent } from "../dropdown/dropdown.component";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

let nextId = 0;

const AM_PM_DATA: readonly string[] = ["AM", "PM"];

interface ParsedTime {
  hour24: number;
  minute: number;
  second: number;
}

function parseTimeValue(
  value: string | undefined | null,
): ParsedTime | undefined {
  if (!value) {
    return undefined;
  }
  const [hourStr, minuteStr, secondStr] = value.split(":");
  const hour24 = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return undefined;
  }
  const second = secondStr !== undefined ? parseInt(secondStr, 10) : 0;
  return { hour24, minute, second: Number.isNaN(second) ? 0 : second };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Internal masked hour/minute(/second) field + AM/PM `rec-dropdown` primitive
 * backing `rec-time-picker` — same two-tier split as `TextArea`/`NumberInput`/
 * `DatePicker` (see `text-area-control.component.ts`'s own doc comment for why
 * the `RECURSICA_FORM_CONTROL` provider has to live on a node *inside*
 * `rec-with-read-only-wrapper`'s projected `activeTemplate`).
 *
 * ## `MatTimepicker`/`MatTimepickerInput` investigated and rejected
 *
 * The stub's own `IMPLEMENTATION_NOTES.md` flagged a real `MatTimepicker`
 * exists (`@angular/material/timepicker`) — re-checked directly against its
 * `.d.ts` before deciding, same rigor as every other adoption/rejection call
 * in this adapter. Rejected because its actual design doesn't match this
 * golden's contract, not for a `ViewEncapsulation`/DOM-ownership reason:
 * `MatTimepicker` (confirmed `implements MatOptionParentComponent`, with
 * `interval`/`options` inputs) is fundamentally a *pick a full "H:MM AM/PM"
 * string from a scrollable preset list* control — the same family as
 * `MatSelect`, just for times — with an `<input>` alongside for free typing.
 * The genesis reference's own design (confirmed against its golden
 * screenshots and `TIMEPICKER_IMPLEMENTATION_NOTES.md`) is categorically
 * different: a masked hour/minute(/second) field with **no dropdown-list
 * affordance at all**, sitting next to a *separate*, always-visible AM/PM
 * selector. Adopting `MatTimepicker` would mean either bolting on a preset
 * list nothing in the design calls for, or fighting its list/option
 * machinery to suppress a feature that's core to how the component is
 * built — more code and a worse fit than hand-building the masked field
 * directly, the same class of call `Tabs`/`Stepper`/`Chip` made for
 * different reasons.
 *
 * ## `rec-dropdown` reused directly for AM/PM — no `BareDropdown` needed
 *
 * The genesis reference had to build a whole separate internal-only
 * `BareDropdown` component specifically because its own public `Dropdown`
 * wraps `FormControlWrapper` internally, and nesting that inside an
 * already-wrapped `TimePicker` would double up the label/assistive-text
 * structure. **Confirmed by reading `dropdown.component.ts` directly**:
 * this adapter's own `DropdownComponent` does *not* wrap
 * `FormControlWrapperComponent` internally at all (it exposes itself under
 * `RECURSICA_FORM_CONTROL` for external composition, same as `TextField` —
 * see `dropdown.component.ts`'s own class doc comment) — it's already
 * exactly the "bare" shape the reference had to build separately. Reused
 * directly here with `overStyled`/`overStyle` to size it down to the AM/PM
 * box's small width, the same escape hatch the reference's own
 * `styles={{ wrapper: { width: "fit-content" } }}` served.
 *
 * **No provider collision**: `DropdownComponent` also provides
 * `RECURSICA_FORM_CONTROL` on itself, but it's nested *inside this
 * component's own template* — `FormControlWrapper`'s `@ContentChild`
 * query (on whatever's projected into `rec-with-read-only-wrapper`'s
 * `activeTemplate`) only sees this component's own host, not further into
 * a child component's internal view, so there's nothing for it to collide
 * with. This component's own `id`/`describedByIds` point at the time
 * field's `<input>`, not the AM/PM dropdown.
 *
 * ## Value reconciliation: same logical shape as the reference, none of its DOM hacks
 *
 * The reference's `getHour`/`withHour`/`isPM` helpers and its internal
 * `useState` reconciling the time field and the AM/PM control are real,
 * necessary architecture (`TIMEPICKER_IMPLEMENTATION_NOTES.md`: "the one
 * exception" to every other component here being a thin pass-through) —
 * copied here in spirit (`parseTimeValue`/`clamp`, `isPM`/`onMeridiemChange`
 * below). What's *not* copied is the ~40 lines of Mantine-specific
 * workarounds for a native hidden `<select>` never reporting a valid
 * `onChange` until manually poked — that entire problem is a Mantine
 * internal-state quirk (confirmed by reading `TIMEPICKER_IMPLEMENTATION_NOTES.md`'s
 * own "round 3"/"round 6" write-ups) that doesn't exist here: both
 * sub-controls are driven by this component's own plain `value`/`(valueChange)`
 * bindings from the start.
 *
 * ## Masking: simple digit parsing on blur, not full segmented `SpinInput`-style masking
 *
 * Mantine's `TimePicker` renders real per-segment (`hour`/`minute`/`second`)
 * masked sub-inputs with arrow-key increment. None of this adapter's 8
 * golden stories exercise typing into a real value (checked
 * `TimePicker.stories.tsx` directly — `Default`/`WithSeconds`/`Disabled`/
 * `ErrorState`/`WithLeadingIcon` are all empty-value; only
 * `StaticReadOnly`/`EditableReadOnly` show a real value, and those render
 * through `ReadOnlyField`'s plain text, never this editable field), so
 * building full segmented masking would be speculative scope. This field is
 * a single real `<input>`, parsed on blur (strips non-digits, interprets as
 * `H(H)MM(SS)?`, clamps hour to 1–12/minute+second to 0–59) — genuinely
 * functional, just simpler than the reference's masking, and honestly
 * scoped to what's actually exercised.
 */
@Component({
  selector: "rec-time-picker-control",
  imports: [NgTemplateOutlet, DropdownComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./time-picker.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => TimePickerControlComponent),
    },
  ],
  template: `
    <div
      class="root"
      [attr.data-disabled]="disabled ? 'true' : null"
      [attr.data-error]="error ? 'true' : null"
    >
      <div
        class="timeWrapper"
        [attr.data-with-left-section]="leftSection ? '' : null"
      >
        @if (leftSection) {
          <span class="section" data-position="left">
            <ng-container [ngTemplateOutlet]="leftSection" />
          </span>
        }
        <input
          class="timeField"
          type="text"
          [id]="id"
          [placeholder]="withSeconds ? '-- : -- : --' : '-- : --'"
          [disabled]="disabled"
          [required]="required"
          [attr.name]="name ?? null"
          [attr.aria-describedby]="describedByAttr"
          [value]="fieldText"
          (blur)="onFieldBlur($event)"
        />
      </div>
      <rec-dropdown
        class="amPmSelect"
        [data]="amPmData"
        [value]="isPM ? 'PM' : 'AM'"
        [disabled]="disabled"
        [error]="error"
        [overStyled]="true"
        [overStyle]="{ width: '6rem', 'flex-shrink': '0' }"
        (valueChange)="onMeridiemChange($event)"
      />
    </div>
  `,
})
export class TimePickerControlComponent implements RecursicaFormControl {
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() error = false;
  @Input() withSeconds = false;

  @Input() leftSection?: TemplateRef<unknown>;

  readonly amPmData = AM_PM_DATA;

  private readonly baseId = `rec-time-picker-${nextId++}`;
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

  private get parsed(): ParsedTime | undefined {
    return parseTimeValue(this.value);
  }

  get isPM(): boolean {
    const p = this.parsed;
    return p !== undefined && p.hour24 >= 12;
  }

  get fieldText(): string {
    const p = this.parsed;
    if (!p) {
      return "";
    }
    const hour12 = p.hour24 % 12 === 0 ? 12 : p.hour24 % 12;
    const mm = String(p.minute).padStart(2, "0");
    if (this.withSeconds) {
      return `${hour12}:${mm}:${String(p.second).padStart(2, "0")}`;
    }
    return `${hour12}:${mm}`;
  }

  onFieldBlur(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      this.valueChange.emit(undefined);
      return;
    }

    let hour12: number;
    let minute: number;
    let second: number;
    if (this.withSeconds && digits.length > 4) {
      hour12 = parseInt(digits.slice(0, digits.length - 4), 10);
      minute = parseInt(digits.slice(digits.length - 4, digits.length - 2), 10);
      second = parseInt(digits.slice(digits.length - 2), 10);
    } else if (digits.length > 2) {
      hour12 = parseInt(digits.slice(0, digits.length - 2), 10);
      minute = parseInt(digits.slice(digits.length - 2), 10);
      second = this.parsed?.second ?? 0;
    } else {
      hour12 = parseInt(digits, 10);
      minute = 0;
      second = this.parsed?.second ?? 0;
    }

    hour12 = clamp(Number.isNaN(hour12) ? 12 : hour12, 1, 12);
    minute = clamp(Number.isNaN(minute) ? 0 : minute, 0, 59);
    second = clamp(Number.isNaN(second) ? 0 : second, 0, 59);

    const wasPM = this.isPM;
    const hour24 = wasPM
      ? hour12 === 12
        ? 12
        : hour12 + 12
      : hour12 === 12
        ? 0
        : hour12;
    this.emitTime(hour24, minute, second);
  }

  onMeridiemChange(next: string | null): void {
    const p = this.parsed;
    if (!p || !next) {
      return;
    }
    const wantsPM = next === "PM";
    if (wantsPM === this.isPM) {
      return;
    }
    const nextHour = wantsPM ? p.hour24 + 12 : p.hour24 - 12;
    this.emitTime(nextHour, p.minute, p.second);
  }

  private emitTime(hour24: number, minute: number, second: number): void {
    const parts = [
      String(hour24).padStart(2, "0"),
      String(minute).padStart(2, "0"),
    ];
    if (this.withSeconds) {
      parts.push(String(second).padStart(2, "0"));
    }
    this.valueChange.emit(parts.join(":"));
  }
}
