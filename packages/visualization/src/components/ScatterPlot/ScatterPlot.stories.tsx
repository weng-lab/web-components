import { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import ScatterPlot from './scatterplot';
import ScatterPlotSync from './ScatterPlotSync';
import { getSharedDomains } from './helpers';
import { MiniMapProps } from './types';

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
        (Story) => (
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
    shape?: "circle" | "triangle";
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

// Mock for the map prop
const miniMap: MiniMapProps = {
    position: { right: 50, bottom: 50 }
};

// Default story with scatter data
export const Default: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        downloadButton: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
    },
    render: () => {
        return (
            <ScatterPlot
                pointData={scatterData}
                loading={false}
                leftAxisLabel=""
                bottomAxisLabel=""
                miniMap={miniMap}
                disableTooltip
                initialState={
                    {
                        minimap: {
                            open: true,
                        },
                        controls: {
                            selectionType: "pan"
                        }
                    }
                }
            />

        )
    }
};

// backgroundGradient:{
//     colorScale: ["red", "white", "blue"],
//     legend: {
//       label: "L2FC TRvUT",
//       minLabel: "-0.8",
//       midLabel: "0",
//       maxLabel: "0.8",
//     }
//   },
//   originLine: true,
//   border: true,

// Default story with tooltip
export const CustomTooltip: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
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
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
    }
};

// Default story with no mini map
export const WithoutMiniMap: Story = {
    args: {
        pointData: scatterData,
        loading: false,
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
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
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
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
    }
};

// Default story with grouped points
export const HoverMultiplePoints: Story = {
    args: {
        groupPointsAnchor: "color",
        pointData: moreScatterData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        },
    }
};

// Default story with multiple shapes
export const OtherShapes: Story = {
    args: {
        pointData: shapeData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
    }
};

// Default story with disabled zoom
export const ZoomDisabled: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableZoom: true,
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "none"
            }
        }
    },
    render: () => {
        return (
            <ScatterPlot
                pointData={scatterData}
                loading={false}
                leftAxisLabel=""
                bottomAxisLabel=""
                miniMap={miniMap}
                disableTooltip
                disableZoom
                initialState={
                    {
                        minimap: {
                            open: true,
                        },
                        controls: {
                            selectionType: "none"
                        }
                    }
                }
            />

        )
    }
};

// Default story with disabled zoom but selectable
export const ZoomDisabledButSelectable: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
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
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "select"
            }
        }
    }
};

// Controls Highlight
export const ControlsHighlight: Story = {
    args: {
        controlsHighlight: "red",
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        selectable: true,
        onSelectionChange: (selectedPoints) => {
            window.alert(
                `You Seleted Points: ${JSON.stringify(selectedPoints)}`
            );
        },
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
    }
};

export const Animation: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
    },
    render: () => {
        return (
            <ScatterPlot
                pointData={points}
                loading={false}
                leftAxisLabel=""
                bottomAxisLabel=""
                miniMap={miniMap}
                disableTooltip
                initialState={
                    {
                        minimap: {
                            open: true,
                        },
                        controls: {
                            selectionType: "pan"
                        }
                    }
                }
                animation="slideUp"
                animationBuffer={0.02}
                animationGroupSize={10}
            />

        )
    }
};

// Manually sized plot. Container is 900x700 with a dashed border - the plot
// should render at the fixed 350x350 size below, ignoring the container size.
export const ManualSize: Story = {
    args: {
        pointData: scatterData,
        loading: false,
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        width: 350,
        height: 350,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
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
// the same crosshair on both, and zooming or panning either one moves both. Only the hovered
// plot shows a tooltip.
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
                                miniMap={miniMap}
                                disableTooltip
                                initialState={{ minimap: { open: true }, controls: { selectionType: "pan" } }}
                                {...sync}
                            />
                        </div>
                        <div style={{ flex: 1, height: '100%' }}>
                            <ScatterPlot
                                pointData={syncedDataB}
                                loading={false}
                                leftAxisLabel="Y-Axis Label"
                                bottomAxisLabel="Sample B"
                                miniMap={miniMap}
                                disableTooltip
                                controlsPosition="right"
                                initialState={{ minimap: { open: true }, controls: { selectionType: "pan" } }}
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
        miniMap: miniMap,
        leftAxisLabel: "Y-Axis Label",
        bottomAxisLabel: "X-Axis Label",
        disableTooltip: true,
        initialState: {
            minimap: {
                open: true,
            },
            controls: {
                selectionType: "pan"
            }
        }
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
