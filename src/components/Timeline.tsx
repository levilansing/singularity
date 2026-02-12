import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Prediction } from "../data/types";
import { TimelineTooltip } from "./TimelineTooltip";

interface TimelineProps {
  predictions: Prediction[];
  selectedId: number;
  onSelect: (id: number) => void;
}

const PADDING_LEFT = 60;
const PADDING_RIGHT = 30;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 50;
const POINT_RADIUS = 5;
const CHART_HEIGHT = 400;
const ZOOM_FACTOR = 0.1;

const TYPE_COLORS: Record<string, string> = {
  AGI: "#3b82f6",
  Singularity: "#a855f7",
  Superintelligence: "#ef4444",
  "Intelligence Explosion": "#f97316",
  "Transformative AI": "#10b981",
  "Human-level AI": "#06b6d4",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#6b7280";
}

/** Pick a nice tick step for a given year range */
function tickStep(range: number): number {
  if (range <= 20) return 2;
  if (range <= 50) return 5;
  if (range <= 100) return 10;
  if (range <= 200) return 20;
  return 50;
}

/** Generate tick values for a range with adaptive step */
function generateTicks(min: number, max: number): number[] {
  const range = max - min;
  const step = tickStep(range);
  const start = Math.ceil(min / step) * step;
  const result: number[] = [];
  for (let y = start; y <= max; y += step) {
    result.push(y);
  }
  return result;
}

export function Timeline({ predictions, selectedId, onSelect }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ prediction: Prediction; x: number; y: number } | null>(null);

  // Only include predictions with at least a best year for x-axis
  const timelinePredictions = useMemo(
    () => predictions.filter((p) => p.predicted_year_best !== null),
    [predictions]
  );

  // Data bounds (full extent)
  const dataBounds = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    for (const p of timelinePredictions) {
      const years = [p.predicted_year_low, p.predicted_year_best, p.predicted_year_high].filter(
        (y): y is number => y !== null
      );
      for (const y of years) {
        if (y < xMin) xMin = y;
        if (y > xMax) xMax = y;
      }
      const predYear = parseInt(p.prediction_date, 10);
      if (!isNaN(predYear)) {
        if (predYear < yMin) yMin = predYear;
        if (predYear > yMax) yMax = predYear;
      }
    }
    return {
      xMin: Math.floor(xMin / 10) * 10,
      xMax: Math.ceil(xMax / 10) * 10 + 10,
      yMin: Math.floor(yMin / 10) * 10,
      yMax: Math.ceil(yMax / 10) * 10,
    };
  }, [timelinePredictions]);

  // Viewport state (the currently visible range)
  const [viewport, setViewport] = useState<{ xMin: number; xMax: number; yMin: number; yMax: number } | null>(null);

  // Initialize viewport from data bounds
  useEffect(() => {
    setViewport({ ...dataBounds });
  }, [dataBounds]);

  const vp = viewport ?? dataBounds;

  const svgHeight = PADDING_TOP + CHART_HEIGHT + PADDING_BOTTOM;

  const xScale = useCallback(
    (year: number, width: number) => {
      const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
      return PADDING_LEFT + ((year - vp.xMin) / (vp.xMax - vp.xMin)) * plotWidth;
    },
    [vp.xMin, vp.xMax]
  );

  const yScale = useCallback(
    (year: number) => {
      return PADDING_TOP + CHART_HEIGHT - ((year - vp.yMin) / (vp.yMax - vp.yMin)) * CHART_HEIGHT;
    },
    [vp.yMin, vp.yMax]
  );

  const currentYear = new Date().getFullYear() + new Date().getMonth() / 12;

  const xTicks = useMemo(() => generateTicks(vp.xMin, vp.xMax), [vp.xMin, vp.xMax]);
  const yTicks = useMemo(() => generateTicks(vp.yMin, vp.yMax), [vp.yMin, vp.yMax]);

  const handleMouseEnter = useCallback((prediction: Prediction, event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({
      prediction,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const [svgWidth, setSvgWidth] = useState(800);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const resizeRef = useCallback((node: SVGSVGElement | null) => {
    svgRef.current = node;
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setSvgWidth(entry.contentRect.width);
        }
      });
      observer.observe(node);
      setSvgWidth(node.getBoundingClientRect().width);
    }
  }, []);

  // Zoom handler (wheel / pinch)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Scale factor from viewBox
      const scaleX = svgWidth / rect.width;
      const scaleY = svgHeight / rect.height;
      const svgX = mouseX * scaleX;
      const svgY = mouseY * scaleY;

      // Year at cursor
      const plotWidth = svgWidth - PADDING_LEFT - PADDING_RIGHT;
      const yearAtCursorX = vp.xMin + ((svgX - PADDING_LEFT) / plotWidth) * (vp.xMax - vp.xMin);
      const yearAtCursorY = vp.yMin + ((PADDING_TOP + CHART_HEIGHT - svgY) / CHART_HEIGHT) * (vp.yMax - vp.yMin);

      const delta = e.deltaY > 0 ? ZOOM_FACTOR : -ZOOM_FACTOR;
      // Fraction of cursor position in viewport
      const fx = (yearAtCursorX - vp.xMin) / (vp.xMax - vp.xMin);
      const fy = (yearAtCursorY - vp.yMin) / (vp.yMax - vp.yMin);

      const xRange = vp.xMax - vp.xMin;
      const yRange = vp.yMax - vp.yMin;
      const newXRange = xRange * (1 + delta);
      const newYRange = yRange * (1 + delta);

      // Don't zoom in too far or out too far
      if (newXRange < 5 || newYRange < 5 || newXRange > 500 || newYRange > 500) return;

      setViewport({
        xMin: yearAtCursorX - fx * newXRange,
        xMax: yearAtCursorX + (1 - fx) * newXRange,
        yMin: yearAtCursorY - fy * newYRange,
        yMax: yearAtCursorY + (1 - fy) * newYRange,
      });
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [svgWidth, svgHeight, vp]);

  // Pan handler (drag)
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vp: vp });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan on background clicks (not on data points)
    if ((e.target as SVGElement).closest(".timeline-row")) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, vp: { ...vp } };
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, [vp]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;

    const dx = (e.clientX - panStart.current.x) * scaleX;
    const dy = (e.clientY - panStart.current.y) * scaleY;

    const pv = panStart.current.vp;
    const plotWidth = svgWidth - PADDING_LEFT - PADDING_RIGHT;
    const xShift = (dx / plotWidth) * (pv.xMax - pv.xMin);
    const yShift = (dy / CHART_HEIGHT) * (pv.yMax - pv.yMin);

    setViewport({
      xMin: pv.xMin - xShift,
      xMax: pv.xMax - xShift,
      yMin: pv.yMin + yShift, // inverted Y
      yMax: pv.yMax + yShift,
    });
  }, [svgWidth, svgHeight]);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Double-click to reset
  const onDoubleClick = useCallback(() => {
    setViewport({ ...dataBounds });
  }, [dataBounds]);

  return (
    <div className="timeline-container" ref={containerRef}>
      <div className="timeline-legend">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="timeline-legend-item">
            <span className="timeline-legend-dot" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>

      <div className="timeline-chart-area">
        <svg
          ref={resizeRef}
          className="timeline-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          style={{ touchAction: "none", cursor: isPanning.current ? "grabbing" : "grab", userSelect: "none" }}
        >
          {/* Clip path for chart area */}
          <defs>
            <clipPath id="chart-clip">
              <rect x={PADDING_LEFT} y={PADDING_TOP} width={svgWidth - PADDING_LEFT - PADDING_RIGHT} height={CHART_HEIGHT} />
            </clipPath>
          </defs>

          {/* X-axis grid lines & labels */}
          {xTicks.map((year) => {
            const x = xScale(year, svgWidth);
            return (
              <g key={`x-${year}`}>
                <line x1={x} y1={PADDING_TOP} x2={x} y2={PADDING_TOP + CHART_HEIGHT} stroke="#ffffff10" strokeWidth={1} clipPath="url(#chart-clip)" />
                <text x={x} y={PADDING_TOP + CHART_HEIGHT + 20} fill="#ffffff50" fontSize={11} textAnchor="middle" fontFamily="system-ui">
                  {year}
                </text>
              </g>
            );
          })}

          {/* Y-axis grid lines & labels */}
          {yTicks.map((year) => {
            const y = yScale(year);
            return (
              <g key={`y-${year}`}>
                <line x1={PADDING_LEFT} y1={y} x2={svgWidth - PADDING_RIGHT} y2={y} stroke="#ffffff10" strokeWidth={1} clipPath="url(#chart-clip)" />
                <text x={PADDING_LEFT - 8} y={y + 4} fill="#ffffff50" fontSize={11} textAnchor="end" fontFamily="system-ui">
                  {year}
                </text>
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={PADDING_LEFT + (svgWidth - PADDING_LEFT - PADDING_RIGHT) / 2}
            y={svgHeight - 4}
            fill="#ffffff50"
            fontSize={11}
            textAnchor="middle"
            fontFamily="system-ui"
            style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Predicted year of singularity
          </text>

          {/* Y-axis label */}
          <text
            x={14}
            y={PADDING_TOP + CHART_HEIGHT / 2}
            fill="#ffffff50"
            fontSize={11}
            textAnchor="middle"
            fontFamily="system-ui"
            style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            transform={`rotate(-90, 14, ${PADDING_TOP + CHART_HEIGHT / 2})`}
          >
            Year prediction was made
          </text>

          {/* NOW vertical line */}
          {(() => {
            const nowX = xScale(currentYear, svgWidth);
            const inView = nowX >= PADDING_LEFT && nowX <= svgWidth - PADDING_RIGHT;
            if (!inView) return null;
            return (
              <g>
                <line
                  x1={nowX}
                  y1={PADDING_TOP}
                  x2={nowX}
                  y2={PADDING_TOP + CHART_HEIGHT}
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  clipPath="url(#chart-clip)"
                />
                <text
                  x={nowX}
                  y={PADDING_TOP - 10}
                  fill="#fbbf24"
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight="bold"
                  fontFamily="system-ui"
                >
                  NOW
                </text>
              </g>
            );
          })()}

          {/* Prediction points */}
          <g clipPath="url(#chart-clip)">
            {timelinePredictions.map((p) => {
              const predictionYear = parseInt(p.prediction_date, 10);
              if (isNaN(predictionYear)) return null;
              const cx = xScale(p.predicted_year_best!, svgWidth);
              const cy = yScale(predictionYear);
              const color = getTypeColor(p.prediction_type);
              const isSelected = p.id === selectedId;
              const opacity = isSelected ? 1 : 0.7;

              return (
                <g
                  key={p.id}
                  className="timeline-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelect(p.id)}
                  onMouseEnter={(e) => handleMouseEnter(p, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Range bar (horizontal) */}
                  {p.predicted_year_low !== null && p.predicted_year_high !== null && (
                    <line
                      x1={xScale(p.predicted_year_low, svgWidth)}
                      y1={cy}
                      x2={xScale(p.predicted_year_high, svgWidth)}
                      y2={cy}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={opacity * 0.4}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Best estimate point */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? POINT_RADIUS + 2 : POINT_RADIUS}
                    fill={color}
                    opacity={opacity}
                    stroke={isSelected ? "#fff" : "none"}
                    strokeWidth={isSelected ? 2 : 0}
                  />

                  {/* Invisible hit area */}
                  <circle cx={cx} cy={cy} r={12} fill="transparent" />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="timeline-hint">Scroll to zoom · Drag to pan · Double-click to reset</div>

      {tooltip && <TimelineTooltip prediction={tooltip.prediction} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
