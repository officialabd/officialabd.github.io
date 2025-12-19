// Import types from models
import type {
    SetType,
    WeightUnit,
    GymSet,
    GymExercise,
    GymPlanDay,
    GymPlan,
    GymLogExercise,
    GymLogEntry,
} from "../../models/Gym";

// Re-export all types from models for convenience
export type {
    SetType,
    WeightUnit,
    GymSet,
    GymExercise,
    GymPlanDay,
    GymPlan,
    GymLogExercise,
    GymLogEntry,
};

// View/Navigation types
export type ViewTab = "plans" | "edit" | "session" | "logs";

// Session status
export type SessionStatus = "running" | "completed" | null;

// Exercise completion status
export type ExerciseStatusLabel = "Completed" | "Partial" | "Unattempted";
export type ExerciseStatusColor = "text-emerald-300" | "text-orange-300" | "text-rose-300";

export interface ExerciseStatus {
    label: ExerciseStatusLabel;
    color: ExerciseStatusColor;
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
