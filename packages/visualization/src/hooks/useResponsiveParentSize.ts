import { useParentSize } from '@visx/responsive';

export type ManualSizeProps = {
    /**
     * Manually specify the plot width in pixels, overriding the width measured from the parent element.
     */
    width?: number;
    /**
     * Manually specify the plot height in pixels, overriding the height measured from the parent element.
     */
    height?: number;
};

/**
 * Wraps useParentSize so plots can opt out of automatic sizing by passing explicit width/height props.
 * The parent element is still measured (and parentRef/node are still returned) so components that rely
 * on them for scroll/resize behavior keep working even when the size itself is overridden.
 */
export function useResponsiveParentSize<T extends HTMLElement = HTMLDivElement>(
    overrides: ManualSizeProps = {},
    options?: Parameters<typeof useParentSize<T>>[0]
): ReturnType<typeof useParentSize<T>> {
    const { width: measuredWidth, height: measuredHeight, ...rest } = useParentSize<T>(options);

    return {
        ...rest,
        width: overrides.width ?? measuredWidth,
        height: overrides.height ?? measuredHeight,
    };
}