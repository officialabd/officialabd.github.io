import { create } from "zustand";
import type { GymExercise, GymExerciseInput } from "../types";
import * as gymService from "../services/gymService";
import { cleanName, exerciseNameKey } from "../utils";
import { requireUid } from "./authStore";

interface ExercisesState {
    exercises: GymExercise[];
    byId: Map<string, GymExercise>;
    isLoading: boolean;

    load: () => Promise<void>;
    /** Returns an error message when the name is already used by another exercise. */
    validateName: (name: string, ignoreId?: string) => string | null;
    create: (input: GymExerciseInput) => Promise<GymExercise>;
    update: (exercise: GymExercise) => Promise<void>;
    remove: (exerciseId: string) => Promise<void>;
    /** Merge `removeIds` into `keepId` (logs and plans are re-linked; reload them afterwards). */
    merge: (keepId: string, removeIds: string[]) => Promise<void>;
    clear: () => void;
}

const index = (exercises: GymExercise[]) => new Map(exercises.map((e) => [e.id, e]));

const sortByName = (exercises: GymExercise[]) =>
    [...exercises].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

export const useExercisesStore = create<ExercisesState>((set, get) => {
    const setExercises = (exercises: GymExercise[]) => {
        const sorted = sortByName(exercises);
        set({ exercises: sorted, byId: index(sorted) });
    };

    return {
        exercises: [],
        byId: new Map(),
        isLoading: false,

        load: async () => {
            set({ isLoading: true });
            try {
                setExercises(await gymService.fetchExercises(requireUid()));
            } finally {
                set({ isLoading: false });
            }
        },

        validateName: (name, ignoreId) => {
            const key = exerciseNameKey(cleanName(name));
            if (!key) return "Name is required.";
            const clash = get().exercises.find((e) => e.id !== ignoreId && exerciseNameKey(e.name) === key);
            return clash ? `"${clash.name}" already exists.` : null;
        },

        create: async (input) => {
            const created = await gymService.createExercise(requireUid(), { ...input, name: cleanName(input.name) });
            setExercises([...get().exercises, created]);
            return created;
        },

        update: async (exercise) => {
            const updated = await gymService.updateExercise(requireUid(), { ...exercise, name: cleanName(exercise.name) });
            setExercises(get().exercises.map((e) => (e.id === updated.id ? updated : e)));
        },

        remove: async (exerciseId) => {
            await gymService.deleteExercise(requireUid(), exerciseId);
            setExercises(get().exercises.filter((e) => e.id !== exerciseId));
        },

        merge: async (keepId, removeIds) => {
            const keep = get().byId.get(keepId);
            if (!keep) throw new Error("The exercise to keep no longer exists.");
            await gymService.mergeExercises(requireUid(), keep, removeIds);
            setExercises(get().exercises.filter((e) => e.id === keepId || !removeIds.includes(e.id)));
        },

        clear: () => set({ exercises: [], byId: new Map(), isLoading: false }),
    };
});
