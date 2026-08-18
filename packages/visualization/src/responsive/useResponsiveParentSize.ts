import type { CSSProperties } from 'react';
import { useParentSize } from '@visx/responsive';
import type { UseParentSizeConfig, UseParentSizeResult } from '@visx/responsive';

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

export type UseResponsiveParentSizeResult<T extends HTMLElement = HTMLDivElement> =
    UseParentSizeResult<T> & { containerStyle: CSSProperties };

/**
 * Wraps useParentSize so plots can opt out of automatic sizing by passing explicit width/height props.
 * The parent element is still measured (and parentRef/node are still returned) so components that rely
 * on them for scroll/resize behavior keep working even when the size itself is overridden.
 *
 * containerStyle is derived from the overrides (not the resolved width/height) so it can distinguish
 * "measured 400" from "override 400" - the container should stay 100% until a manual size is given,
 * otherwise a manually-sized plot would keep claiming the parent's full layout space.
 */
export function useResponsiveParentSize<T extends HTMLElement = HTMLDivElement>(
    overrides: ManualSizeProps = {},
    options?: UseParentSizeConfig<T>
): UseResponsiveParentSizeResult<T> {
    const { width: measuredWidth, height: measuredHeight, ...rest } = useParentSize<T>(options);

    return {
        ...rest,
        width: overrides.width ?? measuredWidth,
        height: overrides.height ?? measuredHeight,
        containerStyle: {
            position: 'relative',
            width: overrides.width ?? '100%',
            height: overrides.height ?? '100%',
        },
    };
}
