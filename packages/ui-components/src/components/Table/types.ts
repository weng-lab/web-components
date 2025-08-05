import { DataGridProProps } from "@mui/x-data-grid-pro";
import { ReactElement, ReactNode } from "react";

//The props listed here are the props which are new (like elevation) or overridden (like pageSizeOptions) compared to the MUI DataGridProProps

export interface TableProps extends DataGridProProps {
  /**
   * Rows to be consumed in the table.
   * 
   * ```undefined``` will be given default value of ```[]```
   * 
   * Note: Rows without an 'id' property will be given id matching their index
   */
  rows: DataGridProProps["rows"];
  /**
   * @default true
   * @note Overrides MUI default
   */
  disableRowSelectionOnClick?: DataGridProProps["disableRowSelectionOnClick"];
  /**
   * @default "compact"
   * @note Overrides MUI default
   */
  density?: DataGridProProps["density"];
  /**
   * @default true
   * @note Overrides MUI default
   */
  autosizeOnMount?: boolean;
  /**
   * @note Table assigns a default internal ID to each row if no ID is provided in the row data.
   */
  getRowId?: DataGridProProps["getRowId"];
  /**
   * Element to be rendered instead of `DataGridPro` when `rows` has a length of `0`.
   * If a string is passed will use `TableFallback` component
   */
  emptyTableFallback?: string | ReactElement;
  /**
   * If true, the toolbar is displayed.
   * @default true
   */
  showToolbar?: DataGridProProps["showToolbar"]
  /**
   * Configures the height properties of the wrapper `<div>`. 
   * 
   * By default it's wrapped with:
   * ```jsx
   * <div style={{ display: 'flex', flexDirection: 'column' }}>
   * ```
   * 
   * Additional height properties spread onto this `<div>`
   */
  divHeight?: {
    height?: string
    minHeight?: string
    maxHeight?: string
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
}

export type TableToolbarProps = {
  /**
   * Optional ReactNode to be used in the table toolbar. Strings and numbers will be rendered as Typography variant h6.
   */
  title?: ReactNode;
};