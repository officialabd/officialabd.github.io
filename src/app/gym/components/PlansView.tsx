"use client";

import { useState } from "react";
import type { GymPlan, GymPlanDay, SetType, WeightUnit } from "../types";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";
import LinePulse from "../../_layouts/pulse/line";
import { openExerciseSearch, exportToJsonFile, ensureSetCount } from "../utils";
import { SearchIcon, DownloadIcon, PlusIcon, TrashIcon, DragIcon, EditIcon } from "./icons";

// Helper to format date nicely
function formatDate(timestamp: number | null | undefined): string {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PlansViewProps {
    plans: GymPlan[];
    selectedPlanId: string;
    selectedDayId: string;
    planDrafts: Record<string, GymPlan>;
    planDirty: Record<string, boolean>;
    isLoading: boolean;
    isSaving: boolean;
    draggingExerciseId: string | null;
    dragOverExerciseId: string | null;
    onPlanSelect: (planId: string) => void;
    onDaySelect: (dayId: string) => void;
    onAddPlan: () => void;
    onSavePlan: (planId: string) => void;
    onDeletePlan: (planId: string) => void;
    onAddDay: (planId: string) => void;
    onDeleteDay: (planId: string, dayId: string) => void;
    onUpdatePlanTitle: (planId: string, title: string) => void;
    onUpdatePlanNote: (planId: string, note: string) => void;
    onUpdateDayTitle: (planId: string, dayId: string, title: string) => void;
    onUpdateDayNote: (planId: string, dayId: string, note: string) => void;
    onUpdateExercise: (
        planId: string,
        dayId: string,
        exerciseIndex: number,
        field: string,
        value: any
    ) => void;
    onAddExercise: (planId: string, dayId: string) => void;
    onDeleteExercise: (planId: string, dayId: string, exerciseIndex: number) => void;
    onDragStart: (exerciseId: string) => void;
    onDragEnd: () => void;
    onDragEnter: (exerciseId: string) => void;
    onDragLeave: (exerciseId: string) => void;
    onDrop: (planId: string, dayId: string, sourceId: string, targetId: string) => void;
}

export function PlansView({
    plans,
    selectedPlanId,
    selectedDayId,
    planDrafts,
    planDirty,
    isLoading,
    isSaving,
    draggingExerciseId,
    dragOverExerciseId,
    onPlanSelect,
    onDaySelect,
    onAddPlan,
    onSavePlan,
    onDeletePlan,
    onAddDay,
    onDeleteDay,
    onUpdatePlanTitle,
    onUpdatePlanNote,
    onUpdateDayTitle,
    onUpdateDayNote,
    onUpdateExercise,
    onAddExercise,
    onDeleteExercise,
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDrop,
}: PlansViewProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    const editDraft = selectedPlan ? planDrafts[selectedPlan.id] ?? selectedPlan : null;
    const selectedDay = editDraft?.days.find((d) => d.id === selectedDayId);

    const handleAddNewDay = () => {
        if (selectedPlan) {
            onAddDay(selectedPlan.id);
        }
    };

    const handleToggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <div className="space-y-4">
            {/* Plans Card */}
            <Card
                heading={
                    <div className="flex items-center justify-between w-full">
                        <Basic
                            text="Plans"
                            fontFamily="font-RobotoMono"
                            fontSize="text-2xl"
                            textColor="text-teal-300"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onAddPlan}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Create Plan</span>
                            </button>
                            <button
                                onClick={() => exportToJsonFile(plans, "gymPlans-backup")}
                                disabled={plans.length === 0}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                                    plans.length > 0
                                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                        : "bg-slate-800 text-slate-500"
                                }`}
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {isLoading && <LinePulse />}

                    {!isLoading && plans.length === 0 && (
                        <p className="text-sm text-slate-400">
                            No plans yet. Create one to get started.
                        </p>
                    )}

                    {/* Plans List */}
                    {!isLoading && plans.length > 0 && (
                        <div className="rounded-lg border border-slate-700 overflow-hidden">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => {
                                        onPlanSelect(plan.id === selectedPlanId ? "" : plan.id);
                                        if (plan.id !== selectedPlanId) {
                                            setIsEditMode(false);
                                        }
                                    }}
                                    className={`cursor-pointer border-b border-slate-700 px-3 py-3 transition-colors last:border-b-0 ${
                                        selectedPlanId === plan.id
                                            ? "bg-blue-600/20 border-l-2 border-l-blue-500"
                                            : "hover:bg-slate-800/50"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                        <span className={`font-medium min-w-[180px] ${
                                            selectedPlanId === plan.id ? "text-blue-300" : "text-slate-200"
                                        }`}>
                                            {plan.title}
                                        </span>
                                        <span className="text-sm text-slate-400">
                                            {plan.days.length} {plan.days.length === 1 ? "day" : "days"}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Created: {formatDate(plan.createdAt)}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Updated: {formatDate(plan.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Selected Plan Actions */}
                    {!isLoading && selectedPlan && (
                        <div className="flex items-center justify-between gap-3 pt-2">
                            {selectedPlan.note && !isEditMode && (
                                <div className="text-sm text-slate-300 flex-1">{selectedPlan.note}</div>
                            )}
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={handleToggleEditMode}
                                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                                        isEditMode
                                            ? "bg-slate-700 text-white hover:bg-slate-600"
                                            : "bg-indigo-500 text-white hover:bg-indigo-400"
                                    }`}
                                >
                                    <EditIcon className="w-4 h-4" />
                                    {isEditMode ? "Done Editing" : "Edit Plan"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Plan Editor (when in edit mode) */}
                    {!isLoading && selectedPlan && editDraft && isEditMode && (
                        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-slate-900/40 p-4 shadow-md">
                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                <div className="flex flex-col gap-2 w-full sm:flex-1">
                                    <label className="text-xs text-slate-400">Plan title</label>
                                    <input
                                        className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                        value={editDraft.title}
                                        onChange={(e) =>
                                            onUpdatePlanTitle(selectedPlan.id, e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    {planDirty[selectedPlan.id] && (
                                        <span className="text-[11px] text-amber-300">
                                            Unsaved changes — press Save
                                        </span>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onSavePlan(selectedPlan.id)}
                                            className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={() => onDeletePlan(selectedPlan.id)}
                                            className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-400">Plan notes</label>
                                <textarea
                                    className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                    rows={2}
                                    value={editDraft.note ?? ""}
                                    onChange={(e) =>
                                        onUpdatePlanNote(selectedPlan.id, e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Days Card - Only show when a plan is selected */}
            {!isLoading && selectedPlan && editDraft && (
                <Card
                    heading={
                        <div className="flex items-center justify-between w-full">
                            <Basic
                                text="Days"
                                fontFamily="font-RobotoMono"
                                fontSize="text-2xl"
                                textColor="text-teal-300"
                            />
                            {isEditMode && (
                                <button
                                    onClick={handleAddNewDay}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Day
                                </button>
                            )}
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {editDraft.days.length === 0 ? (
                            <p className="text-sm text-slate-400">No days in this plan yet.</p>
                        ) : (
                            <div className="rounded-lg border border-slate-700 overflow-hidden">
                                {editDraft.days.map((day) => (
                                    <div
                                        key={day.id}
                                        onClick={() => onDaySelect(day.id === selectedDayId ? "" : day.id)}
                                        className={`cursor-pointer border-b border-slate-700 px-3 py-3 transition-colors last:border-b-0 ${
                                            selectedDayId === day.id
                                                ? "bg-blue-600/20 border-l-2 border-l-blue-500"
                                                : "hover:bg-slate-800/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-x-6">
                                            <span className={`font-medium min-w-[120px] ${
                                                selectedDayId === day.id ? "text-blue-300" : "text-slate-200"
                                            }`}>
                                                {day.title}
                                            </span>
                                            <span className="text-sm text-slate-400">
                                                {day.exercises.length} {day.exercises.length === 1 ? "exercise" : "exercises"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Day Note (view mode) */}
                        {selectedDay?.note && !isEditMode && (
                            <div className="text-sm text-slate-300 pt-2">{selectedDay.note}</div>
                        )}
                    </div>
                </Card>
            )}

            {/* Exercises Card - Only show when a day is selected */}
            {!isLoading && selectedDay && (
                <Card
                    heading={
                        <div className="flex items-center justify-between w-full">
                            <Basic
                                text={`Exercises - ${selectedDay.title}`}
                                fontFamily="font-RobotoMono"
                                fontSize="text-2xl"
                                textColor="text-teal-300"
                            />
                            {isEditMode && (
                                <button
                                    onClick={() => onDeleteDay(selectedPlanId, selectedDayId)}
                                    className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                                >
                                    Delete Day
                                </button>
                            )}
                        </div>
                    }
                >
                    {isEditMode ? (
                        <DayEditor
                            planId={selectedPlanId}
                            day={selectedDay}
                            isDirty={planDirty[selectedPlanId]}
                            draggingExerciseId={draggingExerciseId}
                            dragOverExerciseId={dragOverExerciseId}
                            onUpdateTitle={(title) =>
                                onUpdateDayTitle(selectedPlanId, selectedDayId, title)
                            }
                            onUpdateNote={(note) =>
                                onUpdateDayNote(selectedPlanId, selectedDayId, note)
                            }
                            onUpdateExercise={(exIdx, field, value) =>
                                onUpdateExercise(selectedPlanId, selectedDayId, exIdx, field, value)
                            }
                            onAddExercise={() => onAddExercise(selectedPlanId, selectedDayId)}
                            onDeleteExercise={(exIdx) =>
                                onDeleteExercise(selectedPlanId, selectedDayId, exIdx)
                            }
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDrop={(sourceId, targetId) =>
                                onDrop(selectedPlanId, selectedDayId, sourceId, targetId)
                            }
                        />
                    ) : (
                        <ExercisesList exercises={selectedDay.exercises} />
                    )}
                </Card>
            )}
        </div>
    );
}

// View-only exercises list
interface ExercisesListProps {
    exercises: GymPlanDay["exercises"];
}

// Color palette for muscle groups
const colorPalette = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-lime-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-indigo-500",
];

function ExercisesList({ exercises }: ExercisesListProps) {
    if (exercises.length === 0) {
        return <p className="text-sm text-slate-400">No exercises in this day yet.</p>;
    }

    // Build muscle group color map
    const muscleGroupColors: Record<string, string> = {};
    let colorIndex = 0;
    exercises.forEach((ex) => {
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
        <div className="rounded-xl border border-slate-700 overflow-hidden">
            {exercises.map((ex) => {
                const muscleColor = getMuscleColor(ex.muscleGroup);
                const setsCount = ex.sets?.length ?? 0;

                return (
                    <div
                        key={ex.id}
                        className="flex items-center border-b border-slate-700 last:border-b-0 hover:bg-slate-800/30 transition-colors"
                    >
                        {/* Muscle group color indicator */}
                        <div className={`w-1.5 self-stretch ${muscleColor}`} />

                        <div className="flex items-center justify-between flex-1 px-3 py-3">
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium text-slate-200 truncate">
                                    {ex.name || "Exercise"}
                                </span>
                                {ex.muscleGroup && (
                                    <span className="text-xs text-slate-400 truncate">
                                        {ex.muscleGroup}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <span className={`text-xs font-semibold ${
                                    setsCount > 0 ? "text-emerald-400" : "text-slate-500"
                                }`}>
                                    {setsCount} {setsCount === 1 ? "set" : "sets"}
                                </span>
                                <button
                                    onClick={() => openExerciseSearch(ex.name, ex.muscleGroup)}
                                    className="p-1 text-indigo-300 hover:text-indigo-100"
                                    aria-label="Search exercise"
                                >
                                    <SearchIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Day editor component
interface DayEditorProps {
    planId: string;
    day: GymPlanDay;
    isDirty: boolean;
    draggingExerciseId: string | null;
    dragOverExerciseId: string | null;
    onUpdateTitle: (title: string) => void;
    onUpdateNote: (note: string) => void;
    onUpdateExercise: (exerciseIndex: number, field: string, value: any) => void;
    onAddExercise: () => void;
    onDeleteExercise: (exerciseIndex: number) => void;
    onDragStart: (exerciseId: string) => void;
    onDragEnd: () => void;
    onDragEnter: (exerciseId: string) => void;
    onDragLeave: (exerciseId: string) => void;
    onDrop: (sourceId: string, targetId: string) => void;
}

function DayEditor({
    planId,
    day,
    isDirty,
    draggingExerciseId,
    dragOverExerciseId,
    onUpdateTitle,
    onUpdateNote,
    onUpdateExercise,
    onAddExercise,
    onDeleteExercise,
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDrop,
}: DayEditorProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">Day title</label>
                <input
                    className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    value={day.title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">Day notes</label>
                <textarea
                    className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    rows={2}
                    value={day.note ?? ""}
                    onChange={(e) => onUpdateNote(e.target.value)}
                />
            </div>

            {isDirty && (
                <div className="text-[11px] text-amber-300">Unsaved changes — press Save in the plan section above</div>
            )}

            {/* Exercises table */}
            <div className="overflow-x-auto sm:overflow-visible">
                <table className="min-w-[800px] w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-left text-slate-300">
                            <th className="py-2 w-12 text-center">Move</th>
                            <th className="py-2">Exercise</th>
                            <th className="py-2">Muscle</th>
                            <th className="py-2">Sets</th>
                            <th className="py-2">Type</th>
                            <th className="py-2">Unit</th>
                            <th className="py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {day.exercises.map((ex, exIdx) => (
                            <tr
                                key={ex.id}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    if (!draggingExerciseId || draggingExerciseId === ex.id) return;
                                    onDragEnter(ex.id);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDragLeave={() => onDragLeave(ex.id)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const source =
                                        draggingExerciseId || e.dataTransfer.getData("text/plain");
                                    onDrop(source, ex.id);
                                }}
                                className={`border-t border-slate-800 transition-all duration-150 ease-out ${
                                    draggingExerciseId === ex.id
                                        ? "bg-slate-900/60 shadow-inner scale-[0.995]"
                                        : dragOverExerciseId === ex.id
                                        ? "bg-slate-900/50 ring-1 ring-teal-500/40"
                                        : ""
                                }`}
                            >
                                <td className="py-2 text-center align-middle">
                                    <button
                                        draggable
                                        onDragStart={(e) => {
                                            onDragStart(ex.id);
                                            e.dataTransfer.effectAllowed = "move";
                                            e.dataTransfer.setData("text/plain", ex.id);
                                        }}
                                        onDragEnd={onDragEnd}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-white cursor-grab"
                                        aria-label="Drag to reorder"
                                        title="Drag to reorder"
                                    >
                                        <DragIcon className="w-4 h-4" />
                                    </button>
                                </td>
                                <td className="py-2 pr-0.5 sm:pr-2 min-w-[220px]">
                                    <input
                                        className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                        value={ex.name}
                                        onChange={(e) =>
                                            onUpdateExercise(exIdx, "name", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="py-2 pr-0.5 min-w-[140px]">
                                    <input
                                        className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                        value={ex.muscleGroup ?? ""}
                                        onChange={(e) =>
                                            onUpdateExercise(exIdx, "muscleGroup", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="py-2 pr-0.5 w-16">
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                        value={ex.sets?.length ?? 0}
                                        onChange={(e) => {
                                            const count = Number(e.target.value) || 0;
                                            onUpdateExercise(
                                                exIdx,
                                                "sets",
                                                ensureSetCount(count, ex.sets || [])
                                            );
                                        }}
                                    />
                                </td>
                                <td className="py-2 pr-0.5 w-24">
                                    <select
                                        className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-2 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                        value={ex.setType ?? "weight"}
                                        onChange={(e) =>
                                            onUpdateExercise(
                                                exIdx,
                                                "setType",
                                                e.target.value as SetType
                                            )
                                        }
                                    >
                                        <option value="weight">Weight</option>
                                        <option value="time">Time</option>
                                    </select>
                                </td>
                                <td className="py-2 pr-0.5 w-20">
                                    {ex.setType !== "time" && (
                                        <select
                                            className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-2 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                            value={ex.weightUnit ?? "kg"}
                                            onChange={(e) =>
                                                onUpdateExercise(
                                                    exIdx,
                                                    "weightUnit",
                                                    e.target.value as WeightUnit
                                                )
                                            }
                                        >
                                            <option value="kg">KG</option>
                                            <option value="lb">LB</option>
                                        </select>
                                    )}
                                </td>
                                <td className="py-2 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onDeleteExercise(exIdx)}
                                            className="py-2 text-rose-400 hover:text-rose-300"
                                            aria-label="Remove exercise"
                                            title="Remove exercise"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openExerciseSearch(ex.name, ex.muscleGroup)}
                                            className="p-1 text-indigo-300 hover:text-indigo-100"
                                            aria-label="Search exercise"
                                            title="Search exercise"
                                        >
                                            <SearchIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button
                    onClick={onAddExercise}
                    className="mt-3 text-sm text-indigo-300 hover:text-indigo-200"
                >
                    + Add exercise
                </button>
            </div>
        </div>
    );
}
