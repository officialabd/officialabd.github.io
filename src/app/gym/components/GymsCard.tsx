"use client";

import { useState } from "react";
import Card from "./Card";
import { useProfileStore } from "../stores";
import { cleanName, confirmAction } from "../utils";
import { StarIcon, TrashIcon } from "./icons";
import { Button, EmptyState, inputClass, Notice, SectionTitle } from "./ui";

/** The gyms the user trains at. The default one is preselected for new sessions. */
export function GymsCard() {
    const { profile, isSaving, addGym, removeGym, setDefaultGym } = useProfileStore();
    const [name, setName] = useState("");
    const { gyms, defaultGym } = profile;

    const cleaned = cleanName(name);
    const duplicate = gyms.some((g) => g.toLowerCase() === cleaned.toLowerCase());

    const handleAdd = async () => {
        if (!cleaned || duplicate) return;
        await addGym(cleaned);
        setName("");
    };

    return (
        <Card heading={<SectionTitle text="Gyms" />}>
            <div className="space-y-4">
                <p className="text-xs text-slate-400">
                    Label sessions with the gym they took place at, so stats can be filtered by gym. The starred gym is used for new
                    sessions.
                </p>
                <div className="flex gap-2">
                    <input
                        className={inputClass}
                        placeholder="Gym name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={!cleaned || duplicate || isSaving}>
                        Add
                    </Button>
                </div>
                {duplicate && <Notice tone="warn">&quot;{cleaned}&quot; is already in your list.</Notice>}

                {gyms.length === 0 ? (
                    <EmptyState>No gyms yet.</EmptyState>
                ) : (
                    <div className="rounded-xl border border-slate-700 overflow-hidden">
                        {gyms.map((gym) => {
                            const isDefault = gym === defaultGym;
                            return (
                                <div key={gym} className="flex items-center gap-3 border-b border-slate-700 px-3 py-2 last:border-b-0">
                                    <button
                                        type="button"
                                        onClick={() => setDefaultGym(isDefault ? null : gym)}
                                        disabled={isSaving}
                                        className={`p-1 ${isDefault ? "text-amber-300" : "text-slate-500 hover:text-amber-200"}`}
                                        aria-label={isDefault ? `Unset ${gym} as default` : `Make ${gym} the default`}
                                        aria-pressed={isDefault}
                                        title={isDefault ? "Default gym" : "Make default"}
                                    >
                                        <StarIcon className="w-4 h-4" filled={isDefault} />
                                    </button>
                                    <span className="flex-1 text-sm font-semibold text-slate-100">{gym}</span>
                                    {isDefault && <span className="text-xs text-slate-400">Default</span>}
                                    <button
                                        type="button"
                                        onClick={() => confirmAction(`Remove "${gym}"? Past sessions keep this label.`) && removeGym(gym)}
                                        disabled={isSaving}
                                        className="p-1 text-rose-400 hover:text-rose-300"
                                        aria-label={`Remove ${gym}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
}
