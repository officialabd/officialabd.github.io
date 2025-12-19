import type { GymSet, ExerciseStatus, SetType } from "../types";

/**
 * Generate a unique ID using crypto.randomUUID or fallback
 */
export const generateId = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10);

/**
 * Convert a Date to local ISO date string (YYYY-MM-DD)
 */
export const toLocalISODate = (d: Date): string =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/**
 * Get today's date in ISO format
 */
export const todayISO = (): string => toLocalISODate(new Date());

/**
 * Get date from one month ago in ISO format
 */
export const lastMonthISO = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toLocalISODate(d);
};

/**
 * Format a timestamp to a readable date/time string
 */
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

/**
 * Calculate and format duration between two timestamps
 */
export const formatDuration = (start?: number | null, end?: number | null): string => {
    if (!start || !end) return "-";
    const mins = Math.max(0, Math.round((end - start) / 60000));
    return `${mins} min`;
};

/**
 * Format remaining time in human-readable format
 */
export const formatRemaining = (ms?: number | null): string => {
    if (ms === null || ms === undefined) return "-";
    if (ms <= 0) return "expired";
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
};

/**
 * Ensure an array of sets has exactly the specified count
 */
export const ensureSetCount = (count: number, existing: GymSet[]): GymSet[] => {
    const safe = Math.max(0, count);
    const next = [...existing];
    if (next.length < safe) {
        while (next.length < safe) {
            next.push({ weight: null, reps: null, time: null, completed: false });
        }
    } else if (next.length > safe) {
        next.length = safe;
    }
    return next;
};

/**
 * Get the completion status of an exercise based on its sets
 */
export const getExerciseStatus = (sets: GymSet[], setType?: SetType): ExerciseStatus => {
    const total = sets?.length ?? 0;
    const filled = (sets ?? []).filter((s) => {
        if (!s) return false;
        if (setType === "time") {
            return s.time !== null && s.time !== undefined;
        }
        return s.weight !== null && s.weight !== undefined;
    }).length;

    if (total > 0 && filled === total) {
        return { label: "Completed", color: "text-emerald-300" };
    }
    if (filled > 0) {
        return { label: "Partial", color: "text-orange-300" };
    }
    return { label: "Unattempted", color: "text-rose-300" };
};

/**
 * Open Google search for an exercise
 */
export const openExerciseSearch = (name: string, muscle?: string | null): void => {
    if (typeof window === "undefined") return;
    const query = encodeURIComponent(`${muscle ? `${muscle}: ` : ""}${name}`.trim());
    const url = `https://www.google.com/search?q=${query}`;
    const isMobile =
        typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = url;
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
    }
};

/**
 * Export data to a JSON file and trigger download
 */
export const exportToJsonFile = (data: unknown, filename: string): void => {
    if (typeof window === "undefined") return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fullFilename = `${filename}-${timestamp}.json`;
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = fullFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
