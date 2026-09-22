export const PAGINATION_DOTS = "dots" as const;
export type RecursicaPaginationRangeItem = number | typeof PAGINATION_DOTS;

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => index + start);
}

/**
 * Direct port of `@mantine/hooks`' own `usePagination` range-computation
 * algorithm (read from its compiled `use-pagination.mjs` source, not
 * reimplemented from a description) — the same sibling/boundary/ellipsis
 * math the reference's `<Pagination total={10} />` story actually renders
 * against, so the page numbers/dots shown here match exactly rather than
 * approximating a "reasonable" pagination range.
 */
export function computePaginationRange(
  total: number,
  active: number,
  siblings: number,
  boundaries: number,
): RecursicaPaginationRangeItem[] {
  const safeTotal = Math.max(Math.trunc(total), 0);
  const totalPageNumbers = siblings * 2 + 3 + boundaries * 2;

  if (totalPageNumbers >= safeTotal) {
    return range(1, safeTotal);
  }

  const leftSiblingIndex = Math.max(active - siblings, boundaries);
  const rightSiblingIndex = Math.min(active + siblings, safeTotal - boundaries);

  const shouldShowLeftDots = leftSiblingIndex > boundaries + 2;
  const shouldShowRightDots = rightSiblingIndex < safeTotal - (boundaries + 1);

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = siblings * 2 + boundaries + 2;
    return [
      ...range(1, leftItemCount),
      PAGINATION_DOTS,
      ...range(safeTotal - (boundaries - 1), safeTotal),
    ];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = boundaries + 1 + 2 * siblings;
    return [
      ...range(1, boundaries),
      PAGINATION_DOTS,
      ...range(safeTotal - rightItemCount, safeTotal),
    ];
  }

  return [
    ...range(1, boundaries),
    PAGINATION_DOTS,
    ...range(leftSiblingIndex, rightSiblingIndex),
    PAGINATION_DOTS,
    ...range(safeTotal - boundaries + 1, safeTotal),
  ];
}
