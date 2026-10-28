import { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useMemo, useState } from 'react';
import ScatterPlot from './scatterplot';
import ScatterPlotSync from './ScatterPlotSync';
import { getSharedDomains } from './helpers';
import { POINT_SHAPES, PointShape, type Point as PlotPoint } from './types';
import ChipLegend from '../Legend/ChipLegend/ChipLegend';
import { Colorbar, evenStops, sweptValues, type RampRange } from '../Legend';

const meta = {
    title: 'visualization/ScatterPlot',
    component: ScatterPlot,
    tags: ['autodocs'],
    argTypes: {
    },
    parameters: {
        controls: { expanded: true },
    },
    decorators: [
        // Mobile stories size to the device instead - see .storybook/preview.tsx
        (Story, { tags }) => tags.includes('mobile') ? <Story /> : (
          <div style={{ width: 850, height: 500}}>
            <Story />
          </div>
        ),
      ],
} satisfies Meta<typeof ScatterPlot>;

type Point = {
    x: number;
    y: number;
    color: string;
    shape?: PointShape;
    r?: number;
};

export default meta;
type Story = StoryObj<typeof meta>;

// Example data for the scatter plot
const scatterData: Point[] = [
    { x: 1, y: 2, color: 'red' },
    { x: 3, y: 4, color: 'blue' },
    { x: 5, y: 6, color: 'green' },
];



function generatePoints(count = 2000): Point[] {
  const points: Point[] = []

  for (let i = 0; i < count; i++) {
    const angle = i * 0.1
    const radius = Math.sqrt(i) * 2

    points.push({
      x: radius * Math.cos(angle) + (i % 50),
      y: radius * Math.sin(angle) + (i % 30),
      color: `hsl(${i % 360}, 100%, 50%)`,
    })
  }

  return points
}

// usage
const points = generatePoints(2500)


const moreScatterData: Point[] = [
    { x: 1, y: 2, color: 'red' },
    { x: 3, y: 4, color: 'blue' },
    { x: 5, y: 6, color: 'green' },
    { x: 2, y: 2, color: 'red' },
    { x: 4, y: 4, color: 'blue' },
    { x: 6, y: 6, color: 'green' },
];

const shapeData: Point[] = [
    { x: 1, y: 2, color: 'red' },
    { x: 3, y: 4, color: 'blue', shape: "triangle" },
    { x: 5, y: 6, color: 'green' },
];

/**
 * Every shape at a run of radii, one shape per row. All one color on purpose: shape is the only
 * thing varying, so a column should read as evenly weighted down the rows rather than the
 * triangles and crosses looking lighter than the circles - each is drawn to the same area as a
 * circle of the same r.
 */
const shapeScaleData: Point[] = POINT_SHAPES.flatMap((shape, row) =>
    [3, 5, 7, 9, 11].map((r, column) => ({
        x: column,
        y: POINT_SHAPES.length - row,
        r,
        shape,
        color: '#2541b2',
    }))
);

// Default story with scatter data, and nothing but the props it needs
export const Default: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
    }
};

// Default story with tooltip
export const CustomTooltip: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        tooltipBody: (point) => (
            <div>
                <strong>Point Details:</strong>
                <p>X: {point.x}</p>
                <p>Y: {point.y}</p>
                <p>Color: {point.color}</p>
            </div>
        ),
    }
};

// The minimap toggle starts on here. Zoom in or pan to bring the minimap up: it takes whichever
// corner of the plot area covers the fewest points, and hides again once the view is reset.
export const MiniMap: Story = {
    args: {
        pointData: points,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                showWhileZoomed: true,
            },
        }
    }
};

// No minimap toggle in the control panel
export const WithoutMiniMap: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        disableMiniMap: true,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    }
};

// Default story with selectable points
export const SelectablePoints: Story = {
    args: {
        selectable: true,
        onSelectionChange: (selectedPoints) => {
            window.alert(
                `You Seleted Points: ${JSON.stringify(selectedPoints)}`
            );
        },
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    }
};

// Default story with clickable points
export const ClickablePoints: Story = {
    args: {
        onPointClicked: (point) => {
            window.alert(
                `You Seleted Point: ${JSON.stringify(point)}`
            );
        },
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    }
};

// Default story with grouped points
export const HoverMultiplePoints: Story = {
    args: {
        groupPointsAnchor: "color",
        pointData: moreScatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    }
};

/**
 * All five shapes, each row one shape across a run of radii. Hovering any point grows it and
 * rings it in the shape it already has.
 */
export const PointShapes: Story = {
    args: {
        pointData: shapeScaleData,
        loading: false,
        leftAxisLabel: "Shape",
        bottomAxisLabel: "Radius",
    }
};

/**
 * Hover styling turned down from the default (+2px, black) to a subtler gray ring, for plots
 * dense enough that a growing point covers its neighbors.
 */
export const CustomHoverStyle: Story = {
    args: {
        pointData: points,
        loading: false,
        hoverGrowth: 1,
        hoverStroke: "#555555",
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
    }
};

// Default story with multiple shapes
export const OtherShapes: Story = {
    args: {
        pointData: shapeData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    }
};

// Default story with disabled zoom
export const ZoomDisabled: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableZoom: true,
        disableTooltip: true,
    }
};

// Default story with disabled zoom but selectable
export const ZoomDisabledButSelectable: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableZoom: true,
        selectable: true,
        onSelectionChange: (selectedPoints) => {
            window.alert(
                `You Seleted Points: ${JSON.stringify(selectedPoints)}`
            );
        },
        disableTooltip: true,
    }
};

// Controls Highlight
export const ControlsHighlight: Story = {
    args: {
        controlsHighlight: "red",
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        selectable: true,
        onSelectionChange: (selectedPoints) => {
            window.alert(
                `You Seleted Points: ${JSON.stringify(selectedPoints)}`
            );
        },
        disableTooltip: true,
        // The minimap toggle starts on, so it shows the highlight alongside the selection toggle.
        initialState: {
            minimap: {
                showWhileZoomed: true,
            },
        }
    }
};

// The controls on the right of the plot, which is narrowed to give them a lane of their own.
export const ControlsRight: Story = {
    args: {
        pointData: points,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        controlsPosition: "right",
    }
};

export const Animation: Story = {
    args: {
        pointData: points,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        animation: "slideUp",
        animationBuffer: 0.02,
        animationGroupSize: 10,
    }
};

// Manually sized plot. Container is 900x700 with a dashed border - the plot
// should render at the fixed 350x350 size below, ignoring the container size.
export const ManualSize: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        width: 350,
        height: 350,
    },
    decorators: [
        (Story) => (
          <div style={{ width: 900, height: 700, border: '2px dashed #999' }}>
            <Story />
          </div>
        ),
      ],
};

// Two plots over the same coordinate space, linked by ScatterPlotSync: hovering either one draws
// the same crosshair on both, and zooming or panning either one moves both - their minimaps start
// on, so the shared view shows in each. Only the hovered plot shows a tooltip.
const syncedDataA: Point[] = generatePoints(600);
const syncedDataB: Point[] = generatePoints(600)
    .map((point, index) => ({
        ...point,
        x: point.x + Math.sin(index) * 6,
        y: point.y + Math.cos(index) * 6,
        color: `hsl(${(index % 360)}, 60%, 40%)`,
    }));

export const SyncedPlots: Story = {
    args: {
        pointData: syncedDataA,
        loading: false,
    },
    render: () => {
        // Memoized: a fresh domain array on every render would rebuild both plots' scales.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const domains = useMemo(() => getSharedDomains(syncedDataA, syncedDataB), []);

        return (
            <ScatterPlotSync {...domains}>
                {(sync) => (
                    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                        <div style={{ flex: 1, height: '100%' }}>
                            <ScatterPlot
                                pointData={syncedDataA}
                                loading={false}
                                leftAxisLabel="Y-Axis Label"
                                bottomAxisLabel="Sample A"
                                disableTooltip
                                initialState={{ minimap: { showWhileZoomed: true } }}
                                {...sync}
                            />
                        </div>
                        <div style={{ flex: 1, height: '100%' }}>
                            <ScatterPlot
                                pointData={syncedDataB}
                                loading={false}
                                leftAxisLabel="Y-Axis Label"
                                bottomAxisLabel="Sample B"
                                disableTooltip
                                controlsPosition="right"
                                initialState={{ minimap: { showWhileZoomed: true } }}
                                {...sync}
                            />
                        </div>
                    </div>
                )}
            </ScatterPlotSync>
        );
    },
    decorators: [
        (Story) => (
            <div style={{ width: 1000, height: 500 }}>
                <Story />
            </div>
        ),
    ],
};

// A single plot with crosshairs and no sync - the plot tracks its own pointer.
export const Crosshairs: Story = {
    args: {
        pointData: points,
        loading: false,
        crosshair: true,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    },
};

// onHoveredPointChange publishes the point under the cursor, and null once nothing is hovered.
// It fires on transitions only - moving within one point stays silent - so it is safe to drive
// state with directly.
//
// Here it drives a legend that lives outside the plot: hovering a point rings its group.
// disableTooltip is on deliberately, because that is the case the callback exists for - hover is
// still tracked with the tooltip turned off, so a plot can carry hover affordances of its own
// without also taking the built-in one. groupPointsAnchor swells the rest of the hovered group
// at the same time, so the plot and the legend answer the same question together.
//
// hoveredPoints runs the same wiring backwards: hovering a legend entry hands the plot that
// group's points and they light up as though the cursor were on one. Between them the legend
// and the plot drive each other in both directions.
type GroupedPoint = {
    x: number;
    y: number;
    color: string;
    metaData: { group: string };
};

const HOVER_GROUPS = [
    { name: "Alpha", color: "#E41A1C" },
    { name: "Beta", color: "#377EB8" },
    { name: "Gamma", color: "#4DAF4A" },
    { name: "Delta", color: "#984EA3" },
];

const groupedData: GroupedPoint[] = HOVER_GROUPS.flatMap(({ name, color }, groupIndex) =>
    Array.from({ length: 160 }, (_, i) => {
        const angle = (i / 160) * Math.PI * 2;
        const radius = 3 + (i % 8) * 0.6;
        return {
            x: Math.cos(angle) * radius + groupIndex * 13,
            y: Math.sin(angle) * radius + (groupIndex % 2) * 11,
            color,
            metaData: { group: name },
        };
    }),
);

export const HoveredPointChange: Story = {
    args: {
        pointData: groupedData,
        loading: false,
    },
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [hoveredLegend, setHoveredLegend] = useState<string | null>(null);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const hoveredPoints = useMemo(
            () => (hoveredLegend ? groupedData.filter((point) => point.metaData.group === hoveredLegend) : undefined),
            [hoveredLegend],
        );

        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontFamily: "system-ui" }}>
                    {HOVER_GROUPS.map(({ name, color }) => {
                        const on = name === hoveredGroup || name === hoveredLegend;
                        return (
                            <span
                                key={name}
                                onMouseEnter={() => setHoveredLegend(name)}
                                onMouseLeave={() => setHoveredLegend(null)}
                                style={{
                                    cursor: "default",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    fontSize: 13,
                                    background: on ? "#e0e0e0" : "#f5f5f5",
                                    // Outline rather than border: drawn outside the box, so a ring
                                    // appearing under the cursor cannot reflow the row.
                                    outline: on ? `2px solid ${color}` : "none",
                                    outlineOffset: 1,
                                }}
                            >
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        background: color,
                                    }}
                                />
                                {name}
                            </span>
                        );
                    })}
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <ScatterPlot
                        pointData={groupedData}
                        loading={false}
                        disableTooltip
                        groupPointsAnchor="group"
                        leftAxisLabel="Y-Axis Label"
                        bottomAxisLabel="X-Axis Label"
                        hoveredPoints={hoveredPoints}
                        onHoveredPointChange={(point) => setHoveredGroup(point?.metaData?.group ?? null)}
                    />
                </div>

                <div style={{ fontFamily: "system-ui", fontSize: 13, color: "#666" }}>
                    hovered group: <strong>{hoveredGroup ?? "none"}</strong>
                    {"  |  "}
                    from the legend: <strong>{hoveredLegend ?? "none"}</strong>
                </div>
            </div>
        );
    },
    decorators: [
        (Story) => (
            <div style={{ width: 850, height: 560 }}>
                <Story />
            </div>
        ),
    ],
};

// ChipLegend wired to the plot. Switching a chip off marks its points `dimmed`, kept on the plot but
// faded beneath the rest; hovering a chip hands the plot its group with `spotlight` on, which dims
// every other point. Both are drawn by the plot, so hovering never rebuilds pointData.
export const DimmedAndSpotlit: Story = {
    args: {
        pointData: groupedData,
        loading: false,
    },
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [plotHover, setPlotHover] = useState<string | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [legendHover, setLegendHover] = useState<string | null>(null);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const pointData = useMemo(
            () => groupedData.map((point) => ({ ...point, dimmed: hidden.has(point.metaData.group) })),
            [hidden],
        );
        // A switched-off group has nothing to spotlight, so its chip leaves the plot be.
        const group = legendHover ? pointData.filter((point) => point.metaData.group === legendHover && !point.dimmed) : [];

        const toggle = (value: string) => {
            const next = new Set(hidden);
            if (!next.delete(value)) next.add(value);
            setHidden(next);
        };

        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
                <ChipLegend
                    groups={HOVER_GROUPS.map(({ name, color }) => ({ value: name, label: name, color, count: 160 }))}
                    hidden={hidden}
                    onToggle={toggle}
                    highlighted={legendHover ?? plotHover}
                    onHover={setLegendHover}
                />
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ScatterPlot
                        pointData={pointData}
                        loading={false}
                        hoveredPoints={group.length > 0 ? group : undefined}
                        spotlight
                        onHoveredPointChange={(point) => setPlotHover(point?.metaData?.group ?? null)}
                        leftAxisLabel="Y-Axis Label"
                        bottomAxisLabel="X-Axis Label"
                    />
                </div>
            </div>
        );
    },
    decorators: [
        (Story) => (
            <div style={{ width: 850, height: 560 }}>
                <Story />
            </div>
        ),
    ],
};

// Two rings side by side, so the x domain is wider than the y: drawn round only while both axes
// have the same pixels per unit.
const ringData: Point[] = Array.from({ length: 360 }, (_, i) => {
    const angle = (i * Math.PI) / 90;
    return i < 180
        ? { x: Math.cos(angle), y: Math.sin(angle), color: '#2541b2' }
        : { x: 2.4 + 0.3 * Math.cos(angle), y: 0.3 * Math.sin(angle), color: '#d62728' };
});

// square locks the plot to the shorter side of its container and centers it. Off by default: the
// plot fills the container instead. Both keep the rings round, as the axes share a scale unless
// disableEqualScale stretches each over the plot on its own.
//
// The three stories below sit in the same wide container, so the difference is the point.
const inWideBox: Decorator = (Story) => (
    <div style={{ width: 900, height: 420, border: '2px dashed #999' }}>
        <Story />
    </div>
);

export const Square: Story = {
    args: {
        pointData: ringData,
        loading: false,
        square: true,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    },
    decorators: [inWideBox],
};

export const FillsContainer: Story = {
    args: {
        pointData: ringData,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    },
    decorators: [inWideBox],
};

export const EqualScaleDisabled: Story = {
    args: {
        pointData: ringData,
        loading: false,
        disableEqualScale: true,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
    },
    decorators: [inWideBox],
};

// hoveredPoints set a window at a time, as a swept colorbar sets them. Points that stay in the window
// keep their hover growth; only newly included ones grow in, so a quick sweep doesn't flicker.
type ValuePoint = {
    x: number;
    y: number;
    color: string;
    metaData: { value: number };
};

const SWEEP_WINDOW = 0.15;

const sweepData: ValuePoint[] = (() => {
    // Seeded, so the points are the same on every load.
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: 1200 }, () => {
        const x = random() * 100;
        const y = random() * 60 + x * 0.3;
        const value = Math.min(1, Math.max(0, x / 100 + (random() - 0.5) * 0.3));
        return { x, y, color: `hsl(${240 - value * 240}, 70%, 50%)`, metaData: { value } };
    });
})();

export const HoveredPointsSweep: Story = {
    args: {
        pointData: sweepData,
        loading: false,
    },
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [from, setFrom] = useState<number | null>(null);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const hoveredPoints = useMemo(
            () =>
                from === null
                    ? undefined
                    : sweepData.filter(({ metaData: { value } }) => value >= from && value <= from + SWEEP_WINDOW),
            [from],
        );

        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>
                <div
                    data-testid="sweep-bar"
                    onMouseMove={(event) => {
                        const { left, width } = event.currentTarget.getBoundingClientRect();
                        const t = (event.clientX - left) / width;
                        setFrom(Math.min(Math.max(t - SWEEP_WINDOW / 2, 0), 1 - SWEEP_WINDOW));
                    }}
                    onMouseLeave={() => setFrom(null)}
                    style={{
                        position: "relative",
                        height: 16,
                        borderRadius: 8,
                        background:
                            "linear-gradient(to right, hsl(240, 70%, 50%), hsl(180, 70%, 50%), hsl(120, 70%, 50%), hsl(60, 70%, 50%), hsl(0, 70%, 50%))",
                    }}
                >
                    {from !== null && (
                        <div
                            style={{
                                position: "absolute",
                                top: -3,
                                bottom: -3,
                                left: `${from * 100}%`,
                                width: `${SWEEP_WINDOW * 100}%`,
                                border: "2px solid #000",
                                borderRadius: 4,
                            }}
                        />
                    )}
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <ScatterPlot
                        pointData={sweepData}
                        loading={false}
                        disableTooltip
                        leftAxisLabel="Y-Axis Label"
                        bottomAxisLabel="X-Axis Label"
                        hoveredPoints={hoveredPoints}
                    />
                </div>
            </div>
        );
    },
};

// backgroundField paints a grid of values behind the points - a model's surface the points are read
// against, say - in the points' own coordinates, so it pans and zooms with them and shows in the
// minimap. The grid is built once, here, so its arrays are the same on every render: a new array
// rasterizes the grid again. getFieldGrid builds one from a table with a row per grid point instead.
const FIELD_EXTENT: [number, number] = [0, 100];
const FIELD_LINES = 80;
const FIELD_DOMAIN: [number, number] = [-1, 1];
const FIELD_COLORS = ["blue", "white", "red"];

const fieldSurface = (x: number, y: number) => Math.sin(x / 16) * Math.cos(y / 22);

const fieldGrid = (() => {
    const lines = Array.from({ length: FIELD_LINES }, (_, i) => (i / (FIELD_LINES - 1)) * FIELD_EXTENT[1]);
    return {
        x: lines,
        y: lines,
        // A row of x at a time, from the lowest y up.
        values: lines.flatMap((y) => lines.map((x) => fieldSurface(x, y))),
    };
})();

type FieldPoint = PlotPoint<{ value: number }>;

/** Scattered over the surface, each carrying the surface's value where it sits. Seeded, so the story draws the same each time. */
const fieldPoints: FieldPoint[] = (() => {
    let seed = 7;
    const random = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
    return Array.from({ length: 400 }, () => {
        const x = 3 + random() * 94;
        const y = 3 + random() * 94;
        return { x, y, r: 3, color: "#37474f", metaData: { value: fieldSurface(x, y) } };
    });
})();

const FIELD_STOPS = evenStops(FIELD_COLORS);
/** Every point's value, sorted: what the colorbar's histogram counts. */
const FIELD_POINT_VALUES = fieldPoints.map(({ metaData }) => metaData!.value).sort((a, b) => a - b);

/** The built-in legend: a color bar ticked across the domain, titled and formatted from `legend`. */
export const BackgroundField: Story = {
    args: {
        pointData: fieldPoints,
        loading: false,
        // The grid covers exactly this, so the plot shows all of it and nothing beyond.
        xDomain: FIELD_EXTENT,
        yDomain: FIELD_EXTENT,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        backgroundField: {
            ...fieldGrid,
            domain: FIELD_DOMAIN,
            colorScale: FIELD_COLORS,
            opacity: 0.8,
            legend: { label: "Predicted value", format: (value) => value.toFixed(1) },
        },
    },
};

// A legend of the caller's own: a function handed the room beside the plot, whose SVG is drawn in
// the plot's <svg> (so a download keeps it). Here it's the library's Colorbar, with a histogram of
// the points' values: sweeping along it spotlights the points in that stretch, and hovering a point
// marks its value on the bar.
export const BackgroundFieldCustomLegend: Story = {
    args: {
        pointData: fieldPoints,
        loading: false,
    },
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [sweep, setSweep] = useState<RampRange | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [hovered, setHovered] = useState<FieldPoint | null>(null);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const swept = useMemo(() => {
            if (!sweep) return undefined;
            const [low, high] = sweptValues(FIELD_DOMAIN, sweep);
            return fieldPoints.filter(({ metaData }) => metaData!.value >= low && metaData!.value <= high);
        }, [sweep]);

        return (
            <ScatterPlot
                pointData={fieldPoints}
                loading={false}
                xDomain={FIELD_EXTENT}
                yDomain={FIELD_EXTENT}
                leftAxisLabel="Y-Axis Label"
                bottomAxisLabel="X-Axis Label"
                disableTooltip
                hoveredPoints={swept}
                spotlight
                onHoveredPointChange={setHovered}
                backgroundField={{
                    ...fieldGrid,
                    domain: FIELD_DOMAIN,
                    colorScale: FIELD_COLORS,
                    opacity: 0.8,
                    legend: ({ width, height }) => (
                        <>
                            <Colorbar
                                orientation="vertical"
                                width={width}
                                height={height}
                                stops={FIELD_STOPS}
                                range={FIELD_DOMAIN}
                                values={FIELD_POINT_VALUES}
                                format={(value) => value.toFixed(1)}
                                noun="point"
                                sweep={sweep}
                                onSweep={setSweep}
                                marker={hovered?.metaData?.value ?? null}
                            />
                            {/* Rotated to read down the slot's right edge: 14px in, its font size. */}
                            <text transform={`translate(${width - 14},${height / 2}) rotate(90)`} textAnchor="middle" fontSize={14}>
                                Predicted value
                            </text>
                        </>
                    ),
                }}
            />
        );
    },
};

export const Mobile: Story = {
    tags: ['mobile', '!autodocs'],
    globals: { viewport: { value: 'iphone14', isRotated: false } },
    args: {
        pointData: points,
        loading: false,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        selectable: true,
        onSelectionChange: fn(),
        onPointClicked: fn(),
        initialState: {
            minimap: {
                showWhileZoomed: true,
            },
        },
    },
    decorators: [(Story) => <div style={{ height: 360 }}><Story /></div>],
};
