import {
  DataGridPremium,
  GridAutosizeOptions,
  GridToolbarProps,
  ToolbarPropsOverrides,
  useGridApiRef,
  useKeepGroupedColumnsHidden,
} from "@mui/x-data-grid-premium";
import { useMemo, useEffect, useCallback, useRef } from "react";
import TableFallback from "./EmptyFallback";
import { TableProps } from "./types";
import { CustomToolbar } from "./CustomToolbar";

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

  //Assign default ID if no ID is provided in the row data
  const rowsWithIds = useMemo(() => rows.map((row, index) => ({ ...row, id: row?.id || index })), [rows]);

  const internalApiRef = useGridApiRef();
  // prioritize using the provided apiRef if available, otherwise create a new one
  const apiRef = externalApiRef ?? internalApiRef;

  const handleResizeCols = () => {
    console.log("handleResizeCols called");
    // need to check .autosizeCoumns since the current was being set with an empty object
    if (!apiRef.current?.autosizeColumns) return;
    apiRef.current.autosizeColumns(autosizeOptions);
  };

  // trigger resize when rows or columns change so that rows/columns don't need to be memoized outisde of this component
  // otherwise sometimes would snap back to default widths when rows/columns change
  // useEffect(() => {
  //   // avoid autosizing on every render by checking if apiRef is ready
  //   // and only resize if we have content or if columns are defined
  //   const timeoutId = setTimeout(() => {
  //     handleResizeCols();
  //   }, 0);
  //   return () => clearTimeout(timeoutId);
  // }, [rows, columns, handleResizeCols]);

  useEffect(() => {
    return apiRef.current?.subscribeEvent("rowExpansionChange", (params) => {
      if (params.childrenExpanded) {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }
    });
  }, [apiRef]);

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

  /**
   * Todo:
   * - For some reason (unknown if related to using the table with too many cols (in BiosampleTable) or if due to upgrading to premuim)
   * calling handleResizeCols, which calls the autosize method of the api, triggers the onResize callback which infinitely rerenders.
   * Maybe this can be solved with a ref that gates calling the method multiple times in a row, but not sure how that would play with the
   * useEffect which aims to solve issue of rows snapping back to initial state when the reference to them changes.
   */

  const internalInitialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...divHeight,
      }}
    >
      <DataGridPremium
        apiRef={apiRef}
        columns={columns}
        rows={rowsWithIds}
        autosizeOnMount
        onResize={(params, event, details) => {
          if (onResize) {
            onResize(params, event, details);
          }
          // console.log("onResize")
          // This is being called infinitely now? Causes freeze
          // handleResizeCols();
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
          ...slots,
        }}
        initialState={internalInitialState}
        {...restDataGridProps}
      />
    </div>
  );
};

export default Table;
