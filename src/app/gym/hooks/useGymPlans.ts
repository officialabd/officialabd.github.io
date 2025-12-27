"use client";

import { useCallback } from "react";
import { usePlansStore } from "../stores";
import type { GymPlan, GymPlanDay, Unit } from "../types";
import * as gymService from "../services/gymService";

/**
 * Hook to manage gym plans
 */
export function useGymPlans(userId: string | null) {
    const store = usePlansStore();

    // Load all plans for the user
    const loadPlans = useCallback(async (preferredPlanId?: string) => {
        if (!userId) {
            store.clearPlans();
            return;
        }

        store.setLoading(true);
        try {
            const items = await gymService.fetchPlans(userId);
            store.setPlans(items);
            store.initializeDrafts(items);

            // Resolve selection IDs - don't auto-select, only preserve valid existing selections
            const resolvePlanId = (current: string, preferred?: string) => {
                if (preferred && items.some((i) => i.id === preferred)) return preferred;
                if (current && items.some((i) => i.id === current)) return current;
                return ""; // Don't auto-select
            };

            const resolveDayId = (current: string, planId: string) => {
                const plan = items.find((p) => p.id === planId);
                if (!plan) return "";
                if (current && plan.days.some((d) => d.id === current)) return current;
                return ""; // Don't auto-select
            };

            const nextViewPlanId = resolvePlanId(store.viewPlanId, preferredPlanId);
            const nextEditPlanId = resolvePlanId(store.editPlanId, preferredPlanId);
            const nextViewDayId = resolveDayId(store.viewDayId, nextViewPlanId);
            const nextEditDayId = resolveDayId(store.editDayId, nextEditPlanId);

            store.setViewPlanId(nextViewPlanId);
            store.setEditPlanId(nextEditPlanId);
            store.setViewDayId(nextViewDayId);
            store.setEditDayId(nextEditDayId);
        } finally {
            store.setLoading(false);
        }
    }, [userId, store]);

    // Add a new plan
    const addPlan = useCallback(async (title?: string) => {
        if (!userId) return;

        // Generate default title if none provided
        const planCount = store.plans.length;
        const finalTitle = title?.trim() || `New Plan ${planCount + 1}`;

        const now = Date.now();
        const payload: Omit<GymPlan, "id"> = {
            title: finalTitle,
            note: "",
            userId,
            createdAt: now,
            updatedAt: now,
            days: [],
        };

        const docId = await gymService.createPlan(userId, payload);
        store.setNewPlanTitle("");
        await loadPlans(docId);
        store.setEditPlanId(docId);
    }, [userId, store, loadPlans]);

    // Save a plan
    const savePlan = useCallback(async (planId: string) => {
        if (!userId) return;
        const draft = store.planDrafts[planId];
        if (!draft) return;

        store.setSavingPlanId(planId);
        try {
            const now = Date.now();
            const cleaned: GymPlan = {
                ...draft,
                userId: userId ?? null,
                createdAt: draft.createdAt ?? now,
                updatedAt: now,
                days: (draft.days ?? []).map((day) => ({
                    ...day,
                    exercises: (day.exercises ?? []).filter(Boolean).map((ex) => ({
                        ...ex,
                        setsNo: ex.setsNo,
                    })),
                })),
            };
            await gymService.updatePlan(userId, planId, cleaned);
            store.markPlanClean(planId);
            await loadPlans(planId);
        } finally {
            store.setSavingPlanId(null);
        }
    }, [userId, store, loadPlans]);

    // Delete a plan
    const deletePlan = useCallback(async (planId: string) => {
        const planTitle =
            store.planDrafts[planId]?.title ||
            store.plans.find((p) => p.id === planId)?.title ||
            "this plan";

        const confirmed =
            typeof window === "undefined"
                ? true
                : window.confirm(`Delete plan "${planTitle}"? This cannot be undone.`);

        if (!confirmed) return;

        await gymService.deletePlan(userId!, planId);
        store.removePlan(planId);
        await loadPlans();
    }, [store, loadPlans]);

    // Add a day to a plan
    const addDay = useCallback((planId: string, title: string) => {
        if (!title.trim()) return "";
        const dayId = store.addDayToPlan(planId, title);
        store.setNewDayTitle("");
        store.setEditDayId(dayId);
        return dayId;
    }, [store]);

    // Delete a day from a plan
    const deleteDay = useCallback((planId: string, dayId: string) => {
        store.deleteDayFromPlan(planId, dayId);
    }, [store]);

    // Update plan draft properties
    const updatePlanTitle = useCallback((planId: string, title: string) => {
        store.updatePlanDraft(planId, (d) => ({ ...d, title }));
    }, [store]);

    const updatePlanNote = useCallback((planId: string, note: string) => {
        store.updatePlanDraft(planId, (d) => ({ ...d, note }));
    }, [store]);

    // Update day draft properties
    const updateDayTitle = useCallback((planId: string, dayId: string, title: string) => {
        store.updateDayDraft(planId, dayId, (d) => ({ ...d, title }));
    }, [store]);

    const updateDayNote = useCallback((planId: string, dayId: string, note: string) => {
        store.updateDayDraft(planId, dayId, (d) => ({ ...d, note }));
    }, [store]);

    // Update exercise in a day
    const updateExercise = useCallback(
        (planId: string, dayId: string, exerciseIndex: number, field: string, value: any) => {
            store.updateDayDraft(planId, dayId, (day) => {
                const exercises = [...(day.exercises ?? [])];

                if (field === 'type') {
                    // Reset unit when type changes
                    let newUnit = exercises[exerciseIndex]?.unit || "";
                    if (value === "weight") {
                        newUnit = "kg";
                    } else if (value === "time") {
                        newUnit = "mins";
                    } else {
                        newUnit = "unknown";
                    }
                    exercises[exerciseIndex] = { ...exercises[exerciseIndex], unit: newUnit as Unit };
                }

                exercises[exerciseIndex] = { ...exercises[exerciseIndex], [field]: value };
                return { ...day, exercises };
            });
        },
        [store]
    );

    // Add exercise to a day
    const addExercise = useCallback((planId: string, dayId: string) => {
        store.addExerciseToDay(planId, dayId);
    }, [store]);

    // Delete exercise from a day
    const deleteExercise = useCallback(
        (planId: string, dayId: string, exerciseIndex: number) => {
            store.deleteExerciseFromDay(planId, dayId, exerciseIndex);
        },
        [store]
    );

    // Reorder exercises
    const reorderExercises = useCallback(
        (planId: string, dayId: string, sourceId: string, targetId: string) => {
            store.reorderExercises(planId, dayId, sourceId, targetId);
        },
        [store]
    );

    return {
        // State
        plans: store.plans,
        planDrafts: store.planDrafts,
        planDirty: store.planDirty,
        isLoading: store.isLoading,
        savingPlanId: store.savingPlanId,
        viewPlanId: store.viewPlanId,
        viewDayId: store.viewDayId,
        editPlanId: store.editPlanId,
        editDayId: store.editDayId,
        newPlanTitle: store.newPlanTitle,
        newDayTitle: store.newDayTitle,

        // Selection setters
        setViewPlanId: store.setViewPlanId,
        setViewDayId: store.setViewDayId,
        setEditPlanId: store.setEditPlanId,
        setEditDayId: store.setEditDayId,
        setNewPlanTitle: store.setNewPlanTitle,
        setNewDayTitle: store.setNewDayTitle,

        // Actions
        loadPlans,
        addPlan,
        savePlan,
        deletePlan,
        addDay,
        deleteDay,
        updatePlanTitle,
        updatePlanNote,
        updateDayTitle,
        updateDayNote,
        updateExercise,
        addExercise,
        deleteExercise,
        reorderExercises,
        clearPlans: store.clearPlans,
    };
}
