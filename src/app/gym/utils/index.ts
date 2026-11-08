import { PER_OPTIONS, UNIT_LABELS } from "../constants";
import type { GymLogExercise, Per } from "../types";
import { isSetFilled } from "./logDraft";

export * from "./units";
export * from "./logDraft";

/** Generate a unique ID using crypto.randomUUID or a fallback. */
export const generateId = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 12);

/** Key used to decide whether two exercise names refer to the same exercise (case-insensitive). */
export const exerciseNameKey = (name: string): string => name.toLowerCase();

// ============================================================================
// Dates
// ============================================================================

/** Convert a Date to a local ISO date string (YYYY-MM-DD). */
export const toLocalISODate = (d: Date): string =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const todayISO = (): string => toLocalISODate(new Date());

export const lastMonthISO = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toLocalISODate(d);
};

/** Format a local ISO date (YYYY-MM-DD) without timezone shifts. */
export const formatISODate = (iso: string | null | undefined): string => {
    if (!iso) return "-";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatDate = (ts: number | null | undefined): string =>
    ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";

export const formatTime = (ts?: number | null): string =>
    ts
        ? new Date(ts).toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "-";

export const formatDuration = (start?: number | null, end?: number | null): string => {
    if (!start || !end) return "-";
    const mins = Math.max(0, Math.round((end - start) / 60000));
    return `${mins} min`;
};

export const formatRemaining = (ms?: number | null): string => {
    if (ms === null || ms === undefined) return "-";
    if (ms <= 0) return "expired";
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

// ============================================================================
// Labels
// ============================================================================

export const perLabel = (per: Per | null | undefined): string =>
    PER_OPTIONS.find((p) => p.value === per)?.label ?? "";

export const unitLabel = (unit: string | null | undefined): string => (unit ? UNIT_LABELS[unit] ?? unit : "");

// ============================================================================
// Exercise status
// ============================================================================

export type ExerciseStatusLabel = "Completed" | "Partial" | "Unattempted";

export interface ExerciseStatus {
    label: ExerciseStatusLabel;
    filled: number;
    total: number;
    textColor: string;
    bgColor: string;
    rowColor: string;
}

export const getExerciseStatus = (exercise: GymLogExercise): ExerciseStatus => {
    const total = exercise.sets.length;
    const filled = exercise.sets.filter((s) => isSetFilled(s)).length;
    if (total > 0 && filled === total) {
        return {
            label: "Completed", filled, total,
            textColor: "text-emerald-300", bgColor: "bg-emerald-300", rowColor: "bg-emerald-900/30 border-emerald-700/50",
        };
    }
    if (filled > 0) {
        return {
            label: "Partial", filled, total,
            textColor: "text-orange-300", bgColor: "bg-orange-300", rowColor: "bg-orange-900/30 border-orange-700/50",
        };
    }
    return {
        label: "Unattempted", filled, total,
        textColor: "text-rose-300", bgColor: "bg-rose-300", rowColor: "bg-slate-900/60 border-slate-700",
    };
};

// ============================================================================
// Muscle group colors
// ============================================================================

const GROUP_PALETTE = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-lime-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-indigo-500",
];

/** Assigns a stable color per muscle group, in order of first appearance. */
export const buildGroupColors = (groups: (string | null | undefined)[]): ((group?: string | null) => string) => {
    const colors: Record<string, string> = {};
    groups.forEach((g) => {
        const key = g?.toLowerCase().trim();
        if (key && !colors[key]) colors[key] = GROUP_PALETTE[Object.keys(colors).length % GROUP_PALETTE.length];
    });
    return (group) => colors[group?.toLowerCase().trim() ?? ""] ?? "bg-slate-600";
};

// ============================================================================
// Browser helpers
// ============================================================================

export const openExerciseSearch = (name: string, muscle?: string | null): void => {
    if (typeof window === "undefined") return;
    const query = encodeURIComponent(`${muscle ? `${muscle}: ` : ""}${name}`.trim());
    const url = `https://www.google.com/search?q=${query}`;
    const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = url;
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
    }
};

export const exportToJsonFile = (data: unknown, filename: string): void => {
    if (typeof window === "undefined") return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const confirmAction = (message: string): boolean =>
    typeof window === "undefined" ? true : window.confirm(message);
