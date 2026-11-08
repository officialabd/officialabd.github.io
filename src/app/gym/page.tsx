"use client";

import { useEffect } from "react";
import Basic from "../_layouts/texts/basic";
import LinePulse from "../_layouts/pulse/line";
import { useGymAuth, useGymBootstrap } from "./hooks";
import { useLogsStore, useProfileStore, useStatsStore, useUIStore } from "./stores";
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
import { formatRemaining, formatTime } from "./utils";

export default function GymPage() {
    const { user, isLoading: authLoading, error: authError, sessionIssuedAt, sessionExpiresAt, login, logout } = useGymAuth();
    const { status, error: loadError, retry } = useGymBootstrap(user);
    const { activeView, setActiveView, nowTs, tick } = useUIStore();
    const needsOnboarding = useProfileStore((s) => s.needsOnboarding());
    const profileName = useProfileStore((s) => s.profile.name);
    const showDefaultLogs = useLogsStore((s) => s.showDefault);
    const loadStats = useStatsStore((s) => s.load);

    const isReady = !!user && status === "ready";

    // Refresh timers every minute.
    useEffect(() => {
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, [tick]);

    // Opening the logs tab shows its default view; filter changes reload from the Logs tab itself.
    useEffect(() => {
        if (isReady && activeView === "logs") showDefaultLogs();
    }, [isReady, activeView, showDefaultLogs]);

    // Reload stats whenever the stats tab is shown, so finished sessions are included.
    useEffect(() => {
        if (isReady && activeView === "stats") loadStats();
    }, [isReady, activeView, loadStats]);

    return (
        <div className="min-h-screen bg-[#0b1222] text-white">
            <div className="mx-auto max-w-screen-xl px-0 py-10">
                <div className="px-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <Basic
                            text="Gym Plan Manager"
                            fontSize="text-3xl sm:text-4xl"
                            fontFamily="font-Nunito"
                            fontWeight="font-bold"
                            textColor="text-[#BFACDF]"
                        />
                        {user && (
                            <button onClick={logout} className="text-sm text-slate-300 hover:text-white underline whitespace-nowrap">
                                Sign out
                            </button>
                        )}
                    </div>
                    {user && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-xs sm:text-sm text-slate-200">
                            <span className="font-semibold text-white break-all">Hello {profileName || user.email}</span>
                            <span className="text-[11px] sm:text-xs text-slate-400">
                                Logged in Session: {formatTime(sessionIssuedAt)} • Renews in{" "}
                                {formatRemaining(sessionExpiresAt ? sessionExpiresAt - nowTs : null)}
                            </span>
                        </div>
                    )}
                </div>

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
                    <div className="mt-6 space-y-8">
                        <TabNavigation activeView={activeView} onViewChange={setActiveView} />
                        {activeView === "session" && <SessionLogger />}
                        {activeView === "plans" && <PlansView />}
                        {activeView === "exercises" && <ExercisesView />}
                        {activeView === "logs" && <LogsFeed />}
                        {activeView === "stats" && <StatsView />}
                        {activeView === "profile" && <ProfileView />}
                    </div>
                )}
            </div>
        </div>
    );
}
