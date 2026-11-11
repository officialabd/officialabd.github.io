"use client";

import { useState, type ReactNode } from "react";
import { DISTANCE_UNITS, HEIGHT_UNITS, WEIGHT_UNITS } from "../constants";
import type { UnitPreferences } from "../types";
import { todayISO } from "../utils";
import { CalendarIcon, PlusIcon } from "./icons";
import { Button, Field, inputClass, Segmented } from "./ui";

export interface BasicsValue {
    name: string;
    birthdate: string | null;
    units: UnitPreferences;
}

/** Name, birthdate and unit preferences. */
export function BasicsFields({ value, onChange }: { value: BasicsValue; onChange: (value: BasicsValue) => void }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                    <input className={inputClass} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
                </Field>
                <Field label="Birthdate">
                    <input
                        type="date"
                        max={todayISO()}
                        className={inputClass}
                        value={value.birthdate ?? ""}
                        onChange={(e) => onChange({ ...value, birthdate: e.target.value || null })}
                    />
                </Field>
            </div>
            <div className="flex flex-wrap gap-4">
                <Field as="div" label="Weight unit">
                    <Segmented
                        value={value.units.weight}
                        options={WEIGHT_UNITS.map((u) => ({ value: u }))}
                        onChange={(weight) => onChange({ ...value, units: { ...value.units, weight } })}
                    />
                </Field>
                <Field as="div" label="Height unit">
                    <Segmented
                        value={value.units.height}
                        options={HEIGHT_UNITS.map((u) => ({ value: u }))}
                        onChange={(height) => onChange({ ...value, units: { ...value.units, height } })}
                    />
                </Field>
                <Field as="div" label="Distance unit">
                    <Segmented
                        value={value.units.distance}
                        options={DISTANCE_UNITS.map((u) => ({ value: u }))}
                        onChange={(distance) => onChange({ ...value, units: { ...value.units, distance } })}
                    />
                </Field>
            </div>
        </div>
    );
}

export interface MeasurementValue<U extends string> {
    value: string;
    unit: U;
    date: string;
}

export const emptyMeasurement = <U extends string>(unit: U): MeasurementValue<U> => ({ value: "", unit, date: todayISO() });

export const parseMeasurement = <U extends string>(m: MeasurementValue<U>) => {
    const value = Number(m.value);
    return m.value !== "" && value > 0 && m.date ? { value, unit: m.unit, date: m.date } : null;
};

/**
 * Value + unit + date inputs for a body measurement.
 * On phones it's one compact row: the value input (filling the width), the unit, the date as a calendar icon
 * (tapping it opens the native date picker) and an optional trailing control (e.g. an add button),
 * which stays at the end of the row on every screen size.
 */
export function MeasurementFields<U extends string>({
    label,
    units,
    value,
    onChange,
    trailing,
}: {
    label: string;
    units: U[];
    value: MeasurementValue<U>;
    onChange: (value: MeasurementValue<U>) => void;
    /** Shown at the end of the row. */
    trailing?: ReactNode;
}) {
    return (
        <div className="flex items-end gap-2 sm:gap-3">
            <Field label={label} className="min-w-0 flex-1">
                <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    className={inputClass}
                    value={value.value}
                    onChange={(e) => onChange({ ...value, value: e.target.value })}
                />
            </Field>
            <Field as="div" label="Unit">
                <Segmented value={value.unit} options={units.map((u) => ({ value: u }))} onChange={(unit) => onChange({ ...value, unit })} />
            </Field>
            <Field label="Date" className="sm:flex-1">
                <div className="relative">
                    <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-300 sm:hidden"
                        aria-hidden="true"
                    >
                        <CalendarIcon className="w-5 h-5" />
                    </span>
                    {/* Invisible over the icon on phones (so a tap opens the picker); a normal input on larger screens. */}
                    <input
                        type="date"
                        max={todayISO()}
                        className={`${inputClass} absolute inset-0 opacity-0 sm:static sm:opacity-100`}
                        value={value.date}
                        onChange={(e) => onChange({ ...value, date: e.target.value })}
                    />
                </div>
            </Field>
            {trailing}
        </div>
    );
}

/** Form that adds one measurement entry to a history list. */
export function AddMeasurement<U extends string>({
    label,
    units,
    defaultUnit,
    onAdd,
}: {
    label: string;
    units: U[];
    defaultUnit: U;
    onAdd: (entry: { value: number; unit: U; date: string }) => Promise<void>;
}) {
    const [value, setValue] = useState(() => emptyMeasurement(defaultUnit));
    const [isSaving, setIsSaving] = useState(false);
    const parsed = parseMeasurement(value);

    const handleAdd = async () => {
        if (!parsed) return;
        setIsSaving(true);
        try {
            await onAdd(parsed);
            setValue(emptyMeasurement(value.unit));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-2">
            <MeasurementFields
                label={label}
                units={units}
                value={value}
                onChange={setValue}
                trailing={
                    // Icon only on phones; icon and label on larger screens.
                    <Button
                        className="w-10 shrink-0 !px-0 sm:w-auto sm:!px-4"
                        onClick={handleAdd}
                        disabled={!parsed || isSaving}
                        aria-label="Add entry"
                        title="Add entry"
                    >
                        <PlusIcon />
                        <span className="hidden sm:inline">{isSaving ? "Adding..." : "Add entry"}</span>
                    </Button>
                }
            />
        </div>
    );
}
