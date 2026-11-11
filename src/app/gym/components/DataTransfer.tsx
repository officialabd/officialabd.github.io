"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Card from "./Card";
import { loadAccount } from "../hooks";
import {
    applyImport,
    buildExport,
    missingExerciseRefs,
    parseImport,
    type TransferData,
    type TransferFile,
    type TransferScope,
} from "../services/transfer";
import { useAuthStore, useExercisesStore, usePlansStore, useUIStore } from "../stores";
import { exportToJsonFile } from "../utils";
import { Button, Field, inputClass, Notice, SectionTitle } from "./ui";

const SCOPES: { value: TransferScope; label: string }[] = [
    { value: "all", label: "All" },
    { value: "plans", label: "Plans" },
    { value: "exercises", label: "Exercises" },
    { value: "logs", label: "Logs" },
];

const SCOPE_TEXT: Record<TransferScope, string> = {
    all: "all your data (profile, exercises, plans and logs)",
    plans: "all your plans",
    exercises: "your exercise library",
    logs: "all your logs",
};

const CONFIRM_WORD = "REPLACE";

interface PendingImport {
    scope: TransferScope;
    fileName: string;
    data: TransferData;
    source: TransferFile;
    warnings: string[];
}

export function DataTransfer() {
    const user = useAuthStore((s) => s.user);
    const libraryIds = useExercisesStore((s) => s.byId);
    const plans = usePlansStore((s) => s.plans);
    const setActiveView = useUIStore((s) => s.setActiveView);

    const fileInput = useRef<HTMLInputElement>(null);
    const [importScope, setImportScope] = useState<TransferScope>("all");
    const [pending, setPending] = useState<PendingImport | null>(null);
    const [confirmText, setConfirmText] = useState("");
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const reset = () => {
        setPending(null);
        setConfirmText("");
        setError(null);
        setDone(null);
    };

    const handleExport = async (scope: TransferScope) => {
        if (!user) return;
        reset();
        setBusy(`Exporting ${scope}…`);
        try {
            exportToJsonFile(await buildExport(user.uid, scope, user.email), `gym-${scope}`);
        } catch (err) {
            console.error("Export failed", err);
            setError("Export failed. Please try again.");
        } finally {
            setBusy(null);
        }
    };

    const chooseImport = (scope: TransferScope) => {
        reset();
        setImportScope(scope);
        fileInput.current?.click();
    };

    /** Warn about plan days that would point at exercises missing from the library. */
    const buildWarnings = (scope: TransferScope, data: TransferData): string[] => {
        const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
        const missing =
            scope === "all"
                ? missingExerciseRefs(data.plans ?? [], ids(data.exercises ?? []))
                : scope === "plans"
                ? missingExerciseRefs(data.plans ?? [], new Set(libraryIds.keys()))
                : scope === "exercises"
                ? missingExerciseRefs(plans, ids(data.exercises ?? []))
                : 0;
        if (!missing) return [];
        return [
            `${missing} exercise${missing === 1 ? " is" : "s are"} used in plan days but won't be in your exercise library. ` +
                "They will be removed from those days the next time the plan is saved.",
        ];
    };

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            const { source, ...data } = parseImport(await file.text(), importScope);
            setPending({ scope: importScope, fileName: file.name, data, source, warnings: buildWarnings(importScope, data) });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this file.");
        }
    };

    const handleImport = async () => {
        if (!user || !pending || confirmText !== CONFIRM_WORD) return;
        setError(null);
        setBusy("Importing…");
        try {
            await applyImport(user.uid, pending.data);
            setBusy("Reloading…");
            await loadAccount(user.uid);
            setDone(`Imported ${pending.scope} from ${pending.fileName}.`);
            setPending(null);
            setConfirmText("");
            if (pending.scope === "all") setActiveView("session");
        } catch (err) {
            console.error("Import failed", err);
            setError("The import did not finish. Importing the same file again will complete it.");
        } finally {
            setBusy(null);
        }
    };

    const counts = pending
        ? [
              ["Exercises", pending.data.exercises?.length],
              ["Plans", pending.data.plans?.length],
              ["Logs", pending.data.logs?.length],
          ].filter(([, n]) => n !== undefined)
        : [];

    return (
        <Card heading={<SectionTitle text="Import / Export" />}>
            <div className="space-y-5">
                <div className="space-y-2">
                    <div className="text-xs text-slate-400">Export (downloads a JSON file)</div>
                    <div className="flex flex-wrap gap-2">
                        {SCOPES.map((s) => (
                            <Button
                                key={s.value}
                                size="sm"
                                variant={s.value === "all" ? "success" : "neutral"}
                                disabled={!!busy}
                                onClick={() => handleExport(s.value)}
                            >
                                Export {s.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-xs text-slate-400">
                        Import (replaces that part of your data; an &quot;All&quot; file can be used for any import)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SCOPES.map((s) => (
                            <Button
                                key={s.value}
                                size="sm"
                                variant={s.value === "all" ? "primary" : "neutral"}
                                disabled={!!busy}
                                onClick={() => chooseImport(s.value)}
                            >
                                Import {s.label}
                            </Button>
                        ))}
                    </div>
                    <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
                </div>

                {busy && <p className="text-xs text-slate-400">{busy}</p>}
                {error && <Notice tone="error">{error}</Notice>}
                {done && <Notice>{done}</Notice>}

                {pending && (
                    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                        <div className="text-sm text-slate-200">
                            <span className="text-slate-400">File:</span> {pending.fileName}
                            <div className="text-xs text-slate-400">
                                Exported {new Date(pending.source.exportedAt).toLocaleString()}
                                {pending.source.email && ` from ${pending.source.email}`}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-200">
                            {counts.map(([label, n]) => (
                                <span key={label as string}>
                                    <b>{n}</b> {label}
                                </span>
                            ))}
                            {pending.data.profile && <span>+ profile</span>}
                        </div>
                        {pending.warnings.map((w) => (
                            <Notice key={w} tone="warn">
                                {w}
                            </Notice>
                        ))}
                        <Notice tone="warn">
                            This replaces {SCOPE_TEXT[pending.scope]}. Tip: use Export All first if you want a backup.
                        </Notice>
                        <Field label={`Type ${CONFIRM_WORD} to confirm`}>
                            <input className={inputClass} value={confirmText} disabled={!!busy} onChange={(e) => setConfirmText(e.target.value)} />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="danger" size="sm" disabled={!!busy || confirmText !== CONFIRM_WORD} onClick={handleImport}>
                                Import and replace
                            </Button>
                            <Button variant="neutral" size="sm" disabled={!!busy} onClick={reset}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
