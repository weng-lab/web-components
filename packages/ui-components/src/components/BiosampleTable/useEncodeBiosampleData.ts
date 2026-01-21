import { useEffect, useState } from "react"
import { EncodeBiosample } from "./types"

export const useEncodeBiosampleData = ({ assembly, skip }: { assembly: "GRCh38" | "mm10", skip?: boolean }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<EncodeBiosample[] | undefined>(undefined);

  // to be filled in with downloads url
  const url = assembly === "GRCh38" ? "https://downloads.wenglab.org/human_biosamples_tracks_metadata.json" : "https://downloads.wenglab.org/mouse_biosamples_tracks_metadata.json"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json()
        const biosamples = result?.data?.ccREBiosampleQuery?.biosamples
        if (!biosamples) {
          throw new Error(`No biosamples present in return data`);
        }
        setData(
          biosamples
            .filter((x: EncodeBiosample) => x.name !== "GM12866_ENCDO000ABQ")
            .map((x: EncodeBiosample) =>
              x.name === "neural_crest_cell_ENCDO222AAA"
                ? { ...x, h3k4me3_file_accession: null, h3k4me3_experiment_accession: null, h3k4me3_signal_url: null }
                : x
            )
        );
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (!skip) fetchData();
  }, [url, skip]);

  return { data, loading, error };
};