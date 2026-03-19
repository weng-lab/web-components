import { GRID_CHECKBOX_SELECTION_COL_DEF } from "@mui/x-data-grid-premium";
import { TableColDef } from "../Table";

//This is used to prevent sorting from happening when clicking on the header checkbox
export const StopPropagationWrapper: TableColDef["renderHeader"] = (params) => {
  const DefaultHeader = GRID_CHECKBOX_SELECTION_COL_DEF.renderHeader;
  if (!DefaultHeader) return null;
  return (
    <div id={"StopPropagationWrapper"} onClick={(e) => e.stopPropagation()}>
      <DefaultHeader {...params} />
    </div>
  );
};

export const sortableTableCheckboxColumn = {
  ...GRID_CHECKBOX_SELECTION_COL_DEF, //Override checkbox column https://mui.com/x/react-data-grid/row-selection/#custom-checkbox-column
  sortable: true,
  hideable: false,
  renderHeader: StopPropagationWrapper,
} satisfies TableColDef;
