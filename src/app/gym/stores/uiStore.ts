import { create } from "zustand";
import type { ViewTab, WeightDisplay } from "../types";

interface UIState {
    activeView: ViewTab;
    /** Ticks every minute to refresh timers. */
    nowTs: number;
    /** How weights are displayed in the logs (view only, never changes stored values). */
    logsWeightDisplay: WeightDisplay;

    setActiveView: (view: ViewTab) => void;
    tick: () => void;
    setLogsWeightDisplay: (display: WeightDisplay) => void;
    reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    activeView: "session",
    nowTs: Date.now(),
    logsWeightDisplay: "logged",

    setActiveView: (activeView) => set({ activeView }),
    tick: () => set({ nowTs: Date.now() }),
    setLogsWeightDisplay: (logsWeightDisplay) => set({ logsWeightDisplay }),
    reset: () => set({ activeView: "session", logsWeightDisplay: "logged" }),
}));
