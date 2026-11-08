import type { DistanceUnit, HeightUnit, MuscleGroup, Per, TimeUnit, UnitPreferences, WeightUnit } from "./types";

/** Firestore collection names. Gym data lives entirely under `gymUsers/{uid}`. */
export const COLLECTIONS = {
    users: "gymUsers",
    exercises: "exercises",
    plans: "plans",
    logs: "logs",
    /** Pre-migration collections. Read-only: kept untouched as a backup. */
    legacyPlans: "gymPlans",
    legacyLogs: "gymLogs",
} as const;

/** Bump when a new migration step is added. */
export const SCHEMA_VERSION = 1;

/** Logs tab shows at least this many sessions when filtered to a single day. */
export const MIN_DAY_LOGS = 4;
/** The Logs tab opens on this many days back. */
export const DEFAULT_LOGS_DAYS = 30;

export const AUTOSAVE_DELAY_MS = 1200;
/** A running session not updated for this long is offered to be completed or discarded. */
export const STALE_SESSION_MS = 12 * 60 * 60 * 1000;
export const DEFAULT_SETS = 3;

export const WEIGHT_UNITS: WeightUnit[] = ["kg", "lb"];
export const TIME_UNITS: TimeUnit[] = ["secs", "mins", "hours"];
export const DISTANCE_UNITS: DistanceUnit[] = ["km", "mi"];
export const HEIGHT_UNITS: HeightUnit[] = ["cm", "in"];

export const PER_OPTIONS: { value: Per; label: string }[] = [
    { value: "1hand", label: "1 Hand" },
    { value: "2hands", label: "2 Hands" },
    { value: "1leg", label: "1 Leg" },
    { value: "2legs", label: "2 Legs" },
    { value: "fullBody", label: "Full Body" },
    { value: "running", label: "Running" },
];

/** Fixed muscle-group list. Colors are Tailwind classes for the group stripe. */
export const MUSCLE_GROUPS: { value: MuscleGroup; label: string; color: string }[] = [
    { value: "chest", label: "Chest", color: "bg-rose-500" },
    { value: "back", label: "Back", color: "bg-sky-500" },
    { value: "traps", label: "Traps", color: "bg-cyan-600" },
    { value: "shoulders", label: "Shoulders", color: "bg-amber-500" },
    { value: "biceps", label: "Biceps", color: "bg-violet-500" },
    { value: "triceps", label: "Triceps", color: "bg-fuchsia-500" },
    { value: "forearms", label: "Forearms", color: "bg-purple-400" },
    { value: "core", label: "Core", color: "bg-yellow-400" },
    { value: "glutes", label: "Glutes", color: "bg-pink-500" },
    { value: "quads", label: "Quads", color: "bg-emerald-500" },
    { value: "hamstrings", label: "Hamstrings", color: "bg-lime-500" },
    { value: "adductors", label: "Adductors", color: "bg-teal-500" },
    { value: "calves", label: "Calves", color: "bg-green-700" },
    { value: "fullBody", label: "Full Body", color: "bg-orange-500" },
    { value: "cardio", label: "Cardio", color: "bg-red-400" },
];

export const UNIT_LABELS: Record<string, string> = {
    kg: "KG",
    lb: "LB",
    secs: "Secs",
    mins: "Mins",
    reps: "Reps",
    hours: "Hours",
    km: "KM",
    mi: "Miles",
    cm: "CM",
    in: "Inches",
};

export const DEFAULT_UNITS: UnitPreferences = { weight: "kg", distance: "km", height: "cm" };

/** Unit given to exercises created by the migration. */
export const MIGRATED_WEIGHT_UNIT: WeightUnit = "lb";
