/**
 * One entry in `TreeComponent`'s `data` input. A `children` array — even
 * an empty one — makes a node expandable (matches the reference's own
 * documented contract, confirmed by reading `Tree.stories.tsx`'s own
 * component description directly: "a `children` array (even empty) makes
 * a node expandable").
 */
export interface RecursicaTreeNode {
  value: string;
  label: string;
  children?: RecursicaTreeNode[];
}
