import { useEffect, useRef, useState } from "react";
import { getCCREs, getGenes, getICREs, getSNPs, getStudys } from "./queries";
import {
  ccreResultList,
  geneResultList,
  getCoordinates,
  icreResultList,
  snpResultList,
  studyResultList,
  isDomain,
} from "./utils";
import { GenomeSearchProps, Result, ResultType } from "./types";

type Limits = {
  gene?: number;
  snp?: number;
  icre?: number;
  ccre?: number;
  study?: number;
};

type HookOptions = {
  queries: ResultType[];
  assembly: GenomeSearchProps["assembly"];
  geneVersion?: GenomeSearchProps["geneVersion"];
  limits?: Limits;
  showiCREFlag?: boolean;
  debounceMs?: number;
};

type HookResult = {
  data: Result[];
  loading: boolean;
  error: Error | null;
};

// Accept either a single string or an array of strings. Debounced fetches for each input.
export function useEntityAutocomplete(
  inputsArg: string | string[],
  options: HookOptions
): HookResult {
  const inputs = Array.isArray(inputsArg) ? inputsArg : [inputsArg];
  const { queries, assembly, geneVersion, limits, showiCREFlag, debounceMs = 100 } = options;

  const [data, setData] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // clear any pending timer
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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

    timeoutRef.current = window.setTimeout(() => {
      (async () => {
        try {
          const aggregated: Result[] = [];

          await Promise.all(
            activeInputs.map(async (input) => {
              const qGene = queries.includes("Gene");
              const qSnp = queries.includes("SNP");
              const qICRE = queries.includes("iCRE");
              const qCCRE = queries.includes("cCRE");
              const qCoordinate = queries.includes("Coordinate");
              const qStudy = queries.includes("Study");

              // Genes
              if (qGene && !isDomain(input)) {
                const geneLimit = limits?.gene ?? 3;
                const geneResults = await getGenes(input, assembly, geneLimit, geneVersion);
                if (geneResults) {
                  aggregated.push(...geneResultList(geneResults as any, geneLimit, typeof geneVersion === "object"));
                }
              }

              // Assembly specific queries
              if (assembly === "GRCh38") {
                if (qICRE && input.toLowerCase().startsWith("eh")) {
                  const icreLimit = limits?.icre ?? 3;
                  const icreData = await getICREs(input, icreLimit);
                  if (icreData?.data?.iCREQuery) aggregated.push(...icreResultList(icreData.data.iCREQuery, icreLimit));
                }

                if (qCCRE && input.toLowerCase().startsWith("eh")) {
                  const ccreLimit = limits?.ccre ?? 3;
                  const ccreData = await getCCREs(input, assembly, ccreLimit, showiCREFlag || false);
                  if (ccreData?.data?.cCREAutocompleteQuery) aggregated.push(...ccreResultList(ccreData.data.cCREAutocompleteQuery, ccreLimit));
                }

                if (qSnp && input.toLowerCase().startsWith("rs")) {
                  const snpLimit = limits?.snp ?? 3;
                  const snpData = await getSNPs(input, assembly, snpLimit);
                  if (snpData?.data?.snpAutocompleteQuery) aggregated.push(...snpResultList(snpData.data.snpAutocompleteQuery, snpLimit));
                }

                if (qStudy && !isDomain(input) && input !== "") {
                  const studyLimit = limits?.study ?? 3;
                  const studyData = await getStudys(input, studyLimit);
                  if (studyData?.data?.getGWASStudiesMetadata) aggregated.push(...studyResultList(studyData.data.getGWASStudiesMetadata, studyLimit));
                }
              } else {
                // mm10
                if (qCCRE && input.toLowerCase().startsWith("em")) {
                  const ccreLimit = limits?.ccre ?? 3;
                  const ccreData = await getCCREs(input, assembly, ccreLimit, showiCREFlag || false);
                  if (ccreData?.data?.cCREAutocompleteQuery) aggregated.push(...ccreResultList(ccreData.data.cCREAutocompleteQuery, ccreLimit));
                }
              }

              // Coordinates
              if (isDomain(input) && qCoordinate) {
                aggregated.push(...getCoordinates(input, assembly));
              }
            })
          );

          setData(aggregated);
          setLoading(false);
        } catch (err: any) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [JSON.stringify(inputs), queries.join("|"), assembly, JSON.stringify(limits), JSON.stringify(geneVersion), showiCREFlag, debounceMs]);

  return { data, loading, error };
}
