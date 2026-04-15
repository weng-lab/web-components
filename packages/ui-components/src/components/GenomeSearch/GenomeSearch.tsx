import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isDomain } from "./utils";
import {
  AutocompleteRenderGroupParams,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { GenomeSearchProps, Result } from "./types";
import { useEntityAutocomplete } from "./useEntityAutocomplete";

/**
 * An autocomplete search component for genomic landmarks such as genes, SNPs, ICRs, and CCRs.
 * The props extends the MUI Autocomplete props, so you are able to adjust that component's props as well.
 * You can also use the slots and slotProps to customize the search's internal components, such as the input, button and the bounding box.
 * To use, pass in a list of the queries you want to run, and the assembly i.e. GRCh38 or mm10.
 * You must also provide a function to call when a result is selected, which will run when the user clicks the button.
 * @param props - extends MUI AutocompleteProps and includes additional props specific to this component
 */
function GenomeSearch({
  queries,
  assembly,
  showiCREFlag,
  geneVersion,
  limit,
  graphqlUrl,
  onSearchSubmit,
  defaultResults = [],
  style,
  sx,
  slots,
  slotProps,
  ...autocompleteProps
}: GenomeSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [selection, setSelection] = useState<Result | null>(null);

  const {
    input: inputSlot,
    button: buttonSlot,
    box: boxSlot,
    ...muiSlots
  } = slots ?? {};

  const {
    input: inputSlotProps,
    button: buttonSlotProps,
    box: boxSlotProps,
    ...muiSlotProps
  } = slotProps ?? {};

  const InputSlot = inputSlot ?? TextField;
  const ButtonSlot = buttonSlot ?? Button;
  const BoxSlot = boxSlot ?? Box;

  const { data, loading } = useEntityAutocomplete(
    inputValue ? [inputValue] : [],
    {
      queries,
      assembly,
      geneVersion,
      limit,
      showiCREFlag,
      debounceMs: 100,
      graphqlUrl,
    }
  );

  const orderedResults = useMemo(() => {
    const queryOrder = new Map(queries.map((query, index) => [query, index]));
    const query = inputValue.toLowerCase();
    const skipRelevance = isDomain(inputValue);

    const relevanceRank = (title: string) => {
      if (skipRelevance || !query) return 3;
      if (title === query) return 0;
      if (title.startsWith(query)) return 1;
      if (title.includes(query)) return 2;
      return 3;
    };

    const sortByQueryOrder = (results: Result[]) =>
      [...results].sort((a, b) => {
        const aIndex = queryOrder.get(a.type);
        const bIndex = queryOrder.get(b.type);

        // 1. Group order — keep options that share a group contiguous.
        if (aIndex === undefined && bIndex !== undefined) return 1;
        if (bIndex === undefined && aIndex !== undefined) return -1;
        if (aIndex !== undefined && bIndex !== undefined && aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        // 2. Relevance to inputValue within a group.
        const aTitle = (a.title || "").toLowerCase();
        const bTitle = (b.title || "").toLowerCase();
        const aRank = relevanceRank(aTitle);
        const bRank = relevanceRank(bTitle);
        if (aRank !== bRank) return aRank - bRank;

        // 3. Alphabetical fallback.
        return aTitle.localeCompare(bTitle);
      });

    return {
      data: data ? sortByQueryOrder(data) : data,
      defaultResults: sortByQueryOrder(defaultResults),
    };
  }, [data, defaultResults, queries, inputValue]);

  //Clear input on assembly change
  useEffect(() => {
    setInputValue("");
    setSelection(null);
  }, [assembly]);

  // Handle submit
  const onSubmit = useCallback(() => {
    if (selection && onSearchSubmit) onSearchSubmit(selection);
  }, [onSearchSubmit, selection]);

  // Handle enter key down
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        const exactMatch = data?.find((x) => x.title?.toLowerCase() === inputValue.toLowerCase());
        if (exactMatch) {
          setSelection(exactMatch);
          if (onSearchSubmit) onSearchSubmit(exactMatch);
        }
      }
    },
    [data, inputValue, onSearchSubmit]
  );

  const onChange = (_event: React.SyntheticEvent<Element, Event>, newValue: Result | null) => {
    setSelection(newValue);
    setInputValue(newValue?.title || ""); //needed so that the matching to inputValue works on enter press after selection
  };

  return (
    <BoxSlot display="flex" flexDirection="row" gap={2} style={style} sx={sx} {...boxSlotProps}>
      <Autocomplete
        sx={{ flex: 1 }}
        onChange={onChange}
        value={selection}
        options={inputValue === "" ? orderedResults.defaultResults : loading || !orderedResults.data ? [] : orderedResults.data}
        getOptionLabel={(option: Result) => {
          return option.title || "";
        }}
        groupBy={(option: Result) => option.type || ""}
        renderGroup={renderGroup}
        noOptionsText={noOptionsText(inputValue, loading, data)}
        isOptionEqualToValue={(option, value) => option.title === value.title}
        renderOption={renderOptions}
        filterOptions={(x) => x}
        renderInput={(params) => (
          <InputSlot
            {...params}
            label="Search"
            onKeyDown={handleKeyDown}
            value={inputValue}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value)}
            {...inputSlotProps}
          />
        )}
        slots={muiSlots}
        slotProps={muiSlotProps}
        {...autocompleteProps}
      />
      <ButtonSlot variant="contained" onClick={onSubmit} {...buttonSlotProps}>
        {buttonSlotProps?.children ?? "Go"}
      </ButtonSlot>
    </BoxSlot>
  );
}

/**
 * Renders the group of options. Relevance ordering happens upstream in
 * `orderedResults` so that the options array and visual order stay in sync —
 * reordering `<li>`s here would desync MUI's `data-option-index`-based
 * keyboard navigation.
 */
function renderGroup(params: AutocompleteRenderGroupParams) {
  return (
    <div key={params.key}>
      <Typography variant="subtitle2" sx={{ color: "gray", paddingInline: 1.5, paddingBlock: 1 }}>
        {params.group}
      </Typography>
      {params.children}
    </div>
  );
}

/**
 * Renders the "no options" text.
 * @param inputValue - The current input value
 * @param isLoading - Whether the results are still loading
 * @param results - The results from the query
 * @returns A rendered "no options" text
 */
function noOptionsText(inputValue: string, isLoading: boolean, data: Result[] | null) {
  return (
    <Typography variant="caption">
      {inputValue
        ? isLoading
          ? "Loading..."
          : Array.isArray(data) && data.length === 0
            ? "No results found"
            : ""
        : "Start typing for options"}
    </Typography>
  );
}

/**
 * Renders the individual options.
 * @param props - The props object from the Autocomplete component
 * @param option - The current option
 * @returns A rendered option
 */
function renderOptions(props: any, option: Result) {
  return (
    <li {...props} key={`${option.type}-${option.title || "untitled"}-${option.description || "no-description"}`}>
      <Box>
        <Typography
          variant="body1"
          component="div"
          fontWeight="bold"
          sx={option.type === "Gene" ? { fontStyle: "italic" } : {}}
        >
          {option.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" style={{ whiteSpace: "pre-line" }}>
          {option.description}
        </Typography>
      </Box>
    </li>
  );
}

export default GenomeSearch;
