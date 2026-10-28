const sortedCache = new WeakMap<object, Float64Array>();

/**
 * Every finite value, sorted ascending: what a colorbar's histogram and a range editor read. Cached
 * by the array, so a heatmap and the page's ColorRangeButton given the same values share one sort.
 */
export const sortedValues = (values: ArrayLike<number>): Float64Array => {
  const cached = sortedCache.get(values);
  if (cached) return cached;
  const finite = new Float64Array(values.length);
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (Number.isFinite(value)) finite[count++] = value;
  }
  const sorted = finite.slice(0, count).sort();
  sortedCache.set(values, sorted);
  return sorted;
};
