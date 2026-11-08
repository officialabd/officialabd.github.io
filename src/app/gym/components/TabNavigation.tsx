"use client";

import type { ViewTab } from "../types";

const TABS: { id: ViewTab; label: string }[] = [
    { id: "session", label: "Log Session" },
    { id: "plans", label: "Plans" },
    { id: "exercises", label: "Exercises" },
    { id: "logs", label: "Logs" },
    { id: "profile", label: "Profile" },
];

export function TabNavigation({ activeView, onViewChange }: { activeView: ViewTab; onViewChange: (view: ViewTab) => void }) {
    return (
        <div className="flex flex-wrap gap-3 px-4">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onViewChange(tab.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                        activeView === tab.id
                            ? "border-teal-400 bg-teal-500/20 text-teal-100"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
