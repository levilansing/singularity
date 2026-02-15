import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { PredictionSlim } from "../data/types";
import { dateToFractionalYear } from "../data/types";
import { TimelineTooltip } from "./TimelineTooltip";

interface TimelineProps {
  predictions: PredictionSlim[];
  selectedId: number;
  onSelect: (id: number) => void;
}

const PADDING_LEFT = 60;
const PADDING_RIGHT_DEFAULT = 30;
const PADDING_RIGHT_MOBILE = 10;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 50;
const POINT_RADIUS = 5;
const CHART_HEIGHT_MAX = 400;
const CHART_HEIGHT_MIN = 220;
const ZOOM_FACTOR = 0.1;

import { TYPE_HEX, TYPE_LEGEND_ORDER, canonicalType, getTypeHex } from "../data/colors";

const ALL_TYPES = TYPE_LEGEND_ORDER;

function getTypeColor(type: string): string {
  return getTypeHex(type);
}

/** Pick a nice tick step for a given year range */
function tickStep(range: number): number {
  if (range <= 20) return 1;
  if (range <= 40) return 2;
  if (range <= 80) return 5;
  if (range <= 160) return 10;
  if (range <= 320) return 20;
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

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT_ESTIMATE = 120;

export function Timeline({ predictions, selectedId, onSelect }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ prediction: PredictionSlim; x: number; y: number } | null>(null);
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

  // SVG sizing — must be declared before viewport logic that depends on svgWidth
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

  // Responsive chart height: scale linearly between min/max based on width
  const chartHeight = Math.round(Math.min(CHART_HEIGHT_MAX, Math.max(CHART_HEIGHT_MIN, svgWidth * 0.45)));
  const PADDING_RIGHT = svgWidth < 500 ? PADDING_RIGHT_MOBILE : PADDING_RIGHT_DEFAULT;

  // Viewport state (the currently visible range)
  const [viewport, setViewport] = useState<{ xMin: number; xMax: number; yMin: number; yMax: number } | null>(null);

  const svgHeight = PADDING_TOP + chartHeight + PADDING_BOTTOM;
  const nowYear = new Date().getFullYear() + new Date().getMonth() / 12;

  // Compute the max x-range allowed for a given svgWidth to maintain ≤2:1 x:y
  // years-per-pixel ratio. When the chart is narrow, this shrinks the x-range.
  const getMaxXRange = useCallback((width: number) => {
    const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
    const yRange = dataBounds.yMax - dataBounds.yMin;
    const yPerPx = yRange / chartHeight;
    // Max 2x the y density on x-axis
    return 2 * yPerPx * plotWidth;
  }, [dataBounds, chartHeight, PADDING_RIGHT]);

  // Build a viewport centered on "now" that respects the 2:1 ratio constraint
  const getConstrainedViewport = useCallback((width: number) => {
    const maxXRange = getMaxXRange(width);
    const dataXRange = dataBounds.xMax - dataBounds.xMin;
    const xRange = Math.min(dataXRange, maxXRange);

    // Center on nowYear, but clamp so we don't show empty space past data bounds
    let xMin = nowYear - xRange / 2;
    let xMax = nowYear + xRange / 2;
    // Clamp to data bounds
    if (xMin < dataBounds.xMin) { xMin = dataBounds.xMin; xMax = xMin + xRange; }
    if (xMax > dataBounds.xMax) { xMax = dataBounds.xMax; xMin = xMax - xRange; }

    return { xMin, xMax, yMin: dataBounds.yMin, yMax: dataBounds.yMax };
  }, [dataBounds, getMaxXRange, nowYear]);

  // Initialize viewport
  useEffect(() => {
    setViewport(getConstrainedViewport(svgWidth));
  }, [dataBounds]); // only on data change, not every svgWidth change

  // When svgWidth changes, enforce the ratio constraint on the current viewport.
  // Re-center on "now" if the current x-range exceeds the max allowed.
  useEffect(() => {
    setViewport((prev) => {
      if (!prev) return getConstrainedViewport(svgWidth);
      const maxXRange = getMaxXRange(svgWidth);
      const currentXRange = prev.xMax - prev.xMin;
      if (currentXRange <= maxXRange) return prev; // ratio is fine, keep user's viewport

      // Current viewport is too wide for this screen width — shrink centered on "now"
      let xMin = nowYear - maxXRange / 2;
      let xMax = nowYear + maxXRange / 2;
      if (xMin < dataBounds.xMin) { xMin = dataBounds.xMin; xMax = xMin + maxXRange; }
      if (xMax > dataBounds.xMax) { xMax = dataBounds.xMax; xMin = xMax - maxXRange; }
      return { ...prev, xMin, xMax };
    });
  }, [svgWidth, getMaxXRange, getConstrainedViewport, dataBounds, nowYear]);

  const vp = viewport ?? dataBounds;

  const xScale = useCallback(
    (year: number, width: number) => {
      const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
      return PADDING_LEFT + ((year - vp.xMin) / (vp.xMax - vp.xMin)) * plotWidth;
    },
    [vp.xMin, vp.xMax]
  );

  const yScale = useCallback(
    (year: number) => {
      return PADDING_TOP + chartHeight - ((year - vp.yMin) / (vp.yMax - vp.yMin)) * chartHeight;
    },
    [vp.yMin, vp.yMax, chartHeight]
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

  const handleMouseEnter = useCallback((prediction: PredictionSlim, event: React.MouseEvent) => {
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

  const toggleType = useCallback((type: string, shiftKey: boolean) => {
    setActiveTypes((prev) => {
      if (shiftKey) {
        // Shift-click: toggle individual item
        const next = new Set(prev ?? ALL_TYPES);
        if (next.has(type)) next.delete(type); else next.add(type);
        if (next.size === 0 || next.size === ALL_TYPES.length) return null;
        return next;
      }
      // Normal click: select only this one, or deselect if it's the only one
      if (prev !== null && prev.size === 1 && prev.has(type)) return null;
      return new Set([type]);
    });
  }, []);

  const isTypeActive = useCallback((type: string): boolean => {
    if (activeTypes === null) return true;
    return activeTypes.has(canonicalType(type));
  }, [activeTypes]);

  // Zoom handler — wheel on desktop only, pinch handled via pointer events
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // On mobile/touch, skip wheel listener so users can scroll past the chart
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const onWheel = (e: WheelEvent) => {
      const rect = svg.getBoundingClientRect();
      // Only zoom when cursor is in the plot area
      const scaleXCheck = svgWidth / rect.width;
      const scaleYCheck = svgHeight / rect.height;
      const checkX = (e.clientX - rect.left) * scaleXCheck;
      const checkY = (e.clientY - rect.top) * scaleYCheck;
      if (
        checkX < PADDING_LEFT ||
        checkX > svgWidth - PADDING_RIGHT ||
        checkY < PADDING_TOP ||
        checkY > PADDING_TOP + chartHeight
      ) return;
      e.preventDefault();
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
      const yearAtCursorY = vp.yMin + ((PADDING_TOP + chartHeight - svgY) / chartHeight) * (vp.yMax - vp.yMin);

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

    // Prevent default browser pinch-zoom when two fingers are on the chart
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };

    if (!isMobile) {
      svg.addEventListener("wheel", onWheel, { passive: false });
    }
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("touchmove", onTouchMove);
    };
  }, [svgWidth, svgHeight, vp, dataBounds]);

  // Pan handler (drag) — mouse: single pointer, touch: two fingers
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vp: vp });

  // Track active pointers for multi-touch gestures
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; vp: { xMin: number; xMax: number; yMin: number; yMax: number }; cx: number; cy: number } | null>(null);
  const isTouchDevice = useRef(false);

  const isInPlotArea = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return false;
    const rect = svg.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    return (
      svgX >= PADDING_LEFT &&
      svgX <= svgWidth - PADDING_RIGHT &&
      svgY >= PADDING_TOP &&
      svgY <= PADDING_TOP + chartHeight
    );
  }, [svgWidth, svgHeight]);

  const getTwoFingerCenter = useCallback(() => {
    const ptrs = Array.from(activePointers.current.values());
    if (ptrs.length < 2) return null;
    return { x: (ptrs[0]!.x + ptrs[1]!.x) / 2, y: (ptrs[0]!.y + ptrs[1]!.y) / 2 };
  }, []);

  const getTwoFingerDist = useCallback(() => {
    const ptrs = Array.from(activePointers.current.values());
    if (ptrs.length < 2) return 0;
    const dx = ptrs[0]!.x - ptrs[1]!.x;
    const dy = ptrs[0]!.y - ptrs[1]!.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan on background clicks (not on data points), and only in the plot area
    if ((e.target as SVGElement).closest(".timeline-row")) return;
    if (!isInPlotArea(e.clientX, e.clientY)) return;

    if (e.pointerType === "touch") isTouchDevice.current = true;

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as SVGElement).setPointerCapture(e.pointerId);

    // Touch: need 2 fingers to start pan/pinch
    if (e.pointerType === "touch") {
      // Clear stale pointers — if we have more than 2 after adding this one,
      // something wasn't cleaned up. Keep only the two most recent.
      if (activePointers.current.size > 2) {
        const entries = Array.from(activePointers.current.entries());
        activePointers.current.clear();
        for (const [id, pos] of entries.slice(-2)) {
          activePointers.current.set(id, pos);
        }
      }

      if (activePointers.current.size === 2) {
        // Start two-finger gesture
        isPanning.current = true;
        const center = getTwoFingerCenter()!;
        panStart.current = { x: center.x, y: center.y, vp: { ...vp } };
        pinchStart.current = {
          dist: getTwoFingerDist(),
          vp: { ...vp },
          cx: center.x,
          cy: center.y,
        };
      }
      return;
    }

    // Mouse: single pointer pan
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, vp: { ...vp } };
  }, [vp, isInPlotArea, getTwoFingerCenter, getTwoFingerDist]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (!isPanning.current) return;
    const svg = svgRef.current;
    if (!svg) return;

    // Touch: only pan/zoom with two fingers, never with one
    if (e.pointerType === "touch") {
      if (activePointers.current.size < 2) return;

      const rect = svg.getBoundingClientRect();
      const scaleX = svgWidth / rect.width;
      const scaleY = svgHeight / rect.height;

      const center = getTwoFingerCenter()!;
      const dist = getTwoFingerDist();
      const ps = pinchStart.current;
      if (!ps || ps.dist === 0) return;

      const plotWidth = svgWidth - PADDING_LEFT - PADDING_RIGHT;

      // Zoom scale from finger distance change
      const scale = ps.dist / dist; // >1 = zoom out, <1 = zoom in
      const pvPinch = ps.vp;
      const xRange = (pvPinch.xMax - pvPinch.xMin) * scale;
      const yRange = (pvPinch.yMax - pvPinch.yMin) * scale;
      if (xRange < 2 || yRange < 2 || xRange > 500 || yRange > 500) return;

      // Data coordinate that was under the initial midpoint
      const initSvgX = (ps.cx - rect.left) * scaleX;
      const initSvgY = (ps.cy - rect.top) * scaleY;
      const dataX = pvPinch.xMin + ((initSvgX - PADDING_LEFT) / plotWidth) * (pvPinch.xMax - pvPinch.xMin);
      const dataY = pvPinch.yMin + ((PADDING_TOP + chartHeight - initSvgY) / chartHeight) * (pvPinch.yMax - pvPinch.yMin);

      // Current midpoint in SVG coordinates — this is where dataX/dataY should appear
      const curSvgX = (center.x - rect.left) * scaleX;
      const curSvgY = (center.y - rect.top) * scaleY;
      const fx = (curSvgX - PADDING_LEFT) / plotWidth;
      const fy = (PADDING_TOP + chartHeight - curSvgY) / chartHeight;

      // Position viewport so dataX/dataY maps to the current midpoint
      setViewport(clampViewport({
        xMin: dataX - fx * xRange,
        xMax: dataX + (1 - fx) * xRange,
        yMin: dataY - fy * yRange,
        yMax: dataY + (1 - fy) * yRange,
      }, dataBounds));
      return;
    }

    // Mouse pan
    const rect = svg.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const dx = (e.clientX - panStart.current.x) * scaleX;
    const dy = (e.clientY - panStart.current.y) * scaleY;

    const pv = panStart.current.vp;
    const plotWidth = svgWidth - PADDING_LEFT - PADDING_RIGHT;
    const xShift = (dx / plotWidth) * (pv.xMax - pv.xMin);
    const yShift = (dy / chartHeight) * (pv.yMax - pv.yMin);

    setViewport(clampViewport({
      xMin: pv.xMin - xShift,
      xMax: pv.xMax - xShift,
      yMin: pv.yMin + yShift, // inverted Y
      yMax: pv.yMax + yShift,
    }, dataBounds));
  }, [svgWidth, svgHeight, dataBounds, getTwoFingerCenter, getTwoFingerDist]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    // End gesture as soon as we drop below 2 fingers (touch) or 1 (mouse)
    if (e.pointerType === "touch" || activePointers.current.size === 0) {
      isPanning.current = false;
      pinchStart.current = null;
    }
    // Clear all touch pointers when last finger lifts to avoid stale entries
    if (e.pointerType === "touch" && activePointers.current.size === 0) {
      activePointers.current.clear();
    }
  }, []);

  // Double-click to reset
  const onDoubleClick = useCallback(() => {
    setViewport(getConstrainedViewport(svgWidth));
  }, [getConstrainedViewport, svgWidth]);

  return (
    <div className="relative bg-(--bg-card) border border-[#ffffff08] rounded-xl p-4 overflow-hidden max-sm:-mx-3 max-sm:rounded-none max-sm:border-x-0 max-sm:px-2" ref={containerRef}>
      {/* Legend — clickable to filter */}
      <div className="flex flex-wrap gap-3 justify-center mb-3 text-xs">
        {TYPE_LEGEND_ORDER.map((type) => {
          const color = TYPE_HEX[type];
          const isActive = activeTypes === null || activeTypes.has(type);
          return (
            <button
              key={type}
              className="flex items-center gap-1 cursor-pointer transition-opacity duration-150"
              style={{ opacity: isActive ? 1 : 0.3 }}
              onClick={(e) => toggleType(type, e.shiftKey || e.metaKey || e.ctrlKey)}
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
          style={{ touchAction: "pan-y", cursor: "default", userSelect: "none" }}
        >
          {/* Clip path for chart area */}
          <defs>
            <clipPath id="chart-clip">
              <rect x={PADDING_LEFT} y={PADDING_TOP} width={svgWidth - PADDING_LEFT - PADDING_RIGHT} height={chartHeight} />
            </clipPath>
          </defs>

          {/* Plot area background (grab cursor zone) */}
          <rect
            x={PADDING_LEFT}
            y={PADDING_TOP}
            width={svgWidth - PADDING_LEFT - PADDING_RIGHT}
            height={chartHeight}
            fill="transparent"
            style={{ cursor: isPanning.current ? "grabbing" : "grab" }}
          />

          {/* X-axis grid lines & labels */}
          {xTicks.map((year, i) => {
            const x = xScale(year, svgWidth);
            // Estimate label width (~7px per char at fontSize 11) + min gap
            const labelWidth = String(year).length * 7 + 12;
            const tickSpacingPx = xTicks.length > 1
              ? Math.abs(xScale(xTicks[1]!, svgWidth) - xScale(xTicks[0]!, svgWidth))
              : Infinity;
            const showLabel = tickSpacingPx >= labelWidth || i % 2 === 0;
            return (
              <g key={`x-${year}`}>
                <line x1={x} y1={PADDING_TOP} x2={x} y2={PADDING_TOP + chartHeight} stroke="#ffffff10" strokeWidth={1} clipPath="url(#chart-clip)" />
                {showLabel && (
                  <text x={x} y={PADDING_TOP + chartHeight + 20} fill="#ffffff50" fontSize={11} textAnchor="middle" fontFamily="system-ui">
                    {year}
                  </text>
                )}
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
            y={PADDING_TOP + chartHeight / 2}
            fill="#ffffff50"
            fontSize={11}
            textAnchor="middle"
            fontFamily="system-ui"
            style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            transform={`rotate(-90, 14, ${PADDING_TOP + chartHeight / 2})`}
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
                  y2={PADDING_TOP + chartHeight}
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

          {/* Layer 1a: Inactive range lines (filtered-out, behind everything) */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions.map((p) => {
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              if (!p.predicted_date_low || !p.predicted_date_high) return null;
              if (isTypeActive(p.prediction_type)) return null;
              const cy = yScale(predictionFY) + (overlapOffsets.get(p.id) ?? 0);
              return (
                <line
                  key={`range-${p.id}`}
                  x1={xScale(dateToFractionalYear(p.predicted_date_low), svgWidth)}
                  y1={cy}
                  x2={xScale(dateToFractionalYear(p.predicted_date_high), svgWidth)}
                  y2={cy}
                  stroke="#333340"
                  strokeWidth={2}
                  opacity={0.1}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Layer 1b: Inactive dots (filtered-out, behind active) */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions.map((p) => {
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              if (isTypeActive(p.prediction_type)) return null;
              const bestFY = p.predicted_date_best ? dateToFractionalYear(p.predicted_date_best) : p.predicted_year_best!;
              const cx = xScale(bestFY, svgWidth);
              const cy = yScale(predictionFY) + (overlapOffsets.get(p.id) ?? 0);
              return (
                <circle
                  key={`dot-${p.id}`}
                  cx={cx}
                  cy={cy}
                  r={POINT_RADIUS}
                  fill="#333340"
                  opacity={0.15}
                />
              );
            })}
          </g>

          {/* Layer 2a: Active range lines */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions.map((p) => {
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              if (!p.predicted_date_low || !p.predicted_date_high) return null;
              if (!isTypeActive(p.prediction_type)) return null;
              const cy = yScale(predictionFY) + (overlapOffsets.get(p.id) ?? 0);
              const isSelected = p.id === selectedId;
              return (
                <line
                  key={`range-${p.id}`}
                  x1={xScale(dateToFractionalYear(p.predicted_date_low), svgWidth)}
                  y1={cy}
                  x2={xScale(dateToFractionalYear(p.predicted_date_high), svgWidth)}
                  y2={cy}
                  stroke={getTypeColor(p.prediction_type)}
                  strokeWidth={isSelected ? 3 : 2}
                  opacity={isSelected ? 0.5 : 0.3}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Layer 2b: Active dots (on top of inactive) */}
          <g clipPath="url(#chart-clip)">
            {sortedPredictions.map((p) => {
              if (visibleIdSet !== null && !visibleIdSet.has(p.id)) return null;
              const predictionFY = dateToFractionalYear(p.prediction_date);
              if (isNaN(predictionFY)) return null;
              if (!isTypeActive(p.prediction_type)) return null;
              if (p.id === selectedId) return null;
              const bestFY = p.predicted_date_best ? dateToFractionalYear(p.predicted_date_best) : p.predicted_year_best!;
              const cx = xScale(bestFY, svgWidth);
              const cy = yScale(predictionFY) + (overlapOffsets.get(p.id) ?? 0);
              const isHovered = p.id === hoveredId;
              return (
                <circle
                  key={`dot-${p.id}`}
                  cx={cx}
                  cy={cy}
                  r={POINT_RADIUS}
                  fill={getTypeColor(p.prediction_type)}
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
              const active = isTypeActive(p.prediction_type);
              const color = active ? getTypeColor(p.prediction_type) : "#333340";
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={POINT_RADIUS + 2}
                  fill={color}
                  opacity={active ? 1 : 0.3}
                  stroke={active ? "#fff" : "#555"}
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
        <span className="text-[0.65rem] text-(--text-dim) opacity-50 select-none hidden sm:inline">Scroll to zoom · Drag to pan · Double-click to reset · Click legend to filter</span>
        <span className="text-[0.65rem] text-(--text-dim) opacity-50 select-none sm:hidden">Two fingers to pan & zoom · Double-tap to reset</span>
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
