"use client";

import { useState } from "react";
import { DISTANCE_UNITS, PER_OPTIONS, TIME_UNITS, WEIGHT_UNITS } from "../constants";
import type { DistanceUnit, GymExercise, GymLogExercise, GymSet, Per, TimeUnit, Unit } from "../types";
import {
    buildGroupColors,
    computeSpeed,
    formatPace,
    getExerciseStatus,
    isTimeUnit,
    isWeightExercise,
    logExerciseFromLibrary,
    openExerciseSearch,
    resizeSets,
    unitLabel,
    withPer,
    withUnit,
} from "../utils";
import { ExercisePicker } from "./ExercisePicker";
import { MinusIcon, PlusIcon, SearchIcon } from "./icons";
import { compactInputClass, IconButton } from "./ui";

interface LogExercisesEditorProps {
    exercises: GymLogExercise[];
    onChange: (exercises: GymLogExercise[]) => void;
    /** Exercise library, used to add exercises. */
    library: GymExercise[];
    /** Values can be edited (session started, or editing a log). */
    editable: boolean;
    defaultDistanceUnit: DistanceUnit;
}

/** Exercise list + set editor, shared by the running session and the log editor. */
export function LogExercisesEditor({ exercises, onChange, library, editable, defaultDistanceUnit }: LogExercisesEditorProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isPicking, setIsPicking] = useState(false);

    const groupColor = buildGroupColors(exercises.map((ex) => ex.group));
    const completedCount = exercises.filter((ex) => getExerciseStatus(ex).label === "Completed").length;
    const selected = selectedIndex !== null ? exercises[selectedIndex] : undefined;

    const replaceAt = (index: number, ex: GymLogExercise) =>
        onChange(exercises.map((e, i) => (i === index ? ex : e)));

    const removeAt = (index: number) => {
        onChange(exercises.filter((_, i) => i !== index));
        setSelectedIndex((current) => (current === index ? null : current !== null && current > index ? current - 1 : current));
    };

    const addFromLibrary = (ex: GymExercise) => {
        onChange([...exercises, logExerciseFromLibrary(ex)]);
        setSelectedIndex(exercises.length);
        setIsPicking(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400 font-semibold">
                    Exercises ({completedCount}/{exercises.length}):
                </div>
                {editable && (
                    <IconButton
                        onClick={() => setIsPicking(true)}
                        className="p-1.5 bg-emerald-600/80 hover:bg-emerald-500"
                        aria-label="Add exercise"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </IconButton>
                )}
            </div>

            {isPicking && (
                <ExercisePicker
                    exercises={library}
                    excludeIds={exercises.map((e) => e.exerciseId).filter((id): id is string => !!id)}
                    onPick={addFromLibrary}
                    onClose={() => setIsPicking(false)}
                />
            )}

            {exercises.length > 0 && (
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                    {exercises.map((ex, index) => {
                        const isSelected = selectedIndex === index;
                        const status = getExerciseStatus(ex);
                        return (
                            <div
                                key={`${ex.exerciseId ?? ex.name}-${index}`}
                                className={`flex items-center border-b last:border-b-0 cursor-pointer transition-colors ${
                                    isSelected ? "bg-blue-900/60 border-blue-500" : status.rowColor
                                }`}
                                onClick={() => setSelectedIndex(isSelected ? null : index)}
                            >
                                <div className={`w-1.5 self-stretch ${groupColor(ex.group)}`} />
                                <div className="flex items-center justify-between flex-1 px-3 py-3">
                                    <span className={`text-sm font-medium truncate flex-1 ${isSelected ? "text-blue-200" : "text-slate-200"}`}>
                                        {ex.name || "Exercise"}
                                    </span>
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className={`text-xs font-semibold ${status.textColor}`}>
                                            {status.filled}/{status.total}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openExerciseSearch(ex.name, ex.group);
                                            }}
                                            className="p-1 text-indigo-300 hover:text-indigo-100"
                                            aria-label="Search exercise"
                                        >
                                            <SearchIcon className="w-4 h-4" />
                                        </button>
                                        {editable && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeAt(index);
                                                }}
                                                className="p-1 text-rose-400 hover:text-rose-300"
                                                aria-label="Remove exercise"
                                            >
                                                <MinusIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selected && selectedIndex !== null && (
                <SetEditor
                    exercise={selected}
                    editable={editable}
                    defaultDistanceUnit={defaultDistanceUnit}
                    onChange={(ex) => replaceAt(selectedIndex, ex)}
                />
            )}
        </div>
    );
}

// ============================================================================
// Set editor
// ============================================================================

interface SetEditorProps {
    exercise: GymLogExercise;
    editable: boolean;
    defaultDistanceUnit: DistanceUnit;
    onChange: (exercise: GymLogExercise) => void;
}

const parseNumber = (value: string): number | null => (value === "" ? null : Number(value));

function SetEditor({ exercise, editable, defaultDistanceUnit, onChange }: SetEditorProps) {
    const isRunning = exercise.per === "running";
    const isWeight = isWeightExercise(exercise);
    const timeUnit: TimeUnit = isTimeUnit(exercise.unit) ? exercise.unit : "mins";
    const unitOptions: Unit[] = exercise.type === "time" ? TIME_UNITS : WEIGHT_UNITS;

    const setField = (setIndex: number, field: keyof GymSet, value: number | null) =>
        onChange({
            ...exercise,
            sets: exercise.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
        });

    const setCount = (count: number) => onChange({ ...exercise, sets: resizeSets(exercise.sets, count) });

    const numberInput = (setIndex: number, field: keyof GymSet, step: string, mode: "decimal" | "numeric") => (
        <input
            type="number"
            inputMode={mode}
            min="0"
            step={step}
            placeholder="0"
            className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-400 disabled:opacity-60"
            value={(exercise.sets[setIndex][field] as number | null) ?? ""}
            disabled={!editable}
            onChange={(e) => setField(setIndex, field, parseNumber(e.target.value))}
        />
    );

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-teal-200 truncate">{exercise.name || "Exercise"}</div>
                    {exercise.group && <div className="text-xs text-slate-400">{exercise.group}</div>}
                </div>
                <div className="flex items-center gap-2">
                    <IconButton
                        onClick={() => setCount(exercise.sets.length - 1)}
                        disabled={!editable || exercise.sets.length === 0}
                        className="bg-rose-600/80 hover:bg-rose-500"
                        aria-label="Remove last set"
                    >
                        <MinusIcon className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                        onClick={() => setCount(exercise.sets.length + 1)}
                        disabled={!editable}
                        className="bg-emerald-600/80 hover:bg-emerald-500"
                        aria-label="Add set"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </IconButton>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Unit:</span>
                <select
                    className={compactInputClass}
                    value={exercise.unit}
                    disabled={!editable}
                    onChange={(e) => onChange(withUnit(exercise, e.target.value as Unit))}
                >
                    {unitOptions.map((u) => (
                        <option key={u} value={u}>
                            {unitLabel(u)}
                        </option>
                    ))}
                </select>
                {isRunning && (
                    <>
                        <span className="text-xs text-slate-400">Distance:</span>
                        <select
                            className={compactInputClass}
                            value={exercise.distanceUnit ?? defaultDistanceUnit}
                            disabled={!editable}
                            onChange={(e) => onChange({ ...exercise, distanceUnit: e.target.value as DistanceUnit })}
                        >
                            {DISTANCE_UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {unitLabel(u)}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                <span className="text-xs text-slate-400">Per:</span>
                <select
                    className={compactInputClass}
                    value={exercise.per}
                    disabled={!editable}
                    onChange={(e) => onChange(withPer(exercise, e.target.value as Per, defaultDistanceUnit))}
                >
                    {PER_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>

            {exercise.sets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No sets. Tap + to add a set.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-700 text-left">
                                <th className="py-2 w-12">Set #</th>
                                {isRunning && <th className="py-2">Distance ({unitLabel(exercise.distanceUnit)})</th>}
                                <th className="py-2">
                                    {isWeight ? "Weight" : "Time"} ({unitLabel(exercise.unit)})
                                </th>
                                {isWeight && <th className="py-2">Reps</th>}
                                {isRunning && <th className="py-2">Pace / Speed</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {exercise.sets.map((set, setIndex) => {
                                const pace = formatPace(set.distance, set.value, timeUnit);
                                const speed = computeSpeed(set.distance, set.value, timeUnit);
                                const distanceUnit = unitLabel(exercise.distanceUnit);
                                return (
                                    <tr key={setIndex} className="border-b border-slate-800/50 last:border-b-0">
                                        <td className="py-2 text-slate-300">{setIndex + 1}</td>
                                        {isRunning && <td className="py-2 pr-2">{numberInput(setIndex, "distance", "0.01", "decimal")}</td>}
                                        <td className="py-2 pr-2">
                                            {numberInput(setIndex, "value", isWeight ? "0.5" : "1", "decimal")}
                                        </td>
                                        {isWeight && <td className="py-2">{numberInput(setIndex, "reps", "1", "numeric")}</td>}
                                        {isRunning && (
                                            <td className="py-2 text-xs text-slate-300">
                                                {pace ? (
                                                    <>
                                                        {pace} /{distanceUnit}
                                                        <br />
                                                        {speed} {distanceUnit}/h
                                                    </>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
