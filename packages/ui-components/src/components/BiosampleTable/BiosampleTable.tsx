import Table from "../Table/Table";
import { encodeColumns, initialTableState } from "./consts";
import {
  BiosampleTablePropsEncode,
  BiosampleTablePropsMixed,
  BiosampleTablePropsCustom,
  EncodeBiosample,
  UnknownRow,
} from "./types";
import { useEncodeBiosampleData } from "./useEncodeBiosampleData";
import { JSX } from "react";

/**
 * Overloads allow different combinations of props to be type validated properly
 */
export function BiosampleTable(props: BiosampleTablePropsEncode): JSX.Element;
export function BiosampleTable<T extends UnknownRow>(props: BiosampleTablePropsMixed<T>): JSX.Element;
export function BiosampleTable<T extends UnknownRow>(props: BiosampleTablePropsCustom<T>): JSX.Element;

export function BiosampleTable<T extends UnknownRow>(
  props: BiosampleTablePropsEncode | BiosampleTablePropsMixed<T> | BiosampleTablePropsCustom<T>
): JSX.Element {
  const {
    sources = ["encode"],
    extraRows,
    loading,
    error,
    assembly,
    prefilterBiosamples,
    columns = encodeColumns,
    label = "Biosamples",
    downloadFileName = "Biosamples",
    initialState = initialTableState,
    ...restProps
  } = props;

  const {
    data: encodeSamples,
    loading: encodeLoading,
    error: encodeError,
  } = useEncodeBiosampleData({ assembly, skip: !sources.length || !sources.includes("encode") });

  const samples: (T | EncodeBiosample)[] = extraRows ? [...extraRows] : [];
  if (sources) {
    for (const source of sources) {
      switch (source) {
        case "encode":
          encodeSamples && samples.push(...encodeSamples);
      }
    }
  }
  const rows = prefilterBiosamples
    ? samples.filter((x) => (prefilterBiosamples as (biosample: T | EncodeBiosample) => boolean)(x))
    : samples;

  return (
    <Table
      label={label}
      downloadFileName={downloadFileName}
      rows={rows}
      columns={columns}
      loading={loading || encodeLoading}
      error={error || encodeError}
      initialState={initialState}
      rowSelectionPropagation={{ descendants: true }}
      {...restProps}
    />
  );
}

/**
 * Standup:
 * - Properly setup all the typing for combining two different row types
 * - preFilterBiosample function (oddly difficult to type properly given different encode/non-encode combos)
 * - wrote data-fetching utilities
 * - Also figured out dark mode for storybook
 *  - May want to utilize https://storybook.js.org/addons/storybook-dark-mode instead though to unify the storybook ui and the story theme
 * Todo:
 * - Export the columns, expose initial state in such a way to show/hide specific columns, as well as add/subtract columns (necessary for when samples are added that don't conform to EncodeBiosample or more columns are added)
 * - Maybe expose the entire rows object and data fetching utility to allow adding properties to each of the encode samples, maybe unnecessary tho...
 *
 */
