import { useCallback, useState } from "react";

type UseMiniMapToggleProps = {
    initialOpen: boolean;
};

export const useMiniMapToggle = ({ initialOpen }: UseMiniMapToggleProps) => {
    const [showMiniMap, setShowMiniMap] = useState(initialOpen);

    const toggleMiniMap = useCallback(() => {
        setShowMiniMap((curr) => !curr);
    }, []);

    return { showMiniMap, toggleMiniMap };
};
