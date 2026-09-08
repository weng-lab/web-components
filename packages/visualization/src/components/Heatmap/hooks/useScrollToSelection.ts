import { useEffect, useRef, type RefObject } from "react";
import type { HeatmapCellId } from "../types";
import { cellKey } from "../heatmapCellAppearance";

// Minimal scroll offset (along one axis) that brings [boxStart, boxEnd) fully into
// [current, current+viewportSize) - unchanged if it's already fully visible, and aligned to
// boxStart if the box itself is bigger than the viewport (can't fit all of it either way).
// Mirrors Element.scrollIntoView({ block: "nearest" })'s semantics.
function nearestScrollOffset(current: number, viewportSize: number, boxStart: number, boxEnd: number): number {
  if (boxEnd - boxStart > viewportSize) return boxStart;
  if (boxStart < current) return boxStart;
  if (boxEnd > current + viewportSize) return boxEnd - viewportSize;
  return current;
}

export interface UseScrollToSelectionArgs {
  mainPaneRef: RefObject<HTMLDivElement | null>;
  selectedCells?: HeatmapCellId[];
  scrollToSelection?: boolean;
  isScrollable: boolean;
  binWidth: number;
  viewportWidth: number;
}

// Auto-scrolls to reveal newly-selected cells
export function useScrollToSelection({
  mainPaneRef, selectedCells, scrollToSelection, isScrollable, binWidth, viewportWidth,
}: UseScrollToSelectionArgs) {
  const previousSelectionKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const previousKeys = previousSelectionKeysRef.current;
    const cells = selectedCells ?? [];
    const newCells = cells.filter((cell) => !previousKeys.has(cellKey(cell)));
    previousSelectionKeysRef.current = new Set(cells.map(cellKey));

    const main = mainPaneRef.current;
    if (!scrollToSelection || !isScrollable || !main || newCells.length === 0) return;

    let minCol = Infinity, maxCol = -Infinity;
    for (const cell of newCells) {
      if (cell.column < minCol) minCol = cell.column;
      if (cell.column > maxCol) maxCol = cell.column;
    }

    const boxLeft = minCol * binWidth;
    const boxRight = (maxCol + 1) * binWidth;

    const targetLeft = nearestScrollOffset(main.scrollLeft, viewportWidth, boxLeft, boxRight);
    if (targetLeft !== main.scrollLeft) {
      main.scrollTo({ left: targetLeft, behavior: "smooth" });
    }
  }, [selectedCells, scrollToSelection, isScrollable, binWidth, viewportWidth]);
}
