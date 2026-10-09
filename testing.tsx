import ReactDOM from 'react-dom/client';
import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { Colorbar, ScatterPlot, evenStops, getFieldGrid, getSharedDomains, sweptValues } from './packages/visualization/src';
import type { Point, RampRange } from './packages/visualization/src';

// A MEDUSA phase diagram: each gene knockout placed by its relative growth and death rates, over
// the model's L2FC surface as ScatterPlot's backgroundField, with the library's Colorbar handed in
// as the field's legend. Everything here is generated - the surface below is a stand-in with the
// right shape, not MEDUSA's formulas - but it takes the route the web runner will: a simtable's
// three columns, in the file's row order, through getFieldGrid.

/** A linear congruential generator, so the page draws the same plot on every load. */
const seeded = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
};
const medusaRandom = seeded(42);
const normal = () => Math.sqrt(-2 * Math.log(1 - medusaRandom())) * Math.cos(2 * Math.PI * medusaRandom());

/** Stand-in for the model: more growth or more drug-induced death both leave fewer treated cells. */
const l2fcTRvUT = (growth: number, death: number) => -0.95 * (growth - 1) - 1.3 * (death - 1);

// simtable.csv as its three used columns: a num_iter x num_iter mesh, evenly spaced in linear
// units and reaching well past the genes, with NPG as the outer loop as the file has it.
const SIM_ITER = 1000;
const simtable = (() => {
    const NPG = new Float64Array(SIM_ITER * SIM_ITER);
    const DR_drug = new Float64Array(SIM_ITER * SIM_ITER);
    const L2FC_TRvUT = new Float64Array(SIM_ITER * SIM_ITER);
    for (let i = 0; i < SIM_ITER; i++) {
        for (let j = 0; j < SIM_ITER; j++) {
            const row = i * SIM_ITER + j;
            NPG[row] = 0.25 + (2.25 * i) / (SIM_ITER - 1);
            DR_drug[row] = 0.5 + (1.5 * j) / (SIM_ITER - 1);
            L2FC_TRvUT[row] = l2fcTRvUT(NPG[row], DR_drug[row]);
        }
    }
    return { NPG, DR_drug, L2FC_TRvUT };
})();

// The axes are log2, so the coordinates are transformed before the grid is built from them.
const medusaGrid = getFieldGrid(simtable.NPG.map(Math.log2), simtable.DR_drug.map(Math.log2), simtable.L2FC_TRvUT);

type GeneMetadata = { gene: string; l2fc: number };

const geneAt = (gene: string, x: number, y: number, style: Partial<Point<GeneMetadata>>): Point<GeneMetadata> => ({
    x,
    y,
    ...style,
    metaData: { gene, l2fc: l2fcTRvUT(2 ** x, 2 ** y) },
});

/** A draw from a normal, redrawn until it lands inside [low, high], so the hits stay the extremes. */
const within = (mean: number, spread: number, low: number, high: number) => {
    let draw = mean + spread * normal();
    while (draw < low || draw > high) draw = mean + spread * normal();
    return draw;
};

const MEDUSA_HITS: [gene: string, x: number, y: number][] = [
    ['RANGAP1', -0.645, 0.265], ['EEF2', -0.6, 0.257], ['THOC2', -0.56, 0.245], ['THOC1', -0.29, 0.28],
    ['ALG2', -0.18, 0.25], ['TMEM167A', -0.155, 0.245], ['SMG7', -0.07, 0.242], ['TADA1', 0.025, 0.275],
    ['WSB2', 0.04, 0.243], ['TADA2B', 0.085, 0.278], ['PTBP1', -0.03, -0.328], ['BCL2L12', -0.145, -0.342],
    ['BAK1', -0.097, -0.347], ['MAP2K7', 0.045, -0.326], ['BOD1', 0.325, -0.328], ['CASP9', -0.03, -0.38],
    ['DIABLO', 0.163, -0.372], ['ZNF519', 0.02, -0.407], ['OR5K2', 0.18, -0.407], ['CYCS', 0.02, -0.473],
];

const medusaGenes: Point<GeneMetadata>[] = [
    ...Array.from({ length: 3000 }, (_, i) =>
        geneAt(`GENE${i + 1}`, within(-0.08, 0.13, -0.6, 0.3), within(-0.01, 0.09, -0.24, 0.22), { color: '#c0c0c0', r: 4 })
    ),
    geneAt('GENE0', -0.91, 0.04, { color: '#c0c0c0', r: 4 }),
    ...Array.from({ length: 40 }, (_, i) =>
        geneAt(`CONTROL${i + 1}`, within(0.05, 0.08, -0.15, 0.25), within(-0.02, 0.07, -0.2, 0.15), { color: '#8a8a8a', r: 4 })
    ),
    ...MEDUSA_HITS.map(([gene, x, y]) =>
        geneAt(gene, x, y, { color: '#b794f6', stroke: '#8b5cf6', opacity: 0.85, r: 6, label: gene })
    ),
];

// The plot's own domains, taken here so the colors can be fitted to the part of the surface in view.
const medusaDomains = getSharedDomains(medusaGenes);

// The colors span the largest |L2FC| inside the plot, not across the table: its far corners run
// several times higher, and would wash everything behind the genes out to near white.
const medusaLimit = (() => {
    const { x, y, values } = medusaGrid;
    const [xLow, xHigh] = medusaDomains.xDomain;
    const [yLow, yHigh] = medusaDomains.yDomain;
    let limit = 0;
    for (let j = 0; j < y.length; j++) {
        if (y[j] < yLow || y[j] > yHigh) continue;
        for (let i = 0; i < x.length; i++) {
            if (x[i] < xLow || x[i] > xHigh) continue;
            limit = Math.max(limit, Math.abs(values[j * x.length + i]));
        }
    }
    return limit;
})();

const MEDUSA_COLORS = ['blue', 'white', 'red'];
const MEDUSA_STOPS = evenStops(MEDUSA_COLORS);
const MEDUSA_RANGE: [number, number] = [-medusaLimit, medusaLimit];
/** Every gene's L2FC, sorted: what the colorbar's histogram counts. */
const medusaL2fcs = Float64Array.from(medusaGenes, (gene) => gene.metaData!.l2fc).sort();
const formatL2fc = (value: number) => value.toFixed(2).replace('-', '−');

function MedusaPhaseDiagramTest() {
    const [sweep, setSweep] = useState<RampRange | null>(null);
    const [hovered, setHovered] = useState<Point<GeneMetadata> | null>(null);

    // Sweeping the colorbar spotlights the genes whose L2FC lies in the stretch under the cursor.
    const sweptGenes = useMemo(() => {
        if (!sweep) return undefined;
        const [low, high] = sweptValues(MEDUSA_RANGE, sweep);
        return medusaGenes.filter(({ metaData }) => metaData!.l2fc >= low && metaData!.l2fc <= high);
    }, [sweep]);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ width: 1200, textAlign: 'center', fontSize: 22 }}>Treated / Untreated</Box>
            <Box sx={{ width: 1200, height: 450 }}>
                <ScatterPlot
                    pointData={medusaGenes}
                    loading={false}
                    xDomain={medusaDomains.xDomain}
                    yDomain={medusaDomains.yDomain}
                    bottomAxisLabel="log₂(Relative Growth Rate)"
                    leftAxisLabel="log₂(Relative Death Rate)"
                    border
                    originLine
                    hoveredPoints={sweptGenes}
                    spotlight
                    onHoveredPointChange={setHovered}
                    tooltipBody={(point) => (
                        <Box>
                            <div><strong>{point.metaData?.gene}</strong></div>
                            <div>L2FC TRvUT: {formatL2fc(point.metaData?.l2fc ?? 0)}</div>
                        </Box>
                    )}
                    backgroundField={{
                        ...medusaGrid,
                        domain: MEDUSA_RANGE,
                        colorScale: MEDUSA_COLORS,
                        legend: ({ width, height }) => (
                            <>
                                <Colorbar
                                    orientation="vertical"
                                    width={width}
                                    height={height}
                                    stops={MEDUSA_STOPS}
                                    range={MEDUSA_RANGE}
                                    values={medusaL2fcs}
                                    format={formatL2fc}
                                    noun="gene"
                                    sweep={sweep}
                                    onSweep={setSweep}
                                    marker={hovered?.metaData?.l2fc ?? null}
                                />
                                <text
                                    transform={`translate(${width - 14},${height / 2}) rotate(90)`}
                                    textAnchor="middle"
                                    fontSize={14}
                                >
                                    L2FC TRvUT
                                </text>
                            </>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<MedusaPhaseDiagramTest />);
