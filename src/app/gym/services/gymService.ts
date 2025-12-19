import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    setDoc,
    where,
    QueryConstraint,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import staticData from "../../staticData";
import {
    GymPlan,
    GymLogEntry,
    GymLogExercise,
    GymSet,
    planFromFirestore,
    planToFirestore,
    logEntryFromFirestore,
    logEntryToFirestore,
} from "../../models/Gym";
import type { LogDraft } from "../types";
import { todayISO } from "../utils";

const gymCollections = staticData.firebaseConst.collections.gym;

// ============================================================================
// PLANS SERVICE
// ============================================================================

/**
 * Fetch all plans for a user
 */
export async function fetchPlans(userId: string): Promise<GymPlan[]> {
    const snap = await getDocs(
        query(collection(db, gymCollections.plans), where("userId", "==", userId))
    );
    const items = snap.docs.map((d) => planFromFirestore(d.id, d.data()));
    items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.title.localeCompare(b.title));
    return items;
}

/**
 * Create a new plan
 */
export async function createPlan(plan: Omit<GymPlan, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, gymCollections.plans), planToFirestore(plan as GymPlan));
    return docRef.id;
}

/**
 * Update an existing plan
 */
export async function updatePlan(planId: string, plan: GymPlan): Promise<void> {
    await setDoc(doc(db, gymCollections.plans, planId), planToFirestore(plan), { merge: true });
}

/**
 * Delete a plan
 */
export async function deletePlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, gymCollections.plans, planId));
}

// ============================================================================
// LOGS SERVICE
// ============================================================================

/**
 * Sanitize a log draft for writing to Firestore
 */
export function sanitizeLogForWrite(draft: LogDraft): LogDraft {
    return {
        ...draft,
        planId: draft.planId ?? "",
        planTitle: draft.planTitle ?? "",
        dayId: draft.dayId ?? "",
        dayTitle: draft.dayTitle ?? "",
        date: draft.date ?? todayISO(),
        userId: draft.userId ?? null,
        note: draft.note ?? null,
        startedAt: draft.startedAt ?? null,
        completedAt: draft.completedAt ?? null,
        status: draft.status ?? null,
        exercises: (draft.exercises ?? []).filter(Boolean).map((ex: GymLogExercise) => {
            const isTimeType = ex.setType === "time";
            const sets = Array.isArray(ex.sets)
                ? ex.sets.map((s) => {
                      const hasValue = isTimeType
                          ? s?.time !== null && s?.time !== undefined
                          : s?.weight !== null && s?.weight !== undefined;
                      return {
                          weight: s?.weight ?? null,
                          reps: s?.reps ?? null,
                          time: s?.time ?? null,
                          note: s?.note ?? null,
                          completed: hasValue ? true : null,
                      } as GymSet;
                  })
                : [];
            const filled = sets.filter((s) => s.completed).length;
            const completed = sets.length > 0 && filled === sets.length ? true : null;
            return {
                name: ex.name ?? "",
                muscleGroup: ex.muscleGroup,
                setType: ex.setType ?? "weight",
                weightUnit: isTimeType ? undefined : (ex.weightUnit ?? "kg"),
                note: ex.note,
                completed,
                sets,
            } as GymLogExercise;
        }),
    };
}

/**
 * Fetch logs with optional filters
 */
export async function fetchLogs(
    userId: string,
    options?: {
        fromTs?: number;
        toTs?: number;
        planId?: string;
        dayId?: string;
    }
): Promise<GymLogEntry[]> {
    const constraints: QueryConstraint[] = [
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
    ];

    if (options?.fromTs !== undefined) {
        constraints.push(where("createdAt", ">=", options.fromTs));
    }
    if (options?.toTs !== undefined) {
        constraints.push(where("createdAt", "<=", options.toTs));
    }
    if (options?.planId) {
        constraints.push(where("planId", "==", options.planId));
    }
    if (options?.dayId) {
        constraints.push(where("dayId", "==", options.dayId));
    }

    const q = query(collection(db, gymCollections.logs), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => logEntryFromFirestore(d.id, d.data()));
}

/**
 * Fetch running session (status = "running")
 */
export async function fetchRunningSession(userId: string): Promise<GymLogEntry | null> {
    const q = query(
        collection(db, gymCollections.logs),
        where("userId", "==", userId),
        where("status", "==", "running"),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.docs.length > 0) {
        return logEntryFromFirestore(snap.docs[0].id, snap.docs[0].data());
    }
    return null;
}

/**
 * Create a new log entry
 */
export async function createLogEntry(log: Omit<GymLogEntry, "id">): Promise<string> {
    const sanitized = sanitizeLogForWrite(log as LogDraft);
    const docRef = await addDoc(
        collection(db, gymCollections.logs),
        logEntryToFirestore({ ...sanitized, createdAt: log.createdAt } as Omit<GymLogEntry, "id">)
    );
    return docRef.id;
}

/**
 * Update an existing log entry
 */
export async function updateLogEntry(logId: string, log: Omit<GymLogEntry, "id">): Promise<void> {
    const sanitized = sanitizeLogForWrite(log as LogDraft);
    await setDoc(
        doc(db, gymCollections.logs, logId),
        logEntryToFirestore({ ...sanitized, createdAt: log.createdAt } as Omit<GymLogEntry, "id">),
        { merge: true }
    );
}

/**
 * Delete a log entry
 */
export async function deleteLogEntry(logId: string): Promise<void> {
    await deleteDoc(doc(db, gymCollections.logs, logId));
}
