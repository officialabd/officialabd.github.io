import { create } from "zustand";
import type { GymPlan, GymPlanDay, GymExercise } from "../types";
import { generateId } from "../utils";

interface PlansState {
    // State
    plans: GymPlan[];
    planDrafts: Record<string, GymPlan>;
    planDirty: Record<string, boolean>;
    isLoading: boolean;
    savingPlanId: string | null;

    // Selection state
    viewPlanId: string;
    viewDayId: string;
    editPlanId: string;
    editDayId: string;

    // Form state
    newPlanTitle: string;
    newDayTitle: string;

    // Actions
    setPlans: (plans: GymPlan[]) => void;
    setLoading: (loading: boolean) => void;
    setSavingPlanId: (planId: string | null) => void;

    // Selection actions
    setViewPlanId: (id: string) => void;
    setViewDayId: (id: string) => void;
    setEditPlanId: (id: string) => void;
    setEditDayId: (id: string) => void;

    // Form actions
    setNewPlanTitle: (title: string) => void;
    setNewDayTitle: (title: string) => void;

    // Draft actions
    initializeDrafts: (plans: GymPlan[]) => void;
    updatePlanDraft: (planId: string, updater: (draft: GymPlan) => GymPlan) => void;
    updateDayDraft: (planId: string, dayId: string, updater: (day: GymPlanDay) => GymPlanDay) => void;
    markPlanClean: (planId: string) => void;
    addDayToPlan: (planId: string, title: string) => string; // Returns new day ID
    deleteDayFromPlan: (planId: string, dayId: string) => void;
    addExerciseToDay: (planId: string, dayId: string) => void;
    deleteExerciseFromDay: (planId: string, dayId: string, exerciseIndex: number) => void;
    reorderExercises: (planId: string, dayId: string, sourceId: string, targetId: string) => void;

    // Cleanup
    clearPlans: () => void;
    removePlan: (planId: string) => void;
}

export const usePlansStore = create<PlansState>((set, get) => ({
    // Initial state
    plans: [],
    planDrafts: {},
    planDirty: {},
    isLoading: false,
    savingPlanId: null,
    viewPlanId: "",
    viewDayId: "",
    editPlanId: "",
    editDayId: "",
    newPlanTitle: "",
    newDayTitle: "",

    // Basic setters
    setPlans: (plans) => set({ plans }),
    setLoading: (isLoading) => set({ isLoading }),
    setSavingPlanId: (savingPlanId) => set({ savingPlanId }),

    // Selection setters
    setViewPlanId: (viewPlanId) => set({ viewPlanId }),
    setViewDayId: (viewDayId) => set({ viewDayId }),
    setEditPlanId: (editPlanId) => set({ editPlanId }),
    setEditDayId: (editDayId) => set({ editDayId }),

    // Form setters
    setNewPlanTitle: (newPlanTitle) => set({ newPlanTitle }),
    setNewDayTitle: (newDayTitle) => set({ newDayTitle }),

    // Initialize drafts from plans
    initializeDrafts: (plans) => {
        const drafts: Record<string, GymPlan> = {};
        const dirty: Record<string, boolean> = {};
        plans.forEach((p) => {
            drafts[p.id] = { ...p, days: [...(p.days ?? [])] };
            dirty[p.id] = false;
        });
        set({ planDrafts: drafts, planDirty: dirty });
    },

    // Update a plan draft
    updatePlanDraft: async (planId, updater) => {
        const { planDrafts, plans, planDirty } = get();
        const base = planDrafts[planId] ?? plans.find((p) => p.id === planId);
        if (!base) return;

        const cloned: GymPlan = { ...base, days: [...(base.days ?? [])] };
        const nextDraft = updater(cloned);

        set({
            planDrafts: { ...planDrafts, [planId]: nextDraft },
            planDirty: { ...planDirty, [planId]: true },
        });

        console.log("Plan draft", nextDraft);
    },

    // Update a day within a plan draft
    updateDayDraft: (planId, dayId, updater) => {
        get().updatePlanDraft(planId, (draft) => {
            const next = { ...draft, days: [...(draft.days ?? [])] };
            const idx = next.days.findIndex((d) => d.id === dayId);
            if (idx === -1) return next;
            next.days[idx] = updater({
                ...next.days[idx],
                exercises: [...(next.days[idx].exercises ?? [])],
            });
            return next;
        });
    },

    // Mark a plan as clean (saved)
    markPlanClean: (planId) => {
        const { planDirty } = get();
        set({ planDirty: { ...planDirty, [planId]: false } });
    },

    // Add a new day to a plan
    addDayToPlan: (planId, title) => {
        const dayId = generateId();
        const day: GymPlanDay = {
            id: dayId,
            title: title.trim(),
            note: "",
            order: Date.now(),
            exercises: [],
        };
        get().updatePlanDraft(planId, (draft) => ({
            ...draft,
            days: [...(draft.days ?? []), day],
        }));
        return dayId;
    },

    // Delete a day from a plan
    deleteDayFromPlan: (planId, dayId) => {
        const { viewDayId, editDayId } = get();
        get().updatePlanDraft(planId, (draft) => ({
            ...draft,
            days: (draft.days ?? []).filter((d) => d.id !== dayId),
        }));

        // Clear selection if deleted day was selected
        if (viewDayId === dayId) set({ viewDayId: "" });
        if (editDayId === dayId) set({ editDayId: "" });
    },

    // Add an exercise to a day
    addExerciseToDay: (planId, dayId) => {
        get().updateDayDraft(planId, dayId, (day) => ({
            ...day,
            exercises: [
                ...(day.exercises ?? []),
                {
                    id: generateId(),
                    name: "",
                    group: "",
                    type: "weight",
                    unit: "kg",
                    setsNo: 3,
                } as GymExercise,
            ],
        }));
    },

    // Delete an exercise from a day
    deleteExerciseFromDay: (planId, dayId, exerciseIndex) => {
        get().updateDayDraft(planId, dayId, (day) => ({
            ...day,
            exercises: (day.exercises ?? []).filter((_, i) => i !== exerciseIndex),
        }));
    },

    // Reorder exercises via drag and drop
    reorderExercises: (planId, dayId, sourceId, targetId) => {
        if (!sourceId || !targetId || sourceId === targetId) return;
        get().updateDayDraft(planId, dayId, (day) => {
            const exercises = [...(day.exercises ?? [])];
            const fromIdx = exercises.findIndex((ex) => ex.id === sourceId);
            const toIdx = exercises.findIndex((ex) => ex.id === targetId);
            if (fromIdx === -1 || toIdx === -1) return day;
            const [moved] = exercises.splice(fromIdx, 1);
            exercises.splice(toIdx, 0, moved);
            return { ...day, exercises };
        });
    },

    // Clear all plans (on logout)
    clearPlans: () =>
        set({
            plans: [],
            planDrafts: {},
            planDirty: {},
            viewPlanId: "",
            viewDayId: "",
            editPlanId: "",
            editDayId: "",
            newPlanTitle: "",
            newDayTitle: "",
        }),

    // Remove a single plan
    removePlan: (planId) => {
        const { plans, planDrafts, planDirty, viewPlanId, editPlanId } = get();
        const nextDrafts = { ...planDrafts };
        const nextDirty = { ...planDirty };
        delete nextDrafts[planId];
        delete nextDirty[planId];

        set({
            plans: plans.filter((p) => p.id !== planId),
            planDrafts: nextDrafts,
            planDirty: nextDirty,
            viewPlanId: viewPlanId === planId ? "" : viewPlanId,
            editPlanId: editPlanId === planId ? "" : editPlanId,
        });
    },
}));
