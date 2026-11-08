import { create } from "zustand";
import { AUTOSAVE_DELAY_MS, STALE_SESSION_MS } from "../constants";
import type { GymPlan, GymPlanDay, LogDraft, SaveState } from "../types";
import * as gymService from "../services/gymService";
import {
    buildDraftFromDay,
    buildDraftFromPreviousSession,
    buildDraftWithPreviousValues,
    normalizeLogExercise,
    todayISO,
} from "../utils";
import { requireUid } from "./authStore";
import { useExercisesStore } from "./exercisesStore";
import { usePlansStore } from "./plansStore";
import { useProfileStore } from "./profileStore";

export type PrefillMode = "values" | "session";

interface SessionState {
    planId: string;
    dayId: string;
    draft: LogDraft | null;
    /** Firestore ID of the log once the session has been saved. */
    logId: string | null;
    createdAt: number | null;
    saveState: SaveState;
    isBusy: boolean;
    isLoadingRunning: boolean;
    /** Describes where pre-filled values came from, shown to the user. */
    prefill: { mode: PrefillMode; date: string } | null;
    prefillMessage: string | null;
    /** Last save time of a running session found idle for too long at load; null when not stale. */
    staleSince: number | null;
    /** The user picked the gym of this session; otherwise a not-started draft follows the default gym. */
    gymChosen: boolean;

    selectPlan: (planId: string) => void;
    selectDay: (dayId: string) => void;
    /** Rebuild the not-yet-started draft from the current plan day. */
    resetDraft: () => void;
    loadPrevious: (mode: PrefillMode) => Promise<void>;
    loadRunning: () => Promise<boolean>;

    /** Pick the gym of the session (overrides the default gym). */
    setGym: (gym: string | null) => void;
    /** Put the profile's default gym on a not-started draft, unless the user picked one. */
    applyDefaultGym: () => void;
    /** Apply a change to the draft. Running sessions are auto-saved. */
    update: (updater: (draft: LogDraft) => LogDraft) => void;
    start: () => Promise<void>;
    /** Finish the running session, at `completedAt` (default: now). */
    complete: (completedAt?: number) => Promise<void>;
    /** Keep a stale session running and hide the prompt. */
    dismissStale: () => void;
    cancel: () => Promise<void>;
    /** Save pending changes immediately (e.g. when the tab is hidden). */
    flush: () => Promise<void>;
    clear: () => void;
}

const initialState = {
    planId: "",
    dayId: "",
    draft: null as LogDraft | null,
    logId: null as string | null,
    createdAt: null as number | null,
    saveState: "idle" as SaveState,
    isBusy: false,
    isLoadingRunning: false,
    prefill: null as SessionState["prefill"],
    prefillMessage: null as string | null,
    staleSince: null as number | null,
    gymChosen: false,
};

const isRunning = (draft: LogDraft | null) => draft?.status === "running";

export const useSessionStore = create<SessionState>((set, get) => {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    /** Serializes writes so a create can never race with an update. */
    let writeQueue: Promise<unknown> = Promise.resolve();

    const cancelTimer = () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = null;
    };

    const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
        const run = writeQueue.then(task, task);
        writeQueue = run.catch(() => undefined);
        return run;
    };

    /** Write the latest draft (create on first save, update afterwards). */
    const persist = (overrides: Partial<LogDraft> = {}) =>
        enqueue(async () => {
            const { draft, logId, createdAt } = get();
            if (!draft) return;
            const uid = requireUid();
            const payload: LogDraft = {
                ...draft,
                ...overrides,
                exercises: draft.exercises.map(normalizeLogExercise),
            };
            if (logId && createdAt) {
                await gymService.updateLog(uid, logId, payload, createdAt);
            } else {
                const created = await gymService.createLog(uid, payload);
                set({ logId: created.id, createdAt: created.createdAt });
            }
        });

    const autosave = async () => {
        cancelTimer();
        set({ saveState: "saving" });
        try {
            await persist();
            // Another edit may have scheduled a newer save meanwhile.
            if (!saveTimer) set({ saveState: "saved" });
        } catch (err) {
            console.error("Autosave failed", err);
            set({ saveState: "error" });
        }
    };

    const currentPlanDay = (): { plan: GymPlan; day: GymPlanDay } | null => {
        const { planId, dayId } = get();
        const plan = usePlansStore.getState().plans.find((p) => p.id === planId);
        const day = plan?.days.find((d) => d.id === dayId);
        return plan && day ? { plan, day } : null;
    };

    /** The date carries over from the current draft (today for a first draft); the gym is the default unless picked. */
    const draftContext = () => {
        const { draft, gymChosen } = get();
        return {
            date: draft?.date ?? todayISO(),
            gym: draft && gymChosen ? draft.gym : useProfileStore.getState().profile.defaultGym,
        };
    };

    const freshDraft = (): LogDraft | null => {
        const current = currentPlanDay();
        if (!current) return null;
        const { date, gym } = draftContext();
        return { ...buildDraftFromDay(current.plan, current.day, useExercisesStore.getState().byId, date), gym };
    };

    const resetAfterSession = () => {
        // The next session starts from the default gym again.
        set({ gymChosen: false });
        set({
            draft: freshDraft(),
            logId: null,
            createdAt: null,
            saveState: "idle",
            prefill: null,
            prefillMessage: null,
            staleSince: null,
        });
    };

    return {
        ...initialState,

        selectPlan: (planId) => {
            if (isRunning(get().draft)) return;
            const plan = usePlansStore.getState().plans.find((p) => p.id === planId);
            set({ planId, dayId: plan?.days[0]?.id ?? "", prefill: null, prefillMessage: null });
            get().resetDraft();
        },

        selectDay: (dayId) => {
            if (isRunning(get().draft)) return;
            set({ dayId, prefill: null, prefillMessage: null });
            get().resetDraft();
        },

        resetDraft: () => {
            if (isRunning(get().draft)) return;
            set({ draft: freshDraft(), prefill: null, prefillMessage: null });
        },

        loadPrevious: async (mode) => {
            const current = currentPlanDay();
            if (!current || isRunning(get().draft)) return;
            set({ isBusy: true, prefillMessage: null });
            try {
                const previous = await gymService.fetchLastCompletedLog(requireUid(), current.day.id);
                if (!previous) {
                    set({ prefillMessage: `No completed "${current.day.title}" session found yet.` });
                    return;
                }
                const library = useExercisesStore.getState().byId;
                const { date, gym } = draftContext();
                const draft =
                    mode === "values"
                        ? buildDraftWithPreviousValues(current.plan, current.day, library, previous, date)
                        : buildDraftFromPreviousSession(current.plan, current.day, library, previous, date);
                set({ draft: { ...draft, gym }, prefill: { mode, date: previous.date } });
            } finally {
                set({ isBusy: false });
            }
        },

        loadRunning: async () => {
            set({ isLoadingRunning: true });
            try {
                const running = await gymService.fetchRunningLog(requireUid());
                if (!running) return false;
                const { id, createdAt, updatedAt, ...draft } = running;
                set({
                    planId: running.planId,
                    dayId: running.dayId,
                    draft,
                    logId: id,
                    createdAt,
                    saveState: "saved",
                    prefill: null,
                    prefillMessage: null,
                    staleSince: Date.now() - updatedAt > STALE_SESSION_MS ? updatedAt : null,
                });
                return true;
            } finally {
                set({ isLoadingRunning: false });
            }
        },

        setGym: (gym) => {
            set({ gymChosen: true });
            get().update((d) => ({ ...d, gym }));
        },

        applyDefaultGym: () => {
            const { draft, gymChosen } = get();
            if (!draft || isRunning(draft) || gymChosen) return;
            const gym = useProfileStore.getState().profile.defaultGym;
            if (draft.gym !== gym) set({ draft: { ...draft, gym } });
        },

        update: (updater) => {
            const { draft } = get();
            if (!draft) return;
            set({ draft: updater(draft) });
            if (!isRunning(draft)) return;
            cancelTimer();
            set({ saveState: "saving" });
            saveTimer = setTimeout(autosave, AUTOSAVE_DELAY_MS);
        },

        start: async () => {
            const { draft } = get();
            if (!draft || draft.status) return;
            set({ draft: { ...draft, status: "running", startedAt: Date.now() } });
            await autosave();
        },

        flush: async () => {
            if (saveTimer || get().saveState === "error") await autosave();
        },

        complete: async (completedAt = Date.now()) => {
            if (!isRunning(get().draft)) return;
            cancelTimer();
            set({ isBusy: true, saveState: "saving" });
            try {
                await persist({ status: "completed", completedAt });
                resetAfterSession();
            } catch (err) {
                console.error("Failed to complete session", err);
                set({ saveState: "error" });
            } finally {
                set({ isBusy: false });
            }
        },

        cancel: async () => {
            if (!isRunning(get().draft)) return;
            cancelTimer();
            set({ isBusy: true });
            try {
                await writeQueue;
                const { logId } = get();
                if (logId) await enqueue(() => gymService.deleteLog(requireUid(), logId));
                resetAfterSession();
            } finally {
                set({ isBusy: false });
            }
        },

        dismissStale: () => set({ staleSince: null }),

        clear: () => {
            cancelTimer();
            set({ ...initialState });
        },
    };
});
