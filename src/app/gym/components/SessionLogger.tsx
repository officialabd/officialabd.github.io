"use client";

import { useEffect } from "react";
import Card from "./Card";
import { WEIGHT_UNITS } from "../constants";
import type { GymLogExercise, WeightUnit } from "../types";
import {
    useExercisesStore,
    usePlansStore,
    useProfileStore,
    useSessionStore,
    useUIStore,
} from "../stores";
import { confirmAction, formatISODate, formatShortDateTime, formatTime, isWeightExercise, isWeightUnit, todayISO, withWeightUnit } from "../utils";
import { LogExercisesEditor } from "./LogExercisesEditor";
import { Button, Field, GymSelect, inputClass, Notice, SaveIndicator, SectionTitle, Segmented } from "./ui";

/** The unit shared by all weight exercises, or null when mixed / none. */
const sharedWeightUnit = (exercises: GymLogExercise[]): WeightUnit | null => {
    const units = new Set(exercises.filter(isWeightExercise).map((ex) => ex.unit));
    const [only] = Array.from(units);
    return units.size === 1 && isWeightUnit(only) ? only : null;
};

/**
 * Session actions are one joined button group on a single row (Start / Load…, then Complete / Cancel).
 * Each label stays on one line and its button fits it; on phones the group fills the row.
 */
const BUTTON_GROUP = "flex w-full sm:w-fit overflow-hidden rounded-lg divide-x divide-slate-950/50";
const GROUP_BUTTON = "flex-auto !rounded-none !px-2 !text-[13px] whitespace-nowrap sm:flex-none sm:!px-4 sm:!text-sm";

export function SessionLogger() {
    const plans = usePlansStore((s) => s.plans);
    const library = useExercisesStore((s) => s.exercises);
    const distanceUnit = useProfileStore((s) => s.profile.units.distance);
    const gyms = useProfileStore((s) => s.profile.gyms);
    const defaultGym = useProfileStore((s) => s.profile.defaultGym);
    const nowTs = useUIStore((s) => s.nowTs);
    const session = useSessionStore();
    const { draft, planId, dayId, saveState, isBusy, prefill, prefillMessage, staleSince, flush } = session;

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

    // Follow the default gym when it changes in the profile (until a gym is picked for this session).
    useEffect(() => {
        useSessionStore.getState().applyDefaultGym();
    }, [defaultGym]);

    const selectedPlan = plans.find((p) => p.id === planId);
    const weightUnit = draft ? sharedWeightUnit(draft.exercises) : null;
    const hasWeightExercises = !!draft?.exercises.some(isWeightExercise);

    const handleStart = () => session.start();

    const handleCancel = () => {
        if (confirmAction("Cancel this session? Everything logged in it will be deleted.")) session.cancel();
    };

    const showGym = gyms.length > 0 || !!draft?.gym;

    return (
        <Card heading={<SectionTitle text="Log Session" pageTitle />}>
            <div className="space-y-4">
                {isRunning && staleSince && (
                    <Notice tone="warn">
                        <div className="space-y-2">
                            <p>
                                This session was started {formatTime(draft.startedAt)} and last updated {formatTime(staleSince)}. Did
                                you forget to finish it?
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="success" disabled={isBusy} onClick={() => session.complete(staleSince)}>
                                    Complete at last update
                                </Button>
                                <Button size="sm" variant="danger" disabled={isBusy} onClick={handleCancel}>
                                    Discard
                                </Button>
                                <Button size="sm" variant="neutral" disabled={isBusy} onClick={session.dismissStale}>
                                    Keep going
                                </Button>
                            </div>
                        </div>
                    </Notice>
                )}

                <div className={`grid grid-cols-2 gap-4 ${showGym ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
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
                    <Field label="Date" className="col-span-2 sm:col-span-1">
                        <input
                            type="date"
                            className={inputClass}
                            value={draft?.date ?? todayISO()}
                            disabled={!draft}
                            onChange={(e) => session.update((d) => ({ ...d, date: e.target.value }))}
                        />
                    </Field>
                    {showGym && (
                        <GymSelect
                            className="col-span-2 sm:col-span-1"
                            gyms={gyms}
                            value={draft?.gym ?? null}
                            disabled={!draft}
                            onChange={session.setGym}
                        />
                    )}
                </div>

                {!draft || !dayId ? (
                    <p className="text-sm text-slate-400">Select a plan and day to start logging.</p>
                ) : (
                    <div className="space-y-4">
                        {!isRunning ? (
                            <div className={BUTTON_GROUP}>
                                <Button className={GROUP_BUTTON} onClick={handleStart} disabled={isBusy || draft.exercises.length === 0}>
                                    Start
                                </Button>
                                <Button
                                    variant="info"
                                    className={GROUP_BUTTON}
                                    onClick={() => session.loadPrevious("values")}
                                    disabled={isBusy}
                                    title="Load previous values"
                                >
                                    <span className="text-center">
                                        Load <span className="sm:hidden">prev</span>
                                        <span className="hidden sm:inline">previous</span> values
                                    </span>
                                </Button>
                                <Button
                                    variant="accent"
                                    className={GROUP_BUTTON}
                                    onClick={() => session.loadPrevious("session")}
                                    disabled={isBusy}
                                    title="Load previous session"
                                >
                                    <span className="text-center">
                                        Load <span className="sm:hidden">prev</span>
                                        <span className="hidden sm:inline">previous</span> session
                                    </span>
                                </Button>
                            </div>
                        ) : (
                            <div className={BUTTON_GROUP}>
                                <Button variant="success" className={GROUP_BUTTON} onClick={() => session.complete()} disabled={isBusy}>
                                    Complete
                                </Button>
                                <Button variant="danger" className={GROUP_BUTTON} onClick={handleCancel} disabled={isBusy}>
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {!isRunning && prefill && (
                            <Notice>
                                {prefill.mode === "values" ? "Weights" : "Exercises and weights"} loaded from the session on{" "}
                                {formatISODate(prefill.date)}. Reps are left empty.{" "}
                                <button type="button" onClick={session.resetDraft} className="font-semibold underline hover:text-white">
                                    Reset to plan
                                </button>
                            </Notice>
                        )}
                        {!isRunning && prefillMessage && <Notice tone="warn">{prefillMessage}</Notice>}


                        <LogExercisesEditor
                            exercises={draft.exercises}
                            onChange={(exercises) => session.update((d) => ({ ...d, exercises }))}
                            library={library}
                            editable={isRunning}
                            defaultDistanceUnit={distanceUnit}
                            status={
                                isRunning && (
                                    <>
                                        {draft.startedAt && (
                                            <span className="text-xs text-slate-400" title="Started">
                                                {formatShortDateTime(draft.startedAt)} ({Math.max(0, Math.round((nowTs - draft.startedAt) / 60000))}{" "}
                                                mins)
                                            </span>
                                        )}
                                        <SaveIndicator state={saveState} onRetry={session.flush} />
                                    </>
                                )
                            }
                            actions={
                                // Records every weight exercise of the session in one unit (relabels, no conversion).
                                isRunning &&
                                hasWeightExercises && (
                                    <Segmented<WeightUnit | "">
                                        size="sm"
                                        value={weightUnit ?? ""}
                                        options={WEIGHT_UNITS.map((u) => ({ value: u }))}
                                        onChange={(unit) => unit && session.update((d) => withWeightUnit(d, unit))}
                                    />
                                )
                            }
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
