// ============================================================================
// Units & enums
// ============================================================================

/** "reps": bodyweight exercises that only record reps. */
export type ExerciseType = "weight" | "time" | "reps";
export type WeightUnit = "kg" | "lb";
export type TimeUnit = "secs" | "mins" | "hours";
/** "reps" is the only unit of reps-only exercises. */
export type Unit = WeightUnit | TimeUnit | "reps";
export type DistanceUnit = "km" | "mi";
export type HeightUnit = "cm" | "in";
export type Per = "1hand" | "2hands" | "1leg" | "2legs" | "fullBody" | "running";
export type MuscleGroup =
    | "chest"
    | "back"
    | "traps"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "forearms"
    | "core"
    | "glutes"
    | "quads"
    | "hamstrings"
    | "adductors"
    | "calves"
    | "fullBody"
    | "cardio";

// ============================================================================
// Exercise library — gymUsers/{uid}/exercises/{exerciseId}
// ============================================================================

export interface GymExercise {
    id: string;
    name: string;
    groups: MuscleGroup[];
    type: ExerciseType;
    /** Weight unit for "weight" exercises, time unit for "time" exercises, "reps" for reps-only. */
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
    /** Weight (weight exercises) or duration (time / running exercises). Unused for reps-only. */
    value: number | null;
    reps: number | null;
    /** Running only. */
    distance: number | null;
    /** Running only, in kcal. */
    calories: number | null;
    completed: boolean | null;
}

/** Snapshot of an exercise as it was performed. Never updated by library edits. */
export interface GymLogExercise {
    exerciseId: string | null;
    name: string;
    groups: MuscleGroup[];
    type: ExerciseType;
    unit: Unit;
    per: Per;
    distanceUnit: DistanceUnit | null;
    completed: boolean | null;
    /** Explicitly skipped in the session (as opposed to left unfilled). */
    skipped: boolean;
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
    /** Gym the session took place at (one of the profile's gyms), if any. */
    gym: string | null;
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
    /** BMI the user aims for; drives the target weight shown in the profile. */
    targetBmi: number | null;
    /** Gyms the user trains at, used to label sessions. */
    gyms: string[];
    /** Gym new sessions start with. */
    defaultGym: string | null;
    /** Set once the user finishes or skips onboarding. */
    onboardedAt: number | null;
}

// ============================================================================
// UI
// ============================================================================

export type ViewTab = "session" | "plans" | "exercises" | "logs" | "stats" | "profile";

/** "logged" shows values in the unit they were recorded in. */
export type WeightDisplay = "logged" | WeightUnit;

export interface LogsFilter {
    from: string;
    to: string;
    planId: string;
    dayId: string;
}

export type SaveState = "idle" | "saving" | "saved" | "error";
