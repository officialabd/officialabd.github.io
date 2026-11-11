"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { migrateUser, needsMigration } from "../services/migration";
import * as gymService from "../services/gymService";
import {
    useExercisesStore,
    useLogsStore,
    usePlansStore,
    useProfileStore,
    useSessionStore,
    useUIStore,
} from "../stores";

export type BootstrapStatus = "idle" | "loading" | "ready" | "error";

const clearAll = () => {
    useExercisesStore.getState().clear();
    usePlansStore.getState().clear();
    useSessionStore.getState().clear();
    useLogsStore.getState().clear();
    useProfileStore.getState().clear();
    useUIStore.getState().reset();
};

/**
 * (Re)load all of the user's data into the stores: profile, exercise library, plans and any
 * running session, in one parallel round of reads. Logs load lazily (Logs / Stats tabs).
 * Also used after an import or merge replaces data. Returns the user's schema version.
 */
export async function loadAccount(uid: string): Promise<{ schemaVersion: number }> {
    useSessionStore.getState().clear();
    useLogsStore.getState().clear();

    const session = useSessionStore.getState();
    const [{ profile, schemaVersion }, , , hasRunning] = await Promise.all([
        gymService.fetchUser(uid),
        useExercisesStore.getState().load(),
        usePlansStore.getState().load(),
        session.loadRunning(),
    ]);
    useProfileStore.getState().setProfile(profile);
    useUIStore.getState().setLogsWeightDisplay(profile.units.weight);

    if (!hasRunning) {
        const firstPlan = usePlansStore.getState().plans[0];
        if (firstPlan) session.selectPlan(firstPlan.id);
    }
    return { schemaVersion };
}

/** Prepares the signed-in user's data: loads everything, migrating legacy data first if needed. */
export function useGymBootstrap(user: User | null) {
    const [status, setStatus] = useState<BootstrapStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    const bootstrap = useCallback(async (uid: string) => {
        setStatus("loading");
        setError(null);
        try {
            const { schemaVersion } = await loadAccount(uid);
            // Legacy data is migrated once; then everything is loaded again from the new structure.
            if (needsMigration(schemaVersion)) {
                await migrateUser(uid);
                await loadAccount(uid);
            }
            setStatus("ready");
        } catch (err) {
            console.error("Failed to load gym data", err);
            setError(err instanceof Error ? err.message : "Failed to load your data.");
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        if (user) {
            bootstrap(user.uid);
        } else {
            clearAll();
            setStatus("idle");
        }
    }, [user, bootstrap]);

    const retry = useCallback(() => {
        if (user) bootstrap(user.uid);
    }, [user, bootstrap]);

    return { status, error, retry };
}
