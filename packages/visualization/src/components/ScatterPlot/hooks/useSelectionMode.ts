import { useCallback, useState } from "react";
import { SelectionMode } from "../types";

type UseSelectionModeProps = {
    initialSelectionMode: SelectionMode;
};

export const useSelectionMode = ({ initialSelectionMode }: UseSelectionModeProps) => {
    const [selectMode, setSelectMode] = useState<SelectionMode>(initialSelectionMode);

    const handleSelectionModeChange = useCallback((mode: SelectionMode) => {
        setSelectMode(mode);
    }, []);

    return { selectMode, handleSelectionModeChange };
};
