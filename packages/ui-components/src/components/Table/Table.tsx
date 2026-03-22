import {
  DataGridPremium,
  GridApiPremium,
  GridAutosizeOptions,
  GridColDef,
  GridColumnHeaderParams,
  GridToolbarProps,
  ToolbarPropsOverrides,
  useGridApiRef,
  useKeepGroupedColumnsHidden,
} from "@mui/x-data-grid-premium";
import NoSsr from "@mui/material/NoSsr";
import Skeleton from "@mui/material/Skeleton";
import { useMemo, useEffect, useCallback, useRef, ReactNode, CSSProperties, RefObject } from "react";
import TableFallback from "./EmptyFallback";
import { TableProps } from "./types";
import { CustomToolbar } from "./CustomToolbar";
import { HeaderWithTooltip } from "./HeaderWithToolip";
import { useContainerResize } from "./useContainerResize";

export const autosizeOptions: GridAutosizeOptions = {
  expand: true,
  includeHeaders: true,
  outliersFactor: 1.5,
};

type CustomDataGridProps = Omit<TableProps, "emptyTableFallback" | "error"> & { rows: NonNullable<TableProps["rows"]> };

const CustomDataGridPremium = (props: CustomDataGridProps) => {
  const {
    pagination = true,
    columns,
    density = "compact",
    rows,
    apiRef: externalApiRef,
    showToolbar = true,
    divHeight,
    sx = {},
    slots = {},
    label,
    labelTooltip,
    downloadFileName,
    toolbarSlot,
    toolbarStyle,
    toolbarIconColor,
    initialState,
    onReady,
    ...restDataGridProps
  } = props;

  // Create a ref for the wrapper div to measure container resizing
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toolbarPropsRef = useRef({ label, downloadFileName, labelTooltip, toolbarSlot, toolbarStyle, toolbarIconColor });
  toolbarPropsRef.current = { label, downloadFileName, labelTooltip, toolbarSlot, toolbarStyle, toolbarIconColor };

  // Stable component identity regardless of toolbar prop changes, so DataGrid never unmounts/remounts the toolbar slot
  const CustomToolbarWrapper = useMemo(
    () => (props: GridToolbarProps & ToolbarPropsOverrides) => <CustomToolbar {...props} {...toolbarPropsRef.current} />,
    []
  );

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

  const internalApiRef = useGridApiRef();
  // prioritize using the provided apiRef if available, otherwise create a new one
  const apiRef = externalApiRef ?? internalApiRef;

  const handleResizeCols = useCallback(() => {
    // need to check .autosizeColumns since the current was being set with an empty object
    if (!apiRef.current?.autosizeColumns) return;
    apiRef.current.autosizeColumns(autosizeOptions);
  }, [apiRef]);

  // trigger resize when rows or columns change so that rows/columns don't need to be memoized outside of this component
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

  useEffect(() => {
    if (!apiRef.current) return;
    const cleanups = onReady?.(apiRef as RefObject<GridApiPremium>);
    if (!cleanups) return;
    if (Array.isArray(cleanups)) return () => cleanups.forEach(fn => fn());
    return cleanups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure wrapper div for changes in size to trigger autosizeColumns
  // Both resize and viewportInnerSizeChange events on the DataGrid are triggered on column resize so couldn't use those instead
  useContainerResize(wrapperRef, handleResizeCols);

  const internalInitialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState,
  });

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: '100%' }}>
      <DataGridPremium
        apiRef={apiRef}
        columns={transformedColumns}
        autosizeOnMount
        rows={rows}
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

const TableContainer = ({
  autoHeight,
  divHeight = {},
  children,
}: {
  autoHeight?: boolean;
  divHeight?: TableProps["divHeight"];
  children: ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: autoHeight ? "auto" : "100%",
      ...divHeight,
    }}
  >
    {children}
  </div>
);

const TableSSRBoundary = ({ children }: { children: ReactNode }) => (
  <NoSsr fallback={<Skeleton variant="rounded" width="100%" height="100%" sx={{ minHeight: 100 }} />}>
    {children}
  </NoSsr>
);

const Table = (props: TableProps) => {
  const {
    rows = [],
    emptyTableFallback,
    error = false,
    label,
    divHeight,
    ...restProps
  } = props;

  //Assign default ID if no ID is provided in the row data
  const rowsWithIds = useMemo(() => rows.map((row, index) => ({ ...row, id: row?.id || index })), [rows]);

  if (emptyTableFallback && rowsWithIds.length === 0 && !restProps.loading) {
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
    <TableContainer divHeight={divHeight} autoHeight={restProps.autoHeight}>
      <TableSSRBoundary>
        <CustomDataGridPremium rows={rowsWithIds} label={label} {...restProps} />
      </TableSSRBoundary>
    </TableContainer>
  );
};

export default Table;
