"use client";

import { useMemo, useState } from "react";
import type { GymExercise } from "../types";
import { formatGroups, perLabel } from "../utils";
import { CloseIcon } from "./icons";
import { EmptyState, IconButton, inputClass } from "./ui";

interface ExercisePickerProps {
    exercises: GymExercise[];
    /** Exercises already present; they are hidden from the list. */
    excludeIds?: string[];
    onPick: (exercise: GymExercise) => void;
    onClose: () => void;
}

/** Searchable list of library exercises. New exercises are created in the Exercises tab. */
export function ExercisePicker({ exercises, excludeIds = [], onPick, onClose }: ExercisePickerProps) {
    const [search, setSearch] = useState("");

    const available = useMemo(() => {
        const term = search.trim().toLowerCase();
        return exercises.filter(
            (ex) =>
                !excludeIds.includes(ex.id) &&
                (!term || ex.name.toLowerCase().includes(term) || formatGroups(ex.groups).toLowerCase().includes(term))
        );
    }, [exercises, excludeIds, search]);

    return (
        <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-3 space-y-3">
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    className={inputClass}
                    placeholder="Search exercises or muscle groups"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <IconButton onClick={onClose} className="bg-slate-600/80 hover:bg-slate-500" aria-label="Close">
                    <CloseIcon className="w-4 h-4" />
                </IconButton>
            </div>

            {available.length === 0 ? (
                <EmptyState>
                    {exercises.length === 0
                        ? "Your exercise library is empty. Create exercises in the Exercises tab."
                        : "No matching exercises. Create new ones in the Exercises tab."}
                </EmptyState>
            ) : (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-700">
                    {available.map((ex) => (
                        <button
                            key={ex.id}
                            type="button"
                            onClick={() => onPick(ex)}
                            className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-3 py-2 text-left last:border-b-0 hover:bg-slate-800/60"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-100">{ex.name}</span>
                                {ex.groups.length > 0 && <span className="block truncate text-xs text-slate-400">{formatGroups(ex.groups)}</span>}
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">{perLabel(ex.per)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
