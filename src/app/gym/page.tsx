"use client";

import { useEffect } from "react";
import LinePulse from "../_layouts/pulse/line";
import { useGymAuth, useGymBootstrap, useReconnectOnResume } from "./hooks";
import { useLogsStore, useProfileStore, useSessionStore, useUIStore } from "./stores";
import {
    AuthForm,
    ExercisesView,
    LogsFeed,
    Onboarding,
    PlansView,
    ProfileView,
    SessionLogger,
    StatsView,
    TabNavigation,
} from "./components";
import { Button, Notice } from "./components/ui";

export default function GymPage() {
    const { user, isLoading: authLoading, error: authError, sessionIssuedAt, sessionExpiresAt, login, logout } = useGymAuth();
    const { status, error: loadError, retry } = useGymBootstrap(user);
    const { activeView, setActiveView, tick } = useUIStore();
    const needsOnboarding = useProfileStore((s) => s.needsOnboarding());
    const showDefaultLogs = useLogsStore((s) => s.showDefault);

    const isReady = !!user && status === "ready";
    useReconnectOnResume(!!user);

    // Refresh timers every minute.
    useEffect(() => {
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, [tick]);

    // Opening the logs tab shows its default view (the running session's day, if any).
    // Logs download only the dates a tab needs and are reused by Logs and Stats.
    useEffect(() => {
        if (!isReady || activeView !== "logs") return;
        const { draft, planId, dayId } = useSessionStore.getState();
        showDefaultLogs(draft?.status === "running" ? { planId, dayId } : null);
    }, [isReady, activeView, showDefaultLogs]);

    return (
        <div className="min-h-screen bg-[#0b1222] text-white">
            <div className="mx-auto max-w-screen-xl px-0 pt-4 sm:pt-6 pb-24 sm:pb-10">
                {!user && <AuthForm onLogin={login} isLoading={authLoading} error={authError} />}

                {user && status === "loading" && (
                    <div className="px-4 mt-8 space-y-2">
                        <p className="text-sm text-slate-400">Loading your data…</p>
                        <LinePulse />
                    </div>
                )}

                {user && status === "error" && (
                    <div className="px-4 mt-8 space-y-3 max-w-xl">
                        <Notice tone="error">Could not load your data: {loadError}</Notice>
                        <Button onClick={retry}>Try again</Button>
                    </div>
                )}

                {isReady && needsOnboarding && <Onboarding />}

                {isReady && !needsOnboarding && (
                    <div className="space-y-2">
                        <TabNavigation activeView={activeView} onViewChange={setActiveView} />
                        {activeView === "session" && <SessionLogger />}
                        {activeView === "plans" && <PlansView />}
                        {activeView === "exercises" && <ExercisesView />}
                        {activeView === "logs" && <LogsFeed />}
                        {activeView === "stats" && <StatsView />}
                        {activeView === "profile" && (
                            <ProfileView
                                account={{ email: user.email, sessionIssuedAt, sessionExpiresAt, onLogout: logout }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
