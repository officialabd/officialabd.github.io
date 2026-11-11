"use client";

import { useMemo, useState } from "react";
import { loadAccount } from "../hooks/useGymBootstrap";
import { requireUid, useExercisesStore, usePlansStore, useSessionStore } from "../stores";
import { confirmAction, formatGroups, similarNames } from "../utils";
import { Button, EmptyState, Field, inputClass, Notice } from "./ui";

/**
 * Merge duplicate exercises: pick the one to keep and the ones to fold into it.
 * Logs and plan days of the merged exercises are re-linked to the kept one, then they are deleted.
 */
export function MergeExercises({ onDone }: { onDone: () => void }) {
    const { exercises, byId, merge } = useExercisesStore();
    const hasUnsavedPlans = usePlansStore((s) => Object.keys(s.drafts).length > 0);
    const [keepId, setKeepId] = useState("");
    const [removeIds, setRemoveIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [isMerging, setIsMerging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const keep = byId.get(keepId);
    const suggested = useMemo(
        () => new Set(keep ? similarNames(keep.name, exercises.map((e) => e.name)) : []),
        [keep, exercises]
    );

    const candidates = useMemo(() => {
        const term = search.trim().toLowerCase();
        return exercises
            .filter((e) => e.id !== keepId && (!term || e.name.toLowerCase().includes(term)))
            .sort((a, b) => Number(suggested.has(b.name)) - Number(suggested.has(a.name)));
    }, [exercises, keepId, search, suggested]);

    const selectKeep = (id: string) => {
        setKeepId(id);
        setRemoveIds((ids) => ids.filter((x) => x !== id));
    };

    const toggle = (id: string) => setRemoveIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

    const handleMerge = async () => {
        if (!keep || removeIds.length === 0) return;
        const names = removeIds.map((id) => `"${byId.get(id)?.name}"`).join(", ");
        const message =
            `Merge ${names} into "${keep.name}"?\n\n` +
            `Their logs and plan days will use "${keep.name}" and they will be deleted. This cannot be undone.`;
        if (!confirmAction(message)) return;

        setIsMerging(true);
        setError(null);
        try {
            // Save the running session first so the merge also re-links it.
            await useSessionStore.getState().flush();
            await merge(keep.id, removeIds);
            await loadAccount(requireUid());
            onDone();
        } catch (err) {
            console.error("Merge failed", err);
            setError("The merge did not finish. It's safe to run it again.");
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="space-y-3 rounded-xl border border-violet-500/40 bg-slate-900/40 p-3">
            <p className="text-xs text-slate-400">
                Combine duplicates into one exercise. Their history moves to the exercise you keep.
            </p>
            {hasUnsavedPlans && <Notice tone="warn">Save or discard your plan changes before merging.</Notice>}

            <Field label="Keep">
                <select className={inputClass} value={keepId} onChange={(e) => selectKeep(e.target.value)}>
                    <option value="">Select the exercise to keep</option>
                    {exercises.map((e) => (
                        <option key={e.id} value={e.id}>
                            {e.name}
                        </option>
                    ))}
                </select>
            </Field>

            {keep && (
                <div className="space-y-2">
                    <span className="text-xs text-slate-400">Merge into it ({removeIds.length} selected)</span>
                    <input className={inputClass} placeholder="Search exercises" value={search} onChange={(e) => setSearch(e.target.value)} />
                    {candidates.length === 0 ? (
                        <EmptyState>No matching exercises.</EmptyState>
                    ) : (
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700">
                            {candidates.map((e) => (
                                <label
                                    key={e.id}
                                    className="flex cursor-pointer items-center gap-3 border-b border-slate-800 px-3 py-2 last:border-b-0 hover:bg-slate-800/60"
                                >
                                    <input
                                        type="checkbox"
                                        className="accent-violet-500"
                                        checked={removeIds.includes(e.id)}
                                        onChange={() => toggle(e.id)}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm text-slate-100">{e.name}</span>
                                        {e.groups.length > 0 && (
                                            <span className="block truncate text-xs text-slate-400">{formatGroups(e.groups)}</span>
                                        )}
                                    </span>
                                    {suggested.has(e.name) && (
                                        <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[11px] text-violet-200">Similar</span>
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="accent"
                    onClick={handleMerge}
                    disabled={!keep || removeIds.length === 0 || isMerging || hasUnsavedPlans}
                >
                    {isMerging ? "Merging..." : "Merge"}
                </Button>
                <Button size="sm" variant="neutral" onClick={onDone} disabled={isMerging}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
