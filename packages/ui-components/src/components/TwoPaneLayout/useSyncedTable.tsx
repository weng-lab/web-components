import { useCallback, useMemo } from "react";
import type { RefObject } from "react";
import type { GridApi, GridSortModel } from "@mui/x-data-grid-premium";
import AutoSortSwitch from "./AutoSortSwitch";
import type { useTablePlotSync } from "./useTablePlotSync";
import { useAutoSort } from "./useAutoSort";
import { TableColDef, TableProps } from "../Table";
import { sortableTableCheckboxColumn } from "./SortableTableCheckboxColumn";

type UseSyncedTableOptions<T> = {
  /** The tableProps object returned by useTablePlotSync */
  tableProps: ReturnType<typeof useTablePlotSync<T>>["tableProps"];
  /**
   * will be prepended with sortable checkbox column
   */
  columns: TableColDef[]
  /** Default sort model when autoSort is off */
  initialSort: GridSortModel;
  /** True when rows are pre-sorted (e.g. tissue grouping) — disables column sorting */
  isPresorted: boolean;
};

/**
 * Composes useAutoSort with the tableProps from useTablePlotSync,
 * handling the onReady callback chaining and AutoSortSwitch rendering.
 */
export function useSyncedTable<T>({
  tableProps,
  columns,
  initialSort,
  isPresorted,
}: UseSyncedTableOptions<T>) {
  const { apiRef, onReady: tableSyncOnReady, ...restTableProps } = tableProps;

  const { autoSort, setAutoSort, onReady: autoSortOnReady } = useAutoSort(apiRef, initialSort, isPresorted);

  const composedOnReady = useCallback(
    (api: RefObject<GridApi>) => {
      const existing = tableSyncOnReady?.(api);
      const existingCleanups = Array.isArray(existing) ? existing : existing ? [existing] : [];
      return [...existingCleanups, ...autoSortOnReady(api)];
    },
    [tableSyncOnReady, autoSortOnReady]
  );

  const columnsWithCheckbox = useMemo(() => [sortableTableCheckboxColumn, ...columns], [columns])

  const syncedTableProps = useMemo(
    () => ({
      apiRef,
      onReady: composedOnReady,
      disableColumnSorting: isPresorted,
      initialState: { sorting: { sortModel: initialSort } },
      slotProps: { toolbar: { extra: <AutoSortSwitch autoSort={autoSort} setAutoSort={setAutoSort} /> } },
      columns: columnsWithCheckbox,
      ...restTableProps,
    }) satisfies Partial<TableProps>,
    [apiRef, composedOnReady, isPresorted, initialSort, autoSort, setAutoSort, restTableProps, columnsWithCheckbox]
  );

  return { syncedTableProps };
}
