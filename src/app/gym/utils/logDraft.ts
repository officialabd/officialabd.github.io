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
import { convertWeight, isWeightUnit } from "./units";

export const emptySet = (): GymSet => ({ value: null, reps: null, distance: null, completed: null });

export const isSetFilled = (set: GymSet): boolean =>
    (set.value !== null && set.value !== undefined) || (set.distance !== null && set.distance !== undefined);

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
            unit: isWeightUnit(ex.unit) ? "mins" : ex.unit,
            distanceUnit: ex.distanceUnit ?? distanceUnit,
        };
    }
    return { ...ex, per, distanceUnit: null };
};

/** Change exercise type, resetting the unit to a sensible default for that type. */
export const withType = <T extends ExerciseShape>(ex: T, type: ExerciseType, weightUnit: WeightUnit): T => {
    if (ex.type === type) return ex;
    const per = type === "weight" && ex.per === "running" ? "fullBody" : ex.per;
    return {
        ...ex,
        type,
        per,
        unit: type === "weight" ? weightUnit : "mins",
        distanceUnit: per === "running" ? ex.distanceUnit : null,
    };
};

export const logExerciseFromLibrary = (ex: GymExercise): GymLogExercise => ({
    exerciseId: ex.id,
    name: ex.name,
    group: ex.group,
    type: ex.type,
    unit: ex.unit,
    per: ex.per,
    distanceUnit: ex.distanceUnit,
    completed: null,
    sets: resizeSets([], ex.setsNo || DEFAULT_SETS),
});

/** Recompute the completed flags from the set values. */
export const normalizeLogExercise = (ex: GymLogExercise): GymLogExercise => {
    const sets = ex.sets.map((s) => ({ ...s, completed: isSetFilled(s) ? true : null }));
    const allFilled = sets.length > 0 && sets.every((s) => s.completed);
    return { ...ex, sets, completed: allFilled ? true : null };
};

/** Change the unit of an exercise. Weight values are converted so they keep their meaning. */
export const withUnit = (ex: GymLogExercise, unit: Unit): GymLogExercise => {
    if (ex.unit === unit) return ex;
    if (isWeightUnit(ex.unit) && isWeightUnit(unit)) {
        const from = ex.unit;
        return {
            ...ex,
            unit,
            sets: ex.sets.map((s) => ({ ...s, value: s.value === null ? null : convertWeight(s.value, from, unit) })),
        };
    }
    return { ...ex, unit };
};

/** Switch every weight exercise of a draft to one weight unit (converting values). */
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
            : { ...prev, completed: null, sets: resizeSets([], prev.sets.length || DEFAULT_SETS) };
        return fillWeightsFrom(fresh, prev);
    }),
});
