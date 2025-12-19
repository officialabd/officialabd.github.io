import { create } from "zustand";
import type { ViewTab } from "../types";

interface UIState {
    // Current view/tab
    activeView: ViewTab;
    nowTs: number; // Current timestamp for session timer

    // Drag state for exercise reordering
    draggingExerciseId: string | null;
    dragOverExerciseId: string | null;

    // Actions
    setActiveView: (view: ViewTab) => void;
    updateNowTs: () => void;
    setDraggingExerciseId: (id: string | null) => void;
    setDragOverExerciseId: (id: string | null) => void;
    clearDragState: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Initial state
    activeView: "session",
    nowTs: Date.now(),
    draggingExerciseId: null,
    dragOverExerciseId: null,

    // Actions
    setActiveView: (activeView) => set({ activeView }),
    updateNowTs: () => set({ nowTs: Date.now() }),
    setDraggingExerciseId: (draggingExerciseId) => set({ draggingExerciseId }),
    setDragOverExerciseId: (dragOverExerciseId) => set({ dragOverExerciseId }),
    clearDragState: () => set({ draggingExerciseId: null, dragOverExerciseId: null }),
}));
