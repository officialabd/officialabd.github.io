import { create } from "zustand";
import { DEFAULT_LOGS_DAYS, MIN_DAY_LOGS } from "../constants";
import type { GymLogEntry, LogDraft, LogsFilter } from "../types";
import * as gymService from "../services/gymService";
import { addDays, normalizeLogExercise, todayISO } from "../utils";
import { requireUid } from "./authStore";
import { useSessionStore } from "./sessionStore";

interface LogsState {
    logs: GymLogEntry[];
    filter: LogsFilter;
    /**
     * Showing the default view of a running session's day: older sessions are added when the
     * last 30 days have fewer than MIN_DAY_LOGS. A filter set by the user always shows exact results.
     */
    padToMinimum: boolean;
    isLoading: boolean;
    error: string | null;
    /** True when older sessions outside the date range were added to reach the minimum. */
    extendedBeyondRange: boolean;

    /**
     * Default view when the tab is opened: with a running session, that day's sessions of the
     * last 30 days (at least MIN_DAY_LOGS); otherwise every session of the last 30 days.
     */
    showDefault: () => Promise<void>;
    /** Change the filter (exact results) and reload. */
    setFilter: (partial: Partial<LogsFilter>) => Promise<void>;
    load: () => Promise<void>;
    saveLog: (log: GymLogEntry, draft: LogDraft) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
    clear: () => void;
}

const recentFilter = (planId = "", dayId = ""): LogsFilter => {
    const to = todayISO();
    return { from: addDays(to, -DEFAULT_LOGS_DAYS), to, planId, dayId };
};

const inRange = (log: GymLogEntry, { from, to }: LogsFilter) => (!from || log.date >= from) && (!to || log.date <= to);

/** Logs matching the filter, optionally topped up with the latest older sessions of the day. */
async function queryLogs(uid: string, filter: LogsFilter, padToMinimum: boolean): Promise<{ logs: GymLogEntry[]; extended: boolean }> {
    if (!filter.planId && !filter.dayId) {
        return { logs: await gymService.fetchLogsInRange(uid, filter.from, filter.to), extended: false };
    }
    const matching = filter.dayId
        ? await gymService.fetchLogsByDay(uid, filter.dayId)
        : await gymService.fetchLogsByPlan(uid, filter.planId);
    const ranged = matching.filter((l) => inRange(l, filter));
    if (!padToMinimum || ranged.length >= MIN_DAY_LOGS) return { logs: ranged, extended: false };

    const merged = new Map([...ranged, ...matching.slice(0, MIN_DAY_LOGS)].map((l) => [l.id, l]));
    const logs = gymService.sortLogsDesc(Array.from(merged.values()));
    return { logs, extended: logs.length > ranged.length };
}

const initialState = {
    logs: [] as GymLogEntry[],
    filter: recentFilter(),
    padToMinimum: false,
    isLoading: false,
    error: null as string | null,
    extendedBeyondRange: false,
};

export const useLogsStore = create<LogsState>((set, get) => ({
    ...initialState,

    showDefault: () => {
        const { draft, planId, dayId } = useSessionStore.getState();
        const running = draft?.status === "running";
        set({ filter: running ? recentFilter(planId, dayId) : recentFilter(), padToMinimum: running });
        return get().load();
    },

    setFilter: (partial) => {
        set({ filter: { ...get().filter, ...partial }, padToMinimum: false });
        return get().load();
    },

    load: async () => {
        const { filter, padToMinimum } = get();
        set({ isLoading: true, error: null });
        try {
            const { logs, extended } = await queryLogs(requireUid(), filter, padToMinimum);
            // Ignore stale responses if the filter changed while loading.
            if (get().filter !== filter) return;
            set({ logs, extendedBeyondRange: extended });
        } catch (err) {
            console.error("Failed to load logs", err);
            set({ error: "Could not load logs. Please try again." });
        } finally {
            if (get().filter === filter) set({ isLoading: false });
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

    clear: () => set({ ...initialState, filter: recentFilter() }),
}));
