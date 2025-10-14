import { ValueOvalProps } from "./types";

const ValueOval: React.FC<ValueOvalProps> = ({ cx, cy, value, color }) => {
    const fontSize = 12;
    const text = `${value}`;
    const textWidth = measureTextWidth(text, fontSize, "sans-serif");
    const padding = 6;
    const ovalWidth = textWidth + padding * 2;
    const ovalHeight = fontSize * 1.8;

    return (
        <>
            <rect
                x={cx - ovalWidth / 2}
                y={cy - ovalHeight / 2}
                width={ovalWidth}
                height={ovalHeight}
                rx={ovalHeight / 2}
                fill={color}
            />
            <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={fontSize}
                fontWeight={500}
            >
                {text}
            </text>
        </>
    );
};

export default ValueOval;

function measureTextWidth(text: string, fontSize: number, fontFamily: string) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
}