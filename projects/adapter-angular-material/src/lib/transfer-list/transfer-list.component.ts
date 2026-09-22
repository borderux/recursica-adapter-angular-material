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
import type {
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import type { RecursicaLabelAlignment } from "../label/label.component";
import { WithReadOnlyWrapperComponent } from "../read-only-field/with-read-only-wrapper.component";
import { BadgeComponent } from "../badge/badge.component";
import { ButtonComponent } from "../button/button.component";
import { CheckboxComponent } from "../checkbox/checkbox.component";
import { TextFieldComponent } from "../text-field/text-field.component";
import {
  RecursicaTransferListData,
  RecursicaTransferListItem,
} from "./transfer-list-item";

let nextId = 0;

interface RecursicaTransferListPaneGroup {
  name: string;
  items: RecursicaTransferListItem[];
}

interface RecursicaTransferListPaneView {
  side: "source" | "target";
  label: string;
  items: RecursicaTransferListItem[];
  allItems: RecursicaTransferListItem[];
  ungrouped: RecursicaTransferListItem[];
  groups: RecursicaTransferListPaneGroup[];
  selected: Set<string>;
  search: string;
  countText: string;
}

/**
 * Recursica `TransferList` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already flagged `Category: DOES NOT EXIST`
 * ("`MatSelectionList`/`MatListOption` give a genuine multi-select list
 * building block, but there's no packaged dual-list transfer component —
 * same from-scratch composition the genesis adapter itself already
 * required against Mantine") — re-confirmed at build time, and exactly
 * the approach taken: not a Material-wrappable widget at all, hand-built
 * by composing this adapter's own already-real `Badge`/`Button`/
 * `TextField`/`Checkbox` components, mirroring the reference's own
 * `TransferList.tsx` composition (Badge/Button/TextField/Checkbox/
 * CheckboxGroup) almost 1:1.
 *
 * ## `Checkbox`, not `CheckboxGroup` — this adapter's own `CheckboxGroupComponent` grew a second `FormControlWrapper` layer
 *
 * The reference composes Mantine's own headless `CheckboxGroup` purely for
 * ARIA grouping — a thin wrapper, no visible chrome of its own. This
 * adapter's own `CheckboxGroupComponent` is not that: it composes
 * `FormControlWrapperComponent` directly (see its own class doc comment),
 * meaning nesting one inside each pane would render a second, unwanted
 * label/description/assistive-text/error chrome block per group. Each
 * pane instead renders plain `<rec-checkbox>` elements directly inside a
 * `role="group"` div (`.groupBlock`, `aria-label` set to the group name)
 * — real ARIA grouping semantics with none of `CheckboxGroupComponent`'s
 * own extra form-field chrome.
 *
 * ## One shared `#paneTpl`, not two duplicated pane blocks
 *
 * The reference's own `renderPane()` is a plain function called twice
 * (source, target) — this component's Angular equivalent is one
 * `<ng-template #paneTpl let-pane>` instantiated twice via
 * `[ngTemplateOutletContext]`, each with a precomputed
 * `RecursicaTransferListPaneView` (filtered items, grouped/ungrouped
 * split, selection set, count text) — the same "compute a view-model
 * object, hand it to one shared template" shape this adapter already uses
 * elsewhere for repeated structure (`pagination.component.ts`'s own
 * `#iconTpl`).
 *
 * ## Read-only display: array `readOnlyValue`, `ReadOnlyFieldComponent` already joins it
 *
 * `ReadOnlyFieldComponent`'s own `"text"` type formatting already joins an
 * array value with `", "` (confirmed by reading `read-only-field.component.ts`
 * directly) — passing `effectiveData[1].map(item => item.label)` straight
 * through as `readOnlyValue` reproduces the reference's own
 * `readOnlyValue={effectiveData[1].map((item) => item.label)}` with no
 * custom `readOnlyTemplate` needed (unlike `Slider`, which needed one for
 * dedicated typography tokens this component has none of).
 */
@Component({
  selector: "rec-transfer-list",
  imports: [
    NgTemplateOutlet,
    WithReadOnlyWrapperComponent,
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    TextFieldComponent,
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./transfer-list.component.css",
  template: `
    <rec-with-read-only-wrapper
      [readOnly]="readOnly"
      [activeTemplate]="active"
      readOnlyType="text"
      [readOnlyValue]="
        currentValue[1].length ? currentValue[1].map(labelOf) : null
      "
      [formLayout]="formLayout"
      [labelSize]="labelSize"
      [labelAlignment]="labelAlignment"
      [labelOptionalText]="labelOptionalText"
      [labelWithEditIcon]="labelWithEditIcon"
      [labelActionArea]="labelActionArea"
      [label]="label"
      [description]="description"
      [assistiveText]="assistiveText"
      [helperText]="helperText"
      [error]="error"
      [assistiveWithIcon]="assistiveWithIcon"
      [required]="required"
      [withAsterisk]="withAsterisk"
      [overStyled]="overStyled"
      [overClass]="overClass"
      [overStyle]="overStyle"
      (labelEditClick)="labelEditClick.emit($event)"
    />

    <ng-template #paneTpl let-pane>
      <div class="pane" [attr.data-pane]="pane.side">
        <div class="paneHeader">
          <span>{{ pane.label }}</span>
          <rec-badge>{{ pane.countText }}</rec-badge>
        </div>

        @if (searchable) {
          <div class="paneSearch">
            <label
              class="visuallyHidden"
              [for]="id + '-' + pane.side + '-search'"
              >{{ "Filter " + pane.label.toLowerCase() }}</label
            >
            <rec-text-field
              [id]="id + '-' + pane.side + '-search'"
              [value]="pane.search"
              (valueChange)="setSearch(pane.side, $event)"
              [placeholder]="searchPlaceholder"
              [disabled]="disabled"
            />
          </div>
        }

        <div class="paneList">
          @if (pane.items.length === 0) {
            <div class="emptyState">No items</div>
          }

          @if (pane.ungrouped.length > 0) {
            <div class="groupBlock" role="group">
              @for (item of pane.ungrouped; track item.value) {
                <rec-checkbox
                  [id]="id + '-' + pane.side + '-' + item.value"
                  [label]="item.label"
                  [checked]="pane.selected.has(item.value)"
                  (checkedChange)="toggleItem(pane.side, item.value)"
                  [disabled]="disabled"
                />
              }
            </div>
          }

          @for (group of pane.groups; track group.name) {
            <div class="groupBlock" role="group" [attr.aria-label]="group.name">
              <div class="groupLabel">{{ group.name }}</div>
              @for (item of group.items; track item.value) {
                <rec-checkbox
                  [id]="id + '-' + pane.side + '-' + item.value"
                  [label]="item.label"
                  [checked]="pane.selected.has(item.value)"
                  (checkedChange)="toggleItem(pane.side, item.value)"
                  [disabled]="disabled"
                />
              }
            </div>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #active>
      <div
        class="root"
        [attr.data-form-layout]="formLayout"
        [attr.data-disabled]="disabled ? 'true' : null"
        [attr.data-error]="error ? 'true' : null"
      >
        <div class="panes">
          <ng-container
            [ngTemplateOutlet]="paneTpl"
            [ngTemplateOutletContext]="{ $implicit: sourceView }"
          />

          <div class="transferColumn">
            <rec-button
              variant="outline"
              size="small"
              [iconOnly]="true"
              [icon]="chevronsRightIcon"
              [ariaLabel]="'Move all to ' + targetLabel"
              [disabled]="disabled || currentValue[0].length === 0"
              (click)="transferAll('source')"
            />
            <rec-button
              variant="outline"
              size="small"
              [iconOnly]="true"
              [icon]="chevronRightIcon"
              [ariaLabel]="'Move selected to ' + targetLabel"
              [disabled]="disabled || sourceSelected().size === 0"
              (click)="transferSelected('source')"
            />
            <rec-button
              variant="outline"
              size="small"
              [iconOnly]="true"
              [icon]="chevronLeftIcon"
              [ariaLabel]="'Move selected to ' + sourceLabel"
              [disabled]="disabled || targetSelected().size === 0"
              (click)="transferSelected('target')"
            />
            <rec-button
              variant="outline"
              size="small"
              [iconOnly]="true"
              [icon]="chevronsLeftIcon"
              [ariaLabel]="'Move all to ' + sourceLabel"
              [disabled]="disabled || currentValue[1].length === 0"
              (click)="transferAll('target')"
            />
          </div>

          <ng-container
            [ngTemplateOutlet]="paneTpl"
            [ngTemplateOutletContext]="{ $implicit: targetView }"
          />
        </div>
      </div>
    </ng-template>

    <ng-template #chevronRightIcon>
      <svg
        class="chevron"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3l5 5-5 5" />
      </svg>
    </ng-template>
    <ng-template #chevronLeftIcon>
      <svg
        class="chevron"
        data-direction="left"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3l5 5-5 5" />
      </svg>
    </ng-template>
    <ng-template #chevronsRightIcon>
      <svg
        class="chevron"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l5 5-5 5M9 3l5 5-5 5" />
      </svg>
    </ng-template>
    <ng-template #chevronsLeftIcon>
      <svg
        class="chevron"
        data-direction="left"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l5 5-5 5M9 3l5 5-5 5" />
      </svg>
    </ng-template>
  `,
})
export class TransferListComponent implements OnInit {
  @Input() data?: RecursicaTransferListData;
  @Input() defaultData: RecursicaTransferListData = [[], []];
  @Output() dataChange = new EventEmitter<RecursicaTransferListData>();

  @Input() sourceLabel = "Available";
  @Input() targetLabel = "Selected";
  @Input() searchable = true;
  @Input() searchPlaceholder = "Filter items...";
  @Input() disabled = false;
  @Input() readOnly = false;

  /** Doubles as the wrapper's error message and the control's visual flag — mirrors `Slider`'s identical `error` input. */
  @Input() error?: string;
  @Input() required = false;

  @Input() formLayout: RecursicaFormLayout = "stacked";
  @Input() labelSize: RecursicaFormControlLabelSize = "default";
  @Input() labelAlignment: RecursicaLabelAlignment = "left";
  @Input() labelOptionalText?: boolean | string;
  @Input() labelWithEditIcon = false;
  @Input() labelActionArea?: TemplateRef<unknown>;

  @Input() label?: string | TemplateRef<unknown>;
  @Input() description?: string | TemplateRef<unknown>;
  @Input() assistiveText?: string | TemplateRef<unknown>;
  @Input() helperText?: string | TemplateRef<unknown>;
  @Input() assistiveWithIcon = true;
  @Input() withAsterisk?: boolean;

  @Output() labelEditClick = new EventEmitter<MouseEvent>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly baseId = `rec-transfer-list-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultData` in `ngOnInit`
   * (never the constructor/field initializer) — same bug class documented
   * in `checkbox.component.ts`/`slider.component.ts`.
   */
  private readonly _uncontrolledData = signal<RecursicaTransferListData>([
    [],
    [],
  ]);

  readonly sourceSelected = signal<Set<string>>(new Set());
  readonly targetSelected = signal<Set<string>>(new Set());
  private sourceSearchValue = "";
  private targetSearchValue = "";

  ngOnInit(): void {
    this._uncontrolledData.set(this.data ?? this.defaultData);
  }

  get currentValue(): RecursicaTransferListData {
    return this.data !== undefined ? this.data : this._uncontrolledData();
  }

  labelOf = (item: RecursicaTransferListItem): string => item.label;

  private filterItems(
    items: RecursicaTransferListItem[],
    search: string,
  ): RecursicaTransferListItem[] {
    if (!search) return items;
    const query = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(query));
  }

  private groupItems(items: RecursicaTransferListItem[]): {
    ungrouped: RecursicaTransferListItem[];
    groups: RecursicaTransferListPaneGroup[];
  } {
    const groupMap = new Map<string, RecursicaTransferListItem[]>();
    const ungrouped: RecursicaTransferListItem[] = [];
    for (const item of items) {
      if (item.group) {
        const bucket = groupMap.get(item.group) ?? [];
        bucket.push(item);
        groupMap.set(item.group, bucket);
      } else {
        ungrouped.push(item);
      }
    }
    const groups = [...groupMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, groupedItems]) => ({ name, items: groupedItems }));
    return { ungrouped, groups };
  }

  private buildPaneView(
    side: "source" | "target",
  ): RecursicaTransferListPaneView {
    const allItems = this.currentValue[side === "source" ? 0 : 1];
    const search =
      side === "source" ? this.sourceSearchValue : this.targetSearchValue;
    const selected =
      side === "source" ? this.sourceSelected() : this.targetSelected();
    const items = this.filterItems(allItems, search);
    const { ungrouped, groups } = this.groupItems(items);
    const countText =
      selected.size > 0
        ? `${selected.size} / ${allItems.length}`
        : `${allItems.length}`;
    return {
      side,
      label: side === "source" ? this.sourceLabel : this.targetLabel,
      items,
      allItems,
      ungrouped,
      groups,
      selected,
      search,
      countText,
    };
  }

  get sourceView(): RecursicaTransferListPaneView {
    return this.buildPaneView("source");
  }

  get targetView(): RecursicaTransferListPaneView {
    return this.buildPaneView("target");
  }

  setSearch(side: "source" | "target", value: string): void {
    if (side === "source") {
      this.sourceSearchValue = value;
    } else {
      this.targetSearchValue = value;
    }
  }

  toggleItem(side: "source" | "target", value: string): void {
    const signalRef =
      side === "source" ? this.sourceSelected : this.targetSelected;
    const next = new Set(signalRef());
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    signalRef.set(next);
  }

  private emit(next: RecursicaTransferListData): void {
    if (this.data === undefined) {
      this._uncontrolledData.set(next);
    }
    this.dataChange.emit(next);
  }

  transferSelected(from: "source" | "target"): void {
    const [source, target] = this.currentValue;
    if (from === "source") {
      const selected = this.sourceSelected();
      if (selected.size === 0) return;
      const moved = source.filter((item) => selected.has(item.value));
      const remaining = source.filter((item) => !selected.has(item.value));
      this.sourceSelected.set(new Set());
      this.emit([remaining, [...target, ...moved]]);
    } else {
      const selected = this.targetSelected();
      if (selected.size === 0) return;
      const moved = target.filter((item) => selected.has(item.value));
      const remaining = target.filter((item) => !selected.has(item.value));
      this.targetSelected.set(new Set());
      this.emit([[...source, ...moved], remaining]);
    }
  }

  transferAll(from: "source" | "target"): void {
    const [source, target] = this.currentValue;
    if (from === "source") {
      if (source.length === 0) return;
      this.sourceSelected.set(new Set());
      this.emit([[], [...target, ...source]]);
    } else {
      if (target.length === 0) return;
      this.targetSelected.set(new Set());
      this.emit([[...source, ...target], []]);
    }
  }
}
