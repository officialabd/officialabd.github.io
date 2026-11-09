/**
 * Firestore access for the gym app. All data is scoped to `gymUsers/{uid}`.
 *
 * Queries use at most one equality or one range filter and sort on the client,
 * so they only need Firestore's automatic single-field indexes.
 */
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { COLLECTIONS } from "../constants";
import type { GymExercise, GymExerciseInput, GymLogEntry, GymPlan, GymProfile, LogDraft } from "../types";
import { sortLogsDesc } from "../utils/logQuery";
import { mergeIntoLog, mergeIntoPlan } from "../utils/merge";
import { commitInBatches, type WriteOp } from "./batch";
import {
    exerciseFromFirestore,
    exerciseToFirestore,
    logFromFirestore,
    logToFirestore,
    planFromFirestore,
    planToFirestore,
    profileFromFirestore,
    profileToFirestore,
} from "./mappers";

// ============================================================================
// References
// ============================================================================

export const userDoc = (uid: string) => doc(db, COLLECTIONS.users, uid);
export const exercisesCol = (uid: string) => collection(db, COLLECTIONS.users, uid, COLLECTIONS.exercises);
export const plansCol = (uid: string) => collection(db, COLLECTIONS.users, uid, COLLECTIONS.plans);
export const logsCol = (uid: string) => collection(db, COLLECTIONS.users, uid, COLLECTIONS.logs);

// ============================================================================
// User document (profile + schema version)
// ============================================================================

export async function fetchUser(uid: string): Promise<{ profile: GymProfile; schemaVersion: number }> {
    const snap = await getDoc(userDoc(uid));
    const data = snap.data();
    return {
        profile: profileFromFirestore(data),
        schemaVersion: typeof data?.schemaVersion === "number" ? data.schemaVersion : 0,
    };
}

export async function saveProfile(uid: string, profile: GymProfile): Promise<void> {
    await setDoc(userDoc(uid), { ...profileToFirestore(profile), updatedAt: Date.now() }, { merge: true });
}

// ============================================================================
// Exercises
// ============================================================================

export async function fetchExercises(uid: string): Promise<GymExercise[]> {
    const snap = await getDocs(exercisesCol(uid));
    return snap.docs
        .map((d) => exerciseFromFirestore(d.id, d.data()))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function createExercise(uid: string, input: GymExerciseInput): Promise<GymExercise> {
    const now = Date.now();
    const payload = exerciseToFirestore({ ...input, createdAt: now, updatedAt: now });
    const ref = await addDoc(exercisesCol(uid), payload);
    return exerciseFromFirestore(ref.id, payload);
}

export async function updateExercise(uid: string, exercise: GymExercise): Promise<GymExercise> {
    const updated = { ...exercise, updatedAt: Date.now() };
    await setDoc(doc(exercisesCol(uid), exercise.id), exerciseToFirestore(updated));
    return updated;
}

export async function deleteExercise(uid: string, exerciseId: string): Promise<void> {
    await deleteDoc(doc(exercisesCol(uid), exerciseId));
}

/**
 * Merge exercises into `keep`: every log and plan day referencing a removed exercise is
 * re-linked to `keep`, then the removed exercises are deleted. References are rewritten
 * before anything is deleted, so an interruption never leaves dangling links.
 */
export async function mergeExercises(uid: string, keep: GymExercise, removeIds: string[]): Promise<void> {
    const remove = new Set(removeIds.filter((id) => id !== keep.id));
    if (remove.size === 0) return;
    const [plans, logs] = await Promise.all([fetchPlans(uid), fetchAllLogs(uid)]);
    const now = Date.now();
    const updates: WriteOp[] = [
        ...plans.flatMap((plan): WriteOp[] => {
            const merged = mergeIntoPlan(plan, keep.id, remove);
            return merged ? [{ kind: "set", ref: doc(plansCol(uid), plan.id), data: planToFirestore({ ...merged, updatedAt: now }) }] : [];
        }),
        ...logs.flatMap((log): WriteOp[] => {
            const merged = mergeIntoLog(log, keep, remove);
            return merged ? [{ kind: "set", ref: doc(logsCol(uid), log.id), data: logToFirestore({ ...merged, updatedAt: now }) }] : [];
        }),
    ];
    await commitInBatches(updates);
    await commitInBatches(Array.from(remove, (id): WriteOp => ({ kind: "delete", ref: doc(exercisesCol(uid), id) })));
}

// ============================================================================
// Plans
// ============================================================================

export async function fetchPlans(uid: string): Promise<GymPlan[]> {
    const snap = await getDocs(plansCol(uid));
    return snap.docs
        .map((d) => planFromFirestore(d.id, d.data()))
        .sort((a, b) => a.createdAt - b.createdAt || a.title.localeCompare(b.title));
}

export async function createPlan(uid: string, plan: Omit<GymPlan, "id">): Promise<GymPlan> {
    const ref = await addDoc(plansCol(uid), planToFirestore(plan));
    return { ...plan, id: ref.id };
}

export async function updatePlan(uid: string, plan: GymPlan): Promise<GymPlan> {
    const updated = { ...plan, updatedAt: Date.now() };
    await setDoc(doc(plansCol(uid), plan.id), planToFirestore(updated));
    return updated;
}

export async function deletePlan(uid: string, planId: string): Promise<void> {
    await deleteDoc(doc(plansCol(uid), planId));
}

// ============================================================================
// Logs
// ============================================================================

const runLogsQuery = async (q: ReturnType<typeof query>): Promise<GymLogEntry[]> => {
    const snap = await getDocs(q);
    return sortLogsDesc(snap.docs.map((d) => logFromFirestore(d.id, d.data() as Record<string, any>)));
};

export const fetchAllLogs = (uid: string) => runLogsQuery(query(logsCol(uid)));

export const fetchLogsByDay = (uid: string, dayId: string) =>
    runLogsQuery(query(logsCol(uid), where("dayId", "==", dayId)));

export async function fetchRunningLog(uid: string): Promise<GymLogEntry | null> {
    const logs = await runLogsQuery(query(logsCol(uid), where("status", "==", "running")));
    return logs[0] ?? null;
}

/** Most recent completed session of a plan day. */
export async function fetchLastCompletedLog(uid: string, dayId: string): Promise<GymLogEntry | null> {
    const logs = await fetchLogsByDay(uid, dayId);
    return logs.find((l) => l.status === "completed") ?? null;
}

export async function createLog(uid: string, draft: LogDraft): Promise<GymLogEntry> {
    const now = Date.now();
    const payload = logToFirestore({ ...draft, createdAt: now, updatedAt: now });
    const ref = await addDoc(logsCol(uid), payload);
    return { ...draft, id: ref.id, createdAt: now, updatedAt: now };
}

/** Overwrite a log. `createdAt` is preserved — it is never bumped by edits. */
export async function updateLog(uid: string, logId: string, draft: LogDraft, createdAt: number): Promise<GymLogEntry> {
    const now = Date.now();
    await setDoc(doc(logsCol(uid), logId), logToFirestore({ ...draft, createdAt, updatedAt: now }));
    return { ...draft, id: logId, createdAt, updatedAt: now };
}

export async function deleteLog(uid: string, logId: string): Promise<void> {
    await deleteDoc(doc(logsCol(uid), logId));
}
