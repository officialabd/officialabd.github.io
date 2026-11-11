import { create } from "zustand";
import type { GymPlan, GymPlanDay } from "../types";
import * as gymService from "../services/gymService";
import { generateId } from "../utils";
import { requireUid } from "./authStore";
import { useExercisesStore } from "./exercisesStore";

/** Copy of `record` without `key`. */
const without = <T,>(record: Record<string, T>, key: string): Record<string, T> => {
    const next = { ...record };
    delete next[key];
    return next;
};

interface PlansState {
    plans: GymPlan[];
    /** Unsaved edits, keyed by plan ID. A plan is dirty when it has a draft. */
    drafts: Record<string, GymPlan>;
    isLoading: boolean;
    savingPlanId: string | null;
    selectedPlanId: string;
    selectedDayId: string;

    load: () => Promise<void>;
    /** Current version of a plan (draft if edited, otherwise saved). */
    getPlan: (planId: string) => GymPlan | undefined;
    selectPlan: (planId: string) => void;
    selectDay: (dayId: string) => void;

    addPlan: () => Promise<void>;
    savePlan: (planId: string) => Promise<void>;
    discardPlan: (planId: string) => void;
    deletePlan: (planId: string) => Promise<void>;

    editPlan: (planId: string, updater: (plan: GymPlan) => GymPlan) => void;
    editDay: (planId: string, dayId: string, updater: (day: GymPlanDay) => GymPlanDay) => void;
    addDay: (planId: string) => void;
    deleteDay: (planId: string, dayId: string) => void;
    addExerciseToDay: (planId: string, dayId: string, exerciseId: string) => void;
    removeExerciseFromDay: (planId: string, dayId: string, exerciseId: string) => void;
    moveExercise: (planId: string, dayId: string, sourceId: string, targetId: string) => void;

    /** Plan days (saved or drafted) that reference an exercise. */
    usagesOf: (exerciseId: string) => { plan: GymPlan; day: GymPlanDay }[];
    clear: () => void;
}

const initialState = {
    plans: [] as GymPlan[],
    drafts: {} as Record<string, GymPlan>,
    isLoading: false,
    savingPlanId: null as string | null,
    selectedPlanId: "",
    selectedDayId: "",
};

export const usePlansStore = create<PlansState>((set, get) => ({
    ...initialState,

    load: async () => {
        set({ isLoading: true });
        try {
            const plans = await gymService.fetchPlans(requireUid());
            const { selectedPlanId, selectedDayId } = get();
            const plan = plans.find((p) => p.id === selectedPlanId);
            set({
                plans,
                drafts: {},
                selectedPlanId: plan ? selectedPlanId : "",
                selectedDayId: plan?.days.some((d) => d.id === selectedDayId) ? selectedDayId : "",
            });
        } finally {
            set({ isLoading: false });
        }
    },

    getPlan: (planId) => get().drafts[planId] ?? get().plans.find((p) => p.id === planId),

    selectPlan: (selectedPlanId) => set({ selectedPlanId, selectedDayId: "" }),
    selectDay: (selectedDayId) => set({ selectedDayId }),

    addPlan: async () => {
        const now = Date.now();
        const created = await gymService.createPlan(requireUid(), {
            title: `New Plan ${get().plans.length + 1}`,
            note: "",
            createdAt: now,
            updatedAt: now,
            days: [],
        });
        set({ plans: [...get().plans, created], selectedPlanId: created.id, selectedDayId: "" });
    },

    savePlan: async (planId) => {
        const draft = get().drafts[planId];
        if (!draft) return;
        set({ savingPlanId: planId });
        try {
            // Drop references to exercises that no longer exist in the library.
            const library = useExercisesStore.getState().byId;
            const cleaned: GymPlan = {
                ...draft,
                days: draft.days.map((d) => ({ ...d, exerciseIds: d.exerciseIds.filter((id) => library.has(id)) })),
            };
            const saved = await gymService.updatePlan(requireUid(), cleaned);
            const drafts = without(get().drafts, planId);
            set({ plans: get().plans.map((p) => (p.id === planId ? saved : p)), drafts });
        } finally {
            set({ savingPlanId: null });
        }
    },

    discardPlan: (planId) => {
        const drafts = without(get().drafts, planId);
        const saved = get().plans.find((p) => p.id === planId);
        const dayStillExists = saved?.days.some((d) => d.id === get().selectedDayId);
        set({ drafts, selectedDayId: dayStillExists ? get().selectedDayId : "" });
    },

    deletePlan: async (planId) => {
        await gymService.deletePlan(requireUid(), planId);
        const drafts = without(get().drafts, planId);
        const wasSelected = get().selectedPlanId === planId;
        set({
            plans: get().plans.filter((p) => p.id !== planId),
            drafts,
            selectedPlanId: wasSelected ? "" : get().selectedPlanId,
            selectedDayId: wasSelected ? "" : get().selectedDayId,
        });
    },

    editPlan: (planId, updater) => {
        const base = get().getPlan(planId);
        if (!base) return;
        set({ drafts: { ...get().drafts, [planId]: updater(base) } });
    },

    editDay: (planId, dayId, updater) =>
        get().editPlan(planId, (plan) => ({
            ...plan,
            days: plan.days.map((d) => (d.id === dayId ? updater(d) : d)),
        })),

    addDay: (planId) => {
        const id = generateId();
        get().editPlan(planId, (plan) => ({
            ...plan,
            days: [...plan.days, { id, title: `Day ${plan.days.length + 1}`, note: "", exerciseIds: [] }],
        }));
        set({ selectedDayId: id });
    },

    deleteDay: (planId, dayId) => {
        get().editPlan(planId, (plan) => ({ ...plan, days: plan.days.filter((d) => d.id !== dayId) }));
        if (get().selectedDayId === dayId) set({ selectedDayId: "" });
    },

    addExerciseToDay: (planId, dayId, exerciseId) =>
        get().editDay(planId, dayId, (day) =>
            day.exerciseIds.includes(exerciseId) ? day : { ...day, exerciseIds: [...day.exerciseIds, exerciseId] }
        ),

    removeExerciseFromDay: (planId, dayId, exerciseId) =>
        get().editDay(planId, dayId, (day) => ({
            ...day,
            exerciseIds: day.exerciseIds.filter((id) => id !== exerciseId),
        })),

    moveExercise: (planId, dayId, sourceId, targetId) => {
        if (!sourceId || !targetId || sourceId === targetId) return;
        get().editDay(planId, dayId, (day) => {
            const ids = [...day.exerciseIds];
            const from = ids.indexOf(sourceId);
            const to = ids.indexOf(targetId);
            if (from === -1 || to === -1) return day;
            ids.splice(to, 0, ids.splice(from, 1)[0]);
            return { ...day, exerciseIds: ids };
        });
    },

    usagesOf: (exerciseId) =>
        get()
            .plans.map((p) => get().getPlan(p.id)!)
            .flatMap((plan) =>
                plan.days.filter((day) => day.exerciseIds.includes(exerciseId)).map((day) => ({ plan, day }))
            ),

    clear: () => set({ ...initialState }),
}));
