import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Prediction } from "../data/types";
import { dateToFractionalYear } from "../data/types";
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

const ALL_TYPES = Object.keys(TYPE_COLORS);

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

const BUFFER_RATIO = 0.1;
function clampViewport(
  vp: { xMin: number; xMax: number; yMin: number; yMax: number },
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
) {
  const xBuf = (bounds.xMax - bounds.xMin) * BUFFER_RATIO;
  const yBuf = (bounds.yMax - bounds.yMin) * BUFFER_RATIO;
  const minX = bounds.xMin - xBuf;
  const maxX = bounds.xMax + xBuf;
  const minY = bounds.yMin - yBuf;
  const maxY = bounds.yMax + yBuf;

  let { xMin, xMax, yMin, yMax } = vp;
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  if (xMin < minX) { xMin = minX; xMax = minX + xRange; }
  if (xMax > maxX) { xMax = maxX; xMin = maxX - xRange; }
  if (yMin < minY) { yMin = minY; yMax = minY + yRange; }
  if (yMax > maxY) { yMax = maxY; yMin = maxY - yRange; }

  return { xMin, xMax, yMin, yMax };
}

/** Normalize a prediction_type to its canonical legend key */
function canonicalType(type: string): string {
  // Map variants like "AGI (weak)", "AGI (strong)", "HLMI" to their legend keys
  if (type.startsWith("AGI")) return "AGI";
  if (type === "HLMI") return "Human-level AI";
  return type;
}

const TOOLTIP_WIDTH = 280;
const TOOLTIP_HEIGHT_ESTIMATE = 120;

export function Timeline({ predictions, selectedId, onSelect }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ prediction: Prediction; x: number; y: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string> | null>(null); // null = all active

  // Entrance animation state
  const hasAnimated = useRef(false);
  const animationRef = useRef<number>(0);

  // Only include predictions with at least a best year for x-axis
  const timelinePredictions = useMemo(
    () => predictions.filter((p) => p.predicted_year_best !== null),
    [predictions]
  );

  // Sorted prediction dates (as fractional years) for time-based entrance animation
  const predictionTimeline = useMemo(() => {
    const entries = timelinePredictions.map((p) => ({
      id: p.id,
      fy: dateToFractionalYear(p.prediction_date),
    }));
    entries.sort((a, b) => a.fy - b.fy);
    return entries;
  }, [timelinePredictions]);

  const timeRange = useMemo(() => {
    if (predictionTimeline.length === 0) return { min: 0, max: 0 };
    return { min: predictionTimeline[0]!.fy, max: predictionTimeline[predictionTimeline.length - 1]!.fy };
  }, [predictionTimeline]);

  // animationYear: null = show all, number = show predictions made on or before this year
  const [animationYear, setAnimationYear] = useState<number | null>(null);

  const visibleIdSet = useMemo(() => {
    if (animationYear === null) return null; // show all
    const set = new Set<number>();
    for (const entry of predictionTimeline) {
      if (entry.fy <= animationYear) set.add(entry.id);
      else break;
    }
    return set;
  }, [animationYear, predictionTimeline]);

  const startAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    if (predictionTimeline.length === 0) { setAnimationYear(null); return; }
    const { min, max } = timeRange;
    setAnimationYear(min - 1);
    const duration = 3000;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const currentYear = min + progress * (max - min);
      if (progress >= 1) {
        setAnimationYear(null);
      } else {
        setAnimationYear(currentYear);
        animationRef.current = requestAnimationFrame(step);
      }
    };
    animationRef.current = requestAnimationFrame(step);
  }, [predictionTimeline, timeRange]);

  // IntersectionObserver to trigger animation on first view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          startAnimation();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startAnimation]);

  // Cleanup animation on unmount
  useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

  // Data bounds (full extent)
  const dataBounds = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    for (const p of timelinePredictions) {
      // X-axis: use fractional years from dates for precision
      const dates = [p.predicted_date_low, p.predicted_date_best, p.predicted_date_high].filter(Boolean) as string[];
      for (const d of dates) {
        const fy = dateToFractionalYear(d);
        if (fy < xMin) xMin = fy;
        if (fy > xMax) xMax = fy;
      }
      // Y-axis: fractional year when prediction was made
      const predFY = dateToFractionalYear(p.prediction_date);
      if (!isNaN(predFY)) {
        if (predFY < yMin) yMin = predFY;
        if (predFY > yMax) yMax = predFY;
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

  // Compute vertical offsets for overlapping points
  const overlapOffsets = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const p of timelinePredictions) {
      if (p.predicted_year_best === null) continue;
      // Round to nearest quarter-year for overlap grouping
      const predFY = dateToFractionalYear(p.prediction_date);
      const bestFY = p.predicted_date_best ? dateToFractionalYear(p.predicted_date_best) : p.predicted_year_best;
      const key = `${Math.round(bestFY * 4) / 4}:${Math.round(predFY * 4) / 4}`;
      const group = groups.get(key);
      if (group) group.push(p.id);
      else groups.set(key, [p.id]);
    }
    const offsets = new Map<number, number>();
    for (const ids of groups.values()) {
      if (ids.length <= 1) continue;
      const spacing = POINT_RADIUS * 1.5;
      const totalHeight = (ids.length - 1) * spacing;
      for (let i = 0; i < ids.length; i++) {
        offsets.set(ids[i]!, -totalHeight / 2 + i * spacing);
      }
    }
    return offsets;
  }, [timelinePredictions]);

  // Sort predictions: farthest predicted date first (rendered first = behind),
  // nearest predicted date last (rendered last = on top, easier to hover)
  const sortedPredictions = useMemo(() => {
    return [...timelinePredictions].sort((a, b) => {
      const aYear = a.predicted_year_best ?? 9999;
      const bYear = b.predicted_year_best ?? 9999;
      return bYear - aYear; // descending = farthest first
    });
  }, [timelinePredictions]);

  const currentYear = new Date().getFullYear() + new Date().getMonth() / 12;

  const xTicks = useMemo(() => generateTicks(vp.xMin, vp.xMax), [vp.xMin, vp.xMax]);
  const yTicks = useMemo(() => generateTicks(vp.yMin, vp.yMax), [vp.yMin, vp.yMax]);

  const handleMouseEnter = useCallback((prediction: Prediction, event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let x = event.clientX - rect.left + 10;
    let y = event.clientY - rect.top - 10;

    // Clamp tooltip to stay within container
    if (x + TOOLTIP_WIDTH > rect.width) {
      x = event.clientX - rect.left - TOOLTIP_WIDTH - 10;
    }
    if (x < 0) x = 4;
    if (y + TOOLTIP_HEIGHT_ESTIMATE > rect.height) {
      y = event.clientY - rect.top - TOOLTIP_HEIGHT_ESTIMATE - 10;
    }
    if (y < 0) y = 4;

    setHoveredId(prediction.id);
    setTooltip({ prediction, x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
  }, []);

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      if (prev === null) {
        // First click: select only this type
        return new Set([type]);
      }
      if (prev.size === 1 && prev.has(type)) {
        // Clicking the only active type: reset to all
        return null;
      }
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      // If all are now active, reset to null
      if (next.size === ALL_TYPES.length) return null;
      return next;
    });
  }, []);

  const isTypeActive = useCallback((type: string): boolean => {
    if (activeTypes === null) return true;
    return activeTypes.has(canonicalType(type));
  }, [activeTypes]);

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
      if (newXRange < 2 || newYRange < 2 || newXRange > 500 || newYRange > 500) return;

      setViewport(clampViewport({
        xMin: yearAtCursorX - fx * newXRange,
        xMax: yearAtCursorX + (1 - fx) * newXRange,
        yMin: yearAtCursorY - fy * newYRange,
        yMax: yearAtCursorY + (1 - fy) * newYRange,
      }, dataBounds));
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [svgWidth, svgHeight, vp, dataBounds]);

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

    setViewport(clampViewport({
      xMin: pv.xMin - xShift,
      xMax: pv.xMax - xShift,
      yMin: pv.yMin + yShift, // inverted Y
      yMax: pv.yMax + yShift,
    }, dataBounds));
  }, [svgWidth, svgHeight, dataBounds]);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Double-click to reset
  const onDoubleClick = useCallback(() => {
    setViewport({ ...dataBounds });
  }, [dataBounds]);

  return (
    <div className="relative bg-(--bg-card) border border-[#ffffff08] rounded-xl p-4 overflow-hidden" ref={containerRef}>
      {/* Legend — clickable to filter */}
      <div className="flex flex-wrap gap-3 justify-center mb-3 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => {
          const isActive = activeTypes === null || activeTypes.has(type);
          return (
            <button
              key={type}
              className="flex items-center gap-1 cursor-pointer transition-opacity duration-150"
              style={{ opacity: isActive ? 1 : 0.3 }}
              onClick={() => toggleType(type)}
            >
              <span
                className="size-2 rounded-full shrink-0 transition-colors duration-150"
                style={{ backgroundColor: isActive ? color : "#555568" }}
              />
              <span style={{ color: isActive ? "var(--text-muted)" : "var(--text-dim)" }}>
                {type}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-stretch">
        <svg
          ref={resizeRef}
          className="w-full h-auto block flex-1 min-w-0"
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

          {/* y=x diagonal — "predicted for when it was made" */}
          <line
            x1={xScale(vp.yMin, svgWidth)}
            y1={yScale(vp.yMin)}
            x2={xScale(vp.yMax, svgWidth)}
            y2={yScale(vp.yMax)}
            stroke="#ffffff30"
            strokeWidth={1}
            strokeDasharray="4 4"
            clipPath="url(#chart-clip)"
          />

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

          {/* Layer 1: Range lines (behind everything) */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions.map((p) => {
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              if (!p.predicted_date_low || !p.predicted_date_high) return null;
              const cyBase = yScale(predictionFY);
              const cy = cyBase + (overlapOffsets.get(p.id) ?? 0);
              const active = isTypeActive(p.prediction_type);
              const color = active ? getTypeColor(p.prediction_type) : "#333340";
              const isSelected = p.id === selectedId;
              const opacity = active ? (isSelected ? 0.5 : 0.3) : 0.1;

              return (
                <line
                  key={`range-${p.id}`}
                  x1={xScale(dateToFractionalYear(p.predicted_date_low), svgWidth)}
                  y1={cy}
                  x2={xScale(dateToFractionalYear(p.predicted_date_high), svgWidth)}
                  y2={cy}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  opacity={opacity}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Layer 2: Dots (sorted so nearest-date renders last = on top) */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions.map((p) => {
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              const bestFY = p.predicted_date_best ? dateToFractionalYear(p.predicted_date_best) : p.predicted_year_best!;
              const cx = xScale(bestFY, svgWidth);
              const cyBase = yScale(predictionFY);
              const cy = cyBase + (overlapOffsets.get(p.id) ?? 0);
              const active = isTypeActive(p.prediction_type);
              const color = active ? getTypeColor(p.prediction_type) : "#333340";
              const isSelected = p.id === selectedId;
              const isHovered = p.id === hoveredId;

              // Selected dot rendered separately on top
              if (isSelected) return null;

              if (!active) {
                return (
                  <circle
                    key={`dot-${p.id}`}
                    cx={cx}
                    cy={cy}
                    r={POINT_RADIUS}
                    fill={color}
                    opacity={0.15}
                  />
                );
              }

              return (
                <circle
                  key={`dot-${p.id}`}
                  cx={cx}
                  cy={cy}
                  r={POINT_RADIUS}
                  fill={color}
                  opacity={isHovered ? 1 : 0.7}
                  stroke={isHovered ? "#fff" : "none"}
                  strokeWidth={isHovered ? 1.5 : 0}
                />
              );
            })}
          </g>

          {/* Selected dot (rendered on top of all other dots) */}
          <g clipPath="url(#chart-clip)">
            {(() => {
              const p = sortedPredictions.find((p) => p.id === selectedId);
              if (!p) return null;
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              const bestFY = p.predicted_date_best ? dateToFractionalYear(p.predicted_date_best) : p.predicted_year_best!;
              const cx = xScale(bestFY, svgWidth);
              const cy = yScale(predictionFY) + (overlapOffsets.get(p.id) ?? 0);
              const color = getTypeColor(p.prediction_type);
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={POINT_RADIUS + 2}
                  fill={color}
                  opacity={1}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })()}
          </g>

          {/* Layer 3: Invisible hit areas — sorted by SVG y ascending so
              lower-on-screen items render last and are hoverable.
              Use smaller hit radius for stacked items so they don't overlap. */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions
              .filter((p) => {
                if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return false;
                if (isNaN(dateToFractionalYear(p.prediction_date))) return false;
                return isTypeActive(p.prediction_type);
              })
              .map((p) => {
                const predictionFY = dateToFractionalYear(p.prediction_date);
                const bestFY = p.predicted_date_best ? dateToFractionalYear(p.predicted_date_best) : p.predicted_year_best!;
                const cx = xScale(bestFY, svgWidth);
                const cyBase = yScale(predictionFY);
                const cy = cyBase + (overlapOffsets.get(p.id) ?? 0);
                const isStacked = overlapOffsets.has(p.id);
                return { p, cx, cy, isStacked };
              })
              // Sort by cy ascending: top-of-screen first, bottom-of-screen last.
              // In SVG, later elements are on top, so bottom items will be hoverable.
              .sort((a, b) => a.cy - b.cy)
              .map(({ p, cx, cy, isStacked }) => (
                <circle
                  key={`hit-${p.id}`}
                  className="timeline-row"
                  cx={cx}
                  cy={cy}
                  r={isStacked ? POINT_RADIUS + 2 : 12}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelect(p.id)}
                  onMouseEnter={(e) => handleMouseEnter(p, e)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-center gap-3 mt-1.5">
        <span className="text-[0.65rem] text-(--text-dim) opacity-50 select-none">Scroll to zoom · Drag to pan · Double-click to reset · Click legend to filter</span>
        <button
          className="text-[0.65rem] text-(--text-dim) opacity-50 hover:opacity-80 cursor-pointer transition-opacity select-none"
          onClick={startAnimation}
        >
          ↻ Replay
        </button>
      </div>

      {tooltip && <TimelineTooltip prediction={tooltip.prediction} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
