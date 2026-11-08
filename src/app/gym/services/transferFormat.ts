/**
 * File format of gym data exports, and validation of files being imported.
 * Pure (no Firestore access) so it can be tested in isolation.
 */
import type { GymExercise, GymLogEntry, GymPlan, GymProfile } from "../types";
import { exerciseFromFirestore, logFromFirestore, planFromFirestore, profileFromFirestore } from "./mappers";

export type TransferScope = "all" | "plans" | "exercises" | "logs";

export const FILE_FORMAT = "gym-export";
export const FILE_VERSION = 1;

export interface TransferData {
    profile?: GymProfile;
    exercises?: GymExercise[];
    plans?: GymPlan[];
    logs?: GymLogEntry[];
}

export interface TransferFile extends TransferData {
    format: typeof FILE_FORMAT;
    version: number;
    scope: TransferScope;
    exportedAt: string;
    email: string | null;
}

export const scopeIncludes = (scope: TransferScope, part: Exclude<TransferScope, "all">) => scope === "all" || scope === part;

// ============================================================================
// Parse
// ============================================================================

type Raw = Record<string, any>;

const parseList = <T>(value: unknown, label: string, parse: (id: string, data: Raw) => T): T[] => {
    if (!Array.isArray(value)) throw new Error(`The file has no ${label}.`);
    return value.map((item, i) => {
        if (typeof item !== "object" || item === null || typeof item.id !== "string" || !item.id) {
            throw new Error(`The ${label} in this file are invalid (item ${i + 1} has no ID).`);
        }
        const { id, ...data } = item as Raw;
        return parse(id, data);
    });
};

/**
 * Validate a file for importing `scope`. Throws an Error with a user-facing message
 * when the file is not a gym export or doesn't contain what the scope needs.
 */
export function parseImport(text: string, scope: TransferScope): TransferData & { source: TransferFile } {
    let file: Raw;
    try {
        file = JSON.parse(text);
    } catch {
        throw new Error("This is not a valid JSON file.");
    }
    if (file?.format !== FILE_FORMAT) throw new Error("This file is not a Gym Plan Manager export.");
    if (typeof file.version !== "number" || file.version > FILE_VERSION) {
        throw new Error("This file was made by a newer version of the app.");
    }
    const fileScope = file.scope as TransferScope;
    if (fileScope !== "all" && fileScope !== scope) {
        throw new Error(`This file only contains ${fileScope}; it can't be used to import ${scope}.`);
    }

    return {
        source: file as TransferFile,
        ...(scope === "all" && { profile: profileFromFirestore(file.profile) }),
        ...(scopeIncludes(scope, "exercises") && { exercises: parseList(file.exercises, "exercises", exerciseFromFirestore) }),
        ...(scopeIncludes(scope, "plans") && { plans: parseList(file.plans, "plans", planFromFirestore) }),
        ...(scopeIncludes(scope, "logs") && { logs: parseList(file.logs, "logs", logFromFirestore) }),
    };
}

// ============================================================================
// Consistency checks shown before importing
// ============================================================================

/** Exercise IDs referenced by plan days but missing from the given library. */
export const missingExerciseRefs = (plans: GymPlan[], exerciseIds: Set<string>): number =>
    new Set(plans.flatMap((p) => p.days.flatMap((d) => d.exerciseIds)).filter((id) => !exerciseIds.has(id))).size;
