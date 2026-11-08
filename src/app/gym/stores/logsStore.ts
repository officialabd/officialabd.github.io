import { create } from "zustand";
import { MIN_DAY_LOGS } from "../constants";
import type { GymLogEntry, LogDraft, LogsFilter } from "../types";
import * as gymService from "../services/gymService";
import { lastMonthISO, normalizeLogExercise, todayISO } from "../utils";
import { requireUid } from "./authStore";

interface LogsState {
    logs: GymLogEntry[];
    filter: LogsFilter;
    isLoading: boolean;
    error: string | null;
    /** True when older sessions outside the date range were added to reach the minimum. */
    extendedBeyondRange: boolean;

    setFilter: (partial: Partial<LogsFilter>) => void;
    /** Point the filter at a plan day (used when a session starts). */
    focusDay: (planId: string, dayId: string) => void;
    load: () => Promise<void>;
    saveLog: (log: GymLogEntry, draft: LogDraft) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
    clear: () => void;
}

const defaultFilter = (): LogsFilter => ({ from: lastMonthISO(), to: todayISO(), planId: "", dayId: "" });

const inRange = (log: GymLogEntry, { from, to }: LogsFilter) => (!from || log.date >= from) && (!to || log.date <= to);

/**
 * Logs matching the filter. When fewer than MIN_DAY_LOGS sessions fall in the date range,
 * the most recent matching sessions are added so a rarely trained day still shows history.
 */
async function queryLogs(uid: string, filter: LogsFilter): Promise<{ logs: GymLogEntry[]; extended: boolean }> {
    let matching: GymLogEntry[] | null = null;
    let ranged: GymLogEntry[];

    if (filter.dayId) {
        matching = await gymService.fetchLogsByDay(uid, filter.dayId);
        ranged = matching.filter((l) => inRange(l, filter));
    } else if (filter.planId) {
        matching = await gymService.fetchLogsByPlan(uid, filter.planId);
        ranged = matching.filter((l) => inRange(l, filter));
    } else {
        ranged = await gymService.fetchLogsInRange(uid, filter.from, filter.to);
    }

    if (ranged.length >= MIN_DAY_LOGS) return { logs: ranged, extended: false };

    const latest = matching?.slice(0, MIN_DAY_LOGS) ?? (await gymService.fetchLatestLogs(uid, MIN_DAY_LOGS));
    const merged = new Map([...ranged, ...latest].map((l) => [l.id, l]));
    const logs = gymService.sortLogsDesc(Array.from(merged.values()));
    return { logs, extended: logs.length > ranged.length };
}

export const useLogsStore = create<LogsState>((set, get) => ({
    logs: [],
    filter: defaultFilter(),
    isLoading: false,
    error: null,
    extendedBeyondRange: false,

    setFilter: (partial) => set({ filter: { ...get().filter, ...partial } }),

    focusDay: (planId, dayId) => set({ filter: { ...get().filter, planId, dayId } }),

    load: async () => {
        const filter = get().filter;
        set({ isLoading: true, error: null });
        try {
            const { logs, extended } = await queryLogs(requireUid(), filter);
            // Ignore stale responses if the filter changed while loading.
            if (get().filter !== filter) return;
            set({ logs, extendedBeyondRange: extended });
        } catch (err) {
            console.error("Failed to load logs", err);
            set({ error: "Could not load logs. Please try again." });
        } finally {
            set({ isLoading: false });
        }
    },

    saveLog: async (log, draft) => {
        const normalized: LogDraft = { ...draft, exercises: draft.exercises.map(normalizeLogExercise) };
        const saved = await gymService.updateLog(requireUid(), log.id, normalized, log.createdAt);
        set({ logs: gymService.sortLogsDesc(get().logs.map((l) => (l.id === log.id ? saved : l))) });
    },

    deleteLog: async (logId) => {
        await gymService.deleteLog(requireUid(), logId);
        set({ logs: get().logs.filter((l) => l.id !== logId) });
    },

    clear: () => set({ logs: [], filter: defaultFilter(), isLoading: false, error: null, extendedBeyondRange: false }),
}));
