// ============================================================================
// Units & enums
// ============================================================================

export type ExerciseType = "weight" | "time";
export type WeightUnit = "kg" | "lb";
export type TimeUnit = "secs" | "mins" | "hours";
export type Unit = WeightUnit | TimeUnit;
export type DistanceUnit = "km" | "mi";
export type HeightUnit = "cm" | "in";
export type Per = "1hand" | "2hands" | "1leg" | "2legs" | "fullBody" | "running";

// ============================================================================
// Exercise library — gymUsers/{uid}/exercises/{exerciseId}
// ============================================================================

export interface GymExercise {
    id: string;
    name: string;
    group: string;
    type: ExerciseType;
    /** Weight unit for "weight" exercises, time unit for "time" exercises. */
    unit: Unit;
    per: Per;
    /** Only used when per === "running". */
    distanceUnit: DistanceUnit | null;
    setsNo: number;
    createdAt: number;
    updatedAt: number;
}

export type GymExerciseInput = Omit<GymExercise, "id" | "createdAt" | "updatedAt">;

// ============================================================================
// Plans — gymUsers/{uid}/plans/{planId}
// ============================================================================

export interface GymPlanDay {
    id: string;
    title: string;
    note: string;
    /** Ordered references into the exercise library. */
    exerciseIds: string[];
}

export interface GymPlan {
    id: string;
    title: string;
    note: string;
    createdAt: number;
    updatedAt: number;
    days: GymPlanDay[];
}

// ============================================================================
// Logs — gymUsers/{uid}/logs/{logId}
// ============================================================================

export interface GymSet {
    /** Weight (weight exercises) or duration (time / running exercises). */
    value: number | null;
    reps: number | null;
    /** Running only. */
    distance: number | null;
    completed: boolean | null;
}

/** Snapshot of an exercise as it was performed. Never updated by library edits. */
export interface GymLogExercise {
    exerciseId: string | null;
    name: string;
    group: string;
    type: ExerciseType;
    unit: Unit;
    per: Per;
    distanceUnit: DistanceUnit | null;
    completed: boolean | null;
    sets: GymSet[];
}

export type SessionStatus = "running" | "completed";

export interface GymLogEntry {
    id: string;
    planId: string;
    planTitle: string;
    dayId: string;
    dayTitle: string;
    /** Local ISO date (YYYY-MM-DD) the session belongs to. */
    date: string;
    note: string;
    exercises: GymLogExercise[];
    status: SessionStatus | null;
    createdAt: number;
    updatedAt: number;
    startedAt: number | null;
    completedAt: number | null;
}

export type LogDraft = Omit<GymLogEntry, "id" | "createdAt" | "updatedAt">;

// ============================================================================
// Profile — gymUsers/{uid} (user document)
// ============================================================================

export interface MeasurementEntry<U extends string> {
    id: string;
    value: number;
    unit: U;
    /** Local ISO date (YYYY-MM-DD) the measurement applies to. */
    date: string;
    createdAt: number;
}

export type WeightEntry = MeasurementEntry<WeightUnit>;
export type HeightEntry = MeasurementEntry<HeightUnit>;

export interface UnitPreferences {
    weight: WeightUnit;
    distance: DistanceUnit;
    height: HeightUnit;
}

export interface GymProfile {
    name: string;
    birthdate: string | null;
    units: UnitPreferences;
    weightHistory: WeightEntry[];
    heightHistory: HeightEntry[];
    /** Set once the user finishes or skips onboarding. */
    onboardedAt: number | null;
}

// ============================================================================
// UI
// ============================================================================

export type ViewTab = "session" | "plans" | "exercises" | "logs" | "profile";

/** "logged" shows values in the unit they were recorded in. */
export type WeightDisplay = "logged" | WeightUnit;

export interface LogsFilter {
    from: string;
    to: string;
    planId: string;
    dayId: string;
}

export type SaveState = "idle" | "saving" | "saved" | "error";
