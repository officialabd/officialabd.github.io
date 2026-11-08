/**
 * Pure helpers that build and transform session/log drafts.
 * Shared by the running session and the log editor so both behave identically.
 */
import { DEFAULT_SETS } from "../constants";
import type {
    DistanceUnit,
    ExerciseType,
    GymExercise,
    GymLogEntry,
    GymLogExercise,
    GymPlan,
    GymPlanDay,
    GymSet,
    LogDraft,
    Per,
    Unit,
    WeightUnit,
} from "../types";
import { isTimeUnit } from "./units";

export const emptySet = (): GymSet => ({ value: null, reps: null, distance: null, calories: null, completed: null });

/** A set counts as done when its main value is entered: reps for reps-only exercises, otherwise weight/time or distance. */
export const isSetFilled = (set: GymSet, type: ExerciseType): boolean =>
    type === "reps" ? set.reps !== null : set.value !== null || set.distance !== null;

export const resizeSets = (sets: GymSet[], count: number): GymSet[] => {
    const safe = Math.max(0, count);
    if (sets.length >= safe) return sets.slice(0, safe);
    return [...sets, ...Array.from({ length: safe - sets.length }, emptySet)];
};

/** Whether an exercise records a lifted weight (as opposed to time or running). */
export const isWeightExercise = (ex: { type: ExerciseType; per: Per }): boolean =>
    ex.type === "weight" && ex.per !== "running";

interface ExerciseShape {
    type: ExerciseType;
    unit: Unit;
    per: Per;
    distanceUnit: DistanceUnit | null;
}

/**
 * Change the "per" of an exercise, keeping type/unit consistent:
 * running exercises are always timed and track distance.
 */
export const withPer = <T extends ExerciseShape>(ex: T, per: Per, distanceUnit: DistanceUnit): T => {
    if (per === "running") {
        return {
            ...ex,
            per,
            type: "time",
            unit: isTimeUnit(ex.unit) ? ex.unit : "mins",
            distanceUnit: ex.distanceUnit ?? distanceUnit,
        };
    }
    return { ...ex, per, distanceUnit: null };
};

const DEFAULT_UNIT: Record<ExerciseType, (weightUnit: WeightUnit) => Unit> = {
    weight: (weightUnit) => weightUnit,
    time: () => "mins",
    reps: () => "reps",
};

/** Change exercise type, resetting the unit to a sensible default for that type. Only timed exercises can be running. */
export const withType = <T extends ExerciseShape>(ex: T, type: ExerciseType, weightUnit: WeightUnit): T => {
    if (ex.type === type) return ex;
    const per = type !== "time" && ex.per === "running" ? "fullBody" : ex.per;
    return {
        ...ex,
        type,
        per,
        unit: DEFAULT_UNIT[type](weightUnit),
        distanceUnit: per === "running" ? ex.distanceUnit : null,
    };
};

export const logExerciseFromLibrary = (ex: GymExercise): GymLogExercise => ({
    exerciseId: ex.id,
    name: ex.name,
    groups: ex.groups,
    type: ex.type,
    unit: ex.unit,
    per: ex.per,
    distanceUnit: ex.distanceUnit,
    completed: null,
    skipped: false,
    sets: resizeSets([], ex.setsNo || DEFAULT_SETS),
});

/** Recompute the completed flags from the set values. A skipped exercise is never completed. */
export const normalizeLogExercise = (ex: GymLogExercise): GymLogExercise => {
    const sets = ex.sets.map((s) => ({ ...s, completed: isSetFilled(s, ex.type) ? true : null }));
    const allFilled = sets.length > 0 && sets.every((s) => s.completed);
    return { ...ex, sets, completed: allFilled && !ex.skipped ? true : null };
};

/** Change the unit an exercise is recorded in. Values are kept as entered (no conversion). */
export const withUnit = (ex: GymLogExercise, unit: Unit): GymLogExercise => (ex.unit === unit ? ex : { ...ex, unit });

/** Record every weight exercise of a draft in one weight unit. Values are kept as entered. */
export const withWeightUnit = <T extends Pick<LogDraft, "exercises">>(draft: T, unit: WeightUnit): T => ({
    ...draft,
    exercises: draft.exercises.map((ex) => (isWeightExercise(ex) ? withUnit(ex, unit) : ex)),
});

// ============================================================================
// Building drafts
// ============================================================================

const baseDraft = (plan: GymPlan, day: GymPlanDay, date: string): Omit<LogDraft, "exercises"> => ({
    planId: plan.id,
    planTitle: plan.title,
    dayId: day.id,
    dayTitle: day.title,
    date,
    gym: null,
    note: "",
    status: null,
    startedAt: null,
    completedAt: null,
});

const dayExercises = (day: GymPlanDay, library: Map<string, GymExercise>): GymExercise[] =>
    day.exerciseIds.map((id) => library.get(id)).filter((ex): ex is GymExercise => !!ex);

/** Fresh draft with the day's exercises from the library. */
export const buildDraftFromDay = (
    plan: GymPlan,
    day: GymPlanDay,
    library: Map<string, GymExercise>,
    date: string
): LogDraft => ({
    ...baseDraft(plan, day, date),
    exercises: dayExercises(day, library).map(logExerciseFromLibrary),
});

/**
 * Copy weights (never reps) from a previous performance of the same exercise.
 * The previous unit is kept so the recorded values stay exact.
 */
const fillWeightsFrom = (ex: GymLogExercise, previous: GymLogExercise | undefined): GymLogExercise => {
    if (!previous || !isWeightExercise(ex) || !isWeightExercise(previous)) return ex;
    const prevValues = previous.sets.map((s) => s.value).filter((v): v is number => v !== null);
    if (prevValues.length === 0) return ex;
    return {
        ...ex,
        unit: previous.unit,
        sets: ex.sets.map((s, i) => ({ ...s, value: prevValues[Math.min(i, prevValues.length - 1)] })),
    };
};

const findPrevious = (previous: GymLogEntry, exerciseId: string | null) =>
    exerciseId ? previous.exercises.find((p) => p.exerciseId === exerciseId) : undefined;

/**
 * "Load previous values": the plan's exercises, with weights from the previous session.
 * Plan exercises missing from the previous session stay fresh; extra logged exercises are ignored.
 */
export const buildDraftWithPreviousValues = (
    plan: GymPlan,
    day: GymPlanDay,
    library: Map<string, GymExercise>,
    previous: GymLogEntry,
    date: string
): LogDraft => {
    const draft = buildDraftFromDay(plan, day, library, date);
    return {
        ...draft,
        exercises: draft.exercises.map((ex) => fillWeightsFrom(ex, findPrevious(previous, ex.exerciseId))),
    };
};

/**
 * "Load previous session": the exact exercise list of the previous session, with its weights.
 * Set counts come from the exercise definition; reps are never copied.
 */
export const buildDraftFromPreviousSession = (
    plan: GymPlan,
    day: GymPlanDay,
    library: Map<string, GymExercise>,
    previous: GymLogEntry,
    date: string
): LogDraft => ({
    ...baseDraft(plan, day, date),
    exercises: previous.exercises.map((prev) => {
        const libraryExercise = prev.exerciseId ? library.get(prev.exerciseId) : undefined;
        const fresh: GymLogExercise = libraryExercise
            ? logExerciseFromLibrary(libraryExercise)
            : { ...prev, completed: null, skipped: false, sets: resizeSets([], prev.sets.length || DEFAULT_SETS) };
        return fillWeightsFrom(fresh, prev);
    }),
});
