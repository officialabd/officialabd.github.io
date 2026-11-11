/**
 * Import / export of a user's gym data as JSON files.
 *
 * A file covers one scope: everything, or only plans, exercises or logs.
 * Importing a scope replaces that part of the account (an "all" file can be used for any scope).
 * Records keep their IDs, so links (plan days -> exercises, logs -> plans/days) survive a copy
 * between accounts.
 */
import { doc, getDocs, setDoc, type CollectionReference } from "firebase/firestore";
import { SCHEMA_VERSION } from "../constants";
import { commitInBatches, type WriteOp } from "./batch";
import * as gymService from "./gymService";
import { dropNulls, exerciseToFirestore, logToFirestore, planToFirestore, profileToFirestore } from "./mappers";
import { FILE_FORMAT, FILE_VERSION, scopeIncludes, type TransferData, type TransferFile, type TransferScope } from "./transferFormat";

export * from "./transferFormat";

// ============================================================================
// Export
// ============================================================================

export async function buildExport(uid: string, scope: TransferScope, email: string | null): Promise<TransferFile> {
    const [user, exercises, plans, logs] = await Promise.all([
        scope === "all" ? gymService.fetchUser(uid) : null,
        scopeIncludes(scope, "exercises") ? gymService.fetchExercises(uid) : undefined,
        scopeIncludes(scope, "plans") ? gymService.fetchPlans(uid) : undefined,
        scopeIncludes(scope, "logs") ? gymService.fetchAllLogs(uid) : undefined,
    ]);
    return {
        format: FILE_FORMAT,
        version: FILE_VERSION,
        scope,
        exportedAt: new Date().toISOString(),
        email,
        // Empty (null) fields are left out; importing reads a missing field as empty.
        ...(user && { profile: dropNulls(user.profile) }),
        ...(exercises && { exercises: dropNulls(exercises) }),
        ...(plans && { plans: dropNulls(plans) }),
        ...(logs && { logs: dropNulls(logs) }),
    };
}

// ============================================================================
// Import (replace)
// ============================================================================

/**
 * Replace one collection's contents: write all incoming records first, then delete the rest.
 * An interruption leaves extra records, never missing ones; importing again completes it.
 */
async function replaceCollection<T extends { id: string }>(
    col: CollectionReference,
    items: T[],
    toFirestore: (item: T) => Record<string, unknown>
): Promise<void> {
    await commitInBatches(items.map((item): WriteOp => ({ kind: "set", ref: doc(col, item.id), data: toFirestore(item) })));
    const keep = new Set(items.map((i) => i.id));
    const existing = await getDocs(col);
    await commitInBatches(existing.docs.filter((d) => !keep.has(d.id)).map((d): WriteOp => ({ kind: "delete", ref: d.ref })));
}

export async function applyImport(uid: string, data: TransferData): Promise<void> {
    if (data.exercises) await replaceCollection(gymService.exercisesCol(uid), data.exercises, exerciseToFirestore);
    if (data.plans) await replaceCollection(gymService.plansCol(uid), data.plans, planToFirestore);
    if (data.logs) await replaceCollection(gymService.logsCol(uid), data.logs, logToFirestore);
    if (data.profile) {
        await setDoc(
            gymService.userDoc(uid),
            { ...profileToFirestore(data.profile), schemaVersion: SCHEMA_VERSION, importedAt: Date.now() },
            { merge: true }
        );
    }
}
