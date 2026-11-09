import { PER_OPTIONS, UNIT_LABELS } from "../constants";
import type { GymLogExercise, Per } from "../types";
import { isSetFilled } from "./logDraft";

export * from "./units";
export * from "./logDraft";
export * from "./groups";
export * from "./stats";

/** Generate a unique ID using crypto.randomUUID or a fallback. */
export const generateId = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 12);

/** Key used to decide whether two exercise names refer to the same exercise (case-insensitive). */
export const exerciseNameKey = (name: string): string => name.toLowerCase();

/** Name as stored: trimmed, with runs of spaces collapsed. */
export const cleanName = (name: string): string => name.trim().replace(/\s+/g, " ");

/** Lowercase letters and digits only, without a plural "s" — "Sit-ups" and "situp" compare equal. */
const looseKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

/** Levenshtein distance, stopping early once it exceeds `max`. */
const editDistance = (a: string, b: string, max: number): number => {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const row = [i];
        for (let j = 1; j <= b.length; j++) {
            row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        if (Math.min(...row) > max) return max + 1;
        prev = row;
    }
    return prev[b.length];
};

/**
 * Existing names that look like the same exercise as `name` (typo, spacing, punctuation or plural),
 * excluding exact case-insensitive matches, which are rejected separately.
 */
export const similarNames = (name: string, existing: string[]): string[] => {
    const key = looseKey(name);
    if (key.length < 3) return [];
    const exact = exerciseNameKey(cleanName(name));
    return existing.filter((other) => {
        if (exerciseNameKey(other) === exact) return false;
        const otherKey = looseKey(other);
        return otherKey === key || (Math.min(key.length, otherKey.length) >= 5 && editDistance(key, otherKey, 2) <= 2);
    });
};

// ============================================================================
// Dates
// ============================================================================

/** Convert a Date to a local ISO date string (YYYY-MM-DD). */
export const toLocalISODate = (d: Date): string =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const todayISO = (): string => toLocalISODate(new Date());

/** Format a local ISO date (YYYY-MM-DD) without timezone shifts. */
export const formatISODate = (iso: string | null | undefined): string => {
    if (!iso) return "-";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatDate = (ts: number | null | undefined): string =>
    ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";

/** Month, day and time without the year, e.g. "Nov 8, 6:42 PM". */
export const formatShortDateTime = (ts?: number | null): string =>
    ts
        ? new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
        : "-";

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

export type ExerciseStatusLabel = "Completed" | "Partial" | "Unattempted" | "Skipped";

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
    const filled = exercise.sets.filter((s) => isSetFilled(s, exercise)).length;
    if (exercise.skipped) {
        return {
            label: "Skipped", filled, total,
            textColor: "text-slate-400", bgColor: "bg-slate-400", rowColor: "bg-slate-900/60 border-slate-700 opacity-60",
        };
    }
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
// Browser helpers
// ============================================================================

export const openExerciseSearch = (name: string, muscle?: string): void => {
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
