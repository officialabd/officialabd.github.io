"use client";

import { useState } from "react";
import Card from "../../_layouts/card/card";
import { HEIGHT_UNITS, WEIGHT_UNITS } from "../constants";
import type { HeightUnit, MeasurementEntry, WeightUnit } from "../types";
import { useProfileStore } from "../stores";
import {
    bmiCategory,
    computeAge,
    computeBmi,
    confirmAction,
    convertHeight,
    convertWeight,
    formatISODate,
    unitLabel,
} from "../utils";
import { TrashIcon } from "./icons";
import { AddMeasurement, BasicsFields, type BasicsValue } from "./ProfileForms";
import { Button, EmptyState, SectionTitle } from "./ui";

export function ProfileView() {
    const { profile, isSaving, save, addWeight, addHeight, removeWeight, removeHeight } = useProfileStore();
    const [basics, setBasics] = useState<BasicsValue>(() => ({
        name: profile.name,
        birthdate: profile.birthdate,
        units: profile.units,
    }));

    const { units } = profile;
    const latestWeight = profile.weightHistory[0];
    const latestHeight = profile.heightHistory[0];
    const age = computeAge(profile.birthdate);
    const bmi =
        latestWeight && latestHeight
            ? computeBmi(latestWeight.value, latestWeight.unit, latestHeight.value, latestHeight.unit)
            : null;
    const basicsChanged =
        basics.name !== profile.name ||
        basics.birthdate !== profile.birthdate ||
        JSON.stringify(basics.units) !== JSON.stringify(profile.units);

    return (
        <div className="space-y-4">
            <Card heading={<SectionTitle text="Profile" />}>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Stat label="Age" value={age !== null ? `${age}` : "-"} />
                        <Stat
                            label="Weight"
                            value={latestWeight ? `${convertWeight(latestWeight.value, latestWeight.unit, units.weight)} ${unitLabel(units.weight)}` : "-"}
                        />
                        <Stat
                            label="Height"
                            value={latestHeight ? `${convertHeight(latestHeight.value, latestHeight.unit, units.height)} ${unitLabel(units.height)}` : "-"}
                        />
                        <Stat
                            label="BMI"
                            value={bmi !== null ? `${bmi}` : "-"}
                            hint={bmi !== null ? bmiCategory(bmi) : undefined}
                        />
                    </div>

                    <BasicsFields value={basics} onChange={setBasics} />
                    <Button
                        variant="save"
                        size="sm"
                        disabled={!basicsChanged || isSaving}
                        onClick={() => save({ ...basics, name: basics.name.trim() })}
                    >
                        {isSaving ? "Saving..." : "Save profile"}
                    </Button>
                </div>
            </Card>

            <Card heading={<SectionTitle text="Weight History" />}>
                <div className="space-y-4">
                    <AddMeasurement<WeightUnit> label="Body weight" units={WEIGHT_UNITS} defaultUnit={units.weight} onAdd={addWeight} />
                    <History
                        entries={profile.weightHistory}
                        display={(e) => convertWeight(e.value, e.unit, units.weight)}
                        displayUnit={units.weight}
                        onRemove={removeWeight}
                    />
                </div>
            </Card>

            <Card heading={<SectionTitle text="Height History" />}>
                <div className="space-y-4">
                    <AddMeasurement<HeightUnit> label="Height" units={HEIGHT_UNITS} defaultUnit={units.height} onAdd={addHeight} />
                    <History
                        entries={profile.heightHistory}
                        display={(e) => convertHeight(e.value, e.unit, units.height)}
                        displayUnit={units.height}
                        onRemove={removeHeight}
                    />
                </div>
            </Card>
        </div>
    );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: { label: string; color: string } }) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-lg font-semibold text-slate-100">{value}</div>
            {hint && <div className={`text-xs ${hint.color}`}>{hint.label}</div>}
        </div>
    );
}

function History<U extends string>({
    entries,
    display,
    displayUnit,
    onRemove,
}: {
    entries: MeasurementEntry<U>[];
    display: (entry: MeasurementEntry<U>) => number;
    displayUnit: U;
    onRemove: (id: string) => Promise<void>;
}) {
    if (entries.length === 0) return <EmptyState>No entries yet.</EmptyState>;
    return (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
            {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 border-b border-slate-700 px-3 py-2 last:border-b-0">
                    <span className="text-sm text-slate-300 w-28">{formatISODate(e.date)}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-100">
                        {display(e)} {unitLabel(displayUnit)}
                        {e.unit !== displayUnit && (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                                (entered {e.value} {unitLabel(e.unit)})
                            </span>
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={() => confirmAction("Delete this entry?") && onRemove(e.id)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                        aria-label="Delete entry"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
