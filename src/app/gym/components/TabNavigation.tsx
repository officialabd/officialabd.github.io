"use client";

import type { ComponentType } from "react";
import type { ViewTab } from "../types";
import { ChartIcon, ClipboardIcon, DumbbellIcon, ListIcon, StopwatchIcon, UserIcon } from "./icons";

const TABS: { id: ViewTab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
    { id: "session", label: "Log Session", Icon: StopwatchIcon },
    { id: "plans", label: "Plans", Icon: ClipboardIcon },
    { id: "exercises", label: "Exercises", Icon: DumbbellIcon },
    { id: "logs", label: "Logs", Icon: ListIcon },
    { id: "stats", label: "Stats", Icon: ChartIcon },
    { id: "profile", label: "Profile", Icon: UserIcon },
];

interface TabNavigationProps {
    activeView: ViewTab;
    onViewChange: (view: ViewTab) => void;
}

/** A box of tabs at the top from the `sm` breakpoint up; an icon bar fixed to the bottom on phones. */
export function TabNavigation({ activeView, onViewChange }: TabNavigationProps) {
    return (
        <>
            {/* Larger screens: one box of tabs at the top, aligned with the page content. */}
            <div className="hidden sm:block mx-auto max-w-7xl px-6 lg:px-8">
                <nav className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1" aria-label="Sections">
                    {TABS.map((tab) => {
                        const active = activeView === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onViewChange(tab.id)}
                                aria-current={active ? "page" : undefined}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                    active
                                        ? "bg-teal-500/20 text-teal-100 ring-1 ring-inset ring-teal-400"
                                        : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <nav
                className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-[#0b1222]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
                aria-label="Sections"
            >
                <div className="grid grid-cols-6">
                    {TABS.map(({ id, label, Icon }) => {
                        const active = activeView === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onViewChange(id)}
                                aria-label={label}
                                aria-current={active ? "page" : undefined}
                                title={label}
                                className={`flex h-14 items-center justify-center transition-colors ${
                                    active ? "text-teal-300" : "text-slate-400 active:text-slate-200"
                                }`}
                            >
                                <span className={`rounded-full px-3 py-1.5 ${active ? "bg-teal-500/20" : ""}`}>
                                    <Icon className="w-6 h-6" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
