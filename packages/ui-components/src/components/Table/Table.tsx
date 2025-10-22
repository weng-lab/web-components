import {
  DataGridPro,
  GridAutosizeOptions,
  GridToolbarProps,
  ToolbarPropsOverrides,
  useGridApiRef,
} from "@mui/x-data-grid-pro";
import { useMemo, useEffect, useCallback } from "react";
import TableFallback from "./EmptyFallback";
import { TableProps } from "./types";
import { CustomToolbar } from "./CustomToolbar";

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
    onResize,
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
    ...restDataGridProps
  } = props;

  const CustomToolbarWrapper = useMemo(() => {
    const customToolbarProps = {
      label,
      downloadFileName,
      labelTooltip,
      toolbarSlot,
      toolbarStyle
    };
    return (props: GridToolbarProps & ToolbarPropsOverrides) => <CustomToolbar {...props} {...customToolbarProps} />;
  }, [label, labelTooltip, toolbarSlot]);

  //Assign default ID if no ID is provided in the row data
  const rowsWithIds = useMemo(
    () => rows.map((row, index) => ({ ...row, id: row?.id || index })),
    [rows]
  );

  const autosizeOptions: GridAutosizeOptions = useMemo(
    () => ({
      expand: true,
      includeHeaders: true,
      outliersFactor: 1.5,
    }),
    []
  );

  const internalApiRef = useGridApiRef();
  // prioritize using the provided apiRef if available, otherwise create a new one
  const apiRef = externalApiRef ?? internalApiRef;

  const handleResizeCols = useCallback(() => {
    // need to check .autosizeCoumns since the current was being set with an empty object
    if (!apiRef.current?.autosizeColumns) return;
    apiRef.current.autosizeColumns(autosizeOptions);
  }, [apiRef, autosizeOptions]);

  // trigger resize when rows or columns change so that rows/columns don't need to be memoized outisde of this component
  // otherwise sometimes would snap back to default widths when rows/columns change
  useEffect(() => {
    handleResizeCols();
  }, [rows, columns, handleResizeCols]);

  const shouldDisplayEmptyFallback =
    emptyTableFallback &&
    rowsWithIds.length === 0 &&
    !restDataGridProps.loading;

  if (shouldDisplayEmptyFallback) {
    return typeof emptyTableFallback === "string" ? (
      <TableFallback message={emptyTableFallback} variant="empty" />
    ) : (
      emptyTableFallback
    );
  }

  if (error) {
    return <TableFallback message={`Error fetching ${label}`} variant="error" />
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...divHeight,
      }}
    >
      <DataGridPro
        apiRef={apiRef}
        columns={columns}
        rows={rowsWithIds}
        autosizeOnMount
        onResize={(params, event, details) => {
          if (onResize) {
            onResize(params, event, details);
          }
          handleResizeCols();
        }}
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
          ...slots
        }}
        {...restDataGridProps}
      />
    </div>
  );
};

export default Table;
