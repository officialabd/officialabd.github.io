"use client";

import { useEffect } from "react";
import Card from "../../_layouts/card/card";
import { WEIGHT_UNITS } from "../constants";
import type { GymLogExercise, WeightUnit } from "../types";
import {
    useExercisesStore,
    useLogsStore,
    usePlansStore,
    useProfileStore,
    useSessionStore,
    useUIStore,
} from "../stores";
import { confirmAction, formatISODate, formatTime, isWeightExercise, isWeightUnit, todayISO, withWeightUnit } from "../utils";
import { LogExercisesEditor } from "./LogExercisesEditor";
import { Button, Field, inputClass, Notice, SaveIndicator, SectionTitle, Segmented } from "./ui";

/** The unit shared by all weight exercises, or null when mixed / none. */
const sharedWeightUnit = (exercises: GymLogExercise[]): WeightUnit | null => {
    const units = new Set(exercises.filter(isWeightExercise).map((ex) => ex.unit));
    const [only] = Array.from(units);
    return units.size === 1 && isWeightUnit(only) ? only : null;
};

export function SessionLogger() {
    const plans = usePlansStore((s) => s.plans);
    const library = useExercisesStore((s) => s.exercises);
    const distanceUnit = useProfileStore((s) => s.profile.units.distance);
    const nowTs = useUIStore((s) => s.nowTs);
    const focusLogsDay = useLogsStore((s) => s.focusDay);
    const session = useSessionStore();
    const { draft, planId, dayId, saveState, isBusy, prefill, prefillMessage, flush } = session;

    // Save pending edits right away when the page is hidden (e.g. phone locked).
    useEffect(() => {
        const onHide = () => {
            if (document.visibilityState === "hidden") flush();
        };
        document.addEventListener("visibilitychange", onHide);
        return () => document.removeEventListener("visibilitychange", onHide);
    }, [flush]);

    const isRunning = draft?.status === "running";

    // Keep a not-yet-started draft in sync with plan and library edits.
    useEffect(() => {
        const { draft: current, prefill: loaded } = useSessionStore.getState();
        if (current?.status !== "running" && !loaded) useSessionStore.getState().resetDraft();
    }, [plans, library]);

    const selectedPlan = plans.find((p) => p.id === planId);
    const weightUnit = draft ? sharedWeightUnit(draft.exercises) : null;
    const hasWeightExercises = !!draft?.exercises.some(isWeightExercise);

    const handleStart = async () => {
        await session.start();
        focusLogsDay(planId, dayId);
    };

    const handleCancel = () => {
        if (confirmAction("Cancel this session? Everything logged in it will be deleted.")) session.cancel();
    };

    return (
        <Card heading={<SectionTitle text="Log Session" />}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Plan">
                        <select
                            className={inputClass}
                            value={planId}
                            disabled={isRunning}
                            onChange={(e) => session.selectPlan(e.target.value)}
                        >
                            <option value="">Select plan</option>
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Day">
                        <select
                            className={inputClass}
                            value={dayId}
                            disabled={isRunning || !selectedPlan?.days.length}
                            onChange={(e) => session.selectDay(e.target.value)}
                        >
                            <option value="">Select day</option>
                            {selectedPlan?.days.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.title}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Date">
                        <input
                            type="date"
                            className={inputClass}
                            value={draft?.date ?? todayISO()}
                            disabled={!draft}
                            onChange={(e) => session.update((d) => ({ ...d, date: e.target.value }))}
                        />
                    </Field>
                </div>

                {!draft || !dayId ? (
                    <p className="text-sm text-slate-400">Select a plan and day to start logging.</p>
                ) : (
                    <div className="space-y-4">
                        {!isRunning && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-400">Start from:</span>
                                <Button size="sm" variant="neutral" disabled={isBusy} onClick={() => session.loadPrevious("values")}>
                                    Load previous values
                                </Button>
                                <Button size="sm" variant="neutral" disabled={isBusy} onClick={() => session.loadPrevious("session")}>
                                    Load previous session
                                </Button>
                                {prefill && (
                                    <Button size="sm" variant="ghost" onClick={session.resetDraft}>
                                        Reset to plan
                                    </Button>
                                )}
                            </div>
                        )}
                        {!isRunning && prefill && (
                            <Notice>
                                {prefill.mode === "values" ? "Weights" : "Exercises and weights"} loaded from the session on{" "}
                                {formatISODate(prefill.date)}. Reps are left empty.
                            </Notice>
                        )}
                        {!isRunning && prefillMessage && <Notice tone="warn">{prefillMessage}</Notice>}

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            {!isRunning ? (
                                <Button onClick={handleStart} disabled={isBusy || draft.exercises.length === 0}>
                                    Start
                                </Button>
                            ) : (
                                <>
                                    <Button variant="success" onClick={session.complete} disabled={isBusy}>
                                        Complete
                                    </Button>
                                    <Button variant="danger" onClick={handleCancel} disabled={isBusy}>
                                        Cancel
                                    </Button>
                                    <SaveIndicator state={saveState} onRetry={session.flush} />
                                </>
                            )}
                        </div>

                        <div className="text-xs text-slate-400 space-y-0.5">
                            <div>Status: {draft.status ?? "not started"}</div>
                            <div>Started: {formatTime(draft.startedAt)}</div>
                            <div>
                                Duration:{" "}
                                {draft.startedAt ? `${Math.max(0, Math.round((nowTs - draft.startedAt) / 60000))} mins` : "-"}
                            </div>
                        </div>

                        {hasWeightExercises && (
                            <Segmented<WeightUnit | "">
                                label="All weights in:"
                                value={weightUnit ?? ""}
                                options={WEIGHT_UNITS.map((u) => ({ value: u }))}
                                disabled={!isRunning}
                                onChange={(unit) => unit && session.update((d) => withWeightUnit(d, unit))}
                            />
                        )}

                        <LogExercisesEditor
                            exercises={draft.exercises}
                            onChange={(exercises) => session.update((d) => ({ ...d, exercises }))}
                            library={library}
                            editable={isRunning}
                            defaultDistanceUnit={distanceUnit}
                        />

                        <Field label="Session notes">
                            <textarea
                                className={inputClass}
                                rows={3}
                                value={draft.note}
                                onChange={(e) => session.update((d) => ({ ...d, note: e.target.value }))}
                            />
                        </Field>
                    </div>
                )}
            </div>
        </Card>
    );
}
