import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for Mantine's `useTree()` controller object, which
 * the reference passes down to every node via `renderNode`'s own
 * `RenderTreeNodePayload` — same `useExisting` pattern `TIMELINE_CONTEXT`/
 * `STEPPER_CONTEXT` already establish in this adapter (see
 * `stepper/stepper-context.ts`'s own doc comment for the full "why DI, not
 * `@Input()`" reasoning, not repeated here). `TreeNodeComponent` is
 * recursive (renders itself for `node.children`), so every depth of the
 * tree shares the same single `TreeComponent`-owned expanded/selected
 * state through this one token, rather than each level re-deriving or
 * re-passing it through `@Input()` chains.
 */
export interface TreeContext {
  readonly multiple: boolean;
  readonly disabled: boolean;
  /** Accessible name of every node's expand/collapse toggle (`rec-tree` `toggleLabel`). */
  readonly toggleLabel: string;
  isExpanded(value: string): boolean;
  isSelected(value: string): boolean;
  toggleExpanded(value: string): void;
  select(value: string): void;
  /** Roving tabindex: the one node (by value) that is currently a Tab stop. */
  isFocusTarget(value: string): boolean;
  setFocusTarget(value: string): void;
  /** Moves DOM focus between visible nodes (`ArrowUp`/`ArrowDown`/`Home`/`End`, `ArrowLeft` to the parent, `ArrowRight` to the first child). */
  moveFocus(
    from: HTMLElement,
    direction: "next" | "prev" | "first" | "last" | "parent" | "child",
  ): void;
}

export const TREE_CONTEXT = new InjectionToken<TreeContext>(
  "RecursicaTreeContext",
);
