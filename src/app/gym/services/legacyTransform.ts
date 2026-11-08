/**
 * Pure transformation of the legacy gym data (plans with embedded exercises + logs)
 * into the new model. No Firestore access, so it can be tested in isolation.
 */
import { DEFAULT_SETS, MIGRATED_WEIGHT_UNIT } from "../constants";
import type { GymExercise, GymLogEntry, GymPlan } from "../types";
import { exerciseNameKey, toLocalISODate } from "../utils";
import { exerciseFromFirestore, logFromFirestore } from "./mappers";

/** Small deterministic string hash (FNV-1a, 32-bit) used for stable exercise IDs. */
const hash = (input: string): string => {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
};

const exerciseIdFor = (name: string) => `ex-${hash(exerciseNameKey(name))}`;

type Data = Record<string, any>;

export interface LegacyData {
    plans: { id: string; data: Data }[];
    logs: { id: string; data: Data }[];
}


/** Builds the exercise library, plans and logs from legacy documents. */
export function transformLegacy({ plans: legacyPlans, logs: legacyLogs }: LegacyData, now = Date.now()) {
    const exercises = new Map<string, GymExercise>();

    const registerExercise = (raw: Data, setsFallback: number): string | null => {
        const name = typeof raw?.name === "string" ? raw.name : "";
        if (!name.trim()) return null;
        const id = exerciseIdFor(name);
        if (!exercises.has(id)) {
            const parsed = exerciseFromFirestore(id, {
                ...raw,
                setsNo: typeof raw.setsNo === "number" ? raw.setsNo : setsFallback,
                createdAt: now,
                updatedAt: now,
            });
            exercises.set(id, parsed.type === "weight" ? { ...parsed, unit: MIGRATED_WEIGHT_UNIT } : parsed);
        }
        return id;
    };

    // Plans first (most recently updated wins), so library definitions come from plans when possible.
    const plansNewestFirst = [...legacyPlans].sort(
        (a, b) => (b.data.updatedAt ?? 0) - (a.data.updatedAt ?? 0)
    );
    const plans: GymPlan[] = plansNewestFirst.map(({ id, data }) => ({
        id,
        title: typeof data.title === "string" ? data.title : "",
        note: typeof data.note === "string" ? data.note : "",
        createdAt: typeof data.createdAt === "number" ? data.createdAt : now,
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : now,
        days: (Array.isArray(data.days) ? data.days : []).filter(Boolean).map((day: Data) => {
            const ids = (Array.isArray(day.exercises) ? day.exercises : [])
                .filter(Boolean)
                .map((ex: Data) => registerExercise(ex, DEFAULT_SETS))
                .filter((x: string | null): x is string => !!x);
            return {
                id: typeof day.id === "string" ? day.id : "",
                title: typeof day.title === "string" ? day.title : "",
                note: typeof day.note === "string" ? day.note : "",
                exerciseIds: Array.from(new Set<string>(ids)),
            };
        }),
    }));

    const logs: GymLogEntry[] = legacyLogs
        .map(({ id, data }) => logFromFirestore(id, data))
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((log) => {
            const raw = legacyLogs.find((l) => l.id === log.id)!.data;
            const rawExercises: Data[] = (Array.isArray(raw.exercises) ? raw.exercises : []).filter(Boolean);
            return {
                ...log,
                date: log.date || toLocalISODate(new Date(log.createdAt || now)),
                updatedAt: log.createdAt || now,
                exercises: log.exercises.map((ex, idx) => ({
                    ...ex,
                    exerciseId: registerExercise(rawExercises[idx] ?? {}, ex.sets.length || DEFAULT_SETS),
                })),
            };
        });

    return { exercises: Array.from(exercises.values()), plans, logs };
}
