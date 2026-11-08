import { create } from "zustand";
import type { GymExercise, GymExerciseInput } from "../types";
import * as gymService from "../services/gymService";
import { exerciseNameKey } from "../utils";
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
            if (!name.trim()) return "Name is required.";
            const key = exerciseNameKey(name);
            const clash = get().exercises.find((e) => e.id !== ignoreId && exerciseNameKey(e.name) === key);
            return clash ? `"${clash.name}" already exists.` : null;
        },

        create: async (input) => {
            const created = await gymService.createExercise(requireUid(), input);
            setExercises([...get().exercises, created]);
            return created;
        },

        update: async (exercise) => {
            const updated = await gymService.updateExercise(requireUid(), exercise);
            setExercises(get().exercises.map((e) => (e.id === updated.id ? updated : e)));
        },

        remove: async (exerciseId) => {
            await gymService.deleteExercise(requireUid(), exerciseId);
            setExercises(get().exercises.filter((e) => e.id !== exerciseId));
        },

        clear: () => set({ exercises: [], byId: new Map(), isLoading: false }),
    };
});
