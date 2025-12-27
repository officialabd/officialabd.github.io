import { create } from "zustand";
import type { GymPlan, GymPlanDay, GymLogExercise, GymSet, LogDraft, type, Unit } from "../types";
import { todayISO, ensureSetCount } from "../utils";

interface SessionState {
    // Selection
    logPlanId: string;
    logDayId: string;

    // Draft state
    logDraft: LogDraft | null;
    currentLogId: string | null; // ID of saved log for editing
    isSubmitting: boolean;
    isLoadingRunning: boolean;

    // Actions
    setLogPlanId: (id: string) => void;
    setLogDayId: (id: string) => void;
    setLogDraft: (draft: LogDraft | null) => void;
    setCurrentLogId: (id: string | null) => void;
    setSubmitting: (submitting: boolean) => void;
    setLoadingRunning: (loading: boolean) => void;

    // Draft manipulation
    updateLogDraft: (updater: (draft: LogDraft) => LogDraft) => void;
    startSession: () => void;
    updateExerciseSets: (exerciseIndex: number, count: number) => void;
    updateSetValue: (
        exerciseIndex: number,
        setIndex: number,
        field: keyof GymSet,
        value: number | null
    ) => void;
    updateExerciseUnit: (exerciseIndex: number, unit: Unit) => void;
    updateSessionNote: (note: string) => void;

    // Exercise manipulation
    addExercise: (name: string, group: string, type?: type, unit?: Unit) => void;
    removeExercise: (exerciseIndex: number) => void;
    updateExerciseDetails: (exerciseIndex: number, name: string, group: string) => void;
    updateExerciseType: (exerciseIndex: number, type: type, unit: Unit) => void;

    // Initialize draft from plan/day
    initializeFromPlanDay: (plan: GymPlan, day: GymPlanDay, userId: string | null) => void;

    // Load running session from Firestore data
    loadRunningSession: (log: {
        id: string;
        planId: string;
        planTitle: string;
        dayId: string;
        dayTitle: string;
        date: string;
        userId?: string | null;
        exercises: GymLogExercise[];
        note?: string | null;
        startedAt?: number | null;
        completedAt?: number | null;
        status?: "running" | "completed" | null;
    }) => void;

    // Clear session
    clearSession: () => void;
    resetForNewSession: (plan: GymPlan, day: GymPlanDay, userId: string | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
    // Initial state
    logPlanId: "",
    logDayId: "",
    logDraft: null,
    currentLogId: null,
    isSubmitting: false,
    isLoadingRunning: false,

    // Basic setters
    setLogPlanId: (logPlanId) => set({ logPlanId }),
    setLogDayId: (logDayId) => set({ logDayId }),
    setLogDraft: (logDraft) => set({ logDraft }),
    setCurrentLogId: (currentLogId) => set({ currentLogId }),
    setSubmitting: (isSubmitting) => set({ isSubmitting }),
    setLoadingRunning: (isLoadingRunning) => set({ isLoadingRunning }),

    // Update the log draft
    updateLogDraft: (updater) => {
        const { logDraft } = get();
        if (logDraft) {
            set({ logDraft: updater(logDraft) });
        }
        console.log("logDraft", get().logDraft);
    },

    // Start a session (set startedAt and status)
    startSession: () => {
        get().updateLogDraft((draft) => {
            return ({
                ...draft,
                startedAt: draft.startedAt ?? Date.now(),
                status: "running",
            })
        });
        console.log("Session started: ", get().logDraft);

    },

    // Update the number of sets for an exercise
    updateExerciseSets: (exerciseIndex, count) => {
        get().updateLogDraft((draft) => {
            const exercises = [...draft.exercises];
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                sets: ensureSetCount(count, exercises[exerciseIndex].sets),
            };
            return { ...draft, exercises };
        });
    },

    // Update a specific set value
    updateSetValue: (exerciseIndex, setIndex, field, value) => {
        get().updateLogDraft((draft) => {
            const exercises = [...draft.exercises];
            const sets = [...exercises[exerciseIndex].sets];
            sets[setIndex] = { ...sets[setIndex], [field]: value };
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };
            return { ...draft, exercises };
        });
    },

    // Update exercise weight unit
    updateExerciseUnit: (exerciseIndex, unit) => {
        get().updateLogDraft((draft) => {
            const exercises = [...draft.exercises];
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], unit: unit };
            return { ...draft, exercises };
        });
    },

    // Update session note
    updateSessionNote: (note) => {
        get().updateLogDraft((draft) => ({ ...draft, note }));
    },

    // Add a new exercise (optionally specify set type and weight unit)
    addExercise: (name, group, type = "weight", unit = "kg") => {
        get().updateLogDraft((draft) => {
            const newExercise: GymLogExercise = {
                name,
                group: group || undefined,
                type,
                unit,
                completed: null,
                sets: ensureSetCount(3, []),
            };
            return { ...draft, exercises: [...draft.exercises, newExercise] };
        });
    },

    // Remove an exercise
    removeExercise: (exerciseIndex) => {
        get().updateLogDraft((draft) => {
            const exercises = draft.exercises.filter((_, idx) => idx !== exerciseIndex);
            return { ...draft, exercises };
        });
    },

    // Update exercise name and muscle group
    updateExerciseDetails: (exerciseIndex, name, group) => {
        get().updateLogDraft((draft) => {
            const exercises = [...draft.exercises];
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                name,
                group: group || undefined,
            };
            return { ...draft, exercises };
        });
    },

    // Update exercise type and unit
    updateExerciseType: (exerciseIndex, type, unit) => {
        get().updateLogDraft((draft) => {
            const exercises = [...draft.exercises];
            if (!exercises[exerciseIndex]) return { ...draft };
            exercises[exerciseIndex] = {
                ...exercises[exerciseIndex],
                type,
                unit,
            };
            return { ...draft, exercises };
        });
    },

    // Initialize draft from plan and day
    initializeFromPlanDay: (plan, day, userId) => {
        const draft: LogDraft = {
            planId: plan.id,
            planTitle: plan.title,
            dayId: day.id,
            dayTitle: day.title,
            date: todayISO(),
            userId: userId ?? null,
            exercises: (day.exercises ?? []).map((ex) => ({
                name: ex.name,
                group: ex.group,
                type: ex.type ?? "weight",
                unit: ex.unit ?? "kg",
                completed: null,
                setsNo: ex.setsNo ?? 3,
                sets: ensureSetCount(
                    ex.setsNo ?? 3,
                    []
                ).map(() => ({
                    value: null,
                    reps: null,
                })),
            })),
            note: "",
            startedAt: undefined,
            completedAt: undefined,
            status: undefined,
        };
        set({ logDraft: draft, currentLogId: null });
    },

    // Load a running session from Firestore
    loadRunningSession: (log) => {
        set({
            logPlanId: log.planId,
            logDayId: log.dayId,
            currentLogId: log.id,
            logDraft: {
                planId: log.planId,
                planTitle: log.planTitle,
                dayId: log.dayId,
                dayTitle: log.dayTitle,
                date: log.date,
                userId: log.userId,
                exercises: log.exercises,
                note: log.note,
                startedAt: log.startedAt,
                completedAt: log.completedAt,
                status: log.status,
            },
        });
    },

    // Clear session completely
    clearSession: () =>
        set({
            logPlanId: "",
            logDayId: "",
            logDraft: null,
            currentLogId: null,
            isSubmitting: false,
            isLoadingRunning: false,
        }),

    // Reset for a new session after completing
    resetForNewSession: (plan, day, userId) => {
        get().initializeFromPlanDay(plan, day, userId);
    },
}));
