import type { GymLogEntry, LogsFilter } from "../types";

/** Newest session first: by session date, then by creation time. */
export const sortLogsDesc = (logs: GymLogEntry[]): GymLogEntry[] =>
    [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

const inRange = (log: GymLogEntry, { from, to }: LogsFilter) => (!from || log.date >= from) && (!to || log.date <= to);

/**
 * Logs matching the filter, from a newest-first list. With `padTo`, when fewer than that many sessions
 * fall in the date range, the latest older sessions of the same plan/day are added (`extended`).
 */
export const selectLogs = (
    all: GymLogEntry[],
    filter: LogsFilter,
    padTo = 0
): { logs: GymLogEntry[]; extended: boolean } => {
    const matching = all.filter((l) => (!filter.planId || l.planId === filter.planId) && (!filter.dayId || l.dayId === filter.dayId));
    const ranged = matching.filter((l) => inRange(l, filter));
    if (ranged.length >= padTo) return { logs: ranged, extended: false };
    const ids = new Set(ranged.map((l) => l.id));
    const extra = matching.slice(0, padTo).filter((l) => !ids.has(l.id));
    if (extra.length === 0) return { logs: ranged, extended: false };
    return { logs: sortLogsDesc([...ranged, ...extra]), extended: true };
};
