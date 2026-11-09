import { create } from "zustand";
import { DEFAULT_LOGS_DAYS, MIN_DAY_LOGS } from "../constants";
import type { GymLogEntry, LogDraft, LogsFilter } from "../types";
import * as gymService from "../services/gymService";
import { addDays, normalizeLogExercise, selectLogs, sortLogsDesc, todayISO } from "../utils";
import { requireUid } from "./authStore";

interface LogsState {
    /**
     * Every log of the account, newest first, downloaded once per app load (null until then).
     * The Logs and Stats tabs filter it on the device; writes update it in place.
     */
    all: GymLogEntry[] | null;
    filter: LogsFilter;
    /** Default view of a running session's day: top up to MIN_DAY_LOGS with older sessions. */
    padToMinimum: boolean;
    /** Logs shown in the Logs tab (derived from `all` and the filter). */
    logs: GymLogEntry[];
    /** True when older sessions outside the date range were added to reach the minimum. */
    extendedBeyondRange: boolean;
    isLoading: boolean;
    error: string | null;

    /** Download all logs unless already loaded (or loading). */
    ensureLoaded: () => Promise<void>;
    /** Download all logs again (Refresh). */
    reload: () => Promise<void>;
    /**
     * Default Logs view when the tab is opened: with a running session (its plan/day), that day's
     * sessions of the last 30 days (at least MIN_DAY_LOGS); otherwise every session of the last 30 days.
     */
    showDefault: (running: { planId: string; dayId: string } | null) => Promise<void>;
    /** Change the filter; results are exact (no padding). */
    setFilter: (partial: Partial<LogsFilter>) => void;
    /** Add or replace a log in the cache (after a session save). */
    upsert: (log: GymLogEntry) => void;
    /** Drop a log from the cache (after a delete). */
    remove: (logId: string) => void;
    saveLog: (log: GymLogEntry, draft: LogDraft) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
    clear: () => void;
}

const recentFilter = (planId = "", dayId = ""): LogsFilter => {
    const to = todayISO();
    return { from: addDays(to, -DEFAULT_LOGS_DAYS), to, planId, dayId };
};

const initialState = () => ({
    all: null as GymLogEntry[] | null,
    filter: recentFilter(),
    padToMinimum: false,
    logs: [] as GymLogEntry[],
    extendedBeyondRange: false,
    isLoading: false,
    error: null as string | null,
});

export const useLogsStore = create<LogsState>((set, get) => {
    /** Shared in-flight download, so concurrent callers wait for the same request. */
    let pending: Promise<void> | null = null;
    /** Bumped by clear(): a download started for a previous account/state is ignored. */
    let generation = 0;

    /** Recompute the Logs tab list from the cache and filter. */
    const apply = () => {
        const { all, filter, padToMinimum } = get();
        const { logs, extended } = selectLogs(all ?? [], filter, padToMinimum ? MIN_DAY_LOGS : 0);
        set({ logs, extendedBeyondRange: extended });
    };

    const setAll = (all: GymLogEntry[]) => {
        set({ all: sortLogsDesc(all) });
        apply();
    };

    const download = () => {
        pending ??= (async () => {
            const gen = generation;
            set({ isLoading: true, error: null });
            try {
                const all = await gymService.fetchAllLogs(requireUid());
                if (gen === generation) setAll(all);
            } catch (err) {
                console.error("Failed to load logs", err);
                if (gen === generation) set({ error: "Could not load your sessions. Please try again." });
            } finally {
                if (gen === generation) {
                    set({ isLoading: false });
                    pending = null;
                }
            }
        })();
        return pending;
    };

    return {
        ...initialState(),

        ensureLoaded: () => (get().all ? Promise.resolve() : download()),

        reload: download,

        showDefault: (running) => {
            set({ filter: running ? recentFilter(running.planId, running.dayId) : recentFilter(), padToMinimum: !!running });
            apply();
            return get().ensureLoaded();
        },

        setFilter: (partial) => {
            set({ filter: { ...get().filter, ...partial }, padToMinimum: false });
            apply();
        },

        upsert: (log) => {
            const { all } = get();
            if (all) setAll([...all.filter((l) => l.id !== log.id), log]);
        },

        remove: (logId) => {
            const { all } = get();
            if (all) setAll(all.filter((l) => l.id !== logId));
        },

        saveLog: async (log, draft) => {
            const normalized: LogDraft = { ...draft, exercises: draft.exercises.map(normalizeLogExercise) };
            get().upsert(await gymService.updateLog(requireUid(), log.id, normalized, log.createdAt));
        },

        deleteLog: async (logId) => {
            await gymService.deleteLog(requireUid(), logId);
            get().remove(logId);
        },

        clear: () => {
            generation++;
            pending = null;
            set(initialState());
        },
    };
});
