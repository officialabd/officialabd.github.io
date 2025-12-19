"use client";

import { useEffect } from "react";
import Basic from "../_layouts/texts/basic";

// Hooks
import { useGymAuth, useGymPlans, useGymSession, useGymLogs } from "./hooks";

// Stores
import { useUIStore } from "./stores";

// Components
import {
    AuthForm,
    TabNavigation,
    PlansView,
    PlanEditor,
    SessionLogger,
    LogsFeed,
} from "./components";

// Utils
import { formatTime, formatRemaining } from "./utils";

export default function GymPage() {
    // =========================================================================
    // HOOKS
    // =========================================================================
    const { user, isLoading: authLoading, error: authError, sessionIssuedAt, sessionExpiresAt, login, logout } = useGymAuth();
    const userId = user?.uid ?? null;

    const {
        plans,
        planDrafts,
        planDirty,
        isLoading: plansLoading,
        savingPlanId,
        viewPlanId,
        viewDayId,
        editPlanId,
        editDayId,
        newPlanTitle,
        newDayTitle,
        setViewPlanId,
        setViewDayId,
        setEditPlanId,
        setEditDayId,
        setNewPlanTitle,
        setNewDayTitle,
        loadPlans,
        addPlan,
        savePlan,
        deletePlan,
        addDay,
        deleteDay,
        updatePlanTitle,
        updatePlanNote,
        updateDayTitle,
        updateDayNote,
        updateExercise,
        addExercise,
        deleteExercise,
        reorderExercises,
        clearPlans,
    } = useGymPlans(userId);

    const {
        logPlanId,
        logDayId,
        logDraft,
        isSubmitting,
        isLoadingRunning,
        setLogPlanId,
        setLogDayId,
        initializeSession,
        startSession,
        saveSession,
        completeSession,
        cancelSession,
        loadRunningSession,
        updateSetsCount,
        updateSetValue,
        updateUnit,
        updateNote,
        updateDate,
        addExercise: addSessionExercise,
        removeExercise: removeSessionExercise,
        updateExerciseDetails: updateSessionExerciseDetails,
        clearSession,
    } = useGymSession(userId);

    const {
        logs,
        isLoading: logsLoading,
        filter: logsFilter,
        loadLogs,
        updateFilter,
        clearLogs,
    } = useGymLogs(userId);

    const { activeView, setActiveView, nowTs, updateNowTs, draggingExerciseId, dragOverExerciseId, setDraggingExerciseId, setDragOverExerciseId, clearDragState } = useUIStore();

    // =========================================================================
    // EFFECTS
    // =========================================================================

    // Load plans and running session when user logs in
    useEffect(() => {
        if (user) {
            // Load running session first, then plans
            // This ensures isLoadingRunning is set before plans trigger sync effects
            loadRunningSession().then(() => loadPlans());
        } else {
            clearPlans();
            clearSession();
            clearLogs();
        }
    }, [user]);

    // Initialize session draft when plan/day selection changes
    useEffect(() => {
        if (isLoadingRunning) return; // Skip when loading running session
        
        // Skip if we already have a running session loaded
        if (logDraft?.status === "running") return;

        if (logPlanId && logDayId && user) {
            const plan = plans.find((p) => p.id === logPlanId);
            const day = plan?.days.find((d) => d.id === logDayId);
            if (plan && day) {
                initializeSession(plan, day);
            }
        }
    }, [logPlanId, logDayId, plans, user, isLoadingRunning, logDraft?.status]);

    // Sync logPlanId with first available plan
    useEffect(() => {
        if (isLoadingRunning) return; // Skip when loading running session
        if (!logPlanId && plans.length > 0) {
            setLogPlanId(plans[0].id);
        }
    }, [plans, logPlanId, isLoadingRunning]);

    // Sync logDayId with first available day
    useEffect(() => {
        if (isLoadingRunning) return; // Skip when loading running session
        const plan = plans.find((p) => p.id === logPlanId);
        if (plan && !plan.days.some((d) => d.id === logDayId)) {
            setLogDayId(plan.days[0]?.id ?? "");
        }
    }, [logPlanId, plans, logDayId, isLoadingRunning]);

    // Sync viewDayId
    useEffect(() => {
        const plan = plans.find((p) => p.id === viewPlanId);
        if (plan && !plan.days.some((d) => d.id === viewDayId)) {
            setViewDayId(plan.days[0]?.id ?? "");
        }
    }, [viewPlanId, plans, viewDayId]);

    // Sync editDayId - only clear if current selection is invalid (not empty)
    useEffect(() => {
        const plan = planDrafts[editPlanId] ?? plans.find((p) => p.id === editPlanId);
        // Only reset if there's a selected day that no longer exists
        if (editDayId && plan && !plan.days.some((d) => d.id === editDayId)) {
            setEditDayId("");
        }
    }, [editPlanId, plans, planDrafts, editDayId]);

    // Sync logsFilter dayId
    useEffect(() => {
        const plan = plans.find((p) => p.id === logsFilter.planId);
        if (!plan) {
            if (logsFilter.dayId) updateFilter({ dayId: "" });
        } else if (!plan.days.some((d) => d.id === logsFilter.dayId)) {
            updateFilter({ dayId: "" });
        }
    }, [logsFilter.planId, plans, logsFilter.dayId]);

    // Load logs when switching to logs view
    useEffect(() => {
        if (user && activeView === "logs") {
            loadLogs();
        }
    }, [user, activeView]);

    // Reload logs when filter changes
    useEffect(() => {
        if (user && activeView === "logs") {
            loadLogs();
        }
    }, [logsFilter.from, logsFilter.to, logsFilter.planId, logsFilter.dayId]);

    // Update nowTs every minute for session timer
    useEffect(() => {
        const id = setInterval(updateNowTs, 60000);
        return () => clearInterval(id);
    }, []);

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleEditPlan = (planId: string) => {
        setEditPlanId(planId);
        setActiveView("edit");
    };

    const handleAddDay = (planId: string) => {
        // Get the current plan to determine the next day number
        const plan = planDrafts[planId] ?? plans.find((p) => p.id === planId);
        const dayCount = plan?.days.length ?? 0;
        const defaultTitle = `Day ${dayCount + 1}`;
        addDay(planId, defaultTitle);
    };

    const handleCompleteSession = async () => {
        const plan = plans.find((p) => p.id === logPlanId);
        const day = plan?.days.find((d) => d.id === logDayId);
        if (plan && day) {
            await completeSession(plan, day);
            loadLogs();
        }
    };

    const handleCancelSession = async () => {
        const plan = plans.find((p) => p.id === logPlanId);
        const day = plan?.days.find((d) => d.id === logDayId);
        if (plan && day) {
            await cancelSession(plan, day);
            loadLogs();
        }
    };

    const handleSaveSession = async () => {
        await saveSession();
        loadLogs();
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div className="min-h-screen bg-[#0b1222] text-white">
            <div className="mx-auto max-w-screen-xl px-0 py-10">
                {/* Header */}
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
                            <button
                                onClick={logout}
                                className="text-sm text-slate-300 hover:text-white underline whitespace-nowrap"
                            >
                                Sign out
                            </button>
                        )}
                    </div>
                    {user && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-xs sm:text-sm text-slate-200">
                            <span className="font-semibold text-white break-all">
                                Hello {user.email}
                            </span>
                            <span className="text-[11px] sm:text-xs text-slate-400">
                                Logged in Session: {formatTime(sessionIssuedAt)} • Renews in{" "}
                                {formatRemaining(sessionExpiresAt ? sessionExpiresAt - nowTs : null)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Auth Form (when not logged in) */}
                {!user && (
                    <AuthForm onLogin={login} isLoading={authLoading} error={authError} />
                )}

                {/* Main Content (when logged in) */}
                {user && (
                    <div className="mt-6 space-y-8">
                        {/* Tab Navigation */}
                        <TabNavigation activeView={activeView} onViewChange={setActiveView} />

                        {/* Plans View */}
                        {activeView === "plans" && (
                            <PlansView
                                plans={plans}
                                selectedPlanId={viewPlanId}
                                isLoading={plansLoading}
                                onPlanSelect={setViewPlanId}
                                onEditPlan={handleEditPlan}
                            />
                        )}

                        {/* Plan Editor */}
                        {activeView === "edit" && (
                            <PlanEditor
                                plans={plans}
                                selectedPlanId={editPlanId}
                                selectedDayId={editDayId}
                                planDrafts={planDrafts}
                                planDirty={planDirty}
                                isLoading={plansLoading}
                                isSaving={!!savingPlanId}
                                newPlanTitle={newPlanTitle}
                                newDayTitle={newDayTitle}
                                draggingExerciseId={draggingExerciseId}
                                dragOverExerciseId={dragOverExerciseId}
                                onPlanSelect={(planId) => {
                                    setEditPlanId(planId);
                                    setEditDayId(""); // Clear day selection when plan changes
                                }}
                                onDaySelect={setEditDayId}
                                onNewPlanTitleChange={setNewPlanTitle}
                                onNewDayTitleChange={setNewDayTitle}
                                onAddPlan={() => addPlan()}
                                onSavePlan={savePlan}
                                onDeletePlan={deletePlan}
                                onAddDay={handleAddDay}
                                onDeleteDay={deleteDay}
                                onUpdatePlanTitle={updatePlanTitle}
                                onUpdatePlanNote={updatePlanNote}
                                onUpdateDayTitle={updateDayTitle}
                                onUpdateDayNote={updateDayNote}
                                onUpdateExercise={updateExercise}
                                onAddExercise={addExercise}
                                onDeleteExercise={deleteExercise}
                                onDragStart={setDraggingExerciseId}
                                onDragEnd={clearDragState}
                                onDragEnter={setDragOverExerciseId}
                                onDragLeave={(id) => {
                                    if (dragOverExerciseId === id) setDragOverExerciseId(null);
                                }}
                                onDrop={(planId, dayId, sourceId, targetId) => {
                                    reorderExercises(planId, dayId, sourceId, targetId);
                                    clearDragState();
                                }}
                            />
                        )}

                        {/* Session Logger */}
                        {activeView === "session" && (
                            <SessionLogger
                                plans={plans}
                                selectedPlanId={logPlanId}
                                selectedDayId={logDayId}
                                logDraft={logDraft}
                                isSubmitting={isSubmitting}
                                onPlanSelect={setLogPlanId}
                                onDaySelect={setLogDayId}
                                onDateChange={updateDate}
                                onStart={startSession}
                                onSave={handleSaveSession}
                                onComplete={handleCompleteSession}
                                onCancel={handleCancelSession}
                                onSetsCountChange={updateSetsCount}
                                onSetValueChange={updateSetValue}
                                onUnitChange={updateUnit}
                                onNoteChange={updateNote}
                                onAddExercise={addSessionExercise}
                                onRemoveExercise={removeSessionExercise}
                                onUpdateExercise={updateSessionExerciseDetails}
                            />
                        )}

                        {/* Logs Feed */}
                        {activeView === "logs" && (
                            <LogsFeed
                                logs={logs}
                                plans={plans}
                                filter={logsFilter}
                                isLoading={logsLoading}
                                onFilterChange={updateFilter}
                                onRefresh={loadLogs}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
