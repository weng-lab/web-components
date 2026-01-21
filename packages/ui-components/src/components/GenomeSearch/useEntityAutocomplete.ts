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
} from "./utils";
import { GenomeSearchProps, Result, ResultType } from "./types";

type Limits = {
  gene?: number;
  snp?: number;
  icre?: number;
  ccre?: number;
  legacyCcre?: number;
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
  const { queries, assembly, geneVersion, limits, showiCREFlag, debounceMs = 200 } = options;

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
    setData([])
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
              const qLegacyCcre = queries.includes("Legacy cCRE");
              const qCoordinate = queries.includes("Coordinate");
              const qStudy = queries.includes("Study");

              // array for fetch promises (so that we can Promise.all them in parallel)
              const fetchPromises: Promise<Result[]>[] = [];

              // Genes
              if (qGene && !isDomain(input)) {
                const geneLimit = limits?.gene ?? 3;
                fetchPromises.push(
                  getGenes(input, assembly, geneLimit, geneVersion).then((geneResults) =>
                    geneResults ? geneResultList(geneResults as any, geneLimit, typeof geneVersion === "object") : []
                  )
                );
              }

              // cCRE - check beginning of input to make sure it matches that assembly
              if (qCCRE && input.toLowerCase().startsWith(assembly === "GRCh38" ? "eh" : "em")) {
                const ccreLimit = limits?.ccre ?? 3;
                fetchPromises.push(
                  getCCREs(input, assembly, ccreLimit, showiCREFlag || false).then((ccreData) =>
                    ccreData?.data?.cCREAutocompleteQuery
                      ? ccreResultList(ccreData.data.cCREAutocompleteQuery, ccreLimit)
                      : []
                  )
                );
              }

              // Coordinates (synchronous, push directly)
              if (qCoordinate && isDomain(input)) {
                aggregated.push(...getCoordinates(input, assembly));
              }

              if (qLegacyCcre) {
                const legacyCcreLimit = limits?.legacyCcre ?? 3;
                fetchPromises.push(
                  getLegacyCCREs(input, assembly).then((legacyData) =>
                    legacyData?.data?.ccreMappings
                      ? legacyCcreResultList(legacyData.data.ccreMappings, legacyCcreLimit)
                      : []
                  )
                );
              }

              // Human only fetches
              if (assembly === "GRCh38") {
                if (qICRE && input.toLowerCase().startsWith("eh")) {
                  const icreLimit = limits?.icre ?? 3;
                  fetchPromises.push(
                    getICREs(input, icreLimit).then((icreData) =>
                      icreData?.data?.iCREQuery ? icreResultList(icreData.data.iCREQuery, icreLimit) : []
                    )
                  );
                }

                if (qSnp && input.toLowerCase().startsWith("rs")) {
                  const snpLimit = limits?.snp ?? 3;
                  fetchPromises.push(
                    getSNPs(input, assembly, snpLimit).then((snpData) =>
                      snpData?.data?.snpAutocompleteQuery
                        ? snpResultList(snpData.data.snpAutocompleteQuery, snpLimit)
                        : []
                    )
                  );
                }

                if (qStudy && !isDomain(input) && input !== "") {
                  const studyLimit = limits?.study ?? 3;
                  fetchPromises.push(
                    getStudys(input, studyLimit).then((studyData) =>
                      studyData?.data?.getGWASStudiesMetadata
                        ? studyResultList(studyData.data.getGWASStudiesMetadata, studyLimit)
                        : []
                    )
                  );
                }
              }

              // Execute all parallel fetches and aggregate results
              const allResults = await Promise.all(fetchPromises);
              allResults.forEach((results) => aggregated.push(...results));
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
