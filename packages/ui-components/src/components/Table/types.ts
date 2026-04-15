import { DataGridPremiumProps, GridApiPremium, GridColDef, GridValidRowModel } from "@mui/x-data-grid-premium";
import { CSSProperties, RefObject, ReactElement, ReactNode } from "react";
import { SvgIconOwnProps, TooltipProps } from "@mui/material";

// Extend the GridColDef type to add optional tooltip to column
export type TableColDef<R extends GridValidRowModel = any, V = any, F = V> = GridColDef<R, V, F> & {
  tooltip?: TooltipProps["title"];
};

//The props listed here are the props which are new or overridden compared to the MUI DataGridProProps
export interface TableProps extends Omit<DataGridPremiumProps, 'label'> {
  /**
   * Rows to be consumed in the table.
   *
   * ```undefined``` will be given default value of ```[]```
   *
   * Note: Rows without an 'id' property will be given id matching their index
   */
  rows: DataGridPremiumProps["rows"];
  /**
   * Columns to be used. TableColDef is same as GridColDef plus an optional tooltip property
   */
  columns: TableColDef[];
  /**
   * Table label. Rendered inside the toolbar. If a string, it is also used as the default export filename.
   */
  label?: string | ReactElement;
  /**
   * @default true
   * @note Overrides MUI default
   */
  disableRowSelectionOnClick?: DataGridPremiumProps["disableRowSelectionOnClick"];
  /**
   * @default "compact"
   * @note Overrides MUI default
   */
  density?: DataGridPremiumProps["density"];
  /**
   * @default true
   * @note Overrides MUI default
   */
  autosizeOnMount?: boolean;
  /**
   * @note Table assigns a default internal ID to each row if no ID is provided in the row data.
   */
  getRowId?: DataGridPremiumProps["getRowId"];
  /**
   * Element to be rendered instead of `DataGridPro` when `rows` has a length of `0`.
   * If a string is passed will use `TableFallback` component
   */
  emptyTableFallback?: string | ReactElement;
  /**
   * If true, the toolbar is displayed.
   * @default true
   */
  showToolbar?: DataGridPremiumProps["showToolbar"]
  /**
   * Configures the height properties of the wrapper `<div>`.
   *
   * By default the wrapper uses `height: '100%'` (or `height: 'auto'` when `autoHeight` is set).
   *
   * Additional height properties spread onto this `<div>`
   */
  divHeight?: {
    height?: string | number
    minHeight?: string | number
    maxHeight?: string | number
  }
  /**
   * Used for failed fetches. If true will display error fallback
   * @default false
   */
  error?: boolean
  /**
   * Called once after the DataGrid has mounted and the apiRef is fully initialized.
   * Use this to subscribe to DataGrid events that don't have a corresponding event prop (e.g. `rowExpansionChange`).
   * Return a single unsubscribe function or an array of unsubscribe functions for cleanup.
   *
   * @example
   * onReady={(apiRef) => apiRef.current.subscribeEvent("rowExpansionChange", handler)}
   *
   * @example
   * onReady={(apiRef) => [
   *   apiRef.current.subscribeEvent("rowExpansionChange", handler1),
   *   apiRef.current.subscribeEvent("someOtherEvent", handler2),
   * ]}
   */
  onReady?: (apiRef: RefObject<GridApiPremium>) => (() => void) | (() => void)[] | void
}

// Augment MUI's ToolbarPropsOverrides so our custom toolbar keys are typed on
// `slotProps.toolbar` for consumers. All toolbar customization flows through here.
declare module "@mui/x-data-grid-premium" {
  interface ToolbarPropsOverrides {
    /** Table label. Injected internally from the top-level `label` prop; consumers should pass `label` at the top level. */
    label?: TableProps["label"];
    /** Extra content rendered inside the toolbar, to the left of the filters. */
    extra?: ReactNode;
    /** Inline style applied to the Toolbar root. */
    style?: CSSProperties;
    /** Color forwarded as `htmlColor` to the columns/filter/download/search icons. */
    iconColor?: SvgIconOwnProps["htmlColor"];
    /** Optional info tooltip rendered next to the label. String/number renders inside an InfoOutline tooltip; any other ReactNode renders raw. */
    labelTooltip?: ReactNode;
  }
}
