import { createContext, useContext } from "react";

export type DownloadContextType = {
  onDownload?: (url: string, name: string) => void;
};

export const DownloadContext = createContext<DownloadContextType>({
  onDownload: undefined,
});

export const useDownloadContext = () => useContext(DownloadContext);
