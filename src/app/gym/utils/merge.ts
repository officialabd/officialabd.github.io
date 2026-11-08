/**
 * Pure helpers for merging library exercises: references to the removed exercises
 * are pointed at the kept one, so their history becomes the kept exercise's history.
 */
import type { GymExercise, GymLogEntry, GymPlan } from "../types";

/** Plan days with removed exercises replaced by the kept one (keeping order, no duplicates). Null when unchanged. */
export const mergeIntoPlan = (plan: GymPlan, keepId: string, removeIds: Set<string>): GymPlan | null => {
    let changed = false;
    const days = plan.days.map((day) => {
        if (!day.exerciseIds.some((id) => removeIds.has(id))) return day;
        changed = true;
        const ids = day.exerciseIds.map((id) => (removeIds.has(id) ? keepId : id));
        return { ...day, exerciseIds: Array.from(new Set(ids)) };
    });
    return changed ? { ...plan, days } : null;
};

/**
 * Log with removed exercises re-linked to the kept one and renamed to it.
 * Recorded values, units and groups are left as performed. Null when unchanged.
 */
export const mergeIntoLog = (log: GymLogEntry, keep: GymExercise, removeIds: Set<string>): GymLogEntry | null => {
    if (!log.exercises.some((ex) => ex.exerciseId && removeIds.has(ex.exerciseId))) return null;
    return {
        ...log,
        exercises: log.exercises.map((ex) =>
            ex.exerciseId && removeIds.has(ex.exerciseId) ? { ...ex, exerciseId: keep.id, name: keep.name } : ex
        ),
    };
};
