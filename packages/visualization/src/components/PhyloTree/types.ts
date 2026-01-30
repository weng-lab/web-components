export type TreeItem = {
  name: String;
  branch_length: number | null,
  children?: TreeItem[]
}

export type PhyloTreeProps = {
  /**
   * The display mode of the tree
   */
  layout: "vertical" | "horizontal" | "radial";
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  /**
   * Only supports Newick strings
   */
  data: TreeItem;
};