"use client";

import { useMemo, useState } from "react";
import Card from "../../_layouts/card/card";
import LinePulse from "../../_layouts/pulse/line";
import { DEFAULT_SETS, DISTANCE_UNITS, PER_OPTIONS, TIME_UNITS, WEIGHT_UNITS } from "../constants";
import type { DistanceUnit, ExerciseType, GymExercise, GymExerciseInput, Per, Unit } from "../types";
import { useExercisesStore, usePlansStore, useProfileStore } from "../stores";
import { buildGroupColors, confirmAction, exportToJsonFile, openExerciseSearch, perLabel, unitLabel, withPer, withType } from "../utils";
import { DownloadIcon, PlusIcon, SearchIcon } from "./icons";
import { Button, EmptyState, Field, inputClass, Notice, SectionTitle } from "./ui";

type Editing = { mode: "new" } | { mode: "edit"; exercise: GymExercise } | null;

export function ExercisesView() {
    const { exercises, isLoading } = useExercisesStore();
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<Editing>(null);

    const groups = useMemo(
        () => Array.from(new Set(exercises.map((e) => e.group.trim()).filter(Boolean))).sort(),
        [exercises]
    );
    const groupColor = buildGroupColors(groups);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return exercises;
        return exercises.filter((e) => e.name.toLowerCase().includes(term) || e.group.toLowerCase().includes(term));
    }, [exercises, search]);

    return (
        <Card
            heading={
                <SectionTitle
                    text="Exercises"
                    actions={
                        <>
                            <Button onClick={() => setEditing({ mode: "new" })}>
                                <PlusIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">New Exercise</span>
                            </Button>
                            <Button
                                variant="success"
                                onClick={() => exportToJsonFile(exercises, "gymExercises-backup")}
                                disabled={exercises.length === 0}
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </>
                    }
                />
            }
        >
            <div className="space-y-4">
                <p className="text-xs text-slate-400">
                    Your exercise library. Plans and sessions pick exercises from here; edits apply to every plan using the
                    exercise, while past logs keep what was recorded.
                </p>

                {editing?.mode === "new" && (
                    <ExerciseForm groups={groups} onDone={() => setEditing(null)} />
                )}

                <input
                    className={inputClass}
                    placeholder="Search by name or muscle group"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {isLoading && <LinePulse />}
                {!isLoading && exercises.length === 0 && <EmptyState>No exercises yet. Create your first one.</EmptyState>}
                {!isLoading && exercises.length > 0 && filtered.length === 0 && <EmptyState>No matching exercises.</EmptyState>}

                {filtered.length > 0 && (
                    <div className="rounded-xl border border-slate-700 overflow-hidden">
                        {filtered.map((ex) =>
                            editing?.mode === "edit" && editing.exercise.id === ex.id ? (
                                <div key={ex.id} className="border-b border-slate-700 last:border-b-0 p-2">
                                    <ExerciseForm exercise={ex} groups={groups} onDone={() => setEditing(null)} />
                                </div>
                            ) : (
                                <div
                                    key={ex.id}
                                    onClick={() => setEditing({ mode: "edit", exercise: ex })}
                                    className="flex items-center border-b border-slate-700 last:border-b-0 cursor-pointer hover:bg-slate-800/40"
                                >
                                    <div className={`w-1.5 self-stretch ${groupColor(ex.group)}`} />
                                    <div className="flex items-center gap-3 flex-1 px-3 py-3">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-medium text-slate-200 truncate">{ex.name}</span>
                                            {ex.group && <span className="text-xs text-slate-400 truncate">{ex.group}</span>}
                                        </div>
                                        <span className="hidden sm:inline text-xs text-slate-400 w-20">{perLabel(ex.per)}</span>
                                        <span className="text-xs text-slate-400 w-12">{unitLabel(ex.unit)}</span>
                                        <span className="text-xs font-semibold text-emerald-400 w-12 text-right">
                                            {ex.setsNo} {ex.setsNo === 1 ? "set" : "sets"}
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
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

// ============================================================================
// Create / edit form
// ============================================================================

function ExerciseForm({ exercise, groups, onDone }: { exercise?: GymExercise; groups: string[]; onDone: () => void }) {
    const units = useProfileStore((s) => s.profile.units);
    const { validateName, create, update, remove } = useExercisesStore();
    const usagesOf = usePlansStore((s) => s.usagesOf);

    const [form, setForm] = useState<GymExerciseInput>(
        exercise ?? {
            name: "",
            group: "",
            type: "weight",
            unit: units.weight,
            per: "2hands",
            distanceUnit: null,
            setsNo: DEFAULT_SETS,
        }
    );
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const usages = exercise ? usagesOf(exercise.id) : [];
    const unitOptions: Unit[] = form.type === "time" ? TIME_UNITS : WEIGHT_UNITS;
    const listId = `groups-${exercise?.id ?? "new"}`;

    const run = async (task: () => Promise<void>) => {
        setIsSaving(true);
        setError(null);
        try {
            await task();
            onDone();
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        const input = { ...form, name: form.name.trim(), group: form.group.trim() };
        const nameError = validateName(input.name, exercise?.id);
        if (nameError) return setError(nameError);
        run(async () => {
            if (exercise) await update({ ...exercise, ...input });
            else await create(input);
        });
    };

    const handleDelete = () => {
        if (!exercise || usages.length > 0) return;
        if (confirmAction(`Delete "${exercise.name}"? Past logs keep their records.`)) run(() => remove(exercise.id));
    };

    return (
        <div className="space-y-3 rounded-xl border border-blue-500/30 bg-slate-900/40 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                    <input
                        autoFocus
                        className={inputClass}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                </Field>
                <Field label="Muscle group">
                    <input
                        className={inputClass}
                        list={listId}
                        value={form.group}
                        onChange={(e) => setForm({ ...form, group: e.target.value })}
                    />
                    <datalist id={listId}>
                        {groups.map((g) => (
                            <option key={g} value={g} />
                        ))}
                    </datalist>
                </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Field label="Per">
                    <select
                        className={inputClass}
                        value={form.per}
                        onChange={(e) => setForm(withPer(form, e.target.value as Per, units.distance))}
                    >
                        {PER_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Type">
                    <select
                        className={inputClass}
                        value={form.type}
                        disabled={form.per === "running"}
                        onChange={(e) => setForm(withType(form, e.target.value as ExerciseType, units.weight))}
                    >
                        <option value="weight">Weight</option>
                        <option value="time">Time</option>
                    </select>
                </Field>
                <Field label={form.type === "time" ? "Time unit" : "Weight unit"}>
                    <select
                        className={inputClass}
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
                    >
                        {unitOptions.map((u) => (
                            <option key={u} value={u}>
                                {unitLabel(u)}
                            </option>
                        ))}
                    </select>
                </Field>
                {form.per === "running" && (
                    <Field label="Distance unit">
                        <select
                            className={inputClass}
                            value={form.distanceUnit ?? units.distance}
                            onChange={(e) => setForm({ ...form, distanceUnit: e.target.value as DistanceUnit })}
                        >
                            {DISTANCE_UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {unitLabel(u)}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}
                <Field label="Default sets">
                    <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={form.setsNo}
                        onChange={(e) => setForm({ ...form, setsNo: Math.max(0, Number(e.target.value) || 0) })}
                    />
                </Field>
            </div>

            {error && <Notice tone="error">{error}</Notice>}
            {usages.length > 0 && (
                <p className="text-xs text-slate-400">
                    Used in: {usages.map(({ plan, day }) => `${plan.title} • ${day.title}`).join(", ")}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="save" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : exercise ? "Save" : "Create"}
                </Button>
                <Button size="sm" variant="neutral" onClick={onDone} disabled={isSaving}>
                    Cancel
                </Button>
                {exercise && (
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={handleDelete}
                        disabled={isSaving || usages.length > 0}
                        title={usages.length > 0 ? "Remove it from all plan days first" : undefined}
                    >
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
}
