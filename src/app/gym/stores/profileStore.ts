import { create } from "zustand";
import { DEFAULT_UNITS } from "../constants";
import type { GymProfile, HeightEntry, HeightUnit, WeightEntry, WeightUnit } from "../types";
import * as gymService from "../services/gymService";
import { isProfileEmpty } from "../services/mappers";
import { generateId } from "../utils";
import { requireUid } from "./authStore";

const emptyProfile = (): GymProfile => ({
    name: "",
    birthdate: null,
    units: { ...DEFAULT_UNITS },
    weightHistory: [],
    heightHistory: [],
    onboardedAt: null,
});

const byDateDesc = <T extends { date: string; createdAt: number }>(entries: T[]) =>
    [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

export interface MeasurementInput<U> {
    value: number;
    unit: U;
    date: string;
}

interface ProfileState {
    profile: GymProfile;
    isSaving: boolean;

    /** Onboarding shows for users who haven't set a profile and haven't skipped it. */
    needsOnboarding: () => boolean;
    setProfile: (profile: GymProfile) => void;
    save: (changes: Partial<GymProfile>) => Promise<void>;
    addWeight: (entry: MeasurementInput<WeightUnit>) => Promise<void>;
    addHeight: (entry: MeasurementInput<HeightUnit>) => Promise<void>;
    removeWeight: (id: string) => Promise<void>;
    removeHeight: (id: string) => Promise<void>;
    clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: emptyProfile(),
    isSaving: false,

    needsOnboarding: () => {
        const { profile } = get();
        return !profile.onboardedAt && isProfileEmpty(profile);
    },

    setProfile: (profile) => set({ profile }),

    save: async (changes) => {
        const next = { ...get().profile, ...changes };
        set({ isSaving: true });
        try {
            await gymService.saveProfile(requireUid(), next);
            set({ profile: next });
        } finally {
            set({ isSaving: false });
        }
    },

    addWeight: (entry) => {
        const record: WeightEntry = { ...entry, id: generateId(), createdAt: Date.now() };
        return get().save({ weightHistory: byDateDesc([...get().profile.weightHistory, record]) });
    },

    addHeight: (entry) => {
        const record: HeightEntry = { ...entry, id: generateId(), createdAt: Date.now() };
        return get().save({ heightHistory: byDateDesc([...get().profile.heightHistory, record]) });
    },

    removeWeight: (id) => get().save({ weightHistory: get().profile.weightHistory.filter((e) => e.id !== id) }),

    removeHeight: (id) => get().save({ heightHistory: get().profile.heightHistory.filter((e) => e.id !== id) }),

    clear: () => set({ profile: emptyProfile(), isSaving: false }),
}));
