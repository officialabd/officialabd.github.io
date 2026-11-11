import { create } from "zustand";
import { DEFAULT_LOGS_DAYS, MIN_DAY_LOGS } from "../constants";
import type { GymLogEntry, LogDraft, LogsFilter } from "../types";
import * as gymService from "../services/gymService";
import { addDays, normalizeLogExercise, selectLogs, sortLogsDesc, todayISO } from "../utils";
import { requireUid } from "./authStore";

/**
 * Whether logs from `from` onwards are all in the cache.
 * `coveredFrom`: null = nothing loaded, "" = everything; `from` "" = everything.
 */
export const coversFrom = (coveredFrom: string | null, from: string): boolean =>
    coveredFrom === "" || (coveredFrom !== null && from !== "" && coveredFrom <= from);

interface LogsState {
    /**
     * Logs downloaded so far, newest first. Only the dates that were needed are downloaded
     * (Logs: its date range, Stats: its period); the Logs and Stats tabs filter this cache.
     */
    cache: GymLogEntry[];
    /** Every log dated on/after this is in the cache: null = nothing yet, "" = all logs. */
    coveredFrom: string | null;
    filter: LogsFilter;
    /** Default view of a running session's day: top up to MIN_DAY_LOGS with older sessions. */
    padToMinimum: boolean;
    /** Logs shown in the Logs tab (derived from the cache and the filter). */
    logs: GymLogEntry[];
    /** True when older sessions outside the date range were added to reach the minimum. */
    extendedBeyondRange: boolean;
    isLoading: boolean;
    error: string | null;

    /** Make sure every log dated on/after `from` is cached ("" = all logs). */
    ensureFrom: (from: string) => Promise<void>;
    /** Download the cached range again (Refresh). */
    reload: () => Promise<void>;
    /**
     * Default Logs view when the tab is opened: with a running session (its plan/day), that day's
     * sessions of the last 30 days (at least MIN_DAY_LOGS); otherwise every session of the last 30 days.
     */
    showDefault: (running: { planId: string; dayId: string } | null) => Promise<void>;
    /** Change the filter; results are exact (no padding). */
    setFilter: (partial: Partial<LogsFilter>) => Promise<void>;
    /** Add or replace a log in the cache (after a session save). */
    upsert: (log: GymLogEntry) => void;
    /** Drop a log from the cache (after a delete). */
    remove: (logId: string) => void;
    /**
     * Most recent completed session of a plan day. Looks in recent logs first (cached and shared
     * with the Logs tab); only when none is recent enough is the day's full history fetched.
     */
    lastCompleted: (dayId: string) => Promise<GymLogEntry | null>;
    saveLog: (log: GymLogEntry, draft: LogDraft) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
    clear: () => void;
}

/** "Load previous" first looks this far back before fetching a day's whole history. */
const RECENT_LOOKUP_DAYS = 60;

const recentFilter = (planId = "", dayId = ""): LogsFilter => {
    const to = todayISO();
    return { from: addDays(to, -DEFAULT_LOGS_DAYS), to, planId, dayId };
};

const initialState = () => ({
    cache: [] as GymLogEntry[],
    coveredFrom: null as string | null,
    filter: recentFilter(),
    padToMinimum: false,
    logs: [] as GymLogEntry[],
    extendedBeyondRange: false,
    isLoading: false,
    error: null as string | null,
});

export const useLogsStore = create<LogsState>((set, get) => {
    /** Downloads run one after another, so each one sees the coverage left by the previous. */
    let queue: Promise<unknown> = Promise.resolve();
    /** Bumped by reset(): downloads started before it are ignored. */
    let generation = 0;
    /** Downloads of the current generation still running. */
    let active = 0;
    /** Plan days whose full history was fetched to top up the default view. */
    let paddedDays = new Set<string>();

    const reset = () => {
        generation++;
        active = 0;
        paddedDays = new Set();
    };

    /** Recompute the Logs tab list from the cache and filter. */
    const apply = () => {
        const { cache, filter, padToMinimum } = get();
        const { logs, extended } = selectLogs(cache, filter, padToMinimum ? MIN_DAY_LOGS : 0);
        set({ logs, extendedBeyondRange: extended });
    };

    const merge = (logs: GymLogEntry[]) => {
        const byId = new Map(get().cache.map((l) => [l.id, l]));
        logs.forEach((l) => byId.set(l.id, l));
        set({ cache: sortLogsDesc(Array.from(byId.values())) });
        apply();
    };

    /** Queue a download; skipped when `isNeeded` is false by the time it runs. */
    const download = (isNeeded: () => boolean, fetch: (uid: string) => Promise<void>) => {
        const gen = generation;
        const run = async () => {
            if (gen !== generation || !isNeeded()) return;
            active++;
            set({ isLoading: true, error: null });
            try {
                await fetch(requireUid());
            } catch (err) {
                console.error("Failed to load logs", err);
                if (gen === generation) set({ error: "Could not load your sessions. Please try again." });
            } finally {
                if (gen === generation) {
                    active--;
                    set({ isLoading: active > 0 });
                }
            }
        };
        const task = queue.then(run);
        queue = task.catch(() => undefined);
        return task;
    };

    const ensureFrom = (from: string) =>
        download(
            () => !coversFrom(get().coveredFrom, from),
            async (uid) => {
                const gen = generation;
                // Only the missing part: from `from` up to where the cache already starts.
                const logs = await gymService.fetchLogsBetween(uid, from, get().coveredFrom || null);
                if (gen !== generation) return;
                merge(logs);
                set({ coveredFrom: from });
            }
        );

    /** For the running session's default view: fetch the day's older sessions if fewer than the minimum are cached. */
    const padDay = (dayId: string) =>
        download(
            () => get().padToMinimum && !paddedDays.has(dayId) && get().logs.length < MIN_DAY_LOGS,
            async (uid) => {
                const gen = generation;
                const logs = await gymService.fetchLogsByDay(uid, dayId);
                if (gen !== generation) return;
                paddedDays.add(dayId);
                merge(logs);
            }
        );

    /** Load what the current Logs filter needs. */
    const loadForFilter = async () => {
        const { filter, padToMinimum } = get();
        await ensureFrom(filter.from);
        if (padToMinimum && filter.dayId) await padDay(filter.dayId);
    };

    return {
        ...initialState(),

        ensureFrom,

        reload: async () => {
            const { coveredFrom, filter } = get();
            const target = coveredFrom ?? filter.from;
            reset();
            set({ cache: [], coveredFrom: null, isLoading: false, error: null });
            apply();
            await ensureFrom(target);
            if (get().padToMinimum && get().filter.dayId) await padDay(get().filter.dayId);
        },

        showDefault: (running) => {
            set({ filter: running ? recentFilter(running.planId, running.dayId) : recentFilter(), padToMinimum: !!running });
            apply();
            return loadForFilter();
        },

        setFilter: (partial) => {
            set({ filter: { ...get().filter, ...partial }, padToMinimum: false });
            apply();
            return loadForFilter();
        },

        upsert: (log) => merge([log]),

        lastCompleted: async (dayId) => {
            const find = () => get().cache.find((l) => l.dayId === dayId && l.status === "completed") ?? null;
            await ensureFrom(addDays(todayISO(), -RECENT_LOOKUP_DAYS));
            if (find() || paddedDays.has(dayId)) return find();
            const gen = generation;
            const logs = await gymService.fetchLogsByDay(requireUid(), dayId);
            if (gen === generation) {
                paddedDays.add(dayId);
                merge(logs);
            }
            return find();
        },

        remove: (logId) => {
            set({ cache: get().cache.filter((l) => l.id !== logId) });
            apply();
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
            reset();
            set(initialState());
        },
    };
});
