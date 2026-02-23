import { useMemo, useState, useCallback, useRef } from "react";
import { Group } from "@visx/group";
import { ascending } from "@visx/vendor/d3-array";
import { pathRadialStep } from "@visx/shape";
import { cluster as d3cluster, hierarchy as d3hierarchy } from "d3-hierarchy";
import { PhyloTreeProps, TreeItem, TreeLink, TreeNode, ZoomState } from "./types";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { Zoom } from "@visx/zoom";
import { ProvidedZoom } from "@visx/zoom/lib/types";
import { ZoomFrame } from "./ZoomFrame";
import { pointRadial } from "d3-shape";
import { RenderTree } from "./RenderTree";

/**
 * Improvements that would make this scale better (as much as svg can):
 * - Combine links into fewer path elements
 *    - Requires having static hit detecting paths, but can create fewer <path> elements by combining link paths
 *    - Creates less work for the browser to update fewer, but more complex paths
 *    - Would need base branches grouped by color, selection path, external highlight path, and invisible static hit target paths for branch selection
 * - Remove hover interaction and opt for click only interactions
 * - If keeping hover behavior, define gapless areas between nodes to prevent -> hover NodeA, hover null, hover NodeB in favor of NodeA -> NodeB
 * - Define single hit area that takes in click event and determines what was hit
 */

export const useBranchLengthTransition = {
  duration: 0.3,
  ease: "easeInOut",
} as const;

// Keep spacing of all leaf nodes consistent
const separationFn = () => 1;

const getBranchLengthScaledY = (cumulativeBranchLength: number, maxBranchLength: number, innerRadius: number) => {
  return maxBranchLength === 0 ? 0 : (cumulativeBranchLength / maxBranchLength) * innerRadius;
};

// Framer motion had issues with e notation
const rmSciNotation = (pathString: string) => {
  // Regex to match scientific notation:
  // optional sign, digits/dots, 'e' or 'E', optional sign, and exponent digits
  const scientificRegex = /-?\d*\.?\d+[eE][+-]?\d+/g;

  return pathString.replace(scientificRegex, (match) => {
    // Convert the match to a Number and then back to a decimal string
    const num = Number(match);

    // Use toFixed() to ensure no new scientific notation is generated
    // 10 decimal places is usually enough for SVG precision
    return num.toFixed(10).replace(/\.?0+$/, "");
  });
};

const withNoSciNotation =
  <L extends TreeLink>(generator: (link: L) => string | null) =>
  (link: L) => {
    const path = generator(link);
    return path ? rmSciNotation(path) : "";
  };

const getLinkPath = withNoSciNotation(
  pathRadialStep<TreeLink, TreeNode>({
    source: (l) => l.source,
    target: (l) => l.target,
    x: (n) => n?.x || 0,
    y: (n) => n?.y || 0,
  })
);

const getScaledLinkPath = withNoSciNotation(
  pathRadialStep<TreeLink, TreeNode>({
    source: (l) => l.source,
    target: (l) => l.target,
    x: (n) => n?.x || 0,
    y: (n) => n?.branchLengthScaledRadius || 0,
  })
);

/**
 * Lightens a hex color by blending it with white.
 * @param {string} hex - The input color, e.g. "#336699"
 * @param {number} factor - How much to lighten: 0 = no change, 1 = full white
 * @returns {string} - The lightened hex color
 */
const lightenHex = (hex: string, factor: number) => {
  // Remove leading "#" if present
  hex = hex.replace(/^#/, '');

  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Blend each channel toward 255 (white)
  r = Math.round(r + (255 - r) * factor);
  g = Math.round(g + (255 - g) * factor);
  b = Math.round(b + (255 - b) * factor);

  // Convert back to hex and pad with zeros
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * For internal svg calculation only
 */
export const TOTAL_INNER_RADIUS = 500;
/**
 * For internal svg calculation only (used to define viewbox in ZoomFrame)
 */
export const TOTAL_INNER_DIAMETER = TOTAL_INNER_RADIUS * 2;

export default function PhyloTree({
  width: totalWidth,
  height: totalHeight,
  data,
  highlighted = [],
  leafFontSize = 8,
  leafFontFamily = "Arial",
  linkStrokeWidth = 1,
  getColor = () => "black",
  getLabel = (item: TreeItem) => item.id,
  labelPadding = 135,
  tooltipContents,
}: PhyloTreeProps) {
  const [enableBranchLengths, setEnableBranchLengths] = useState<boolean>(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();

  const pendingRef = useRef<string>(null);
  const frameRef = useRef(false);

  //Prevent hover updates more frequently than the browser can repaint
  const scheduleHighlight = (nodeId: string | null) => {
    pendingRef.current = nodeId;

    if (!frameRef.current) {
      frameRef.current = true;

      requestAnimationFrame(() => {
        setHoveredId(pendingRef.current);
        frameRef.current = false;
      });
    }
  };

  const circleRadius = Math.max(0, TOTAL_INNER_RADIUS - labelPadding);

  // This defines the arbitrary x/y coordinate system. For our radial layout X is the angle defined in radians, Y is radius. https://d3js.org/d3-hierarchy/cluster#cluster_size
  const size: [number, number] = useMemo(() => [2 * Math.PI, circleRadius], [circleRadius]);

  /* Construct root node */
  const root = useMemo(() => {
    const r = d3hierarchy(data, (d) => d.children)
      // sorts first by least number of children, and then by branch length to create nice looking plot
      .sum((d) => (d.children ? 0 : 1))
      .sort(
        (a, b) =>
          (a.value || 0) - (b.value || 0) ||
          ascending(a.data.branch_length ?? undefined, b.data.branch_length ?? undefined)
      );
    return r;
  }, [data, getColor, circleRadius]);

  /* Add layout/render properties */
  const rootNode = useMemo(() => {
    const clusterLayout = d3cluster<TreeItem>();
    clusterLayout.size(size);
    clusterLayout.separation(separationFn);
    const clusterRoot: TreeNode = clusterLayout(root);

    let maxBranchLength = 0;

    clusterRoot.each((node) => {
      node.label = getLabel(node.data)
    })

    // uniformLeafColor
    clusterRoot.eachAfter((node) => {
      //This node is visited after all of it's descendents. Allows us to look at immediate children to see if they have same color.
      //For leaf nodes, there will be no children, so assign the color AND assign light
      if (!node.children) {
        node.color = getColor(node.data);
      } else {
        const childColors = node.children.map((x) => x.color);
        const firstColor = node.children[0].color;
        const allSame = firstColor !== null && childColors.every((color) => color === firstColor);
        node.color = allSame ? firstColor : "#666";
      }
    });

    // cumulativeBranchLength
    clusterRoot.eachBefore((node) => {
      const parentLen = node.parent?.cumulativeBranchLength ?? 0;
      const cumulativeBranchLength = parentLen + (node.data.branch_length ?? 0);

      if (cumulativeBranchLength > maxBranchLength) {
        maxBranchLength = cumulativeBranchLength;
      }
      
      node.cumulativeBranchLength = cumulativeBranchLength;
    });
    
    // Add BranchLengthScaledRadius. Must come after cumulativeBranchLength
    clusterRoot.descendants().forEach((node) => {
      const branchLengthScaledRadius = getBranchLengthScaledY(
        node.cumulativeBranchLength ?? 0,
        maxBranchLength,
        circleRadius
      );

      node.branchLengthScaledRadius = branchLengthScaledRadius;
    })

    // Base/Scaled X/Y. Must come after branchLengthScaledRadius assignment
    clusterRoot.descendants().forEach((node) => {
      const [baseNodeX, baseNodeY] = pointRadial(node.x, node.y);
      const [scaledNodeX, scaledNodeY] = pointRadial(node.x, node.branchLengthScaledRadius ?? 0);

      node.baseNodeX = baseNodeX;
      node.baseNodeY = baseNodeY;
      node.scaledNodeX = scaledNodeX;
      node.scaledNodeY = scaledNodeY;
    });

    // Base/Scaled X/Y. Must come after branchLengthScaledRadius assignment
    clusterRoot.descendants().forEach((node) => {
      const [baseNodeX, baseNodeY] = pointRadial(node.x, node.y);
      const [scaledNodeX, scaledNodeY] = pointRadial(node.x, node.branchLengthScaledRadius ?? 0);

      node.baseNodeX = baseNodeX;
      node.baseNodeY = baseNodeY;
      node.scaledNodeX = scaledNodeX;
      node.scaledNodeY = scaledNodeY;
    });
    
    //Link Path gen must come after the above assignment of branchLengthScaledRadius
    clusterRoot.descendants().forEach((node) => {
      if (node.parent) {
        const link = { source: node.parent, target: node };

        const baseLinkPath = getLinkPath(link);
        const scaledLinkPath = getScaledLinkPath(link);

        node.baseLinkPath = baseLinkPath;
        node.scaledLinkPath = scaledLinkPath;
      }
    });

    clusterRoot.leaves().forEach((leaf) => {
      leaf.baseLeafLinkExtension = {
        x1: leaf.baseNodeX ?? 0,
        x2: leaf.baseNodeX ?? 0,
        y1: leaf.baseNodeY ?? 0,
        y2: leaf.baseNodeY ?? 0,
      };
      leaf.scaledLeafLinkExtension = {
        x1: leaf.scaledNodeX ?? 0,
        x2: leaf.baseNodeX ?? 0,
        y1: leaf.scaledNodeY ?? 0,
        y2: leaf.baseNodeY ?? 0,
      };
      leaf.lightenedLinkExtColor = lightenHex(leaf.color ?? "#000000", 0.5);
    })

    // Highlighted state
    clusterRoot.each((node) => {
      //probably could do this more efficiently with .eachAfter
      const isLeaf = !node.children
      const isHighlighted = isLeaf ? highlighted.includes(node.data.id) : node.leaves().some(leaf => highlighted.includes(leaf.data.id))

      node.linkStrokeWidth = isHighlighted ? linkStrokeWidth * 2 : linkStrokeWidth
      node.labelStrokeWidth = isHighlighted ? 0.7 : 0
    })

    clusterRoot.each((node) => {
      const ancestorIds = new Set(node.ancestors().map(node => node.data.id))
      const descendantIds = new Set(node.descendants().map(node => node.data.id))
      

      node.ancestorIds = ancestorIds
      node.descendantIds = descendantIds
    })

    return clusterRoot;
  }, [data, size, circleRadius, root, highlighted, linkStrokeWidth]);

  const toggleBranchLength = useCallback(() => setEnableBranchLengths((prev) => !prev), []);

  const handleLeafOnMouseEnter = useCallback((e: React.MouseEvent, node: TreeNode) => {
    scheduleHighlight(node.data.id)
    !node.children && showTooltip({
      tooltipData: node.data,
      tooltipLeft: e.clientX,
      tooltipTop: e.clientY,
    });
  }, []);

  const handleLeafOnMouseLeave = useCallback(() => {
    scheduleHighlight(null)
    hideTooltip();
  }, []);

  const renderTree = useCallback(
    (zoom: ProvidedZoom<SVGSVGElement> & ZoomState) => {
      return (
        <ZoomFrame
          zoom={zoom}
          totalWidth={totalWidth}
          totalHeight={totalHeight}
          toggleBranchLength={toggleBranchLength}
        >
          {/* Positions plot at center of zoom frame */}
          <Group
            top={TOTAL_INNER_RADIUS}
            left={TOTAL_INNER_RADIUS}
          >
            <RenderTree
              root={rootNode}
              hoveredId={hoveredId}
              leafFontFamily={leafFontFamily}
              leafFontSize={leafFontSize}
              useBranchLengths={enableBranchLengths}
              onNodeEnter={handleLeafOnMouseEnter}
              onNodeLeave={handleLeafOnMouseLeave}
            />
          </Group>
        </ZoomFrame>
      );
    },
    [
      totalWidth,
      totalHeight,
      origin,
      hoveredId,
      enableBranchLengths,
      toggleBranchLength,
      highlighted,
      getColor,
      getLabel,
      handleLeafOnMouseEnter,
      handleLeafOnMouseLeave,
    ]
  );

  return totalWidth < 10 ? null : (
    <div>
      <Zoom<SVGSVGElement>
        width={totalWidth}
        height={totalHeight}
        scaleXMin={0.8}
        scaleXMax={4}
        scaleYMin={0.8}
        scaleYMax={4}
      >
        {renderTree}
      </Zoom>
      {tooltipData && tooltipContents && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
          {tooltipContents(tooltipData)}
        </TooltipWithBounds>
      )}
    </div>
  );
}
