/**
 * Pure calculations behind the Stats tab. Weights are converted to the display unit per
 * logged exercise, so history recorded in kg and lb forms one series.
 */
import type {
    DistanceUnit,
    GymExercise,
    GymLogEntry,
    GymLogExercise,
    GymProfile,
    MuscleGroup,
    WeightUnit,
} from "../types";
import { isSetFilled, isWeightExercise } from "./logDraft";
import { computeSpeed, convertDistance, convertWeight, isTimeUnit, isWeightUnit, round, toMinutes, weightForBmi } from "./units";

// ============================================================================
// Dates (local ISO strings, YYYY-MM-DD)
// ============================================================================

const parseISO = (iso: string): Date => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};

const toISO = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (iso: string, days: number): string => {
    const d = parseISO(iso);
    d.setDate(d.getDate() + days);
    return toISO(d);
};

/** Monday of the week containing `iso`. */
export const weekStart = (iso: string): string => {
    const d = parseISO(iso);
    return addDays(iso, -((d.getDay() + 6) % 7));
};

const daysBetween = (from: string, to: string): number => Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000);

/** Milliseconds at local midnight, for plotting dates on a time axis. */
export const dateValue = (iso: string): number => parseISO(iso).getTime();

export const median = (values: number[]): number | null => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// ============================================================================
// Filtering
// ============================================================================

export type StatsPeriod = "3m" | "6m" | "1y" | "all";
/** "" = all gyms, "none" = sessions without a gym, otherwise a gym name. */
export type GymFilter = string;
export const NO_GYM = "none";

export const periodStart = (period: StatsPeriod, today: string): string | null => {
    if (period === "all") return null;
    const d = parseISO(today);
    d.setMonth(d.getMonth() - (period === "3m" ? 3 : period === "6m" ? 6 : 12));
    return toISO(d);
};

/** Finished sessions in the period and gym, oldest first. Running sessions are left out. */
export const filterLogs = (logs: GymLogEntry[], from: string | null, gym: GymFilter): GymLogEntry[] =>
    logs
        .filter(
            (l) =>
                l.status !== "running" &&
                (!from || l.date >= from) &&
                (!gym || (gym === NO_GYM ? !l.gym : l.gym === gym))
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

/** Exercises of a log that were actually done (not skipped). */
const doneExercises = (log: GymLogEntry): GymLogExercise[] => log.exercises.filter((ex) => !ex.skipped);

// ============================================================================
// Strength
// ============================================================================

/** Estimated one-rep max (Epley). Only meaningful up to ~20 reps. */
export const estimate1RM = (weight: number, reps: number | null): number | null => {
    if (!reps || reps < 1 || reps > 20 || weight <= 0) return null;
    return reps === 1 ? weight : round(weight * (1 + reps / 30));
};

export interface ExerciseSession {
    date: string;
    logId: string;
    /** Heaviest set weight, in the display unit. */
    topWeight: number;
    topReps: number | null;
    /** Best estimated 1RM of the session, if any set had reps. */
    e1rm: number | null;
    /** Best single-set volume (weight × reps). */
    bestSetVolume: number | null;
    /** Whether this session set a new best estimated 1RM (or top weight when there are no reps). */
    isPr: boolean;
}

/** One entry per session in which `exerciseId` was lifted, oldest first. */
export const exerciseSessions = (logs: GymLogEntry[], exerciseId: string, unit: WeightUnit): ExerciseSession[] => {
    const sessions: ExerciseSession[] = [];
    let best = 0;
    for (const log of logs) {
        for (const ex of doneExercises(log)) {
            if (ex.exerciseId !== exerciseId || !isWeightExercise(ex) || !isWeightUnit(ex.unit)) continue;
            const sets = ex.sets
                .filter((s) => s.value !== null && s.value > 0)
                .map((s) => ({ weight: convertWeight(s.value as number, ex.unit as WeightUnit, unit), reps: s.reps }));
            if (sets.length === 0) continue;
            const top = sets.reduce((a, b) => (b.weight > a.weight || (b.weight === a.weight && (b.reps ?? 0) > (a.reps ?? 0)) ? b : a));
            const e1rms = sets.map((s) => estimate1RM(s.weight, s.reps)).filter((v): v is number => v !== null);
            const volumes = sets.filter((s) => s.reps).map((s) => round(s.weight * (s.reps as number)));
            const e1rm = e1rms.length ? Math.max(...e1rms) : null;
            const score = e1rm ?? top.weight;
            sessions.push({
                date: log.date,
                logId: log.id,
                topWeight: top.weight,
                topReps: top.reps,
                e1rm,
                bestSetVolume: volumes.length ? Math.max(...volumes) : null,
                isPr: score > best,
            });
            best = Math.max(best, score);
        }
    }
    return sessions;
};

/** Library weight exercises that appear in the logs, by name. */
export const loggedWeightExercises = (logs: GymLogEntry[], library: GymExercise[]): GymExercise[] => {
    const ids = new Set(logs.flatMap((l) => doneExercises(l).filter(isWeightExercise).map((ex) => ex.exerciseId)));
    return library.filter((e) => ids.has(e.id) && isWeightExercise(e));
};

export interface Best {
    value: number;
    date: string;
}

export interface ExerciseRecord {
    exercise: GymExercise;
    sessions: number;
    bestWeight: Best;
    bestE1rm: Best | null;
    bestSetVolume: Best | null;
    last: { date: string; topWeight: number };
    /** Last session's top weight as a share of the best (1 = at the best). */
    lastVsBest: number;
}

const bestOf = (sessions: ExerciseSession[], pick: (s: ExerciseSession) => number | null): Best | null =>
    sessions.reduce<Best | null>((best, s) => {
        const value = pick(s);
        return value !== null && (!best || value > best.value) ? { value, date: s.date } : best;
    }, null);

export const exerciseRecords = (logs: GymLogEntry[], library: GymExercise[], unit: WeightUnit): ExerciseRecord[] =>
    loggedWeightExercises(logs, library).flatMap((exercise): ExerciseRecord[] => {
        const sessions = exerciseSessions(logs, exercise.id, unit);
        const bestWeight = bestOf(sessions, (s) => s.topWeight);
        if (!bestWeight) return [];
        const last = sessions[sessions.length - 1];
        return [
            {
                exercise,
                sessions: sessions.length,
                bestWeight,
                bestE1rm: bestOf(sessions, (s) => s.e1rm),
                bestSetVolume: bestOf(sessions, (s) => s.bestSetVolume),
                last: { date: last.date, topWeight: last.topWeight },
                lastVsBest: last.topWeight / bestWeight.value,
            },
        ];
    });

export type Trend = "stalled" | "declining";

export interface StalledExercise {
    exercise: GymExercise;
    trend: Trend;
    /** Best score before the recent window, and the best within it (e1RM, or top weight without reps). */
    previousBest: number;
    recentBest: number;
    lastPrDate: string;
    sessionsSincePr: number;
}

/**
 * Exercises that haven't beaten their earlier best in the last `window` sessions.
 * Within 5% of the best counts as stalled; further below counts as declining.
 */
export const stalledExercises = (
    logs: GymLogEntry[],
    library: GymExercise[],
    unit: WeightUnit,
    window: number
): StalledExercise[] =>
    loggedWeightExercises(logs, library)
        .flatMap((exercise): StalledExercise[] => {
            const sessions = exerciseSessions(logs, exercise.id, unit);
            if (sessions.length <= window) return [];
            const score = (s: ExerciseSession) => s.e1rm ?? s.topWeight;
            const previousBest = Math.max(...sessions.slice(0, -window).map(score));
            const recentBest = Math.max(...sessions.slice(-window).map(score));
            if (recentBest > previousBest) return [];
            const lastPrIndex = sessions.map((s) => s.isPr).lastIndexOf(true);
            return [
                {
                    exercise,
                    trend: recentBest >= previousBest * 0.95 ? "stalled" : "declining",
                    previousBest,
                    recentBest,
                    lastPrDate: sessions[lastPrIndex].date,
                    sessionsSincePr: sessions.length - 1 - lastPrIndex,
                },
            ];
        })
        .sort((a, b) => b.sessionsSincePr - a.sessionsSincePr);

// ============================================================================
// Consistency
// ============================================================================

export interface Consistency {
    /** Sessions per date. */
    byDate: Map<string, GymLogEntry[]>;
    /** Sessions per week (keyed by Monday), for every week from the first to the current one. */
    weeks: { week: string; sessions: number }[];
    /** Consecutive weeks with at least one session, up to this week (or last week, if this one is empty so far). */
    currentStreak: number;
    longestStreak: number;
    averagePerWeek: number;
}

export const consistency = (logs: GymLogEntry[], from: string | null, today: string): Consistency => {
    const byDate = new Map<string, GymLogEntry[]>();
    logs.forEach((l) => byDate.set(l.date, [...(byDate.get(l.date) ?? []), l]));

    const first = from ?? logs[0]?.date ?? today;
    const weeks: Consistency["weeks"] = [];
    for (let w = weekStart(first); w <= today; w = addDays(w, 7)) {
        const end = addDays(w, 6);
        weeks.push({ week: w, sessions: logs.filter((l) => l.date >= w && l.date <= end).length });
    }

    let longestStreak = 0;
    let run = 0;
    weeks.forEach((w) => {
        run = w.sessions > 0 ? run + 1 : 0;
        longestStreak = Math.max(longestStreak, run);
    });
    const counted = weeks.length > 0 && weeks[weeks.length - 1].sessions === 0 ? weeks.slice(0, -1) : weeks;
    let currentStreak = 0;
    for (let i = counted.length - 1; i >= 0 && counted[i].sessions > 0; i--) currentStreak++;

    return {
        byDate,
        weeks,
        currentStreak,
        longestStreak,
        averagePerWeek: weeks.length ? round(logs.length / weeks.length) : 0,
    };
};

// ============================================================================
// Training balance
// ============================================================================

export interface MuscleVolume {
    group: MuscleGroup;
    sets: number;
}

/**
 * Completed sets per muscle group. An exercise counts fully toward each of its groups.
 * Groups come from the library when the exercise still exists, otherwise from the log snapshot.
 */
export const muscleSets = (logs: GymLogEntry[], library: Map<string, GymExercise>): MuscleVolume[] => {
    const totals = new Map<MuscleGroup, number>();
    logs.forEach((log) =>
        doneExercises(log).forEach((ex) => {
            const sets = ex.sets.filter((s) => isSetFilled(s, ex)).length;
            if (!sets) return;
            const groups = (ex.exerciseId && library.get(ex.exerciseId)?.groups) || ex.groups;
            groups.forEach((g) => totals.set(g, (totals.get(g) ?? 0) + sets));
        })
    );
    return Array.from(totals, ([group, sets]) => ({ group, sets })).sort((a, b) => b.sets - a.sets);
};

/** Logs within one week (Monday `week` to Sunday). */
export const logsInWeek = (logs: GymLogEntry[], week: string): GymLogEntry[] => {
    const end = addDays(week, 6);
    return logs.filter((l) => l.date >= week && l.date <= end);
};

/** Number of weeks covered by the period (at least 1), for weekly averages. */
export const weeksInPeriod = (logs: GymLogEntry[], from: string | null, today: string): number => {
    const first = from ?? logs[0]?.date ?? today;
    return Math.max(1, Math.ceil((daysBetween(first, today) + 1) / 7));
};

export const REP_RANGES = [
    { id: "low", label: "1–5 reps", min: 1, max: 5 },
    { id: "medium", label: "6–12 reps", min: 6, max: 12 },
    { id: "high", label: "13+ reps", min: 13, max: Infinity },
] as const;

/** Number of completed sets in each rep range (weight and reps-only exercises). */
export const repRangeCounts = (logs: GymLogEntry[]): number[] => {
    const counts = REP_RANGES.map(() => 0);
    logs.forEach((log) =>
        doneExercises(log).forEach((ex) => {
            if (ex.type === "time") return;
            ex.sets.forEach((s) => {
                if (!s.reps || !isSetFilled(s, ex)) return;
                const i = REP_RANGES.findIndex((r) => s.reps! >= r.min && s.reps! <= r.max);
                if (i >= 0) counts[i]++;
            });
        })
    );
    return counts;
};

export interface SessionDuration {
    date: string;
    dayTitle: string;
    minutes: number;
}

/** Durations of sessions with a start and end time, oldest first. Optionally one plan day only. */
export const sessionDurations = (logs: GymLogEntry[], dayId = ""): SessionDuration[] =>
    logs
        .filter((l) => l.startedAt && l.completedAt && l.completedAt > l.startedAt && (!dayId || l.dayId === dayId))
        .map((l) => ({ date: l.date, dayTitle: l.dayTitle, minutes: Math.round((l.completedAt! - l.startedAt!) / 60000) }));

// ============================================================================
// Running
// ============================================================================

export interface Run {
    date: string;
    distance: number;
    minutes: number;
    calories: number | null;
    /** Minutes per distance unit. */
    pace: number | null;
    speed: number | null;
}

/** One entry per session with running, totals across its running sets, in `unit`. */
export const runs = (logs: GymLogEntry[], unit: DistanceUnit): Run[] =>
    logs.flatMap((log): Run[] => {
        let distance = 0;
        let minutes = 0;
        let calories: number | null = null;
        doneExercises(log)
            .filter((ex) => ex.per === "running")
            .forEach((ex) =>
                ex.sets.forEach((s) => {
                    if (s.distance) distance += convertDistance(s.distance, ex.distanceUnit ?? "km", unit);
                    if (s.value && isTimeUnit(ex.unit)) minutes += toMinutes(s.value, ex.unit);
                    if (s.calories) calories = (calories ?? 0) + s.calories;
                })
            );
        if (!distance && !minutes) return [];
        return [
            {
                date: log.date,
                distance: round(distance, 2),
                minutes: round(minutes),
                calories,
                pace: distance && minutes ? round(minutes / distance, 2) : null,
                speed: computeSpeed(distance || null, minutes || null, "mins"),
            },
        ];
    });

// ============================================================================
// Body weight
// ============================================================================

export interface BodyWeightTrend {
    points: { date: string; weight: number }[];
    /** Weight for the target BMI at the latest height, in `unit`. */
    target: number | null;
}

export const bodyWeightTrend = (profile: GymProfile, from: string | null, unit: WeightUnit): BodyWeightTrend => {
    const height = profile.heightHistory[0];
    const targetKg = profile.targetBmi && height ? weightForBmi(profile.targetBmi, height.value, height.unit) : null;
    return {
        points: profile.weightHistory
            .filter((w) => !from || w.date >= from)
            .map((w) => ({ date: w.date, weight: convertWeight(w.value, w.unit, unit) }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        target: targetKg !== null ? convertWeight(targetKg, "kg", unit) : null,
    };
};
