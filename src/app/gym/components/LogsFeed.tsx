"use client";

import { useState, type ReactNode } from "react";
import Card from "./Card";
import LinePulse from "../../_layouts/pulse/line";
import { MIN_DAY_LOGS } from "../constants";
import type { GymLogEntry, GymLogExercise, GymSet, LogDraft, WeightDisplay } from "../types";
import { useExercisesStore, useLogsStore, usePlansStore, useProfileStore, useUIStore } from "../stores";
import {
    computeSpeed,
    confirmAction,
    convertWeight,
    formatDuration,
    formatGroups,
    formatISODate,
    formatPace,
    formatTime,
    getExerciseStatus,
    hasSetValues,
    isTimeUnit,
    isWeightExercise,
    isWeightUnit,
    perLabel,
    unitLabel,
} from "../utils";
import { LogExercisesEditor } from "./LogExercisesEditor";
import { EditIcon } from "./icons";
import { Button, EmptyState, Field, FilterBar, GymSelect, inputClass, Notice, RefreshButton, SectionTitle, Segmented } from "./ui";

export function LogsFeed() {
    const { logs, filter, isLoading, error, extendedBeyondRange, setFilter, load } = useLogsStore();
    const plans = usePlansStore((s) => s.plans);
    const { logsWeightDisplay, setLogsWeightDisplay } = useUIStore();
    const [editingId, setEditingId] = useState<string | null>(null);

    const filterPlan = plans.find((p) => p.id === filter.planId);

    return (
        <Card
            heading={
                <SectionTitle text="Logs" pageTitle />
            }
        >
            <div className="space-y-4">
                <FilterBar>
                    {/* Plan and Day share a row on phones; on wider screens they flow with the other filters. */}
                    <div className="grid grid-cols-2 gap-3 sm:contents">
                        <Field label="Plan" className="min-w-0 sm:min-w-[9rem]">
                            <select
                                className={inputClass}
                                value={filter.planId}
                                onChange={(e) => setFilter({ planId: e.target.value, dayId: "" })}
                            >
                                <option value="">All plans</option>
                                {plans.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Day" className="min-w-0 sm:min-w-[9rem]">
                            <select
                                className={inputClass}
                                value={filter.dayId}
                                onChange={(e) => setFilter({ dayId: e.target.value })}
                                disabled={!filterPlan}
                            >
                                <option value="">All days</option>
                                {filterPlan?.days.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.title}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <Field label="From">
                        <input type="date" className={inputClass} value={filter.from} onChange={(e) => setFilter({ from: e.target.value })} />
                    </Field>
                    <Field label="To">
                        <input type="date" className={inputClass} value={filter.to} onChange={(e) => setFilter({ to: e.target.value })} />
                    </Field>
                    <Field as="div" label="Weights in">
                        <Segmented<WeightDisplay>
                            value={logsWeightDisplay}
                            options={[{ value: "logged", label: "As logged" }, { value: "kg" }, { value: "lb" }]}
                            onChange={setLogsWeightDisplay}
                        />
                    </Field>
                    <RefreshButton onClick={load} disabled={isLoading} />
                </FilterBar>

                {isLoading && <LinePulse />}
                {error && <Notice tone="error">{error}</Notice>}
                {!isLoading && !error && logs.length === 0 && <EmptyState>No logs found.</EmptyState>}
                {!isLoading && extendedBeyondRange && (
                    <Notice>Fewer than {MIN_DAY_LOGS} sessions in this date range — older sessions are included.</Notice>
                )}

                <div className="space-y-4">
                    {logs.map((log) =>
                        editingId === log.id ? (
                            <LogEditor key={log.id} log={log} onDone={() => setEditingId(null)} />
                        ) : (
                            <LogEntryCard
                                key={log.id}
                                log={log}
                                weightDisplay={logsWeightDisplay}
                                onEdit={log.status === "running" ? undefined : () => setEditingId(log.id)}
                            />
                        )
                    )}
                </div>
            </div>
        </Card>
    );
}

// ============================================================================
// Read-only log card
// ============================================================================

/** Formats one set for display, converting weights when a display unit is chosen (view only). */
function SetChip({ set, exercise, weightDisplay }: { set: GymSet; exercise: GymLogExercise; weightDisplay: WeightDisplay }) {
    if (exercise.per === "running") {
        const timeUnit = isTimeUnit(exercise.unit) ? exercise.unit : "mins";
        const pace = formatPace(set.distance, set.value, timeUnit);
        const speed = computeSpeed(set.distance, set.value, timeUnit);
        const dist = unitLabel(exercise.distanceUnit);
        return (
            <Chip>
                <b>{set.distance ?? "-"}</b> {dist}
                <span className="text-slate-400">in</span>
                <b>{set.value ?? "-"}</b> {unitLabel(exercise.unit)}
                {set.calories !== null && (
                    <>
                        <span className="text-slate-400">·</span>
                        <b>{set.calories}</b> kcal
                    </>
                )}
                {pace && (
                    <span className="text-slate-400">
                        ({pace}/{dist}, {speed} {dist}/h)
                    </span>
                )}
            </Chip>
        );
    }

    if (exercise.type === "reps") {
        return (
            <Chip>
                <b>{set.reps ?? "-"}</b> reps
            </Chip>
        );
    }

    let value = set.value;
    let unit = exercise.unit;
    if (isWeightExercise(exercise) && isWeightUnit(unit) && weightDisplay !== "logged" && value !== null) {
        value = convertWeight(value, unit, weightDisplay);
        unit = weightDisplay;
    }
    return (
        <Chip>
            <b>{value ?? "-"}</b> {unitLabel(unit)}
            {exercise.type === "weight" && (
                <>
                    <span className="text-slate-400">×</span>
                    <b>{set.reps ?? "-"}</b>
                </>
            )}
        </Chip>
    );
}

function Chip({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-100">
            {children}
        </span>
    );
}

function LogEntryCard({ log, weightDisplay, onEdit }: { log: GymLogEntry; weightDisplay: WeightDisplay; onEdit?: () => void }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-200">
                <span className="font-semibold text-teal-200">
                    {log.planTitle} • {log.dayTitle}
                    {log.status === "running" && (
                        <span className="ml-2 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[11px] text-amber-200">In progress</span>
                    )}
                </span>
                <span className="flex items-center gap-2">
                    {formatISODate(log.date)}
                    {onEdit && (
                        <button type="button" onClick={onEdit} className="p-1 text-amber-300 hover:text-amber-200" aria-label="Edit log">
                            <EditIcon className="w-4 h-4" />
                        </button>
                    )}
                </span>
            </div>
            <div className="text-xs text-slate-400 space-y-0.5">
                <div>Started: {formatTime(log.startedAt)}</div>
                <div>Finished: {formatTime(log.completedAt)}</div>
                <div>Duration: {formatDuration(log.startedAt, log.completedAt)}</div>
                <div>Gym: {log.gym ?? "No gym"}</div>
            </div>
            {log.note && <p className="text-sm text-slate-200">Session note: {log.note}</p>}

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
                {log.exercises.map((ex, idx) => {
                    const status = getExerciseStatus(ex);
                    const filledSets = ex.sets.filter(hasSetValues);
                    return (
                        <div key={idx} className="px-3 py-2 space-y-1 sm:grid sm:grid-cols-[35%_10%_1fr_10%] sm:items-center sm:gap-3 sm:space-y-0">
                            <div className="flex items-start justify-between gap-3 sm:block">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-100">{ex.name}</div>
                                    {ex.groups.length > 0 && <div className="text-xs text-slate-400">{formatGroups(ex.groups)}</div>}
                                </div>
                                <span className="sm:hidden shrink-0 whitespace-nowrap text-[11px] text-slate-300">
                                    {perLabel(ex.per)} •
                                    <span className={`ml-1 rounded-md px-1 py-0.5 text-xs font-semibold text-black ${status.bgColor}`}>
                                        {ex.skipped ? "Skipped" : `${status.filled}/${status.total}`}
                                    </span>
                                </span>
                            </div>
                            <div className="hidden sm:block text-center text-xs text-slate-300">{perLabel(ex.per)}</div>
                            <div className="flex flex-wrap gap-1">
                                {filledSets.length === 0 ? (
                                    <span className="text-xs text-slate-500">-</span>
                                ) : (
                                    filledSets.map((s, i) => <SetChip key={i} set={s} exercise={ex} weightDisplay={weightDisplay} />)
                                )}
                            </div>
                            <div className={`hidden sm:block text-center text-xs font-semibold ${status.textColor}`}>
                                {ex.skipped ? "Skipped" : `${status.filled}/${status.total}`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Log editor
// ============================================================================

function LogEditor({ log, onDone }: { log: GymLogEntry; onDone: () => void }) {
    const { saveLog, deleteLog } = useLogsStore();
    const library = useExercisesStore((s) => s.exercises);
    const distanceUnit = useProfileStore((s) => s.profile.units.distance);
    const gyms = useProfileStore((s) => s.profile.gyms);
    const [draft, setDraft] = useState<LogDraft>(() => {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = log;
        return rest;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async (task: () => Promise<void>) => {
        setIsSaving(true);
        setError(null);
        try {
            await task();
            onDone();
        } catch (err) {
            console.error(err);
            setError("Could not save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (confirmAction(`Delete the ${log.dayTitle} log from ${formatISODate(log.date)}? This cannot be undone.`)) {
            run(() => deleteLog(log.id));
        }
    };

    return (
        <div className="rounded-xl border border-amber-700/50 bg-slate-950/60 p-4 space-y-4">
            <div className="text-sm font-semibold text-teal-200">
                Editing: {log.planTitle} • {log.dayTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date">
                    <input type="date" className={inputClass} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </Field>
                <GymSelect gyms={gyms} value={draft.gym} onChange={(gym) => setDraft({ ...draft, gym })} />
            </div>

            <LogExercisesEditor
                exercises={draft.exercises}
                onChange={(exercises) => setDraft({ ...draft, exercises })}
                library={library}
                editable
                defaultDistanceUnit={distanceUnit}
            />

            <Field label="Session notes">
                <textarea className={inputClass} rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>

            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="save" disabled={isSaving} onClick={() => run(() => saveLog(log, draft))}>
                    {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="neutral" disabled={isSaving} onClick={onDone}>
                    Cancel
                </Button>
                <Button size="sm" variant="danger" disabled={isSaving} onClick={handleDelete}>
                    Delete log
                </Button>
            </div>
        </div>
    );
}
