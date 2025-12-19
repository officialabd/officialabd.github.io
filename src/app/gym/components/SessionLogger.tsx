"use client";

import { useState } from "react";
import type { GymPlan, GymSet, LogDraft, GymLogExercise, SetType, WeightUnit } from "../types";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";
import { SearchIcon, PlusIcon, MinusIcon, EditIcon } from "./icons";
import { formatTime, todayISO, getExerciseStatus, openExerciseSearch } from "../utils";

interface SessionLoggerProps {
    plans: GymPlan[];
    selectedPlanId: string;
    selectedDayId: string;
    logDraft: LogDraft | null;
    isSubmitting: boolean;
    onPlanSelect: (planId: string) => void;
    onDaySelect: (dayId: string) => void;
    onDateChange: (date: string) => void;
    onStart: () => void;
    onSave: () => void;
    onComplete: () => void;
    onCancel: () => void;
    onSetsCountChange: (exerciseIndex: number, count: number) => void;
    onSetValueChange: (
        exerciseIndex: number,
        setIndex: number,
        field: keyof GymSet,
        value: number | null
    ) => void;
    onUnitChange: (exerciseIndex: number, unit: WeightUnit) => void;
    onNoteChange: (note: string) => void;
    onAddExercise: (name: string, muscleGroup: string) => void;
    onRemoveExercise: (exerciseIndex: number) => void;
    onUpdateExercise: (exerciseIndex: number, name: string, muscleGroup: string) => void;
}

export function SessionLogger({
    plans,
    selectedPlanId,
    selectedDayId,
    logDraft,
    isSubmitting,
    onPlanSelect,
    onDaySelect,
    onDateChange,
    onStart,
    onSave,
    onComplete,
    onCancel,
    onSetsCountChange,
    onSetValueChange,
    onUnitChange,
    onNoteChange,
    onAddExercise,
    onRemoveExercise,
    onUpdateExercise,
}: SessionLoggerProps) {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    const canEdit = !!logDraft?.startedAt;
    const isCompleted = logDraft?.status === "completed";
    
    // Track selected exercise index for mobile view
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
    
    // State for adding new exercise
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState("");
    const [newExerciseMuscle, setNewExerciseMuscle] = useState("");
    
    // State for editing exercise
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
    const [editExerciseName, setEditExerciseName] = useState("");
    const [editExerciseMuscle, setEditExerciseMuscle] = useState("");
    
    // Handle adding new exercise
    const handleAddExercise = () => {
        if (newExerciseName.trim()) {
            onAddExercise(newExerciseName.trim(), newExerciseMuscle.trim());
            setNewExerciseName("");
            setNewExerciseMuscle("");
            setIsAddingExercise(false);
        }
    };
    
    // Handle starting edit mode
    const handleStartEdit = (index: number, exercise: GymLogExercise) => {
        setEditingExerciseIndex(index);
        setEditExerciseName(exercise.name || "");
        setEditExerciseMuscle(exercise.muscleGroup || "");
    };
    
    // Handle saving exercise edit
    const handleSaveEdit = () => {
        if (editingExerciseIndex !== null && editExerciseName.trim()) {
            onUpdateExercise(editingExerciseIndex, editExerciseName.trim(), editExerciseMuscle.trim());
            setEditingExerciseIndex(null);
            setEditExerciseName("");
            setEditExerciseMuscle("");
        }
    };
    
    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingExerciseIndex(null);
        setEditExerciseName("");
        setEditExerciseMuscle("");
    };
    
    // Helper to get completion fraction
    const getCompletionFraction = (exercise: GymLogExercise): { filled: number; total: number } => {
        const total = exercise.sets?.length ?? 0;
        const setType = exercise.setType ?? "weight";
        const filled = (exercise.sets ?? []).filter((s) => {
            if (!s) return false;
            if (setType === "time") {
                return s.time !== null && s.time !== undefined;
            }
            return s.weight !== null && s.weight !== undefined;
        }).length;
        return { filled, total };
    };
    
    // Get background color for exercise item based on status
    const getExerciseRowBg = (exercise: GymLogExercise, isSelected: boolean): string => {
        if (isSelected) return "bg-blue-900/60 border-blue-500";
        const status = getExerciseStatus(exercise.sets, exercise.setType);
        if (status.label === "Completed") return "bg-emerald-900/30 border-emerald-700/50";
        if (status.label === "Partial") return "bg-orange-900/30 border-orange-700/50";
        return "bg-slate-900/60 border-slate-700";
    };
    
    // Selected exercise for mobile view
    const selectedExercise = selectedExerciseIndex !== null ? logDraft?.exercises[selectedExerciseIndex] : null;
    
    // Generate muscle group color map
    const muscleGroupColors: Record<string, string> = {};
    const colorPalette = [
        "bg-pink-500",
        "bg-purple-500", 
        "bg-indigo-500",
        "bg-cyan-500",
        "bg-teal-500",
        "bg-lime-500",
        "bg-amber-500",
        "bg-red-500",
        "bg-fuchsia-500",
        "bg-sky-500",
    ];
    let colorIndex = 0;
    logDraft?.exercises.forEach((ex) => {
        const muscle = ex.muscleGroup?.toLowerCase().trim();
        if (muscle && !muscleGroupColors[muscle]) {
            muscleGroupColors[muscle] = colorPalette[colorIndex % colorPalette.length];
            colorIndex++;
        }
    });
    
    const getMuscleColor = (muscleGroup?: string): string => {
        if (!muscleGroup) return "bg-slate-600";
        return muscleGroupColors[muscleGroup.toLowerCase().trim()] ?? "bg-slate-600";
    };

    return (
        <Card
            heading={
                <Basic
                    text="Log Session"
                    fontFamily="font-RobotoMono"
                    fontSize="text-2xl"
                    textColor="text-teal-300"
                />
            }
        >
            <div className="space-y-4">
                {/* Plan/Day/Date selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">Plan</label>
                        <select
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={selectedPlanId}
                            onChange={(e) => onPlanSelect(e.target.value)}
                        >
                            <option value="">Select plan</option>
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">Day</label>
                        <select
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={selectedDayId}
                            onChange={(e) => onDaySelect(e.target.value)}
                            disabled={!selectedPlan?.days.length}
                        >
                            <option value="">Select day</option>
                            {selectedPlan?.days.map((d) => (
                                <option key={`log-day-${d.id}`} value={d.id}>
                                    {d.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">Date</label>
                        <input
                            type="date"
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={logDraft?.date ?? todayISO()}
                            onChange={(e) => onDateChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Session content */}
                {selectedPlan && selectedDayId && logDraft ? (
                    <div className="space-y-4">
                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                            <button
                                onClick={onStart}
                                className="rounded-lg bg-indigo-500 px-3 py-2 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                                disabled={isCompleted}
                            >
                                Start
                            </button>
                            <button
                                onClick={onSave}
                                className="rounded-lg bg-teal-500 px-3 py-2 font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
                                disabled={!logDraft.startedAt || isCompleted || isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save"}
                            </button>
                            <button
                                onClick={onComplete}
                                className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                disabled={!logDraft.startedAt || isCompleted || isSubmitting}
                            >
                                Complete
                            </button>
                            <button
                                onClick={onCancel}
                                className="rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                disabled={!logDraft.startedAt || isCompleted || isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Status info */}
                        <div className="items-center gap-3 text-sm text-slate-300">
                            <span className="text-xs text-slate-400">
                                Status: {logDraft.status ?? "not started"}
                            </span>
                            <br />
                            <span className="text-xs text-slate-400">
                                Started: {formatTime(logDraft.startedAt)}
                            </span>
                            <br />
                            <span className="text-xs text-slate-400">
                                Finished: {formatTime(logDraft.completedAt)}
                            </span>
                        </div>

                        {/* Unified Exercise List Layout */}
                        <div className="space-y-3">
                            {/* Exercise List Header */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-400 font-semibold">
                                    Exercises ({logDraft.exercises.length}):
                                </div>
                                {canEdit && !isCompleted && (
                                    <button
                                        onClick={() => setIsAddingExercise(true)}
                                        className="p-1.5 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500"
                                        aria-label="Add exercise"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Add Exercise Form */}
                            {isAddingExercise && (
                                <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-3 space-y-3">
                                    <div className="text-sm font-semibold text-emerald-200">New Exercise</div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 text-white"
                                            placeholder="Exercise name"
                                            value={newExerciseName}
                                            onChange={(e) => setNewExerciseName(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 text-white"
                                            placeholder="Muscle group (optional)"
                                            value={newExerciseMuscle}
                                            onChange={(e) => setNewExerciseMuscle(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddExercise}
                                            disabled={!newExerciseName.trim()}
                                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsAddingExercise(false);
                                                setNewExerciseName("");
                                                setNewExerciseMuscle("");
                                            }}
                                            className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Exercise List */}
                            <div className="rounded-xl border border-slate-700 overflow-hidden">
                                {logDraft.exercises.map((ex: GymLogExercise, exIdx: number) => {
                                    const isSelected = selectedExerciseIndex === exIdx;
                                    const { filled, total } = getCompletionFraction(ex);
                                    const rowBg = getExerciseRowBg(ex, isSelected);
                                    const muscleColor = getMuscleColor(ex.muscleGroup);
                                    
                                    return (
                                        <div
                                            key={`ex-${exIdx}`}
                                            className={`flex items-center border-b last:border-b-0 cursor-pointer transition-colors ${rowBg}`}
                                            onClick={() => setSelectedExerciseIndex(isSelected ? null : exIdx)}
                                        >
                                            {/* Muscle group color indicator */}
                                            <div className={`w-1.5 self-stretch ${muscleColor}`} />
                                            
                                            <div className="flex items-center justify-between flex-1 px-3 py-3">
                                                <span className={`text-sm font-medium truncate flex-1 ${isSelected ? "text-blue-200" : "text-slate-200"}`}>
                                                    {ex.name || "Exercise"}
                                                </span>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <span className={`text-xs font-semibold ${
                                                        filled === total && total > 0 ? "text-emerald-400" :
                                                        filled > 0 ? "text-orange-400" : "text-slate-400"
                                                    }`}>
                                                        {filled}/{total}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openExerciseSearch(ex.name, ex.muscleGroup);
                                                        }}
                                                        className="p-1 text-indigo-300 hover:text-indigo-100"
                                                        aria-label="Search exercise"
                                                    >
                                                        <SearchIcon className="w-4 h-4" />
                                                    </button>
                                                    {canEdit && !isCompleted && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRemoveExercise(exIdx);
                                                                if (selectedExerciseIndex === exIdx) {
                                                                    setSelectedExerciseIndex(null);
                                                                }
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
                            
                            {/* Selected Exercise Sets */}
                            {selectedExercise && selectedExerciseIndex !== null && (
                                <>
                                    {/* Edit Exercise Form */}
                                    {editingExerciseIndex === selectedExerciseIndex ? (
                                        <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-3 space-y-3">
                                            <div className="text-sm font-semibold text-amber-200">Edit Exercise</div>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 text-white"
                                                    placeholder="Exercise name"
                                                    value={editExerciseName}
                                                    onChange={(e) => setEditExerciseName(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 text-white"
                                                    placeholder="Muscle group (optional)"
                                                    value={editExerciseMuscle}
                                                    onChange={(e) => setEditExerciseMuscle(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    disabled={!editExerciseName.trim()}
                                                    className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <SetEditor
                                            exercise={selectedExercise}
                                            exerciseIndex={selectedExerciseIndex}
                                            canEdit={canEdit}
                                            isCompleted={isCompleted}
                                            onSetsCountChange={(count) => onSetsCountChange(selectedExerciseIndex, count)}
                                            onSetValueChange={(setIdx, field, value) =>
                                                onSetValueChange(selectedExerciseIndex, setIdx, field, value)
                                            }
                                            onUnitChange={(unit) => onUnitChange(selectedExerciseIndex, unit)}
                                            onEditClick={() => handleStartEdit(selectedExerciseIndex, selectedExercise)}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {/* Session notes */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-slate-400">Session notes</label>
                            <textarea
                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                rows={3}
                                value={logDraft.note ?? ""}
                                onChange={(e) => onNoteChange(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">
                        Select a plan and day to start logging.
                    </p>
                )}
            </div>
        </Card>
    );
}

// ============================================================================
// Set Editor Component (Unified for all screen sizes)
// ============================================================================

interface SetEditorProps {
    exercise: GymLogExercise;
    exerciseIndex: number;
    canEdit: boolean;
    isCompleted: boolean;
    onSetsCountChange: (count: number) => void;
    onSetValueChange: (setIndex: number, field: keyof GymSet, value: number | null) => void;
    onUnitChange: (unit: WeightUnit) => void;
    onEditClick?: () => void;
}

// Unit options
const weightUnits: WeightUnit[] = ["kg", "lb"];
const timeUnits = ["secs", "mins", "hours"] as const;
type TimeUnit = typeof timeUnits[number];

function SetEditor({
    exercise,
    exerciseIndex,
    canEdit,
    isCompleted,
    onSetsCountChange,
    onSetValueChange,
    onUnitChange,
    onEditClick,
}: SetEditorProps) {
    const setType = (exercise.setType ?? "weight") as SetType;
    const weightUnit = (exercise.weightUnit ?? "kg") as WeightUnit;
    const isTimeType = setType === "time";
    
    // For time type, we store the "unit" in weightUnit field as well
    const [timeUnit, setTimeUnit] = useState<TimeUnit>("mins");
    
    const handleNumberInput = (
        value: string,
        onChange: (v: number | null) => void
    ) => {
        onChange(value === "" ? null : Number(value));
    };
    
    const handleAddSet = () => {
        onSetsCountChange(exercise.sets.length + 1);
    };
    
    const handleRemoveSet = () => {
        if (exercise.sets.length > 0) {
            onSetsCountChange(exercise.sets.length - 1);
        }
    };
    
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div>
                        <span className="text-sm font-semibold text-teal-200">
                            {exercise.name || "Exercise"}
                        </span>
                        {exercise.muscleGroup && (
                            <div className="text-xs text-slate-400">{exercise.muscleGroup}</div>
                        )}
                    </div>
                    {canEdit && !isCompleted && onEditClick && (
                        <button
                            onClick={onEditClick}
                            className="p-1.5 text-amber-400 hover:text-amber-300"
                            aria-label="Edit exercise"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRemoveSet}
                        disabled={!canEdit || isCompleted || exercise.sets.length === 0}
                        className="p-2 rounded-lg bg-rose-600/80 text-white hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Remove last set"
                    >
                        <MinusIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleAddSet}
                        disabled={!canEdit || isCompleted}
                        className="p-2 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Add set"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Unit selector */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Unit:</span>
                {isTimeType ? (
                    <select
                        className="rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1 text-xs focus:outline-none focus:border-teal-400 text-white"
                        value={timeUnit}
                        disabled={!canEdit || isCompleted}
                        onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
                    >
                        {timeUnits.map((u) => (
                            <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                        ))}
                    </select>
                ) : (
                    <select
                        className="rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1 text-xs focus:outline-none focus:border-teal-400 text-white"
                        value={weightUnit}
                        disabled={!canEdit || isCompleted}
                        onChange={(e) => onUnitChange(e.target.value as WeightUnit)}
                    >
                        {weightUnits.map((u) => (
                            <option key={u} value={u}>{u.toUpperCase()}</option>
                        ))}
                    </select>
                )}
            </div>
            
            {/* Sets Table */}
            {exercise.sets.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-700">
                                <th className="py-2 text-left w-12">Set #</th>
                                <th className="py-2 text-left">{isTimeType ? "Time" : "Value"}</th>
                                <th className="py-2 text-left w-16">Unit</th>
                                {!isTimeType && <th className="py-2 text-left">Reps</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {exercise.sets.map((set, setIdx) => (
                                <tr key={setIdx} className="border-b border-slate-800/50 last:border-b-0">
                                    <td className="py-2 text-slate-300">{setIdx + 1}</td>
                                    <td className="py-2 pr-2">
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            step={isTimeType ? "1" : "0.5"}
                                            className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-2 text-sm focus:outline-none focus:border-blue-400 text-white"
                                            placeholder={isTimeType ? "0" : "0"}
                                            value={isTimeType ? (set.time ?? "") : (set.weight ?? "")}
                                            disabled={!canEdit || isCompleted}
                                            onChange={(e) => 
                                                handleNumberInput(
                                                    e.target.value,
                                                    (v) => onSetValueChange(setIdx, isTimeType ? "time" : "weight", v)
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="py-2 pr-2 text-xs text-slate-400">
                                        {isTimeType 
                                            ? timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1) 
                                            : weightUnit.toUpperCase()}
                                    </td>
                                    {!isTimeType && (
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min="0"
                                                className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-2 text-sm focus:outline-none focus:border-blue-400 text-white"
                                                placeholder="0"
                                                value={set.reps ?? ""}
                                                disabled={!canEdit || isCompleted}
                                                onChange={(e) =>
                                                    handleNumberInput(
                                                        e.target.value,
                                                        (v) => onSetValueChange(setIdx, "reps", v)
                                                    )
                                                }
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-xs text-slate-500 text-center py-3">
                    No sets. Tap + to add a set.
                </p>
            )}
        </div>
    );
}
