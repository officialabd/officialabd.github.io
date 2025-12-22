"use client";

import { useCallback } from "react";
import { useSessionStore } from "../stores";
import type { GymPlan, GymPlanDay, GymSet, GymLogEntry, SetType, WeightUnit } from "../types";
import * as gymService from "../services/gymService";

/**
 * Hook to manage gym session logging
 */
export function useGymSession(userId: string | null) {
    const store = useSessionStore();

    // Initialize session draft from plan and day
    const initializeSession = useCallback(
        (plan: GymPlan, day: GymPlanDay) => {
            store.initializeFromPlanDay(plan, day, userId);
        },
        [userId, store]
    );

    // Start the session
    const startSession = useCallback(() => {
        store.startSession();
    }, [store]);

    // Save session (create or update)
    const saveSession = useCallback(async () => {
        if (!userId || !store.logDraft) return;

        store.setSubmitting(true);
        try {
            const now = Date.now();
            const payload: Omit<GymLogEntry, "id"> = {
                planId: store.logDraft.planId,
                planTitle: store.logDraft.planTitle,
                dayId: store.logDraft.dayId,
                dayTitle: store.logDraft.dayTitle,
                date: store.logDraft.date,
                exercises: store.logDraft.exercises,
                note: store.logDraft.note,
                userId,
                createdAt: now,
                startedAt: store.logDraft.startedAt ?? now,
                completedAt: store.logDraft.completedAt,
                status: store.logDraft.status ?? "running",
            };

            if (store.currentLogId) {
                await gymService.updateLogEntry(userId, store.currentLogId, payload);
            } else {
                const docId = await gymService.createLogEntry(userId, payload);
                store.setCurrentLogId(docId);
            }
        } finally {
            store.setSubmitting(false);
        }
    }, [userId, store]);

    // Complete session
    const completeSession = useCallback(
        async (plan: GymPlan, day: GymPlanDay) => {
            if (!userId || !store.logDraft) return;

            store.setSubmitting(true);
            try {
                const now = Date.now();
                const payload: Omit<GymLogEntry, "id"> = {
                    planId: store.logDraft.planId,
                    planTitle: store.logDraft.planTitle,
                    dayId: store.logDraft.dayId,
                    dayTitle: store.logDraft.dayTitle,
                    date: store.logDraft.date,
                    exercises: store.logDraft.exercises,
                    note: store.logDraft.note,
                    userId,
                    createdAt: now,
                    startedAt: store.logDraft.startedAt ?? now,
                    completedAt: now,
                    status: "completed",
                };

                if (store.currentLogId) {
                    await gymService.updateLogEntry(userId, store.currentLogId, payload);
                } else {
                    await gymService.createLogEntry(userId, payload);
                }

                // Reset for new session
                store.resetForNewSession(plan, day, userId);
            } finally {
                store.setSubmitting(false);
            }
        },
        [userId, store]
    );

    // Cancel session
    const cancelSession = useCallback(
        async (plan: GymPlan, day: GymPlanDay) => {
            if (!store.logDraft) return;

            store.setSubmitting(true);
            try {
                // Delete from Firebase if already saved
                if (store.currentLogId) {
                    await gymService.deleteLogEntry(userId!, store.currentLogId);
                }

                // Reset for new session
                store.resetForNewSession(plan, day, userId);
            } finally {
                store.setSubmitting(false);
            }
        },
        [userId, store]
    );

    // Load running session from Firestore
    const loadRunningSession = useCallback(async () => {
        if (!userId) return null;

        // Set loading flag BEFORE async fetch to prevent race conditions
        store.setLoadingRunning(true);
        
        try {
            const runningLog = await gymService.fetchRunningSession(userId);
            if (runningLog) {
                store.loadRunningSession({
                    id: runningLog.id,
                    planId: runningLog.planId,
                    planTitle: runningLog.planTitle,
                    dayId: runningLog.dayId,
                    dayTitle: runningLog.dayTitle,
                    date: runningLog.date,
                    userId: runningLog.userId,
                    exercises: runningLog.exercises,
                    note: runningLog.note,
                    startedAt: runningLog.startedAt,
                    completedAt: runningLog.completedAt,
                    status: runningLog.status,
                });
                return runningLog;
            }
        } catch (err) {
            console.error("Failed to load running session", err);
        } finally {
            // Reset loading flag after fetch completes (whether found or not)
            store.setLoadingRunning(false);
        }
        return null;
    }, [userId, store]);

    // Update exercise sets count
    const updateSetsCount = useCallback(
        (exerciseIndex: number, count: number) => {
            store.updateExerciseSets(exerciseIndex, count);
        },
        [store]
    );

    // Update a specific set value
    const updateSetValue = useCallback(
        (
            exerciseIndex: number,
            setIndex: number,
            field: keyof GymSet,
            value: number | null
        ) => {
            store.updateSetValue(exerciseIndex, setIndex, field, value);
        },
        [store]
    );

    // Update session note
    const updateNote = useCallback(
        (note: string) => {
            store.updateSessionNote(note);
        },
        [store]
    );

    // Update date
    const updateDate = useCallback(
        (date: string) => {
            store.updateLogDraft((d) => ({ ...d, date }));
        },
        [store]
    );

    // Update exercise unit
    const updateUnit = useCallback(
        (exerciseIndex: number, unit: "kg" | "lb") => {
            store.updateExerciseUnit(exerciseIndex, unit);
        },
        [store]
    );

    // Add a new exercise (optionally specify type and unit)
    const addExercise = useCallback(
        (name: string, muscleGroup: string, setType: SetType = "weight", weightUnit: WeightUnit = "kg") => {
            store.addExercise(name, muscleGroup, setType, weightUnit);
        },
        [store]
    );

    // Remove an exercise
    const removeExercise = useCallback(
        (exerciseIndex: number) => {
            store.removeExercise(exerciseIndex);
        },
        [store]
    );

    // Update exercise details (name and muscle group)
    const updateExerciseDetails = useCallback(
        (exerciseIndex: number, name: string, muscleGroup: string) => {
            store.updateExerciseDetails(exerciseIndex, name, muscleGroup);
        },
        [store]
    );

    return {
        // State
        logPlanId: store.logPlanId,
        logDayId: store.logDayId,
        logDraft: store.logDraft,
        currentLogId: store.currentLogId,
        isSubmitting: store.isSubmitting,
        isLoadingRunning: store.isLoadingRunning,

        // Setters
        setLogPlanId: store.setLogPlanId,
        setLogDayId: store.setLogDayId,

        // Actions
        initializeSession,
        startSession,
        saveSession,
        completeSession,
        cancelSession,
        loadRunningSession,
        updateSetsCount,
        updateSetValue,
        updateNote,
        updateDate,
        updateUnit,
        addExercise,
        updateExerciseType: store.updateExerciseType,
        removeExercise,
        updateExerciseDetails,
        clearSession: store.clearSession,
    };
}
