import { useEffect, useState } from "react"
import { EncodeBiosample } from "./types"

export const useEncodeBiosampleData = ({ assembly }: { assembly: "GRCh38" | "mm10" }) => {
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
        biosamples.map((x: EncodeBiosample) => ({...x, type: "ENCODE"}))
        setData(biosamples)
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};