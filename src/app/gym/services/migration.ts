/**
 * One-time, per-user migration from the legacy collections
 *   gymPlans/{uid}/plans, gymLogs/{uid}/logs
 * to the new structure under gymUsers/{uid}.
 *
 * - Legacy documents are only read, never modified or deleted (they stay as a backup).
 * - Plan, day and log IDs are kept, so existing links (log -> plan/day) remain valid.
 * - Exercises embedded in plans and logs become library exercises. Names that match
 *   case-insensitively become a single exercise. Exercise IDs are derived from the
 *   name, so re-running an interrupted migration overwrites instead of duplicating.
 * - Log values, units and types are copied as-is; each logged exercise gains an exerciseId.
 */
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { COLLECTIONS, SCHEMA_VERSION } from "../constants";
import { exerciseToFirestore, logToFirestore, planToFirestore } from "./mappers";
import { exercisesCol, logsCol, plansCol, userDoc } from "./gymService";
import { commitInBatches, type WriteOp } from "./batch";
import { transformLegacy, type LegacyData } from "./legacyTransform";

async function readLegacy(uid: string): Promise<LegacyData> {
    const [plansSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.legacyPlans, uid, "plans")),
        getDocs(collection(db, COLLECTIONS.legacyLogs, uid, "logs")),
    ]);
    return {
        plans: plansSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
        logs: logsSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
    };
}

/** Whether a user document at `schemaVersion` still needs the migration. */
export const needsMigration = (schemaVersion: number): boolean => schemaVersion < SCHEMA_VERSION;

/**
 * Migrates the signed-in user's legacy data. Call it only when `needsMigration` says so
 * (the schema version comes from the user document read while loading the account).
 */
export async function migrateUser(uid: string): Promise<void> {
    const legacy = await readLegacy(uid);
    const { exercises, plans, logs } = transformLegacy(legacy);

    await commitInBatches([
        ...exercises.map((ex): WriteOp => ({ kind: "set", ref: doc(exercisesCol(uid), ex.id), data: exerciseToFirestore(ex) })),
        ...plans.map((p): WriteOp => ({ kind: "set", ref: doc(plansCol(uid), p.id), data: planToFirestore(p) })),
        ...logs.map((l): WriteOp => ({ kind: "set", ref: doc(logsCol(uid), l.id), data: logToFirestore(l) })),
    ]);

    // Marked last: an interrupted migration simply runs again on the next login.
    await setDoc(
        userDoc(uid),
        {
            schemaVersion: SCHEMA_VERSION,
            migratedAt: Date.now(),
            migratedFrom: {
                plans: legacy.plans.length,
                logs: legacy.logs.length,
                exercisesCreated: exercises.length,
            },
        },
        { merge: true }
    );
}
