import { create } from "zustand";
import type { GymLogEntry, LogsFilter } from "../types";
import { todayISO, lastMonthISO } from "../utils";

interface LogsState {
    // State
    logs: GymLogEntry[];
    isLoading: boolean;

    // Filters
    filter: LogsFilter;

    // Actions
    setLogs: (logs: GymLogEntry[]) => void;
    setLoading: (loading: boolean) => void;
    setFilter: (filter: Partial<LogsFilter>) => void;
    resetFilter: () => void;

    // Clear
    clearLogs: () => void;
}

const defaultFilter: LogsFilter = {
    from: lastMonthISO(),
    to: todayISO(),
    planId: "",
    dayId: "",
};

export const useLogsStore = create<LogsState>((set, get) => ({
    // Initial state
    logs: [],
    isLoading: false,
    filter: { ...defaultFilter },

    // Actions
    setLogs: (logs) => set({ logs }),
    setLoading: (isLoading) => set({ isLoading }),

    setFilter: (partial) => {
        const { filter } = get();
        set({ filter: { ...filter, ...partial } });
    },

    resetFilter: () => set({ filter: { ...defaultFilter } }),

    clearLogs: () =>
        set({
            logs: [],
            isLoading: false,
            filter: { ...defaultFilter },
        }),
}));
