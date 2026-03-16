import { DataGridPremiumProps, GridApiPremium, GridColDef, GridValidRowModel } from "@mui/x-data-grid-premium";
import { RefObject, ReactElement, ReactNode } from "react";
import { SvgIconOwnProps, TooltipProps } from "@mui/material";

// Extend the GridColDef type to add optional tooltip to column
export type TableColDef<R extends GridValidRowModel = any, V = any, F = V> = GridColDef<R, V, F> & {
  tooltip?: TooltipProps["title"];
};

//The props listed here are the props which are new or overridden compared to the MUI DataGridProProps
interface BaseTableProps extends Omit<DataGridPremiumProps, 'label'> {
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
   * By default it's wrapped with:
   * ```jsx
   * <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
   * ```
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
   * Slot for extra component to be rendered within the toolbar, to the left of the filters
   */
  toolbarSlot?: ReactNode
  /**
   * If anything besides an element, renders tooltip icon to the right of the table label with specified string as tooltip contents.
   * If an element, renders the element to the right of the table label.
   */
  labelTooltip?: ReactNode
  /**
   * Styling object for the toolbar
   */
  toolbarStyle?: React.CSSProperties;
  /**
   * Color passed as `htmlColor` to columns, filter, download and search icons
   */
  toolbarIconColor?: SvgIconOwnProps["htmlColor"]
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

//This enforces that a downloadFileName is specified if a ReactElement is used as the label (no default )
export type TableProps = BaseTableProps & (
  | { label?: string; downloadFileName?: string }
  | { label: ReactElement; downloadFileName: string }
  | { label?: undefined; downloadFileName?: string }
);