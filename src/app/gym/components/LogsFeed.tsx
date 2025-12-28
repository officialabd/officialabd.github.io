"use client";

import type { GymPlan, GymLogEntry, LogsFilter } from "../types";
import Card from "../../_layouts/card/card";
import Basic from "../../_layouts/texts/basic";
import LinePulse from "../../_layouts/pulse/line";
import { formatTime, formatDuration, getExerciseStatus, exportToJsonFile } from "../utils";
import { DownloadIcon } from "./icons";

interface LogsFeedProps {
    logs: GymLogEntry[];
    plans: GymPlan[];
    filter: LogsFilter;
    isLoading: boolean;
    onFilterChange: (filter: Partial<LogsFilter>) => void;
    onRefresh: () => void;
}

export function LogsFeed({
    logs,
    plans,
    filter,
    isLoading,
    onFilterChange,
    onRefresh,
}: LogsFeedProps) {
    const selectedFilterPlan = plans.find((p) => p.id === filter.planId);

    return (
        <Card
            heading={
                <Basic
                    text="Logs"
                    fontFamily="font-RobotoMono"
                    fontSize="text-2xl"
                    textColor="text-teal-300"
                />
            }
        >
            <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">Plan (optional)</label>
                        <select
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={filter.planId}
                            onChange={(e) => onFilterChange({ planId: e.target.value })}
                        >
                            <option value="">All plans</option>
                            {plans.map((p) => (
                                <option key={`filter-${p.id}`} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">Day (optional)</label>
                        <select
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={filter.dayId}
                            onChange={(e) => onFilterChange({ dayId: e.target.value })}
                            disabled={!filter.planId}
                        >
                            <option value="">All days</option>
                            {selectedFilterPlan?.days.map((d) => (
                                <option key={`filter-day-${d.id}`} value={d.id}>
                                    {d.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">From</label>
                        <input
                            type="date"
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={filter.from}
                            onChange={(e) => onFilterChange({ from: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400">To</label>
                        <input
                            type="date"
                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                            value={filter.to}
                            onChange={(e) => onFilterChange({ to: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={onRefresh}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => exportToJsonFile(logs, "gymLogs-backup")}
                        disabled={logs.length === 0}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${logs.length > 0
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
                            : "bg-slate-800 text-slate-500"
                            }`}
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Export Logs
                    </button>
                </div>

                {isLoading && <LinePulse />}
                {!isLoading && logs.length === 0 && (
                    <p className="text-sm text-slate-400">No logs in this range.</p>
                )}

                {/* Log entries */}
                <div className="space-y-4">
                    {logs.map((log) => (
                        <LogEntryCard key={log.id} log={log} />
                    ))}
                </div>
            </div>
        </Card>
    );
}

// Sub-component for individual log entry
interface LogEntryCardProps {
    log: GymLogEntry;
}

function LogEntryCard({ log }: LogEntryCardProps) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-200">
                <span className="font-semibold text-teal-200">
                    {log.planTitle} • {log.dayTitle}
                </span>
                <span>{log.date}</span>
            </div>
            <div className="text-xs text-slate-400">
                <span>Started: {formatTime(log.startedAt)}</span>
                <br />
                <span>Finished: {formatTime(log.completedAt)}</span>
                <br />
                <span>Duration: {formatDuration(log.startedAt, log.completedAt)}</span>
            </div>
            {log.note && (
                <p className="text-sm text-slate-200">Session note: {log.note}</p>
            )}

            {/* Desktop table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50 hidden sm:block">
                <table className="w-full text-sm border-collapse min-w-[640px]">
                    <thead className="text-slate-300">
                        <tr>
                            <th className="py-2 px-3 text-left">Exercise</th>
                            <th className="py-2 px-3">Per</th>
                            <th className="py-2 px-3">Sets #</th>
                            <th className="py-2 px-3 text-left">Values per set</th>
                            <th className="py-2 px-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {log.exercises.map((ex, idx) => {
                            const status = getExerciseStatus(ex.sets, ex.type);
                            const isTimeType = ex.type === "time";
                            const perValue = ex.per || "";
                            let value = perValue;
                            if (perValue.length > 0) {
                                value = perValue.charAt(0).toUpperCase() + perValue.slice(1);
                                if (perValue.charAt(0).match(/\d/)) {
                                    value = perValue.charAt(0) + ' ' + perValue.charAt(1).toUpperCase() + perValue.slice(2);
                                }
                            }
                            return (
                                <tr
                                    key={`${log.id}-${idx}`}
                                    className="border-t border-slate-800"
                                >
                                    <td className="py-2 px-3">
                                        <div className="text-teal-200 font-semibold">
                                            {ex.name}
                                        </div>
                                        {ex.group && (
                                            <div className="text-xs text-slate-400">
                                                {ex.group}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2 px-3 text-center">{value}</td>
                                    <td className="py-2 px-3 text-center">{ex.sets.filter((s) => s.completed).length}/{ex.sets.length}</td>
                                    <td className="py-2 px-3">
                                        <div className="flex flex-wrap gap-1 justify-start">
                                            {ex.sets.length === 0 && (
                                                <span className="text-xs text-slate-500">-</span>
                                            )}
                                            {ex.sets.map((s, i) => (
                                                <span
                                                    key={`${log.id}-${idx}-set-${i}`}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-100"
                                                >
                                                    <span className="font-bold">
                                                        {s.value ?? "- "}
                                                    </span>
                                                    <span>
                                                        {ex.unit ?? "kg"}
                                                    </span>

                                                    {!isTimeType && <>
                                                        <span className="text-slate-400">×</span>
                                                        <span className="font-semibold">
                                                            {s.reps ?? "-"}
                                                        </span>
                                                    </>
                                                    }
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-center text-xs">
                                        <span className={`font-semibold ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-1 sm:hidden">
                {log.exercises.map((ex, idx) => {
                    const status = getExerciseStatus(ex.sets, ex.type);
                    const isTimeType = ex.type === "time";
                    const perValue = ex.per || "";
                    let value = perValue;
                    if (perValue.length > 0) {
                        value = perValue.charAt(0).toUpperCase() + perValue.slice(1);
                        if (perValue.charAt(0).match(/\d/)) {
                            value = perValue.charAt(0) + ' ' + perValue.charAt(1).toUpperCase() + perValue.slice(2);
                        }
                    }
                    return (
                        <div
                            key={`${log.id}-m-${idx}`}
                            className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 space-y-1"
                        >
                            <div className="flex justify-between text-sm text-slate-100 font-semibold">
                                <span>{ex.name}</span>

                                <span className={`text-[11px] font-semibold text-slate-300`}>
                                    {value} •
                                    <span className={`${status.color}`}> {status.label} </span>
                                    {ex.sets.filter((s) => s.completed).length}/{ex.sets.length}
                                </span>
                            </div>

                            {ex.group && (
                                <div className="text-[11px] text-slate-400">
                                    {ex.group}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1 text-[12px] text-slate-200">
                                {ex.sets.length === 0 && (
                                    <span className="ml-1 text-slate-500">-</span>
                                )}
                                {ex.sets.filter((s) => s.completed).map((s, i) => (
                                    <span
                                        key={`${log.id}-m-${idx}-set-${i}`}
                                        className="mr-0.5 inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-0.5"
                                    >
                                        <span className="font-bold">
                                            {s.value ?? "- "}
                                        </span>
                                        <span className="text-[10px]">
                                            {ex.unit ?? "kg"}
                                        </span>

                                        {!isTimeType && <>
                                            <span className="text-slate-400">×</span>
                                            <span className="font-semibold">
                                                {s.reps ?? "-"}
                                            </span>
                                        </>
                                        }
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
