export type ProportionsBarProps<K extends string> = {
  /**
   * An object with categories for keys, and values for the counts for the category
   * Ex:
   * ```jsx
   * {
   *    "apple": 3
   *    "banana": 8
   *    "orange": 0
   *    "pear": 2
   * }
   * ```
   */
  data: Record<K, number>;
  /**
   * Title for top of tooltip
   */
  tooltipTitle: string;
  /**
   * Optional label to be displayed above the bar
   */
  label?: string;
  /**
   * If true will display a loading state instead of the bar. Uses MUI `<LinearProgress>`
   */
  loading?: boolean;
  /**
   * 
   * @param key 
   * @returns the color to be used for the category in both the bar and the tooltip
   */
  getColor: (key: K) => string;
  /**
   * Optional formatter for the category for display purposes
   * @param key 
   * @returns 
   */
  formatLabel?: (key: K) => string;
  /**
   * By default this component keeps original insertion order, set this to sort descending.
   */
  sortDescending?: boolean;
  /**
   * applied to wrapper div
   */
  style?: React.CSSProperties;
};
