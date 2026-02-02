export type TreeItem = {
  name: String;
  branch_length: number | null,
  children?: TreeItem[]
}

export type PhyloTreeProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  /**
   * If true, use `branch_length` values to position nodes (cumulative from root).
   * If false, layout uses uniform depth spacing.
   */
  useBranchLengths?: boolean;
  /**
   * Only supports Newick strings
   */
  data: TreeItem;
};