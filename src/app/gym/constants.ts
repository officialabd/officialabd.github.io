import type { DistanceUnit, HeightUnit, Per, TimeUnit, UnitPreferences, WeightUnit } from "./types";

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

export const AUTOSAVE_DELAY_MS = 1200;
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

export const UNIT_LABELS: Record<string, string> = {
    kg: "KG",
    lb: "LB",
    secs: "Secs",
    mins: "Mins",
    hours: "Hours",
    km: "KM",
    mi: "Miles",
    cm: "CM",
    in: "Inches",
};

export const DEFAULT_UNITS: UnitPreferences = { weight: "kg", distance: "km", height: "cm" };

/** Unit given to exercises created by the migration. */
export const MIGRATED_WEIGHT_UNIT: WeightUnit = "lb";
