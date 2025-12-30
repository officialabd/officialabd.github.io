// Import types from models
import type {
    type,
    Unit,
    GymSet,
    GymExercise,
    GymPlanDay,
    GymPlan,
    GymLogExercise,
    GymLogEntry,
} from "../../models/Gym";

// Re-export all types from models for convenience
export type {
    type,
    Unit,
    GymSet,
    GymExercise,
    GymPlanDay,
    GymPlan,
    GymLogExercise,
    GymLogEntry,
};

// View/Navigation types
export type ViewTab = "plans" | "session" | "logs";

// Session status
export type SessionStatus = "running" | "completed" | null;

// Exercise completion status (internal types used by ExerciseStatus)
type ExerciseStatusLabel = "Completed" | "Partial" | "Unattempted";
type ExerciseTextColor = "text-emerald-300" | "text-orange-300" | "text-rose-300";
type ExerciseBgColor = "bg-emerald-300" | "bg-orange-300" | "bg-rose-300";

export interface ExerciseStatus {
    label: ExerciseStatusLabel;
    textColor: ExerciseTextColor;
    bgColor: ExerciseBgColor;
}

// Logs filter state
export interface LogsFilter {
    from: string;
    to: string;
    planId: string;
    dayId: string;
}

// Draft types for editing
export type LogDraft = Omit<GymLogEntry, "id" | "createdAt">;
