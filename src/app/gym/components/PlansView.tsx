"use client";

import type { GymPlan } from "../types";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";
import LinePulse from "../../_layouts/pulse/line";
import { openExerciseSearch, exportToJsonFile } from "../utils";
import { SearchIcon, DownloadIcon } from "./icons";

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
    isLoading: boolean;
    onPlanSelect: (planId: string) => void;
    onDaySelect: (dayId: string) => void;
    onEditPlan: (planId: string) => void;
}

export function PlansView({
    plans,
    selectedPlanId,
    selectedDayId,
    isLoading,
    onPlanSelect,
    onDaySelect,
    onEditPlan,
}: PlansViewProps) {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    const selectedDay = selectedPlan?.days.find((d) => d.id === selectedDayId);

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
                            Export Plans
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {isLoading && <LinePulse />}

                    {!isLoading && plans.length === 0 && (
                        <p className="text-sm text-slate-400">
                            No plans yet. Create one from the Edit Plans tab.
                        </p>
                    )}

                    {/* Plans List */}
                    {!isLoading && plans.length > 0 && (
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

                    {/* Selected Plan Info */}
                    {!isLoading && selectedPlan && (
                        <div className="flex items-center justify-between gap-3 pt-2">
                            {selectedPlan.note && (
                                <div className="text-sm text-slate-300 flex-1">{selectedPlan.note}</div>
                            )}
                            <button
                                onClick={() => onEditPlan(selectedPlanId)}
                                className="inline-flex items-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                            >
                                Edit this plan
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Days Card - Only show when a plan is selected */}
            {!isLoading && selectedPlan && (
                <Card
                    heading={
                        <Basic
                            text="Days"
                            fontFamily="font-RobotoMono"
                            fontSize="text-2xl"
                            textColor="text-teal-300"
                        />
                    }
                >
                    <div className="space-y-4">
                        {selectedPlan.days.length === 0 ? (
                            <p className="text-sm text-slate-400">No days in this plan yet.</p>
                        ) : (
                            <div className="rounded-lg border border-slate-700 overflow-hidden">
                                {selectedPlan.days.map((day) => (
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

                        {/* Selected Day Note */}
                        {selectedDay?.note && (
                            <div className="text-sm text-slate-300 pt-2">{selectedDay.note}</div>
                        )}
                    </div>
                </Card>
            )}

            {/* Exercises Card - Only show when a day is selected */}
            {!isLoading && selectedDay && (
                <Card
                    heading={
                        <Basic
                            text={`Exercises - ${selectedDay.title}`}
                            fontFamily="font-RobotoMono"
                            fontSize="text-2xl"
                            textColor="text-teal-300"
                        />
                    }
                >
                    <div className="space-y-3">
                        {selectedDay.exercises.length === 0 ? (
                            <p className="text-sm text-slate-400">No exercises in this day yet.</p>
                        ) : (
                            selectedDay.exercises.map((ex) => (
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
                            ))
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
