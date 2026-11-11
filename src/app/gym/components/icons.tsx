"use client";

import type { ReactNode } from "react";

interface IconProps {
    className?: string;
}

export function SearchIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.65" y1="16.65" x2="21" y2="21" />
        </svg>
    );
}

export function TrashIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M14 10v8" />
            <path d="M10 10v8" />
            <path d="M9 6l1-2h4l1 2" />
        </svg>
    );
}

export function DragIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M10 4h4" />
            <path d="M10 9h4" />
            <path d="M10 14h4" />
            <path d="M10 19h4" />
        </svg>
    );
}

export function PlusIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

export function MinusIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

export function EditIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

export function DownloadIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

export function CheckIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

export function CloseIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

export function InfoIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

export function SkipIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
    );
}

export function StarIcon({ className = "w-4 h-4", filled = false }: IconProps & { filled?: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

/** Outline icon frame shared by the tab icons. */
function Outline({ className = "w-5 h-5", children }: IconProps & { children: ReactNode }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function StopwatchIcon(props: IconProps) {
    return (
        <Outline {...props}>
            <circle cx="12" cy="14" r="8" />
            <line x1="12" y1="14" x2="12" y2="10" />
            <line x1="10" y1="2" x2="14" y2="2" />
        </Outline>
    );
}

export function ClipboardIcon(props: IconProps) {
    return (
        <Outline {...props}>
            <rect x="5" y="4" width="14" height="18" rx="2" />
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
        </Outline>
    );
}

export function DumbbellIcon(props: IconProps) {
    return (
        <Outline {...props}>
            <line x1="7" y1="12" x2="17" y2="12" />
            <rect x="3" y="8" width="4" height="8" rx="1" />
            <rect x="17" y="8" width="4" height="8" rx="1" />
            <line x1="1.5" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="22.5" y2="12" />
        </Outline>
    );
}

export function ListIcon(props: IconProps) {
    return (
        <Outline {...props}>
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4.5" cy="6" r="1" />
            <circle cx="4.5" cy="12" r="1" />
            <circle cx="4.5" cy="18" r="1" />
        </Outline>
    );
}

export function ChartIcon(props: IconProps) {
    return (
        <Outline {...props}>
            <line x1="3" y1="21" x2="21" y2="21" />
            <rect x="5" y="12" width="3" height="6" rx="1" />
            <rect x="10.5" y="7" width="3" height="11" rx="1" />
            <rect x="16" y="3" width="3" height="15" rx="1" />
        </Outline>
    );
}

export function UserIcon(props: IconProps) {
    return (
        <Outline {...props}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </Outline>
    );
}

export function RefreshIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <Outline className={className}>
            <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
            <polyline points="21 3 21 8 16 8" />
            <polyline points="3 21 3 16 8 16" />
        </Outline>
    );
}

export function MergeIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <Outline className={className}>
            <circle cx="6" cy="5" r="2" />
            <circle cx="6" cy="19" r="2" />
            <circle cx="18" cy="12" r="2" />
            <path d="M6 7v10" />
            <path d="M6 7c0 3 3 5 10 5" />
        </Outline>
    );
}

export function LogoutIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <Outline className={className}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </Outline>
    );
}

export function CalendarIcon({ className = "w-4 h-4" }: IconProps) {
    return (
        <Outline className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </Outline>
    );
}
