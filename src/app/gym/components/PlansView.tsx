"use client";

import type { GymPlan } from "../types";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";
import LinePulse from "../../_layouts/pulse/line";
import { formatTime, openExerciseSearch } from "../utils";
import { SearchIcon } from "./icons";

interface PlansViewProps {
    plans: GymPlan[];
    selectedPlanId: string;
    isLoading: boolean;
    onPlanSelect: (planId: string) => void;
    onEditPlan: (planId: string) => void;
}

export function PlansView({
    plans,
    selectedPlanId,
    isLoading,
    onPlanSelect,
    onEditPlan,
}: PlansViewProps) {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);

    return (
        <Card
            heading={
                <Basic
                    text="Plans"
                    fontFamily="font-RobotoMono"
                    fontSize="text-2xl"
                    textColor="text-teal-300"
                />
            }
        >
            <div className="space-y-6">
                {/* Plan selector */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-slate-300">Select plan</label>
                        <select
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={selectedPlanId}
                            onChange={(e) => onPlanSelect(e.target.value)}
                        >
                            <option value="">Select plan</option>
                            {plans.map((p) => (
                                <option key={`view-${p.id}`} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            if (selectedPlanId) {
                                onEditPlan(selectedPlanId);
                            }
                        }}
                        disabled={!selectedPlanId}
                        className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold ${
                            selectedPlanId
                                ? "bg-indigo-500 text-white hover:bg-indigo-400"
                                : "bg-slate-800 text-slate-500"
                        }`}
                    >
                        Edit this plan
                    </button>
                </div>

                {isLoading && <LinePulse />}

                {!isLoading && plans.length === 0 && (
                    <p className="text-sm text-slate-400">
                        No plans yet. Create one from the Edit Plans tab.
                    </p>
                )}

                {/* Selected plan details */}
                {selectedPlan && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-xl font-semibold text-teal-200">
                                    {selectedPlan.title}
                                </div>
                                <div className="text-xs text-slate-400">
                                    Created: {formatTime(selectedPlan.createdAt)}
                                </div>
                                <div className="text-xs text-slate-400">
                                    Updated: {formatTime(selectedPlan.updatedAt)}
                                </div>
                            </div>
                            {selectedPlan.note && (
                                <div className="text-sm text-slate-300">{selectedPlan.note}</div>
                            )}
                        </div>

                        {/* Days */}
                        <div className="space-y-4">
                            {selectedPlan.days.length === 0 && (
                                <div className="text-sm text-slate-400">
                                    No days in this plan yet.
                                </div>
                            )}

                            {selectedPlan.days.map((day) => (
                                <div
                                    key={day.id}
                                    className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-teal-200 font-semibold">{day.title}</div>
                                        <span className="text-xs text-slate-400">
                                            Exercises: {day.exercises.length}
                                        </span>
                                    </div>
                                    {day.note && (
                                        <div className="text-sm text-slate-300">{day.note}</div>
                                    )}

                                    {day.exercises.length === 0 && (
                                        <div className="text-xs text-slate-500">No exercises yet.</div>
                                    )}
                                    {day.exercises.map((ex) => (
                                        <div
                                            key={ex.id}
                                            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-2">
                                                    <div>
                                                        <div className="text-teal-200 font-semibold">
                                                            {ex.name || "Exercise"}
                                                        </div>
                                                        {ex.muscleGroup && (
                                                            <div className="text-xs text-slate-400">
                                                                {ex.muscleGroup}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            openExerciseSearch(ex.name, ex.muscleGroup)
                                                        }
                                                        className="p-1 text-indigo-300 hover:text-indigo-100"
                                                        aria-label="Search exercise"
                                                        title="Search exercise"
                                                    >
                                                        <SearchIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    Sets: {ex.sets?.length ?? 0}
                                                </span>
                                            </div>
                                            {!ex.sets?.length && (
                                                <div className="text-xs text-slate-500">
                                                    No sets configured yet.
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
