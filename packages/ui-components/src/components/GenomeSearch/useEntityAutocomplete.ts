import { useEffect, useRef, useState } from "react";
import { getCCREs, getGenes, getICREs, getLegacyCCREs, getSNPs, getStudys } from "./queries";
import {
  ccreResultList,
  geneResultList,
  getCoordinates,
  icreResultList,
  snpResultList,
  studyResultList,
  isDomain,
  legacyCcreResultList,
  OmesList,
  omeResultsList,
} from "./utils";
import { GenomeSearchProps, Result, ResultType } from "./types";

export const DEFAULT_LIMIT = 3;

type HookOptions = {
  queries: ResultType[];
  assembly: GenomeSearchProps["assembly"];
  graphqlUrl: string;
  geneVersion?: GenomeSearchProps["geneVersion"];
  limit?: GenomeSearchProps["limit"];
  showiCREFlag?: boolean;
  debounceMs?: number;
};

type HookResult = {
  data: Result[] | null;
  loading: boolean;
  error: Error | null;
};

// Accept either a single string or an array of strings. Debounced fetches for each input.
export function useEntityAutocomplete(
  inputsArg: string | string[],
  options: HookOptions
): HookResult {
  const inputs = Array.isArray(inputsArg) ? inputsArg : [inputsArg];
  const { queries, assembly, geneVersion, limit, showiCREFlag, debounceMs = 200, graphqlUrl } = options;

  const getLimit = (type: ResultType): number =>
    typeof limit === "number" ? limit : limit?.[type] ?? DEFAULT_LIMIT;

  const [data, setData] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const inputsKey = JSON.stringify(inputs);
  const limitKey = JSON.stringify(limit);
  const geneVersionKey = JSON.stringify(geneVersion);
  const queriesKey = queries.join("|");

  useEffect(() => {
    // clear any pending timer and abort previous requests
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // if no inputs or only empty strings, clear
    const activeInputs = inputs.filter((i) => !!i && i.trim() !== "");
    if (activeInputs.length === 0) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Create a new AbortController for this search request
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    timeoutRef.current = window.setTimeout(() => {
      (async () => {
        try {
          const aggregated: Result[] = [];

          const shouldFetch = (type: ResultType, input: string): boolean => {
            if (!queries.includes(type)) return false;

            const isSnpRsId = /^rs\d+$/i.test(input) && input.toLowerCase() !== "rs1";

            switch (type) {
              case "Coordinate":
                return isDomain(input);
              case "Gene":
                return !isDomain(input) && !input.toLowerCase().startsWith(assembly === "GRCh38" ? "eh38" : "em10") && !isSnpRsId;
              case "cCRE":
                return !isDomain(input) && input.toLowerCase().startsWith(assembly === "GRCh38" ? "eh" : "em");
              case "Legacy cCRE":
                return !isDomain(input) && input.toLowerCase().startsWith(assembly === "GRCh38" ? "eh" : "em");
              case "iCRE":
                return !isDomain(input) && assembly === "GRCh38" && input.toLowerCase().startsWith("eh");
              case "SNP":
                return !isDomain(input) && assembly === "GRCh38" && (["r", "rs"].includes(input) || isSnpRsId);
              case "Study":
                return !isDomain(input) && assembly === "GRCh38";
              case "Ome":
                return !isDomain(input) && assembly === "GRCh38";
              default:
                return false;
            }
          };

          await Promise.all(
            activeInputs.map(async (input) => {
              // array for fetch promises (so that we can Promise.all them in parallel)
              const fetchPromises: Promise<Result[]>[] = [];

              // Genes
              if (shouldFetch("Gene", input)) {
                const geneLimit = getLimit("Gene");
                fetchPromises.push(
                  getGenes(input, assembly, geneLimit, geneVersion, graphqlUrl, abortSignal).then((geneResults) =>
                    geneResults ? geneResultList(geneResults as any, geneLimit, typeof geneVersion === "object") : []
                  )
                );
              }

              // cCRE
              if (shouldFetch("cCRE", input)) {
                const ccreLimit = getLimit("cCRE");
                fetchPromises.push(
                  getCCREs(input, assembly, ccreLimit, showiCREFlag || false, graphqlUrl, abortSignal).then((ccreData) =>
                    ccreData?.data?.cCREAutocompleteQuery
                      ? ccreResultList(ccreData.data.cCREAutocompleteQuery, ccreLimit)
                      : []
                  )
                );
              }

              // Coordinates (synchronous, push directly)
              if (shouldFetch("Coordinate", input)) {
                aggregated.push(...getCoordinates(input, assembly));
              }

              // Legacy cCRE
              if (shouldFetch("Legacy cCRE", input)) {
                const legacyCcreLimit = getLimit("Legacy cCRE");
                fetchPromises.push(
                  getLegacyCCREs(input, assembly, graphqlUrl, abortSignal).then((legacyData) =>
                    legacyData?.data?.ccreMappings
                      ? legacyCcreResultList(legacyData.data.ccreMappings, legacyCcreLimit)
                      : []
                  )
                );
              }

              // iCRE
              if (shouldFetch("iCRE", input)) {
                const icreLimit = getLimit("iCRE");
                fetchPromises.push(
                  getICREs(input, icreLimit, graphqlUrl, abortSignal).then((icreData) =>
                    icreData?.data?.iCREQuery ? icreResultList(icreData.data.iCREQuery, icreLimit) : []
                  )
                );
              }

              // SNP
              if (shouldFetch("SNP", input)) {
                const snpLimit = getLimit("SNP");
                fetchPromises.push(
                  getSNPs(input, assembly, snpLimit, graphqlUrl, abortSignal).then((snpData) =>
                    snpData?.data?.snpAutocompleteQuery
                      ? snpResultList(snpData.data.snpAutocompleteQuery, snpLimit)
                      : []
                  )
                );
              }

              // Study
              if (shouldFetch("Study", input)) {
                const studyLimit = getLimit("Study");
                fetchPromises.push(
                  getStudys(input, studyLimit, graphqlUrl, abortSignal).then((studyData) =>
                    studyData?.data?.getGWASStudiesMetadata
                      ? studyResultList(studyData.data.getGWASStudiesMetadata, studyLimit)
                      : []
                  )
                );
              }

              // Ome
              if (shouldFetch("Ome", input)) {
                const omeLimit = getLimit("Ome");

                const filtered = OmesList.filter((ome) => {
                  const search = input.toLowerCase();

                  return (
                    ome.label.toLowerCase().includes(search) ||
                    ome.keywords?.some((k) => k.toLowerCase().includes(search))
                  );
                }).slice(0, omeLimit);

                fetchPromises.push(
                  Promise.resolve(omeResultsList(filtered))
                );
              }

              // Execute all parallel fetches and aggregate results
              const allResults = await Promise.all(fetchPromises);
              allResults.forEach((results) => aggregated.push(...results));
            })
          );

          // Only update state if this request wasn't aborted
          if (!abortSignal.aborted) {
            setData(aggregated);
            setLoading(false);
          }
        } catch (err: any) {
          // Only update error state if this request wasn't aborted
          if (!abortSignal.aborted) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
          }
        }
      })();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [inputsKey, queriesKey, assembly, limitKey, geneVersionKey, showiCREFlag, debounceMs, graphqlUrl]);

  return { data, loading, error };
}
