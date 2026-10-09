import { useMemo, useState, type RefObject, type SetStateAction } from "react";
import { GridLogicOperator, type GridApi, type GridFilterModel } from "@mui/x-data-grid-premium";
import { excludedValues, filteredColumns, isSearching, toggleValue } from "./columnFilters";

/** What a plot reads of, and does to, its table's filters. */
export type TableFilters = {
  /** The table's filter model, joined with AND alone so a column's items read as its chips. */
  model: GridFilterModel;
  setModel: (model: SetStateAction<GridFilterModel>) => void;
  /** Clears every filter, the search with them. */
  clear: () => void;
  /** Whether the table lists a row, by its id, once filtered. */
  isListed: (id: string) => boolean;
  /** The values among `values` a column's filters leave out: a chip legend's switched-off chips. */
  excluded: (column: string, values: readonly string[]) => ReadonlySet<string>;
  /** Switches a value in or out of a column's filters - a chip clicked. `values` are all the column's. */
  toggle: (column: string, value: string, values: readonly string[]) => void;
  /** The columns the table filters by, so a plot can say what its chips don't. */
  columns: readonly string[];
  /** Whether the table's search filters anything. */
  searching: boolean;
};

type UseTableFiltersOptions<T> = {
  apiRef: RefObject<GridApi | null>;
  /** The table's rows. */
  rows: T[];
  /** The rows the table lists once filtered, or null until it first reports them. */
  listedRows: T[] | null;
  getRowId: (row: T) => string;
  /** The filters the table starts with, and what clearing them goes back to. */
  initialModel: GridFilterModel;
};

/** AND alone, so a column's items can be read one at a time - see columnFilters. */
const FILTER_PANEL = { logicOperators: [GridLogicOperator.And] };

/**
 * Holds a table's filter model, so a plot's chips can read and edit it, and says which rows it lists.
 * Part of useTablePlotSync, which spreads `tableProps` onto the table with the rest of its own.
 */
export function useTableFilters<T>({ apiRef, rows, listedRows, getRowId, initialModel }: UseTableFiltersOptions<T>) {
  // What clearing goes back to, as first given, so an inline model needn't be memoized.
  const [initial] = useState(initialModel);
  const [model, setModel] = useState<GridFilterModel>(initial);
  const columns = useMemo(() => filteredColumns(model), [model]);
  const searching = isSearching(model);

  // Every row while nothing filters - which covers the render before the table first reports what it
  // lists, and rows just handed to it that it hasn't yet.
  const filtering = columns.length > 0 || searching;
  const listedIds = useMemo(
    () => new Set((filtering && listedRows ? listedRows : rows).map(getRowId)),
    [filtering, listedRows, rows, getRowId]
  );

  const filters = useMemo(
    (): TableFilters => ({
      model,
      setModel,
      clear: () => setModel(initial),
      isListed: (id) => listedIds.has(id),
      excluded: (column, values) => excludedValues(model, column, values),
      toggle: (column, value, values) => {
        // A singleSelect's values are filtered out with "not", a text column's with "doesNotEqual".
        const type = apiRef.current?.getColumn(column)?.type;
        setModel((prev) => toggleValue(prev, column, value, values, type));
      },
      columns,
      searching,
    }),
    [model, initial, listedIds, apiRef, columns, searching]
  );

  return {
    filters,
    tableProps: { filterModel: model, onFilterModelChange: setModel, filterPanel: FILTER_PANEL },
  };
}
