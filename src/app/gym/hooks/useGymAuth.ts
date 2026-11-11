"use client";

import { useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth } from "../../../../firebase";
import { useAuthStore } from "../stores";

/**
 * Hook to manage Firebase authentication
 */
export function useGymAuth() {
    const {
        user,
        isLoading,
        error,
        sessionIssuedAt,
        sessionExpiresAt,
        setUser,
        setLoading,
        setError,
        setSessionTimes,
        clearSession,
    } = useAuthStore();

    // Refresh session times from the user's ID token
    const refreshSessionTimes = useCallback(async (u: User | null) => {
        if (!u) {
            setSessionTimes(null, null);
            return;
        }
        try {
            const token = await u.getIdTokenResult();
            const issued = Date.parse(token.issuedAtTime);
            const expires = Date.parse(token.expirationTime);
            setSessionTimes(
                Number.isFinite(issued) ? issued : null,
                Number.isFinite(expires) ? expires : null
            );
        } catch (err) {
            console.error("Failed to fetch session token info", err);
            setSessionTimes(null, null);
        }
    }, [setSessionTimes]);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            refreshSessionTimes(u);
        });
        return () => unsubscribe();
    }, [setUser, refreshSessionTimes]);

    // Refresh session times when user changes
    useEffect(() => {
        if (user) {
            refreshSessionTimes(user);
        }
    }, [user, refreshSessionTimes]);

    // Login handler
    const login = useCallback(async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err?.message ?? "Login failed");
        } finally {
            setLoading(false);
        }
    }, [setError, setLoading]);

    // Logout handler
    const logout = useCallback(async () => {
        await signOut(auth);
        clearSession();
    }, [clearSession]);

    return {
        user,
        isLoading,
        error,
        sessionIssuedAt,
        sessionExpiresAt,
        login,
        logout,
    };
}
