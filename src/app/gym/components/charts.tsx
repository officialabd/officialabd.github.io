"use client";

/**
 * Small dependency-free SVG/HTML charts for the Stats tab, styled for the app's dark surface.
 * Series colors are a validated categorical order (blue, orange, aqua) — assign them in order.
 */
import { useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70"] as const;

const INK = { grid: "#1e293b", axis: "#334155", muted: "#94a3b8", surface: "#070d1c" };

/** Width of an element, kept up to date on resize. */
function useWidth<T extends HTMLElement>() {
    const [element, setElement] = useState<T | null>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);
    return { ref: setElement, width };
}

/** Round tick values covering [min, max]. */
const niceTicks = (min: number, max: number, count = 4): number[] => {
    if (min === max) {
        const pad = Math.abs(min) * 0.1 || 1;
        min -= pad;
        max += pad;
    }
    const raw = (max - min) / count;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= raw) ?? 10) * magnitude;
    const ticks: number[] = [];
    for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step + step / 2; v += step) {
        ticks.push(Number(v.toPrecision(12)));
    }
    return ticks;
};

const shortDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
    const flip = x > width - 180;
    return (
        <div
            className="pointer-events-none absolute z-10 min-w-[8rem] rounded-lg border border-slate-700 bg-slate-950/95 px-2.5 py-1.5 text-xs text-slate-300 shadow-xl"
            style={{ top: Math.max(0, y - 10), ...(flip ? { right: width - x + 12 } : { left: x + 12 }) }}
        >
            {children}
        </div>
    );
}

/** Legend row; `kind` mirrors the mark (line key for lines, square for fills). */
export function Legend({ items, kind = "line" }: { items: { label: string; color: string }[]; kind?: "line" | "box" }) {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
            {items.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                    <span
                        className={kind === "line" ? "h-0.5 w-3 rounded-full" : "h-2.5 w-2.5 rounded-sm"}
                        style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                </span>
            ))}
        </div>
    );
}

// ============================================================================
// Line chart (time on x)
// ============================================================================

export interface LinePoint {
    /** Milliseconds (a date). */
    x: number;
    y: number;
    /** Drawn as a marker, e.g. a personal record. */
    marked?: boolean;
}

export interface LineSeries {
    label: string;
    color: string;
    points: LinePoint[];
}

interface LineChartProps {
    series: LineSeries[];
    formatY: (value: number) => string;
    /** Horizontal reference line, e.g. a target. */
    reference?: { y: number; label: string };
    /** Extra tooltip lines for the hovered date. */
    describe?: (x: number) => ReactNode;
    height?: number;
    ariaLabel: string;
}

const MARGIN = { top: 12, right: 16, bottom: 24, left: 48 };

export function LineChart({ series, formatY, reference, describe, height = 220, ariaLabel }: LineChartProps) {
    const { ref, width } = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const xs = useMemo(
        () => Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.x)))).sort((a, b) => a - b),
        [series]
    );
    const ys = series.flatMap((s) => s.points.map((p) => p.y)).concat(reference ? [reference.y] : []);
    if (xs.length === 0) return null;

    const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
    const innerH = height - MARGIN.top - MARGIN.bottom;
    const yTicks = niceTicks(Math.min(...ys), Math.max(...ys));
    const [yMin, yMax] = [yTicks[0], yTicks[yTicks.length - 1]];
    const [xMin, xMax] = xs.length > 1 ? [xs[0], xs[xs.length - 1]] : [xs[0] - 86400000, xs[0] + 86400000];
    const sx = (x: number) => MARGIN.left + ((x - xMin) / (xMax - xMin)) * innerW;
    const sy = (y: number) => MARGIN.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

    const xTickCount = Math.max(2, Math.min(6, Math.floor(innerW / 90)));
    const xTicks = Array.from({ length: xTickCount }, (_, i) => xMin + ((xMax - xMin) * i) / (xTickCount - 1));

    const hoverX = hover !== null ? xs[hover] : null;

    const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const target = xMin + ((e.clientX - box.left) / box.width) * (xMax - xMin);
        let nearest = 0;
        xs.forEach((x, i) => {
            if (Math.abs(x - target) < Math.abs(xs[nearest] - target)) nearest = i;
        });
        setHover(nearest);
    };

    const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const step = e.key === "ArrowRight" ? 1 : -1;
        setHover((h) => Math.min(xs.length - 1, Math.max(0, (h ?? (step > 0 ? -1 : xs.length)) + step)));
    };

    return (
        <div className="space-y-2">
            {series.length > 1 && <Legend items={series} />}
            <div ref={ref} className="relative w-full" style={{ height }}>
                {width > 0 && (
                    <svg
                        width={width}
                        height={height}
                        role="img"
                        aria-label={ariaLabel}
                        tabIndex={0}
                        onKeyDown={onKeyDown}
                        onBlur={() => setHover(null)}
                        className="focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                    >
                        {yTicks.map((t) => (
                            <g key={t}>
                                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={sy(t)} y2={sy(t)} stroke={INK.grid} />
                                <text x={MARGIN.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK.muted} className="tabular-nums">
                                    {formatY(t)}
                                </text>
                            </g>
                        ))}
                        <line x1={MARGIN.left} x2={width - MARGIN.right} y1={MARGIN.top + innerH} y2={MARGIN.top + innerH} stroke={INK.axis} />
                        {xTicks.map((t, i) => (
                            <text
                                key={t}
                                x={sx(t)}
                                y={height - 6}
                                fontSize={11}
                                fill={INK.muted}
                                textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
                            >
                                {shortDate(t)}
                            </text>
                        ))}

                        {reference && (
                            <g>
                                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={sy(reference.y)} y2={sy(reference.y)} stroke={INK.muted} strokeWidth={1} />
                                <text x={width - MARGIN.right} y={sy(reference.y) - 4} textAnchor="end" fontSize={11} fill={INK.muted}>
                                    {reference.label}
                                </text>
                            </g>
                        )}

                        {series.map((s) => {
                            const pts = [...s.points].sort((a, b) => a.x - b.x);
                            const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.y)}`).join("");
                            const last = pts[pts.length - 1];
                            return (
                                <g key={s.label}>
                                    <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                                    {pts
                                        .filter((p) => p.marked || p === last)
                                        .map((p) => (
                                            <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={s.color} stroke={INK.surface} strokeWidth={2} />
                                        ))}
                                </g>
                            );
                        })}

                        {hoverX !== null && (
                            <g>
                                <line x1={sx(hoverX)} x2={sx(hoverX)} y1={MARGIN.top} y2={MARGIN.top + innerH} stroke={INK.muted} strokeWidth={1} />
                                {series.map((s) =>
                                    s.points
                                        .filter((p) => p.x === hoverX)
                                        .map((p) => (
                                            <circle key={s.label} cx={sx(p.x)} cy={sy(p.y)} r={5} fill={s.color} stroke={INK.surface} strokeWidth={2} />
                                        ))
                                )}
                            </g>
                        )}

                        <rect
                            x={MARGIN.left}
                            y={MARGIN.top}
                            width={innerW}
                            height={innerH}
                            fill="transparent"
                            onPointerMove={onPointerMove}
                            onPointerLeave={() => setHover(null)}
                        />
                    </svg>
                )}
                {hoverX !== null && (
                    <Tooltip x={sx(hoverX)} y={MARGIN.top} width={width}>
                        <div className="mb-1 text-slate-400">{new Date(hoverX).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
                        {series.map((s) => {
                            const p = s.points.find((pt) => pt.x === hoverX);
                            return (
                                p && (
                                    <div key={s.label} className="flex items-center gap-2">
                                        <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                                        <span className="font-semibold text-slate-100 tabular-nums">{formatY(p.y)}</span>
                                        <span className="text-slate-400">
                                            {s.label}
                                            {p.marked ? " · PR" : ""}
                                        </span>
                                    </div>
                                )
                            );
                        })}
                        {describe?.(hoverX)}
                    </Tooltip>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Calendar heatmap (weeks as columns, Monday first)
// ============================================================================

const HEAT_STEPS = ["#1e293b", "#1c5cab", "#3987e5", "#86b6ef"];
const heatColor = (count: number) => HEAT_STEPS[Math.min(count, HEAT_STEPS.length - 1)];

interface CalendarHeatmapProps {
    /** Monday of every week to show, oldest first. */
    weeks: string[];
    count: (date: string) => number;
    describe: (date: string) => ReactNode;
    addDays: (iso: string, days: number) => string;
    today: string;
}

const CELL_GAP = 2;
const DAY_LABEL_W = 26;

export function CalendarHeatmap({ weeks, count, describe, addDays, today }: CalendarHeatmapProps) {
    const { ref, width } = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<{ date: string; x: number; y: number } | null>(null);

    // Show as many recent weeks as fit at a readable cell size.
    const cell = 12;
    const fit = Math.max(1, Math.floor((width - DAY_LABEL_W) / (cell + CELL_GAP)));
    const shown = weeks.slice(-fit);
    const top = 16;
    const height = top + 7 * (cell + CELL_GAP);

    return (
        <div className="space-y-2">
            <div ref={ref} className="relative w-full" style={{ height }}>
                {width > 0 && (
                    <svg width={width} height={height} role="img" aria-label="Training days calendar">
                        {["Mon", "Wed", "Fri"].map((label, i) => (
                            <text key={label} x={0} y={top + (i * 2 + 0.5) * (cell + CELL_GAP)} dy="0.32em" fontSize={10} fill={INK.muted}>
                                {label}
                            </text>
                        ))}
                        {shown.map((week, col) => {
                            const x = DAY_LABEL_W + col * (cell + CELL_GAP);
                            const newMonth = col === 0 || week.slice(5, 7) !== shown[col - 1].slice(5, 7);
                            return (
                                <g key={week}>
                                    {newMonth && col < shown.length - 2 && (
                                        <text x={x} y={10} fontSize={10} fill={INK.muted}>
                                            {new Date(`${week}T00:00`).toLocaleDateString("en-US", { month: "short" })}
                                        </text>
                                    )}
                                    {Array.from({ length: 7 }, (_, row) => {
                                        const date = addDays(week, row);
                                        if (date > today) return null;
                                        const y = top + row * (cell + CELL_GAP);
                                        const n = count(date);
                                        return (
                                            <rect
                                                key={date}
                                                x={x}
                                                y={y}
                                                width={cell}
                                                height={cell}
                                                rx={2}
                                                fill={heatColor(n)}
                                                stroke={hover?.date === date ? "#e2e8f0" : "none"}
                                                onPointerEnter={() => setHover({ date, x: x + cell, y })}
                                                onPointerLeave={() => setHover(null)}
                                            >
                                                <title>{`${date}: ${n} session${n === 1 ? "" : "s"}`}</title>
                                            </rect>
                                        );
                                    })}
                                </g>
                            );
                        })}
                    </svg>
                )}
                {hover && (
                    <Tooltip x={hover.x} y={hover.y} width={width}>
                        {describe(hover.date)}
                    </Tooltip>
                )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                Less
                {HEAT_STEPS.map((c) => (
                    <span key={c} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />
                ))}
                More
            </div>
        </div>
    );
}

// ============================================================================
// Horizontal bars with an optional target band
// ============================================================================

interface BarRow {
    key: string;
    label: string;
    value: number;
    detail?: string;
}

export function BarList({
    rows,
    formatValue,
    band,
    color = SERIES_COLORS[0],
}: {
    rows: BarRow[];
    formatValue: (value: number) => string;
    /** Shaded value range, e.g. a recommended range. */
    band?: { from: number; to: number; label: string };
    color?: string;
}) {
    const max = Math.max(...rows.map((r) => r.value), band?.to ?? 0) * 1.08 || 1;
    const pct = (v: number) => `${(v / max) * 100}%`;
    return (
        <div className="space-y-1.5">
            {band && (
                <div className="grid grid-cols-[6.5rem_1fr_3rem] gap-2 text-[11px] text-slate-400">
                    <span />
                    <div className="relative h-4">
                        <span className="absolute -translate-x-1/2" style={{ left: `calc(${pct((band.from + band.to) / 2)})` }}>
                            {band.label}
                        </span>
                    </div>
                    <span />
                </div>
            )}
            {rows.map((r) => (
                <div key={r.key} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2" title={r.detail}>
                    <span className="truncate text-xs text-slate-300">{r.label}</span>
                    <div className="relative h-4">
                        {band && (
                            <div
                                className="absolute inset-y-0 bg-slate-700/40"
                                style={{ left: pct(band.from), width: `calc(${pct(band.to)} - ${pct(band.from)})` }}
                            />
                        )}
                        <div className="absolute inset-y-0.5 left-0 rounded-r" style={{ width: pct(r.value), backgroundColor: color }} />
                    </div>
                    <span className="text-right text-xs font-semibold text-slate-100 tabular-nums">{formatValue(r.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Segmented bar — one whole split into parts
// ============================================================================

export function SegmentedBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
    const total = parts.reduce((sum, p) => sum + p.value, 0);
    if (total === 0) return null;
    return (
        <div className="space-y-2">
            <div className="flex h-7 w-full gap-0.5" role="img" aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(", ")}>
                {parts.map((p) => {
                    const share = p.value / total;
                    if (share === 0) return null;
                    return (
                        <div
                            key={p.label}
                            className="flex items-center rounded px-2 text-xs font-semibold text-white"
                            style={{ width: `${share * 100}%`, backgroundColor: p.color }}
                            title={`${p.label}: ${p.value} (${Math.round(share * 100)}%)`}
                        >
                            {share >= 0.12 && `${Math.round(share * 100)}%`}
                        </div>
                    );
                })}
            </div>
            <Legend kind="box" items={parts.map((p) => ({ label: `${p.label} (${p.value})`, color: p.color }))} />
        </div>
    );
}
