import { create } from "zustand";
import { User } from "firebase/auth";

interface AuthState {
    // State
    user: User | null;
    isLoading: boolean;
    error: string | null;
    sessionIssuedAt: number | null;
    sessionExpiresAt: number | null;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSessionTimes: (issuedAt: number | null, expiresAt: number | null) => void;
    clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    user: null,
    isLoading: true,
    error: null,
    sessionIssuedAt: null,
    sessionExpiresAt: null,

    // Actions
    setUser: (user) => set({ user, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    setSessionTimes: (sessionIssuedAt, sessionExpiresAt) =>
        set({ sessionIssuedAt, sessionExpiresAt }),

    clearSession: () =>
        set({
            user: null,
            isLoading: false,
            error: null,
            sessionIssuedAt: null,
            sessionExpiresAt: null,
        }),
}));
