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
  isExpanded(value: string): boolean;
  isSelected(value: string): boolean;
  toggleExpanded(value: string): void;
  select(value: string): void;
}

export const TREE_CONTEXT = new InjectionToken<TreeContext>(
  "RecursicaTreeContext",
);
