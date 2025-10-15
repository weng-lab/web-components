import { ValueOvalProps } from "./types";
import { measureTextWidth } from "./utility";

const ValueOval: React.FC<ValueOvalProps> = ({ cx, cy, value, color, align }) => {
    const fontSize = 12;
    const text = `${value}`;
    const textWidth = measureTextWidth(text, fontSize, "sans-serif");
    const padding = 6;
    const ovalWidth = textWidth + padding * 2;
    const ovalHeight = fontSize * 1.8;

    let xPos = cx;
    if (align === "start") xPos += ovalWidth / 2;
    if (align === "end") xPos -= ovalWidth / 2;

    return (
        <>
            <rect
                x={xPos - ovalWidth / 2}
                y={cy - ovalHeight / 2}
                width={ovalWidth}
                height={ovalHeight}
                rx={ovalHeight / 2}
                fill={color}
            />
            <text
                x={xPos}
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