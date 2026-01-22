import React, { useCallback, useEffect, useState } from "react";
import {
  isDomain,
} from "./utils";
import { AutocompleteProps, Box, Button, ButtonProps, TextField, TextFieldProps, Typography } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { GenomeSearchProps, Result } from "./types";
import { useEntityAutocomplete } from "./useEntityAutocomplete";

const defaultLimit = 3

/**
 * An autocomplete search component for genomic landmarks such as genes, SNPs, ICRs, and CCRs.
 * The props extends the MUI Autocomplete props, so you are able to adjust that component's props as well.
 * You can also use the slots and slotProps to customize the search's internal components, such as the input, button and the bounding box.
 * To use, pass in a list of the queries you want to run, and the assembly i.e. GRCh38 or mm10.
 * You must also provide a function to call when a result is selected, which will run when the user clicks the button.
 * @param props - extends MUI AutocompleteProps and includes additional props specific to this component
 */
const Search: React.FC<GenomeSearchProps> = ({
  queries,
  assembly,
  showiCREFlag,
  geneVersion,
  geneLimit = defaultLimit,
  snpLimit = defaultLimit,
  icreLimit = defaultLimit,
  ccreLimit = defaultLimit,
  legacyCcreLimit = defaultLimit,
  studyLimit = defaultLimit,
  onSearchSubmit,
  defaultResults = [],
  style,
  sx,
  slots,
  slotProps,
  ...autocompleteProps
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selection, setSelection] = useState<Result | null>(null);

  const { data, loading } = useEntityAutocomplete(
    inputValue && inputValue !== "" ? [inputValue] : [],
    {
      queries,
      assembly,
      geneVersion,
      limits: {
        gene: geneLimit,
        snp: snpLimit,
        icre: icreLimit,
        ccre: ccreLimit,
        legacyCcre: legacyCcreLimit,
        study: studyLimit,
      },
      showiCREFlag,
      debounceMs: 100,
    }
  );

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
    [data, setSelection, onSearchSubmit]
  );

  const onChange = (_event: React.SyntheticEvent<Element, Event>, newValue: Result) => {
    setSelection(newValue);
    setInputValue(newValue?.title || ""); //needed so that the matching to inputValue works on enter press after selection
  };

  return (
    <Box display="flex" flexDirection="row" gap={2} style={{ ...style }} sx={{ ...sx }} {...slotProps?.box}>
      <Autocomplete
        onChange={onChange}
        value={selection as Result}
        options={inputValue === "" ? defaultResults : loading || !data ? [] : data}
        getOptionLabel={(option: Result) => {
          return option.title || "";
        }}
        groupBy={(option: Result) => option.type || ""}
        renderGroup={(params) => renderGroup(params, inputValue)}
        noOptionsText={noOptionsText(inputValue, loading, data)}
        isOptionEqualToValue={(option, value) => option.title === value.title}
        renderOption={renderOptions}
        filterOptions={(x) => x}
        renderInput={(params) => {
          if (slots && slots.input) {
            return React.cloneElement(slots.input as React.ReactElement<TextFieldProps>, {
              ...params,
              onKeyDown: handleKeyDown,
              value: inputValue,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value),
            });
          }
          return (
            <TextField
              {...params}
              label="Search"
              onKeyDown={handleKeyDown}
              value={inputValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value)}
              {...slotProps?.input}
            />
          );
        }}
        style={style}
        sx={sx}
        {...(autocompleteProps as Partial<AutocompleteProps<Result, false, true, false, React.ElementType>>)}
      />
      {/* Submit Button */}
      {slots && slots.button ? (
        React.cloneElement(slots.button as React.ReactElement<ButtonProps, string | React.JSXElementConstructor<any>>, {
          onClick: () => onSubmit(),
        })
      ) : (
        <Button variant="contained" onClick={() => onSubmit()} {...slotProps?.button}>
          {slotProps?.button?.children || "Go"}
        </Button>
      )}
    </Box>
  );
};

/**
 * Renders the group of options. Orders the options by relevance to the input value.
 * @param params - The params object from the Autocomplete component
 * @param inputValue - The current input value
 * @returns A rendered group of options
 */
function renderGroup(params: any, inputValue: string) {
  // Sort items within each group by title match relevance
  const sortedOptions =
    Array.isArray(params.children) && !isDomain(inputValue)
      ? params.children.sort((a: any, b: any) => {
          const aTitle = (a.props?.children?.props?.children?.[0]?.props?.children || "").toLowerCase();
          const bTitle = (b.props?.children?.props?.children?.[0]?.props?.children || "").toLowerCase();
          const query = inputValue.toLowerCase();
          // Exact matches first
          if (aTitle === query && bTitle !== query) return -1;
          if (bTitle === query && aTitle !== query) return 1;

          // Starts with query second
          if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
          if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;

          // Contains query third
          if (aTitle.includes(query) && !bTitle.includes(query)) return -1;
          if (bTitle.includes(query) && !aTitle.includes(query)) return 1;

          // Alphabetical order for equal relevance
          return aTitle.localeCompare(bTitle);
        })
      : params.children;

  return (
    <div key={params.key}>
      <Typography variant="subtitle2" sx={{ color: "gray", paddingInline: 1.5, paddingBlock: 1 }}>
        {params.group}
      </Typography>
      {sortedOptions}
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

/**
 * Wraps the Search component in a QueryClientProvider.
 * @param props - The props object from the Autocomplete component
 * @returns A wrapped Search component
 */
function GenomeSearch(props: GenomeSearchProps) {
  return <Search {...props} />;
}

export default GenomeSearch;
