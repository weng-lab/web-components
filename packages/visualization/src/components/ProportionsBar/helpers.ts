export const getProportionsFromArray = <T extends Record<K, string>, K extends string, V extends string>(
  /**
   * Array of objects to pull values from.
   */
  data: T[],
  /**
   * The field you want to count up. Should resolve to a string in the object.
   */
  field: K,
  /**
   * Optionally define fields to include in the returned object.
   * Useful for getting 0 values in the returned object which otherwise would not be present.
   */
  includeValues?: V[] | readonly V[]
) => {
  const counts: Record<string, number> = {};
  if (includeValues) {
    includeValues.forEach((val) => (counts[val] = 0));
  }
  data?.forEach((entry) => {
    counts[entry[field]] ? counts[entry[field]]++ : (counts[entry[field]] = 1);
  });
  if (includeValues) {
    return counts as Record<T[K] | V, number>;
  } else return counts as Record<T[K], number>;
};

/**
 * Sorts an object of numeric values in descending order by value.
 * 
 * @param obj - An object with string keys and number values
 * @returns A new object with the same entries sorted by value (descending)
 */
export function sortObjectByValueDesc<K extends string>(
  obj: Record<K, number>
): Record<K, number> {
  return Object.fromEntries((Object.entries(obj) as [K, number][]).sort(([, a], [, b]) => b - a)) as Record<K, number>;
}