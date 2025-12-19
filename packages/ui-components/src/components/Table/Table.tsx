import {
  DataGridPremium,
  GridAutosizeOptions,
  GridColDef,
  GridColumnHeaderParams,
  GridToolbarProps,
  ToolbarPropsOverrides,
  useGridApiRef,
  useKeepGroupedColumnsHidden,
} from "@mui/x-data-grid-premium";
import { useMemo, useEffect, useCallback, useRef } from "react";
import TableFallback from "./EmptyFallback";
import { TableProps } from "./types";
import { CustomToolbar } from "./CustomToolbar";
import { HeaderWithTooltip } from "./HeaderWithToolip";

export const autosizeOptions: GridAutosizeOptions = {
  expand: true,
  includeHeaders: true,
  outliersFactor: 1.5,
};

const Table = (props: TableProps) => {
  /**
   * Provide defaults
   * @todo obey the defaults specified in the theme.
   * Ex: Overriding density like this overrides the defaults specified in the theme
   */
  const {
    pagination = true,
    columns,
    density = "compact",
    rows = [],
    apiRef: externalApiRef,
    emptyTableFallback,
    showToolbar = true,
    divHeight = {},
    sx = {},
    error = false,
    slots = {},
    label,
    labelTooltip,
    downloadFileName,
    toolbarSlot,
    toolbarStyle,
    toolbarIconColor,
    initialState,
    ...restDataGridProps
  } = props;

  const CustomToolbarWrapper = useMemo(() => {
    const customToolbarProps = {
      label,
      downloadFileName,
      labelTooltip,
      toolbarSlot,
      toolbarStyle,
      toolbarIconColor,
    };
    return (props: GridToolbarProps & ToolbarPropsOverrides) => <CustomToolbar {...props} {...customToolbarProps} />;
  }, [label, labelTooltip, toolbarSlot]);

  // This handles transforming columns of the TableColDef type back to GridColDef, dealing with adding the tooltip element to the RenderHeader
  const transformedColumns: GridColDef[] = useMemo(() => {
    return columns.map((col) => {
      // If no tooltip is defined, return the column as-is
      if (!col.tooltip) {
        return col;
      }

      // If tooltip exists, override the renderHeader with HeaderWithTooltip
      return {
        ...col,
        renderHeader: (params: GridColumnHeaderParams) => (
          <HeaderWithTooltip 
            params={params} 
            tooltipTitle={col.tooltip!} // We know it exists here
            originalRenderHeader={col.renderHeader} // Pass the user's custom renderer if it exists
          />
        ),
      };
    });
  }, [columns]);

  //Assign default ID if no ID is provided in the row data
  const rowsWithIds = useMemo(() => rows.map((row, index) => ({ ...row, id: row?.id || index })), [rows]);

  const internalApiRef = useGridApiRef();
  // prioritize using the provided apiRef if available, otherwise create a new one
  const apiRef = externalApiRef ?? internalApiRef;

  const handleResizeCols = useCallback(() => {
    // need to check .autosizeCoumns since the current was being set with an empty object
    if (!apiRef.current?.autosizeColumns) return;
    apiRef.current.autosizeColumns(autosizeOptions);
  }, [apiRef]);

  // trigger resize when rows or columns change so that rows/columns don't need to be memoized outisde of this component
  // otherwise sometimes would snap back to default widths when rows/columns change
  useEffect(() => {
    handleResizeCols();
  }, [rows, transformedColumns, handleResizeCols]);

  useEffect(() => {
    return apiRef.current?.subscribeEvent("rowExpansionChange", (params) => {
      if (params.childrenExpanded) {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }
    });
  }, [apiRef]);

  //subscribe to viewportInnerSizeChange events to resize columns automatically on screen width change
  //This creates a very slight performance impact. May need to remove down the line if it becomes an issue
  useEffect(() => {
    return apiRef.current?.subscribeEvent("viewportInnerSizeChange", handleResizeCols);
  }, [apiRef]);

  const internalInitialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState,
  });

  const shouldDisplayEmptyFallback = emptyTableFallback && rowsWithIds.length === 0 && !restDataGridProps.loading;

  if (shouldDisplayEmptyFallback) {
    return typeof emptyTableFallback === "string" ? (
      <TableFallback message={emptyTableFallback} variant="empty" />
    ) : (
      emptyTableFallback
    );
  }

  if (error) {
    return <TableFallback message={`Error fetching ${label}`} variant="error" />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxHeight: '100%',
        ...divHeight,
      }}
    >
      <DataGridPremium
        apiRef={apiRef}
        columns={transformedColumns}
        rows={rowsWithIds}
        autosizeOnMount
        autosizeOptions={autosizeOptions}
        disableRowSelectionOnClick
        showToolbar={showToolbar}
        density={density}
        sx={{
          "& .MuiDataGrid-toolbarDivider": {
            height: "20px",
          },
          ...sx,
        }}
        slots={{
          toolbar: CustomToolbarWrapper,
          ...slots,
        }}
        disableAggregation
        disablePivoting
        initialState={internalInitialState}
        {...restDataGridProps}
      />
    </div>
  );
};

export default Table;
