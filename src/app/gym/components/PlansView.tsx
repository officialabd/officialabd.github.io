"use client";

import { useState } from "react";
import Card from "./Card";
import LinePulse from "../../_layouts/pulse/line";
import type { GymExercise, GymPlan, GymPlanDay } from "../types";
import { useExercisesStore, usePlansStore } from "../stores";
import { confirmAction, formatDate, formatGroups, groupColor, openExerciseSearch, perLabel } from "../utils";
import { ExercisePicker } from "./ExercisePicker";
import { CheckIcon, DragIcon, EditIcon, PlusIcon, SearchIcon, TrashIcon } from "./icons";
import { Button, EmptyState, Field, HeaderButton, inputClass, listClass, Notice, rowClass, SectionTitle } from "./ui";

export function PlansView() {
    const store = usePlansStore();
    const library = useExercisesStore((s) => s.byId);
    const [isEditMode, setIsEditMode] = useState(false);

    const { plans, drafts, isLoading, savingPlanId, selectedPlanId, selectedDayId } = store;
    const plan = selectedPlanId ? store.getPlan(selectedPlanId) : undefined;
    const day = plan?.days.find((d) => d.id === selectedDayId);
    const isDirty = !!drafts[selectedPlanId];

    const handleDelete = (target: GymPlan) => {
        if (confirmAction(`Delete plan "${target.title}"? This cannot be undone.`)) {
            store.deletePlan(target.id);
            setIsEditMode(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card
                heading={
                    <SectionTitle
                        text="Plans"
                        pageTitle
                        actions={
                            <HeaderButton icon={<PlusIcon />} label="New Plan" onClick={store.addPlan} />
                        }
                    />
                }
            >
                <div className="space-y-4">
                    {isLoading && <LinePulse />}
                    {!isLoading && plans.length === 0 && <EmptyState>No plans yet. Create one to get started.</EmptyState>}

                    {!isLoading && plans.length > 0 && (
                        <div className={listClass}>
                            {plans.map((p) => {
                                const current = store.getPlan(p.id) ?? p;
                                const selected = p.id === selectedPlanId;
                                const editing = selected && isEditMode;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            store.selectPlan(selected ? "" : p.id);
                                            if (!selected) setIsEditMode(false);
                                        }}
                                        className={rowClass(selected)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
                                                <span className={`font-medium min-w-[180px] ${selected ? "text-blue-300" : "text-slate-200"}`}>
                                                    {current.title}
                                                    {drafts[p.id] && <span className="ml-2 text-[11px] text-amber-300">• unsaved</span>}
                                                </span>
                                                <span className="text-sm text-slate-400">
                                                    {current.days.length} {current.days.length === 1 ? "day" : "days"}
                                                </span>
                                                <span className="text-xs text-slate-500">Created: {formatDate(p.createdAt)}</span>
                                                <span className="text-xs text-slate-500">Updated: {formatDate(p.updatedAt)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!selected) store.selectPlan(p.id);
                                                    setIsEditMode(!editing);
                                                }}
                                                className={`shrink-0 p-1 ${editing ? "text-emerald-300 hover:text-emerald-200" : "text-amber-300 hover:text-amber-200"}`}
                                                aria-label={editing ? `Done editing ${current.title}` : `Edit ${current.title}`}
                                                aria-pressed={editing}
                                                title={editing ? "Done editing" : "Edit plan"}
                                            >
                                                {editing ? <CheckIcon className="w-4 h-4" /> : <EditIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {plan?.note && !isEditMode && <div className="text-sm text-slate-300">{plan.note}</div>}

                    {plan && isEditMode && (
                        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-slate-900/40 p-4 shadow-md">
                            <div className="flex flex-wrap items-end gap-3 justify-between">
                                <Field label="Plan title" className="w-full sm:flex-1">
                                    <input
                                        className={inputClass}
                                        value={plan.title}
                                        onChange={(e) => store.editPlan(plan.id, (p) => ({ ...p, title: e.target.value }))}
                                    />
                                </Field>
                                <div className="flex flex-col gap-1 items-end">
                                    {isDirty && <span className="text-[11px] text-amber-300">Unsaved changes — press Save</span>}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="save"
                                            onClick={() => store.savePlan(plan.id)}
                                            disabled={!isDirty || savingPlanId === plan.id}
                                        >
                                            {savingPlanId === plan.id ? "Saving..." : "Save"}
                                        </Button>
                                        {isDirty && (
                                            <Button size="sm" variant="neutral" onClick={() => store.discardPlan(plan.id)}>
                                                Discard
                                            </Button>
                                        )}
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(plan)}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Field label="Plan notes">
                                <textarea
                                    className={inputClass}
                                    rows={2}
                                    value={plan.note}
                                    onChange={(e) => store.editPlan(plan.id, (p) => ({ ...p, note: e.target.value }))}
                                />
                            </Field>
                        </div>
                    )}
                </div>
            </Card>

            {plan && (
                <Card
                    heading={
                        <SectionTitle
                            text="Days"
                            actions={
                                isEditMode && (
                                    <HeaderButton icon={<PlusIcon />} label="Add Day" onClick={() => store.addDay(plan.id)} />
                                )
                            }
                        />
                    }
                >
                    <div className="space-y-4">
                        {plan.days.length === 0 ? (
                            <EmptyState>No days in this plan yet.</EmptyState>
                        ) : (
                            <div className={listClass}>
                                {plan.days.map((d) => {
                                    const selected = d.id === selectedDayId;
                                    return (
                                        <div key={d.id} onClick={() => store.selectDay(selected ? "" : d.id)} className={rowClass(selected)}>
                                            <div className="flex items-center gap-x-6">
                                                <span className={`font-medium min-w-[120px] ${selected ? "text-blue-300" : "text-slate-200"}`}>
                                                    {d.title}
                                                </span>
                                                <span className="text-sm text-slate-400">
                                                    {d.exerciseIds.length} {d.exerciseIds.length === 1 ? "exercise" : "exercises"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {day?.note && !isEditMode && <div className="text-sm text-slate-300 pt-2">{day.note}</div>}
                    </div>
                </Card>
            )}

            {plan && day && (
                <Card
                    heading={
                        <SectionTitle
                            text={`Exercises - ${day.title}`}
                            actions={
                                isEditMode && (
                                    <HeaderButton
                                        variant="danger"
                                        icon={<TrashIcon />}
                                        label="Delete Day"
                                        onClick={() => store.deleteDay(plan.id, day.id)}
                                    />
                                )
                            }
                        />
                    }
                >
                    {isEditMode ? (
                        <DayEditor plan={plan} day={day} library={library} isDirty={isDirty} />
                    ) : (
                        <DayExercises day={day} library={library} />
                    )}
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// Day exercises (read-only)
// ============================================================================

const resolve = (day: GymPlanDay, library: Map<string, GymExercise>) =>
    day.exerciseIds.map((id) => library.get(id)).filter((ex): ex is GymExercise => !!ex);

function ExerciseSummary({ exercise }: { exercise: GymExercise }) {
    return (
        <>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-200 truncate">{exercise.name}</span>
                {exercise.groups.length > 0 && <span className="text-xs text-slate-400 truncate">{formatGroups(exercise.groups)}</span>}
            </div>
            <span className="text-xs font-semibold text-slate-300 w-20">{perLabel(exercise.per)}</span>
            <span className={`text-xs font-semibold w-14 text-right ${exercise.setsNo > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                {exercise.setsNo} {exercise.setsNo === 1 ? "set" : "sets"}
            </span>
            <button
                type="button"
                onClick={() => openExerciseSearch(exercise.name, formatGroups(exercise.groups))}
                className="p-1 text-indigo-300 hover:text-indigo-100"
                aria-label="Search exercise"
            >
                <SearchIcon className="w-4 h-4" />
            </button>
        </>
    );
}

function DayExercises({ day, library }: { day: GymPlanDay; library: Map<string, GymExercise> }) {
    const exercises = resolve(day, library);
    if (exercises.length === 0) return <EmptyState>No exercises in this day yet.</EmptyState>;

    return (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
            {exercises.map((ex) => (
                <div key={ex.id} className="flex items-center border-b border-slate-700 last:border-b-0 hover:bg-slate-800/30">
                    <div className={`w-1.5 self-stretch ${groupColor(ex.groups)}`} />
                    <div className="flex items-center gap-2 flex-1 px-3 py-3">
                        <ExerciseSummary exercise={ex} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Day editor
// ============================================================================

function DayEditor({
    plan,
    day,
    library,
    isDirty,
}: {
    plan: GymPlan;
    day: GymPlanDay;
    library: Map<string, GymExercise>;
    isDirty: boolean;
}) {
    const store = usePlansStore();
    const allExercises = useExercisesStore((s) => s.exercises);
    const [isPicking, setIsPicking] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);

    const exercises = resolve(day, library);
    const missingCount = day.exerciseIds.length - exercises.length;

    const endDrag = () => {
        setDragging(null);
        setDragOver(null);
    };

    return (
        <div className="space-y-4">
            <Field label="Day title">
                <input
                    className={inputClass}
                    value={day.title}
                    onChange={(e) => store.editDay(plan.id, day.id, (d) => ({ ...d, title: e.target.value }))}
                />
            </Field>
            <Field label="Day notes">
                <textarea
                    className={inputClass}
                    rows={2}
                    value={day.note}
                    onChange={(e) => store.editDay(plan.id, day.id, (d) => ({ ...d, note: e.target.value }))}
                />
            </Field>

            {isDirty && <div className="text-[11px] text-amber-300">Unsaved changes — press Save in the plan section above</div>}
            {missingCount > 0 && (
                <Notice tone="warn">
                    {missingCount} exercise{missingCount === 1 ? " was" : "s were"} deleted from the library and will be removed on save.
                </Notice>
            )}

            {exercises.length === 0 ? (
                <EmptyState>No exercises in this day yet.</EmptyState>
            ) : (
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                    {exercises.map((ex) => (
                        <div
                            key={ex.id}
                            onDragEnter={(e) => {
                                e.preventDefault();
                                if (dragging && dragging !== ex.id) setDragOver(ex.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                store.moveExercise(plan.id, day.id, dragging || e.dataTransfer.getData("text/plain"), ex.id);
                                endDrag();
                            }}
                            className={`flex items-center gap-2 border-b border-slate-700 px-2 py-2 last:border-b-0 transition-all ${
                                dragging === ex.id
                                    ? "bg-slate-900/60 scale-[0.995]"
                                    : dragOver === ex.id
                                    ? "bg-slate-900/50 ring-1 ring-teal-500/40"
                                    : ""
                            }`}
                        >
                            <button
                                type="button"
                                draggable
                                onDragStart={(e) => {
                                    setDragging(ex.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", ex.id);
                                }}
                                onDragEnd={endDrag}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-white cursor-grab"
                                aria-label="Drag to reorder"
                                title="Drag to reorder"
                            >
                                <DragIcon className="w-4 h-4" />
                            </button>
                            <ExerciseSummary exercise={ex} />
                            <button
                                type="button"
                                onClick={() => store.removeExerciseFromDay(plan.id, day.id, ex.id)}
                                className="p-1 text-rose-400 hover:text-rose-300"
                                aria-label="Remove exercise from day"
                                title="Remove from day"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isPicking ? (
                <ExercisePicker
                    exercises={allExercises}
                    excludeIds={day.exerciseIds}
                    onPick={(ex) => store.addExerciseToDay(plan.id, day.id, ex.id)}
                    onClose={() => setIsPicking(false)}
                />
            ) : (
                <Button variant="ghost" onClick={() => setIsPicking(true)}>
                    + Add exercise
                </Button>
            )}
            <p className="text-xs text-slate-500">Exercise details (sets, unit, per…) are edited in the Exercises tab.</p>
        </div>
    );
}
