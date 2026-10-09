import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  gridFilteredSortedRowEntriesSelector,
  useGridApiRef,
  type GridApi,
  type GridColDef,
  type GridFilterModel,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid-premium";
import type { RefObject } from "react";
import { TableProps } from "../Table";
import AutoSortSwitch from "./AutoSortSwitch";
import { useAutoSort } from "./useAutoSort";
import { useTableFilters } from "./useTableFilters";

/**
 * Shallow equality check for arrays by element reference.
 * Used to prevent unnecessary state updates when the DataGrid
 * fires events but the actual row order/content hasn't changed.
 */
function arraysShallowEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

type UseTablePlotSyncOptions<T> = {
  /** Pre-transformed rows to display in the table */
  rows: T[];
  /** Extract a unique string ID from a row */
  getRowId: (row: T) => string;
  /**
   * The table's sort until the reader changes it, and what turning auto sort off goes back to.
   * Compared by value, so it can be written inline.
   * @default []
   */
  initialSort?: GridSortModel;
  /** True when rows are pre-sorted (e.g. tissue grouping) — disables column sorting. */
  isPresorted?: boolean;
  /**
   * The table's filters until the reader changes them, and what clearing them goes back to.
   * @default { items: [] }
   */
  initialFilters?: GridFilterModel;
};

const NO_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };
const NO_SORT: GridSortModel = [];
const NO_FILTERS: GridFilterModel = { items: [] };
const NO_ROWS: never[] = [];

/** The checkbox column stays out of the columns panel, so it can't be hidden and selection lost with it. */
const togglableColumns = (columns: GridColDef[]) =>
  columns.filter(({ field }) => field !== GRID_CHECKBOX_SELECTION_FIELD).map(({ field }) => field);

/**
 * Manages shared state between a table and its companion plots, and everything the table needs to
 * take part: spread `tableProps` onto a `<Table>` with its columns.
 *
 * Handles:
 * - Selection state (bidirectional between table checkboxes and plot clicks), group rows included
 * - Syncing the table's sorted/filtered rows to plots via DataGrid events
 * - The table's filters, held here so a plot can read and edit them as chips and dim the rows the
 *   table filters out - see useTableFilters
 * - Auto sort: selected rows kept at the top, toggled from the table's toolbar, and read back as
 *   `autoSort` for plots that follow the table's order
 * - The table's initial sort, and turning column sorting off for pre-sorted rows
 */
export function useTablePlotSync<T>({
  rows,
  getRowId,
  initialSort = NO_SORT,
  isPresorted = false,
  initialFilters = NO_FILTERS,
}: UseTablePlotSyncOptions<T>) {
  /**
   * The grid's own selection model, group rows included. It's kept whole rather than rebuilt from the
   * selected rows: the grid marks a group selected by its own row's id, so a model of data rows alone
   * leaves every group reading as partly selected, and a click on a partly selected group can only
   * select - which it already is.
   */
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(NO_SELECTION);
  // Null until the grid first reports its rows.
  const [sortedFilteredData, setSortedFilteredData] = useState<T[] | null>(null);
  const apiRef = useGridApiRef();

  // Use refs so stable callbacks always access current values
  const getRowIdRef = useRef(getRowId);
  const rowsRef = useRef(rows);
  useEffect(() => {
    getRowIdRef.current = getRowId;
    rowsRef.current = rows;
  });

  const stableGetRowId = useCallback((r: T) => getRowIdRef.current(r), []);

  // Kept by value: auto sort resets the grid's sort whenever this changes, so an inline array that
  // was new every render would undo each column the reader sorts by on the next render.
  const sortKey = JSON.stringify(initialSort);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by value, as above
  const sortBase = useMemo(() => initialSort, [sortKey]);
  const { autoSort, setAutoSort, onReady: autoSortOnReady } = useAutoSort(apiRef, sortBase, isPresorted);
  const {
    filters,
    tableProps: { filterModel, onFilterModelChange, filterPanel },
  } = useTableFilters({
    apiRef,
    rows,
    listedRows: sortedFilteredData,
    getRowId: stableGetRowId,
    initialModel: initialFilters,
  });

  /**
   * Called via Table's `onReady` prop once the DataGrid has mounted, when its events can be
   * subscribed to. sortedRowsSet and filteredRowsSet fire after the grid has recomputed its rows,
   * which keeps sortedFilteredData in step with it; auto sort adds its own subscriptions.
   */
  const onTableReady = useCallback(
    (readyApiRef: RefObject<GridApi>) => {
      const sync = () => {
        // Leaf rows only: with row grouping on, the grid lists a row of its own to head each group
        // among the data rows, with an empty model that no plot can draw.
        const newRows = gridFilteredSortedRowEntriesSelector(readyApiRef)
          .filter(({ id }) => readyApiRef.current.getRowNode(id)?.type === "leaf")
          .map((x) => x.model) as T[];
        setSortedFilteredData((prev) => (prev && arraysShallowEqual(prev, newRows) ? prev : newRows));
      };
      sync(); // initial sync
      return [
        readyApiRef.current.subscribeEvent("sortedRowsSet", sync),
        readyApiRef.current.subscribeEvent("filteredRowsSet", sync),
        ...autoSortOnReady(readyApiRef),
      ];
    },
    [autoSortOnReady]
  );

  /** The selected rows, in the order they were selected: the data rows in a selection model. */
  const rowsIn = useCallback(
    (model: GridRowSelectionModel, from: T[]) => {
      const byId = new Map(from.map((row) => [stableGetRowId(row), row]));
      return Array.from(model.ids).flatMap((id) => byId.get(String(id)) ?? []);
    },
    [stableGetRowId]
  );

  const selected = useMemo(() => rowsIn(selectionModel, rows), [rowsIn, selectionModel, rows]);

  /**
   * Sets the selection to the given rows, as a plot click does. The grid adds any groups they fill
   * when the model comes back to it, and reports the result - see handleRowSelectionModelChange.
   */
  const setSelected = useCallback(
    (next: SetStateAction<T[]>) =>
      setSelectionModel((model) => {
        const rows = typeof next === "function" ? next(rowsIn(model, rowsRef.current)) : next;
        return { type: "include", ids: new Set(rows.map(stableGetRowId)) };
      }),
    [rowsIn, stableGetRowId]
  );

  const handleRowSelectionModelChange = useCallback((model: GridRowSelectionModel) => {
    // "Every row but these" isn't asked for (see disableRowSelectionExcludeModel below), but read it
    // right if it comes: every data row but the excluded ones.
    setSelectionModel(
      model.type === "include"
        ? model
        : { type: "include", ids: new Set(rowsRef.current.map(getRowIdRef.current).filter((id) => !model.ids.has(id))) }
    );
  }, []);

  /** Toggle a single item's selection state. Use for plot click handlers. */
  const toggleSelection = useCallback(
    (item: T) => {
      const id = stableGetRowId(item);
      setSelected((prev) =>
        prev.some((x) => stableGetRowId(x) === id) ? prev.filter((x) => stableGetRowId(x) !== id) : [...prev, item]
      );
    },
    [setSelected, stableGetRowId]
  );

  const tableProps = useMemo(
    () => ({
      apiRef,
      getRowId: stableGetRowId,
      checkboxSelection: true as const,
      onRowSelectionModelChange: handleRowSelectionModelChange,
      rowSelectionModel: selectionModel,
      keepNonExistentRowsSelected: true,
      // "Select all" as a list of the rows it selects, not "every row but none" - so the model always
      // names the selected rows, and deselecting one after it just drops that one.
      disableRowSelectionExcludeModel: true,
      onReady: onTableReady,
      disableColumnSorting: isPresorted,
      initialState: { sorting: { sortModel: sortBase } },
      filterModel,
      onFilterModelChange,
      slotProps: {
        toolbar: { extra: <AutoSortSwitch autoSort={autoSort} setAutoSort={setAutoSort} /> },
        columnsManagement: { getTogglableColumns: togglableColumns },
        filterPanel,
      },
    }),
    [
      apiRef,
      stableGetRowId,
      handleRowSelectionModelChange,
      selectionModel,
      onTableReady,
      isPresorted,
      sortBase,
      autoSort,
      setAutoSort,
      filterModel,
      onFilterModelChange,
      filterPanel,
    ]
  ) satisfies Partial<TableProps>;

  return {
    selected,
    setSelected,
    toggleSelection,
    getRowId: stableGetRowId,
    /** The rows the table lists, in its order: none until it first reports them. */
    sortedFilteredData: sortedFilteredData ?? (NO_ROWS as T[]),
    /** The table's filters, for a plot to read and edit as chips. */
    filters,
    /** Whether the table keeps selected rows at the top - which a plot following its order can read. */
    autoSort,
    setAutoSort,
    apiRef,
    /** Spread onto the `<Table>`, with its columns. */
    tableProps,
  };
}

/** The props useTablePlotSync gives a `<Table>`: spread them onto it with its columns. */
export type SyncedTableProps<T> = ReturnType<typeof useTablePlotSync<T>>["tableProps"];
