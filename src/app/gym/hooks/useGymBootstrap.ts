"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { migrateUserIfNeeded } from "../services/migration";
import * as gymService from "../services/gymService";
import {
    useExercisesStore,
    useLogsStore,
    usePlansStore,
    useProfileStore,
    useSessionStore,
    useStatsStore,
    useUIStore,
} from "../stores";

export type BootstrapStatus = "idle" | "loading" | "ready" | "error";

const clearAll = () => {
    useExercisesStore.getState().clear();
    usePlansStore.getState().clear();
    useSessionStore.getState().clear();
    useLogsStore.getState().clear();
    useStatsStore.getState().clear();
    useProfileStore.getState().clear();
    useUIStore.getState().reset();
};

/**
 * (Re)load all of the user's data into the stores: profile, exercise library,
 * plans and any running session. Also used after an import replaces data.
 */
export async function loadAccount(uid: string): Promise<void> {
    useSessionStore.getState().clear();
    useLogsStore.getState().clear();
    useStatsStore.getState().clear();

    const [{ profile }] = await Promise.all([
        gymService.fetchUser(uid),
        useExercisesStore.getState().load(),
        usePlansStore.getState().load(),
    ]);
    useProfileStore.getState().setProfile(profile);
    useUIStore.getState().setLogsWeightDisplay(profile.units.weight);

    const session = useSessionStore.getState();
    if (!(await session.loadRunning())) {
        const firstPlan = usePlansStore.getState().plans[0];
        if (firstPlan) session.selectPlan(firstPlan.id);
    }
}

/** Prepares the signed-in user's data: migrates legacy data once, then loads everything. */
export function useGymBootstrap(user: User | null) {
    const [status, setStatus] = useState<BootstrapStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    const bootstrap = useCallback(async (uid: string) => {
        setStatus("loading");
        setError(null);
        try {
            await migrateUserIfNeeded(uid);
            await loadAccount(uid);
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
