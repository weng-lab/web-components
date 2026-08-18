import type { CSSProperties, ReactNode } from 'react';
import type { UseResponsiveParentSizeResult } from './useResponsiveParentSize';

export type ResponsiveContainerProps = Pick<UseResponsiveParentSizeResult, 'parentRef' | 'containerStyle'> & {
    style?: CSSProperties;
    children?: ReactNode;
};

export function ResponsiveContainer({ parentRef, containerStyle, style, children }: ResponsiveContainerProps) {
    return (
        <div ref={parentRef} style={{ ...containerStyle, ...style }}>
            {children}
        </div>
    );
}
