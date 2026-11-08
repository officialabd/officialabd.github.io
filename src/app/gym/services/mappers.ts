/**
 * Conversions between Firestore documents and app models.
 * Reads are defensive (documents may be partial); writes never contain `undefined`.
 */
import { DEFAULT_SETS, DEFAULT_UNITS } from "../constants";
import type {
    DistanceUnit,
    ExerciseType,
    GymExercise,
    GymExerciseInput,
    GymLogEntry,
    GymLogExercise,
    GymPlan,
    GymPlanDay,
    GymProfile,
    GymSet,
    HeightEntry,
    HeightUnit,
    LogDraft,
    Per,
    SessionStatus,
    Unit,
    WeightEntry,
    WeightUnit,
} from "../types";
import { parseGroups } from "../utils/groups";

type Data = Record<string, any>;

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const arr = (v: unknown): any[] => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined) : []);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
    options.includes(v as T) ? (v as T) : fallback;

const EXERCISE_TYPES = ["weight", "time", "reps"] as const;
const WEIGHT_AND_TIME_UNITS = ["kg", "lb", "secs", "mins", "hours"] as const;
const PERS = ["1hand", "2hands", "1leg", "2legs", "fullBody", "running"] as const;
const DISTANCE_UNITS = ["km", "mi"] as const;
const WEIGHT_UNITS = ["kg", "lb"] as const;
const HEIGHT_UNITS = ["cm", "in"] as const;

const parseType = (v: unknown): ExerciseType => oneOf(v, EXERCISE_TYPES, "weight");
const parseUnit = (v: unknown, type: ExerciseType): Unit =>
    type === "reps" ? "reps" : oneOf(v, WEIGHT_AND_TIME_UNITS, type === "time" ? "mins" : "kg");
const parsePer = (v: unknown): Per => oneOf(v, PERS, "1hand");
const parseDistanceUnit = (v: unknown, per: Per): DistanceUnit | null =>
    per === "running" ? oneOf(v, DISTANCE_UNITS, "km") : null;

// ============================================================================
// Exercises
// ============================================================================

export const exerciseFromFirestore = (id: string, data: Data): GymExercise => {
    const type = parseType(data.type);
    const per = parsePer(data.per);
    return {
        id,
        name: str(data.name),
        groups: parseGroups(data.groups, data.group),
        type,
        unit: parseUnit(data.unit, type),
        per,
        distanceUnit: parseDistanceUnit(data.distanceUnit, per),
        setsNo: num(data.setsNo) ?? DEFAULT_SETS,
        createdAt: num(data.createdAt) ?? 0,
        updatedAt: num(data.updatedAt) ?? 0,
    };
};

export const exerciseToFirestore = (ex: GymExerciseInput & { createdAt: number; updatedAt: number }) => ({
    name: ex.name,
    nameKey: ex.name.toLowerCase(),
    groups: ex.groups,
    type: ex.type,
    unit: ex.unit,
    per: ex.per,
    distanceUnit: ex.per === "running" ? ex.distanceUnit ?? "km" : null,
    setsNo: ex.setsNo,
    createdAt: ex.createdAt,
    updatedAt: ex.updatedAt,
});

// ============================================================================
// Plans
// ============================================================================

const dayFromFirestore = (data: Data): GymPlanDay => ({
    id: str(data.id),
    title: str(data.title),
    note: str(data.note),
    exerciseIds: arr(data.exerciseIds).filter((x): x is string => typeof x === "string"),
});

export const planFromFirestore = (id: string, data: Data): GymPlan => ({
    id,
    title: str(data.title),
    note: str(data.note),
    createdAt: num(data.createdAt) ?? 0,
    updatedAt: num(data.updatedAt) ?? 0,
    days: arr(data.days).map(dayFromFirestore),
});

export const planToFirestore = (plan: Omit<GymPlan, "id">) => ({
    title: plan.title,
    note: plan.note,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    days: plan.days.map((day) => ({
        id: day.id,
        title: day.title,
        note: day.note,
        exerciseIds: day.exerciseIds,
    })),
});

// ============================================================================
// Logs
// ============================================================================

const setFromFirestore = (data: Data): GymSet => ({
    value: num(data.value),
    reps: num(data.reps),
    distance: num(data.distance),
    calories: num(data.calories),
    completed: data.completed === true ? true : null,
});

export const logExerciseFromFirestore = (data: Data): GymLogExercise => {
    const type = parseType(data.type);
    const per = parsePer(data.per);
    return {
        exerciseId: typeof data.exerciseId === "string" ? data.exerciseId : null,
        name: str(data.name),
        groups: parseGroups(data.groups, data.group),
        type,
        unit: parseUnit(data.unit, type),
        per,
        distanceUnit: parseDistanceUnit(data.distanceUnit, per),
        completed: data.completed === true ? true : null,
        skipped: data.skipped === true,
        sets: arr(data.sets).map(setFromFirestore),
    };
};

export const logFromFirestore = (id: string, data: Data): GymLogEntry => ({
    id,
    planId: str(data.planId),
    planTitle: str(data.planTitle),
    dayId: str(data.dayId),
    dayTitle: str(data.dayTitle),
    date: str(data.date),
    gym: str(data.gym) || null,
    note: str(data.note),
    exercises: arr(data.exercises).map(logExerciseFromFirestore),
    status: oneOf<SessionStatus | "">(data.status, ["running", "completed"], "") || null,
    createdAt: num(data.createdAt) ?? 0,
    updatedAt: num(data.updatedAt) ?? num(data.createdAt) ?? 0,
    startedAt: num(data.startedAt),
    completedAt: num(data.completedAt),
});

const logExerciseToFirestore = (ex: GymLogExercise) => ({
    exerciseId: ex.exerciseId,
    name: ex.name,
    groups: ex.groups,
    type: ex.type,
    unit: ex.unit,
    per: ex.per,
    distanceUnit: ex.per === "running" ? ex.distanceUnit ?? "km" : null,
    completed: ex.completed,
    skipped: ex.skipped,
    sets: ex.sets.map((s) => ({
        value: s.value,
        reps: s.reps,
        distance: s.distance,
        calories: s.calories,
        completed: s.completed,
    })),
});

export const logToFirestore = (log: LogDraft & { createdAt: number; updatedAt: number }) => ({
    planId: log.planId,
    planTitle: log.planTitle,
    dayId: log.dayId,
    dayTitle: log.dayTitle,
    date: log.date,
    gym: log.gym,
    note: log.note,
    exercises: log.exercises.map(logExerciseToFirestore),
    status: log.status,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
    startedAt: log.startedAt,
    completedAt: log.completedAt,
});

// ============================================================================
// Profile
// ============================================================================

const measurementFromFirestore = <U extends string>(data: Data, units: readonly U[], fallback: U) => ({
    id: str(data.id),
    value: num(data.value) ?? 0,
    unit: oneOf(data.unit, units, fallback),
    date: str(data.date),
    createdAt: num(data.createdAt) ?? 0,
});

/** Newest first by date, then by entry time. */
const byDateDesc = (a: { date: string; createdAt: number }, b: { date: string; createdAt: number }) =>
    b.date.localeCompare(a.date) || b.createdAt - a.createdAt;

export const profileFromFirestore = (data: Data | undefined): GymProfile => {
    const units = (data?.units ?? {}) as Data;
    return {
        name: str(data?.name),
        birthdate: str(data?.birthdate) || null,
        units: {
            weight: oneOf(units.weight, WEIGHT_UNITS, DEFAULT_UNITS.weight),
            distance: oneOf(units.distance, DISTANCE_UNITS, DEFAULT_UNITS.distance),
            height: oneOf(units.height, HEIGHT_UNITS, DEFAULT_UNITS.height),
        },
        weightHistory: arr(data?.weightHistory)
            .map((e): WeightEntry => measurementFromFirestore<WeightUnit>(e, WEIGHT_UNITS, "kg"))
            .sort(byDateDesc),
        heightHistory: arr(data?.heightHistory)
            .map((e): HeightEntry => measurementFromFirestore<HeightUnit>(e, HEIGHT_UNITS, "cm"))
            .sort(byDateDesc),
        targetBmi: num(data?.targetBmi),
        gyms: arr(data?.gyms).filter((g): g is string => typeof g === "string" && !!g.trim()),
        defaultGym: str(data?.defaultGym) || null,
        onboardedAt: num(data?.onboardedAt),
    };
};

export const profileToFirestore = (profile: GymProfile) => ({
    name: profile.name,
    birthdate: profile.birthdate,
    units: { ...profile.units },
    weightHistory: profile.weightHistory.map((e) => ({ ...e })),
    heightHistory: profile.heightHistory.map((e) => ({ ...e })),
    targetBmi: profile.targetBmi,
    gyms: [...profile.gyms],
    defaultGym: profile.defaultGym,
    onboardedAt: profile.onboardedAt,
});

export const isProfileEmpty = (profile: GymProfile): boolean =>
    !profile.name && !profile.birthdate && profile.weightHistory.length === 0 && profile.heightHistory.length === 0;
