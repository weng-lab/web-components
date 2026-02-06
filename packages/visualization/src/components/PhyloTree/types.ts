export type TreeItem = {
  name: String;
  branch_length: number | null,
  children?: TreeItem[]
}

export type PhyloTreeProps = {
  width: number;
  height: number;
  /**
   * @default { top: 30, left: 30, right: 30, bottom: 30 };
   */
  margin?: { top: number; right: number; bottom: number; left: number };
  /**
   * @default 100
   */
  labelPadding?: number
  /**
   * If true, use `branch_length` values to position nodes (cumulative from root).
   * If false, layout uses uniform depth spacing.
   * @default false
   */
  useBranchLengths?: boolean;
  /**
   * @todo change this back to required before publishing
   */
  data?: TreeItem;
};