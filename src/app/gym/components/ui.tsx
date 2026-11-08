"use client";

/**
 * Small presentational building blocks shared by the gym views,
 * so every tab uses the same look.
 */
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Basic from "../../_layouts/texts/basic";
import type { SaveState } from "../types";
import { unitLabel } from "../utils";
import { CloseIcon, InfoIcon } from "./icons";

export const inputClass =
    "w-full rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400 disabled:opacity-60";

export const compactInputClass =
    "rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400 disabled:opacity-60";

export const listClass = "rounded-lg border border-slate-700 overflow-hidden";

export const rowClass = (selected: boolean) =>
    `cursor-pointer border-b border-slate-700 px-3 py-3 transition-colors last:border-b-0 ${
        selected ? "bg-blue-600/20 border-l-2 border-l-blue-500" : "hover:bg-slate-800/50"
    }`;

export function SectionTitle({ text, actions }: { text: string; actions?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 w-full">
            <Basic text={text} fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
    return (
        <label className={`flex flex-col gap-2 ${className}`}>
            <span className="text-xs text-slate-400">{label}</span>
            {children}
        </label>
    );
}

type Variant = "primary" | "info" | "accent" | "save" | "success" | "danger" | "neutral" | "ghost";

const VARIANTS: Record<Variant, string> = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-400",
    info: "bg-sky-600 text-white hover:bg-sky-500",
    accent: "bg-violet-600 text-white hover:bg-violet-500",
    save: "bg-teal-500 text-white hover:bg-teal-400",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    neutral: "bg-slate-700 text-white hover:bg-slate-600",
    ghost: "text-indigo-300 hover:text-indigo-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: "sm" | "md";
}

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
    const sizing = variant === "ghost" ? "p-1" : size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
            {...props}
        />
    );
}

/** Square icon button used in exercise rows and editors. */
export function IconButton({ className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type={type}
            className={`p-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
            {...props}
        />
    );
}

/** Pill-style single choice, e.g. KG | LB. */
export function Segmented<T extends string>({
    value,
    options,
    onChange,
    disabled,
    label,
}: {
    value: T;
    options: { value: T; label?: string }[];
    onChange: (value: T) => void;
    disabled?: boolean;
    label?: string;
}) {
    return (
        <div className="inline-flex items-center gap-2">
            {label && <span className="text-xs text-slate-400">{label}</span>}
            <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(o.value)}
                        className={`px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            value === o.value ? "bg-teal-500/30 text-teal-100" : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                        }`}
                    >
                        {o.label ?? unitLabel(o.value)}
                    </button>
                ))}
            </div>
        </div>
    );
}

const SAVE_STATE_TEXT: Record<Exclude<SaveState, "idle">, { text: string; color: string }> = {
    saving: { text: "Saving…", color: "text-slate-400" },
    saved: { text: "Saved", color: "text-emerald-400" },
    error: { text: "Not saved", color: "text-rose-400" },
};

export function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry?: () => void }) {
    if (state === "idle") return null;
    const { text, color } = SAVE_STATE_TEXT[state];
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs ${color}`} aria-live="polite">
            <span className={`h-1.5 w-1.5 rounded-full ${state === "saving" ? "bg-slate-400 animate-pulse" : "bg-current"}`} />
            {text}
            {state === "error" && onRetry && (
                <button type="button" onClick={onRetry} className="underline hover:text-rose-300">
                    Retry
                </button>
            )}
        </span>
    );
}

/** Info button that opens a small explanation popover, anchored to its right edge. */
export function InfoTip({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`relative ${className}`} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="p-1 text-slate-400 hover:text-teal-300"
                aria-label={`About: ${title}`}
                aria-expanded={open}
            >
                <InfoIcon className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-7 z-20 w-72 max-w-[80vw] rounded-xl border border-slate-600 bg-slate-950 p-3 text-left shadow-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-teal-200">{title}</span>
                        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close">
                            <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {children}
                </div>
            )}
        </div>
    );
}

/** Term / meaning pairs for an InfoTip. */
export function TermList({ terms }: { terms: [string, ReactNode][] }) {
    return (
        <dl className="space-y-1.5 text-xs">
            {terms.map(([term, meaning]) => (
                <div key={term}>
                    <dt className="font-semibold text-slate-100">{term}</dt>
                    <dd className="text-slate-400">{meaning}</dd>
                </div>
            ))}
        </dl>
    );
}

export function EmptyState({ children }: { children: ReactNode }) {
    return <p className="text-sm text-slate-400">{children}</p>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "error" }) {
    const tones = {
        info: "border-sky-700/50 bg-sky-900/20 text-sky-200",
        warn: "border-amber-700/50 bg-amber-900/20 text-amber-200",
        error: "border-rose-700/50 bg-rose-900/20 text-rose-200",
    };
    return <div className={`rounded-lg border px-3 py-2 text-xs ${tones[tone]}`}>{children}</div>;
}

/**
 * Gym of a session, from the profile's gym list. A label no longer in the list (removed gym)
 * stays selectable so editing an old session doesn't drop it. Hidden when there is nothing to pick.
 */
export function GymSelect({
    gyms,
    value,
    onChange,
    disabled,
}: {
    gyms: string[];
    value: string | null;
    onChange: (gym: string | null) => void;
    disabled?: boolean;
}) {
    const options = value && !gyms.includes(value) ? [...gyms, value] : gyms;
    if (options.length === 0) return null;
    return (
        <Field label="Gym">
            <select className={inputClass} value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">No gym</option>
                {options.map((g) => (
                    <option key={g} value={g}>
                        {g}
                    </option>
                ))}
            </select>
        </Field>
    );
}
