/**
 * A table's filter model read and written one column at a time, as a plot's chips are: each of the
 * column's values switched in or out. The grid's own operators test the values, so a chip reads as
 * switched off exactly where the table filters its value out, whoever wrote the filter.
 *
 * Read with AND alone: a column's items can't be read on their own once OR joins them to the rest.
 */

import {
  getGridSingleSelectOperators,
  getGridStringOperators,
  GridLogicOperator,
  type GridColDef,
  type GridColType,
  type GridFilterItem,
  type GridFilterModel,
} from "@mui/x-data-grid-premium";

type ValueTest = (value: unknown) => boolean;

/**
 * The operators a chip's column is filtered by, looked up by name: a singleSelect's, then a text
 * column's. Only "is any of" is in both, and they agree on any value a chip writes.
 */
const OPERATORS = [...getGridSingleSelectOperators(), ...getGridStringOperators()];

/**
 * The grid's test for an item, or null where it doesn't filter yet (no value picked), as the grid
 * skips it. These operators read only the cell's value, so they run without a grid.
 */
const testOf = (item: GridFilterItem): ValueTest | null => {
  const operator = OPERATORS.find(({ value }) => value === item.operator);
  return (
    (operator?.getApplyFilterFn(item, { field: item.field } as GridColDef) as ValueTest | null | undefined) ?? null
  );
};

/** Whether an item filters anything: the grid skips one with no value picked, unless it needs none. */
const isActive = ({ operator, value }: GridFilterItem) =>
  operator === "isEmpty" ||
  operator === "isNotEmpty" ||
  (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0));

/** The values among `values` the items on a column leave out. */
export const excludedValues = (
  model: GridFilterModel,
  column: string,
  values: readonly string[]
): ReadonlySet<string> => {
  const tests = model.items.filter((item) => item.field === column).flatMap((item) => testOf(item) ?? []);
  return new Set(values.filter((value) => tests.some((test) => !test(value))));
};

/**
 * The model with a column filtered to leave out exactly `excluded` among its `values`: an item per
 * value where few are out, "is any of" the rest where most are, so the filter panel reads as the
 * chips look. A singleSelect's values are left out with "not", a text column's with "doesNotEqual".
 */
export const withExcludedValues = (
  model: GridFilterModel,
  column: string,
  excluded: ReadonlySet<string>,
  values: readonly string[],
  type?: GridColType
): GridFilterModel => {
  const kept = values.filter((value) => !excluded.has(value));
  const items: GridFilterItem[] =
    excluded.size === 0
      ? []
      : kept.length > 0 && kept.length < excluded.size
        ? [{ id: `${column}:kept`, field: column, operator: "isAnyOf", value: kept }]
        : [...excluded].map((value) => ({
            id: `${column}:${value}`,
            field: column,
            operator: type === "singleSelect" ? "not" : "doesNotEqual",
            value,
          }));
  return {
    ...model,
    logicOperator: GridLogicOperator.And,
    items: [...model.items.filter((item) => item.field !== column), ...items],
  };
};

/** A value switched in or out of a column's filters - a chip clicked. `values` are all the column's. */
export const toggleValue = (
  model: GridFilterModel,
  column: string,
  value: string,
  values: readonly string[],
  type?: GridColType
): GridFilterModel => {
  const excluded = new Set(excludedValues(model, column, values));
  if (!excluded.delete(value)) excluded.add(value);
  return withExcludedValues(model, column, excluded, values, type);
};

/** The columns the model filters by, in the order their filters were added. */
export const filteredColumns = (model: GridFilterModel): string[] => [
  ...new Set(model.items.filter(isActive).map(({ field }) => field)),
];

/** Whether the model's search has anything to search for. */
export const isSearching = (model: GridFilterModel) =>
  (model.quickFilterValues ?? []).some((word) => word !== "" && word != null);
