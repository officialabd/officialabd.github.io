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
    limit,
    orderBy,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { COLLECTIONS } from "../constants";
import type { GymExercise, GymExerciseInput, GymLogEntry, GymPlan, GymProfile, LogDraft } from "../types";
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

/** Newest session first: by session date, then by creation time. */
export const sortLogsDesc = (logs: GymLogEntry[]): GymLogEntry[] =>
    [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

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

/** Logs whose session date is within [from, to] (inclusive, YYYY-MM-DD). */
export const fetchLogsInRange = (uid: string, from: string, to: string) =>
    runLogsQuery(query(logsCol(uid), where("date", ">=", from), where("date", "<=", to)));

/** The `count` most recent sessions by session date. */
export const fetchLatestLogs = (uid: string, count: number) =>
    runLogsQuery(query(logsCol(uid), orderBy("date", "desc"), limit(count)));

export const fetchLogsByPlan =(uid: string, planId: string) =>
    runLogsQuery(query(logsCol(uid), where("planId", "==", planId)));

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
