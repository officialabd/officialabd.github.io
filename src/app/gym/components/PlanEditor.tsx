"use client";

import type { GymPlan, GymPlanDay, SetType, WeightUnit } from "../types";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";
import LinePulse from "../../_layouts/pulse/line";
import { formatTime, ensureSetCount, openExerciseSearch } from "../utils";
import { SearchIcon, TrashIcon, DragIcon, PlusIcon } from "./icons";

// Helper to format date nicely
function formatDate(timestamp: number | null | undefined): string {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PlanEditorProps {
    plans: GymPlan[];
    selectedPlanId: string;
    selectedDayId: string;
    planDrafts: Record<string, GymPlan>;
    planDirty: Record<string, boolean>;
    isLoading: boolean;
    isSaving: boolean;
    newPlanTitle: string;
    newDayTitle: string;
    draggingExerciseId: string | null;
    dragOverExerciseId: string | null;
    onPlanSelect: (planId: string) => void;
    onDaySelect: (dayId: string) => void;
    onNewPlanTitleChange: (title: string) => void;
    onNewDayTitleChange: (title: string) => void;
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

export function PlanEditor({
    plans,
    selectedPlanId,
    selectedDayId,
    planDrafts,
    planDirty,
    isLoading,
    isSaving,
    newPlanTitle,
    newDayTitle,
    draggingExerciseId,
    dragOverExerciseId,
    onPlanSelect,
    onDaySelect,
    onNewPlanTitleChange,
    onNewDayTitleChange,
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
}: PlanEditorProps) {
    const editPlan = plans.find((p) => p.id === selectedPlanId);
    const editDraft = editPlan ? planDrafts[editPlan.id] ?? editPlan : null;
    const editDay = editDraft?.days.find((d) => d.id === selectedDayId);

    const handleAddNewDay = () => {
        if (editPlan) {
            onAddDay(editPlan.id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Plan Management Card */}
            <Card
                heading={
                    <div className="flex items-center justify-between w-full">
                        <Basic
                            text="Edit Plans"
                            fontFamily="font-RobotoMono"
                            fontSize="text-2xl"
                            textColor="text-teal-300"
                        />
                        <button
                            onClick={onAddPlan}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create new plan
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {isLoading && <LinePulse />}

                    {/* Plans List */}
                    {!isLoading && (
                        <>
                            {plans.length === 0 ? (
                                <p className="text-sm text-slate-400">No plans yet. Create one to get started.</p>
                            ) : (
                                <div className="rounded-lg border border-slate-700 overflow-hidden">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => onPlanSelect(plan.id === selectedPlanId ? "" : plan.id)}
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
                        </>
                    )}

                    {/* Selected Plan Editor */}
                    {!isLoading && editPlan && editDraft && (
                        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-slate-900/40 p-4 shadow-md mt-4">
                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                <div className="flex flex-col gap-2 w-full sm:flex-1">
                                    <label className="text-xs text-slate-400">Plan title</label>
                                    <input
                                        className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                        value={editDraft.title}
                                        onChange={(e) =>
                                            onUpdatePlanTitle(editPlan.id, e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    {planDirty[editPlan.id] && (
                                        <span className="text-[11px] text-amber-300">
                                            Unsaved changes — press Save
                                        </span>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onSavePlan(editPlan.id)}
                                            className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={() => onDeletePlan(editPlan.id)}
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
                                        onUpdatePlanNote(editPlan.id, e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Days & Exercises Card - Only show when a plan is selected */}
            {!isLoading && editPlan && editDraft && (
                <Card
                    heading={
                        <div className="flex items-center justify-between w-full">
                            <Basic
                                text="Days & Exercises"
                                fontFamily="font-RobotoMono"
                                fontSize="text-2xl"
                                textColor="text-teal-300"
                            />
                            <button
                                onClick={handleAddNewDay}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Day
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {/* Days list */}
                            {editDraft.days.length === 0 ? (
                                <p className="text-sm text-slate-400">No days yet. Add a day to get started.</p>
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

                            {/* Selected day editor */}
                            {editDay && (
                                <DayEditor
                                    planId={editPlan.id}
                                    day={editDay}
                                    isDirty={planDirty[editPlan.id]}
                                    draggingExerciseId={draggingExerciseId}
                                    dragOverExerciseId={dragOverExerciseId}
                                    onDeleteDay={() => onDeleteDay(editPlan.id, editDay.id)}
                                    onUpdateTitle={(title) =>
                                        onUpdateDayTitle(editPlan.id, editDay.id, title)
                                    }
                                    onUpdateNote={(note) =>
                                        onUpdateDayNote(editPlan.id, editDay.id, note)
                                    }
                                    onUpdateExercise={(exIdx, field, value) =>
                                        onUpdateExercise(editPlan.id, editDay.id, exIdx, field, value)
                                    }
                                    onAddExercise={() => onAddExercise(editPlan.id, editDay.id)}
                                    onDeleteExercise={(exIdx) =>
                                        onDeleteExercise(editPlan.id, editDay.id, exIdx)
                                    }
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                    onDragEnter={onDragEnter}
                                    onDragLeave={onDragLeave}
                                    onDrop={(sourceId, targetId) =>
                                        onDrop(editPlan.id, editDay.id, sourceId, targetId)
                                    }
                                />
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

// Sub-component for day editing
interface DayEditorProps {
    planId: string;
    day: GymPlanDay;
    isDirty: boolean;
    draggingExerciseId: string | null;
    dragOverExerciseId: string | null;
    onDeleteDay: () => void;
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
    onDeleteDay,
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
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-col gap-2 w-full sm:flex-1">
                    <label className="text-xs text-slate-400">Day title</label>
                    <input
                        className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                        value={day.title}
                        onChange={(e) => onUpdateTitle(e.target.value)}
                    />
                </div>
                <button
                    onClick={onDeleteDay}
                    className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                >
                    Delete day
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                <label className="text-xs text-slate-400">Day notes</label>
                <textarea
                    className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    rows={2}
                    value={day.note ?? ""}
                    onChange={(e) => onUpdateNote(e.target.value)}
                />
            </div>

            <div className="my-4 h-px w-full bg-slate-800" />

            {isDirty && (
                <div className="text-[11px] text-amber-300">Unsaved changes — press Save</div>
            )}

            {/* Exercises table */}
            <div className="mt-2 overflow-x-auto sm:overflow-visible">
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
