"use client";

import { useEffect } from "react";
import { disableNetwork, enableNetwork } from "firebase/firestore";
import { db } from "../../../../firebase";

/** Background time after which the database connection is assumed stale. */
const STALE_AFTER_MS = 30_000;

/**
 * Phones freeze background tabs, which silently kills Firestore's open connection; the SDK only
 * notices after a long timeout, so requests made right after returning to the app hang.
 * When the page comes back after a while in the background, restart the connection.
 * Pending writes are kept and sent once it's back.
 */
export function useReconnectOnResume(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;
        let hiddenAt: number | null = null;
        const onVisibility = async () => {
            if (document.visibilityState === "hidden") {
                hiddenAt = Date.now();
                return;
            }
            const wasHidden = hiddenAt;
            hiddenAt = null;
            if (wasHidden === null || Date.now() - wasHidden < STALE_AFTER_MS) return;
            try {
                await disableNetwork(db);
                await enableNetwork(db);
            } catch (err) {
                console.error("Failed to reconnect", err);
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [enabled]);
}
