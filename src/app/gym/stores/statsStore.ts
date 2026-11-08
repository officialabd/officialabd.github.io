import { create } from "zustand";
import type { GymLogEntry } from "../types";
import * as gymService from "../services/gymService";
import { requireUid } from "./authStore";

interface StatsState {
    /** Every log of the account; the Stats tab filters them on the client. */
    logs: GymLogEntry[];
    isLoading: boolean;
    error: string | null;

    load: () => Promise<void>;
    clear: () => void;
}

export const useStatsStore = create<StatsState>((set) => ({
    logs: [],
    isLoading: false,
    error: null,

    load: async () => {
        set({ isLoading: true, error: null });
        try {
            set({ logs: await gymService.fetchAllLogs(requireUid()) });
        } catch (err) {
            console.error("Failed to load stats", err);
            set({ error: "Could not load your sessions. Please try again." });
        } finally {
            set({ isLoading: false });
        }
    },

    clear: () => set({ logs: [], isLoading: false, error: null }),
}));
