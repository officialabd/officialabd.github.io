import { create } from "zustand";
import type { User } from "firebase/auth";

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    sessionIssuedAt: number | null;
    sessionExpiresAt: number | null;

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSessionTimes: (issuedAt: number | null, expiresAt: number | null) => void;
    clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    error: null,
    sessionIssuedAt: null,
    sessionExpiresAt: null,

    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setSessionTimes: (sessionIssuedAt, sessionExpiresAt) => set({ sessionIssuedAt, sessionExpiresAt }),
    clearSession: () =>
        set({ user: null, isLoading: false, error: null, sessionIssuedAt: null, sessionExpiresAt: null }),
}));

/** UID of the signed-in user. Throws when called while signed out (a programming error). */
export const requireUid = (): string => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) throw new Error("Not signed in");
    return uid;
};
