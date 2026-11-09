"use client";

/**
 * Small presentational building blocks shared by the gym views, so every tab uses the same look.
 *
 * Consistency rules:
 * - Two control heights: regular (h-10) for inputs, selects, segmented switches and buttons in page,
 *   filter and section-header rows; compact (h-8) for buttons inside forms/editors and for controls
 *   inside a stats panel.
 * - Labels sit above their control (Field), never inline.
 * - Section-header buttons show an icon plus a label that is hidden on phones (HeaderButton).
 * - Filters sit in one FilterBar row at the top of a tab.
 */
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Basic from "../../_layouts/texts/basic";
import type { SaveState } from "../types";
import { unitLabel } from "../utils";
import { CloseIcon, InfoIcon, RefreshIcon } from "./icons";

/** Regular text input / select / textarea. */
export const inputClass =
    "w-full min-h-[2.5rem] rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400 disabled:opacity-60";

/** Compact select, for controls inside editors and stats panels. */
export const compactInputClass =
    "h-8 rounded-lg bg-slate-900/70 border border-slate-700 px-2 text-xs text-white focus:outline-none focus:border-teal-400 disabled:opacity-60";

export const listClass = "rounded-lg border border-slate-700 overflow-hidden";

export const rowClass = (selected: boolean) =>
    `cursor-pointer border-b border-slate-700 px-3 py-3 transition-colors last:border-b-0 ${
        selected ? "bg-blue-600/20 border-l-2 border-l-blue-500" : "hover:bg-slate-800/50"
    }`;

/**
 * Section heading with optional actions on the right. A `pageTitle` (a tab's main heading) is shown
 * on phones only: on larger screens the tab bar already names the page.
 */
export function SectionTitle({ text, actions, pageTitle }: { text: string; actions?: ReactNode; pageTitle?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 w-full">
            <div className={pageTitle ? "sm:hidden" : undefined}>
                <Basic text={text} fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />
            </div>
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
    );
}

/**
 * A control with its label above. Use `as="div"` for groups of buttons (e.g. Segmented),
 * which must not be wrapped in a <label>.
 */
export function Field({
    label,
    children,
    className = "",
    as: Tag = "label",
}: {
    label: string;
    children: ReactNode;
    className?: string;
    as?: "label" | "div";
}) {
    return (
        <Tag className={`flex flex-col gap-2 ${className}`}>
            <span className="text-xs text-slate-400">{label}</span>
            {children}
        </Tag>
    );
}

/**
 * One row of filters at the top of a tab. On phones every item takes a full row; on larger screens
 * items size to their content, with a minimum width only for dropdowns/inputs (labelled Fields).
 */
export function FilterBar({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-end gap-3 [&>*]:w-full sm:[&>*]:w-auto sm:[&>label]:min-w-[9rem]">{children}</div>;
}

/** Reload button, placed as the last item of a FilterBar. */
export function RefreshButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <Button variant="neutral" onClick={onClick} disabled={disabled}>
            <RefreshIcon />
            Refresh
        </Button>
    );
}

/** Small summary figure (label, value, optional hint), used in Profile and Stats. */
export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-lg font-semibold text-slate-100">{value}</div>
            {hint && <div className="text-xs text-slate-400">{hint}</div>}
        </div>
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

const BUTTON_SIZES = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
    const sizing = variant === "ghost" ? `${BUTTON_SIZES[size]} !px-1` : BUTTON_SIZES[size];
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
            {...props}
        />
    );
}

/**
 * Button for a section header (top-right): icon plus a label that is hidden on phones.
 * The label stays available to screen readers.
 */
export function HeaderButton({ icon, label, ...props }: Omit<ButtonProps, "children" | "size"> & { icon: ReactNode; label: string }) {
    return (
        <Button {...props} aria-label={label} title={label}>
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Button>
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

/** Pill-style single choice, e.g. KG | LB. Regular height by default; "sm" inside stats panels. Label it with Field as="div". */
export function Segmented<T extends string>({
    value,
    options,
    onChange,
    disabled,
    size = "md",
}: {
    value: T;
    options: { value: T; label?: string }[];
    onChange: (value: T) => void;
    disabled?: boolean;
    size?: "sm" | "md";
}) {
    return (
        <div className={`inline-flex w-fit rounded-lg border border-slate-700 overflow-hidden ${size === "sm" ? "h-8" : "h-10"}`}>
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(o.value)}
                    aria-pressed={value === o.value}
                    className={`px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        value === o.value ? "bg-teal-500/30 text-teal-100" : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                    }`}
                >
                    {o.label ?? unitLabel(o.value)}
                </button>
            ))}
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
    className,
}: {
    gyms: string[];
    value: string | null;
    onChange: (gym: string | null) => void;
    disabled?: boolean;
    className?: string;
}) {
    const options = value && !gyms.includes(value) ? [...gyms, value] : gyms;
    if (options.length === 0) return null;
    return (
        <Field label="Gym" className={className}>
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
