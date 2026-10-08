import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  inject,
  OnInit,
  Output,
  ViewEncapsulation,
  signal,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaAriaLabelling,
  RecursicaElementId,
} from "../utils/recursica-aria";
import { TREE_CONTEXT, TreeContext } from "./tree-context";
import { RecursicaTreeNode } from "./tree-node-data";
import { TreeNodeComponent } from "./tree-node.component";

/**
 * Recursica `Tree` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` flagged `Category: REQUIRES WORK` with
 * `MatTree`/`@angular/cdk/tree` as the candidate, plus a guess that real
 * work would include "checkbox-selection semantics (no built-in
 * tri-state-checkbox tree node)". Re-investigated by reading `Tree.tsx`
 * directly before building: that guess doesn't match the real reference
 * at all — there is no checkbox selection anywhere in it. Selection is
 * plain row-click (or `Enter`/`Space`), independent of expand/collapse
 * (the chevron button). The real `@angular/cdk/tree` primitive
 * (`CdkTree`/`[cdkTreeNodeDef]`/`[cdkTreeNodePadding]`/`[cdkTreeNodeToggle]`)
 * is genuinely headless (`ViewEncapsulation.None` on `cdk-tree` itself,
 * but every structural directive is a bare directive with no fixed
 * template — confirmed in the compiled source, the same "real, adoptable
 * primitive" category `CdkConnectedOverlay` already falls into elsewhere
 * in this adapter). Not adopted anyway: the reference's own `renderNode`
 * callback already controls 100% of each row's visual DOM directly, and
 * `CdkTree`'s own flattener/`LevelAccessor` configuration surface adds
 * real indirection for no capability this adapter's much simpler
 * recursive-component approach doesn't already cover — a genuinely
 * simpler, equally correct hand-built recursive tree, not a rejection on
 * structural-incompatibility grounds the way `MatTabGroup`/`MatSelect`
 * were rejected elsewhere.
 *
 * **Decision**: hand-built — `TreeComponent` owns expanded/selected state
 * (provided to every node via `TREE_CONTEXT`, `useExisting`), and
 * `TreeNodeComponent` renders itself recursively for `node.children`.
 *
 * ## `initialExpandedValues`/`initialSelectedValues`: uncontrolled-only, matching the reference exactly
 *
 * Confirmed by reading `Tree.tsx` directly: Mantine's own `useTree()` has
 * no controlled `expandedValues`/`selectedValues` prop pair at all — only
 * an *initial* seed plus `onNodeExpand`/`onNodeCollapse`/`onSelectedChange`
 * callbacks, all state lives inside the hook. This component reproduces
 * that shape exactly (`initialExpandedValues`/`initialSelectedValues`
 * seed internal signals in `ngOnInit`, no controlled `expandedValues`
 * `@Input()` exists to accept) rather than inventing a controlled variant
 * with no reference precedent.
 *
 * ## Known, documented gap: no full WAI-ARIA roving-tabindex tree navigation
 *
 * The reference relies on Mantine's own internal `TreeNode` keyboard
 * handling for the full WAI-ARIA treeitem pattern (up/down arrow moves
 * focus across the entire flattened *visible* tree, not just within one
 * node's own children). Reproducing that faithfully requires tracking
 * flattened visible-node order and a single shared roving `tabindex`
 * across every node — real, substantial keyboard-management work with no
 * golden-story screenshot that would visually distinguish it from a
 * simpler per-node-focusable approach. This component gives every node
 * `tabindex="0"` (each row is independently a real, reachable `Tab` stop)
 * and handles `Enter`/`Space` (select) and `ArrowLeft`/`ArrowRight`
 * (collapse/expand) locally per node — real, working keyboard
 * interaction, just not the single-tab-stop roving-focus pattern the
 * reference inherits from Mantine. Flagged here rather than silently
 * assumed equivalent.
 */
@Component({
  selector: "rec-tree",
  imports: [TreeNodeComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tree.component.css",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  providers: [{ provide: TREE_CONTEXT, useExisting: TreeComponent }],
  template: `
    <ul
      class="root"
      role="tree"
      [attr.id]="elementId.id ?? null"
      [attr.aria-label]="aria.ariaLabel ?? null"
      [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
      [attr.aria-describedby]="aria.ariaDescribedby ?? null"
      [attr.aria-multiselectable]="multiple ? 'true' : null"
      [attr.data-disabled]="disabled ? '' : null"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      @for (node of data; track node.value) {
        <rec-tree-node [node]="node" [level]="0" />
      }
    </ul>
  `,
})
export class TreeComponent implements TreeContext, RecursicaOverStyled, OnInit {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  @Input() data: RecursicaTreeNode[] = [];

  /** `"*"` expands every node with a `children` array; an array expands only the listed values. Uncontrolled-only, matching the reference. */
  @Input() initialExpandedValues?: string[] | "*";
  @Input() initialSelectedValues?: string[];

  @Input() multiple = false;
  @Input() disabled = false;

  @Output() nodeExpand = new EventEmitter<string>();
  @Output() nodeCollapse = new EventEmitter<string>();
  @Output() selectedChange = new EventEmitter<string[]>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly expandedValues = signal<Set<string>>(new Set());
  private readonly selectedValues = signal<Set<string>>(new Set());
  private readonly focusTarget = signal<string | undefined>(undefined);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit(): void {
    if (this.initialExpandedValues === "*") {
      this.expandedValues.set(new Set(this.collectExpandableValues(this.data)));
    } else if (this.initialExpandedValues) {
      this.expandedValues.set(new Set(this.initialExpandedValues));
    }
    if (this.initialSelectedValues) {
      this.selectedValues.set(new Set(this.initialSelectedValues));
    }
  }

  private collectExpandableValues(nodes: RecursicaTreeNode[]): string[] {
    const values: string[] = [];
    for (const node of nodes) {
      if (node.children) {
        values.push(node.value);
        values.push(...this.collectExpandableValues(node.children));
      }
    }
    return values;
  }

  isExpanded(value: string): boolean {
    return this.expandedValues().has(value);
  }

  /** Only one node is a Tab stop (roving tabindex): the last focused one, else the first selected, else the first node. */
  isFocusTarget(value: string): boolean {
    const target =
      this.focusTarget() ??
      [...this.selectedValues()][0] ??
      this.data[0]?.value;
    return target === value;
  }

  setFocusTarget(value: string): void {
    this.focusTarget.set(value);
  }

  moveFocus(
    from: HTMLElement,
    direction: "next" | "prev" | "first" | "last" | "parent" | "child",
  ): void {
    const root = (this.host.nativeElement as HTMLElement).querySelector(
      '[role="tree"]',
    );
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('[role="treeitem"]'),
    );
    const index = items.indexOf(from);
    let target: HTMLElement | undefined;
    switch (direction) {
      case "next":
        target = items[index + 1];
        break;
      case "prev":
        target = items[index - 1];
        break;
      case "first":
        target = items[0];
        break;
      case "last":
        target = items[items.length - 1];
        break;
      case "parent":
        target =
          from.parentElement?.closest<HTMLElement>('[role="treeitem"]') ??
          undefined;
        break;
      case "child":
        target =
          from.querySelector<HTMLElement>('[role="treeitem"]') ?? undefined;
        break;
    }
    target?.focus();
  }

  isSelected(value: string): boolean {
    return this.selectedValues().has(value);
  }

  toggleExpanded(value: string): void {
    if (this.disabled) return;
    const next = new Set(this.expandedValues());
    if (next.has(value)) {
      next.delete(value);
      this.nodeCollapse.emit(value);
    } else {
      next.add(value);
      this.nodeExpand.emit(value);
    }
    this.expandedValues.set(next);
  }

  select(value: string): void {
    if (this.disabled) return;
    const next = this.multiple
      ? new Set(this.selectedValues())
      : new Set<string>();
    if (this.multiple && next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    this.selectedValues.set(next);
    this.selectedChange.emit([...next]);
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
