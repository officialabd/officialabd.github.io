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
import { collection, doc, getDocs, setDoc, writeBatch, type DocumentReference } from "firebase/firestore";
import { db } from "../../../../firebase";
import { COLLECTIONS, SCHEMA_VERSION } from "../constants";
import { exerciseToFirestore, logToFirestore, planToFirestore } from "./mappers";
import { exercisesCol, fetchUser, logsCol, plansCol, userDoc } from "./gymService";
import { transformLegacy, type LegacyData } from "./legacyTransform";

const BATCH_LIMIT = 400;

type Write = [DocumentReference, Record<string, unknown>];

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

/**
 * Migrates the signed-in user's legacy data once. Safe to call on every login:
 * returns immediately when the user is already on the current schema.
 */
export async function migrateUserIfNeeded(uid: string): Promise<void> {
    const { schemaVersion } = await fetchUser(uid);
    if (schemaVersion >= SCHEMA_VERSION) return;

    const legacy = await readLegacy(uid);
    const { exercises, plans, logs } = transformLegacy(legacy);

    const writes: Write[] = [
        ...exercises.map((ex): Write => [doc(exercisesCol(uid), ex.id), exerciseToFirestore(ex)]),
        ...plans.map((p): Write => [doc(plansCol(uid), p.id), planToFirestore(p)]),
        ...logs.map((l): Write => [doc(logsCol(uid), l.id), logToFirestore(l)]),
    ];

    for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        writes.slice(i, i + BATCH_LIMIT).forEach(([ref, data]) => batch.set(ref, data));
        await batch.commit();
    }

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
