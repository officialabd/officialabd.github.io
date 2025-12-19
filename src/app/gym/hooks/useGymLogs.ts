"use client";

import { useCallback } from "react";
import { useLogsStore } from "../stores";
import type { LogsFilter } from "../types";
import * as gymService from "../services/gymService";

/**
 * Hook to manage gym logs feed
 */
export function useGymLogs(userId: string | null) {
    const store = useLogsStore();

    // Load logs with current filter
    const loadLogs = useCallback(async () => {
        if (!userId) return;

        store.setLoading(true);
        try {
            const fromTs = new Date(store.filter.from).getTime();
            const toTs = new Date(store.filter.to).getTime() + 24 * 60 * 60 * 1000 - 1;

            const logs = await gymService.fetchLogs(userId, {
                fromTs,
                toTs,
                planId: store.filter.planId || undefined,
                dayId: store.filter.dayId || undefined,
            });

            store.setLogs(logs);
        } finally {
            store.setLoading(false);
        }
    }, [userId, store]);

    // Update filter
    const updateFilter = useCallback(
        (partial: Partial<LogsFilter>) => {
            store.setFilter(partial);
        },
        [store]
    );

    // Reset filter to defaults
    const resetFilter = useCallback(() => {
        store.resetFilter();
    }, [store]);

    return {
        // State
        logs: store.logs,
        isLoading: store.isLoading,
        filter: store.filter,

        // Actions
        loadLogs,
        updateFilter,
        resetFilter,
        clearLogs: store.clearLogs,
    };
}
