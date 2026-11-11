"use client";

import { useState, type ReactNode } from "react";
import Card from "./Card";
import { HEIGHT_UNITS, WEIGHT_UNITS } from "../constants";
import type { HeightUnit, MeasurementEntry, WeightUnit } from "../types";
import { useProfileStore } from "../stores";
import { computeAge, confirmAction, convertHeight, convertWeight, formatISODate, unitLabel } from "../utils";
import { BmiCard } from "./BmiCard";
import { DataTransfer } from "./DataTransfer";
import { GymsCard } from "./GymsCard";
import { TrashIcon } from "./icons";
import { AddMeasurement, BasicsFields, type BasicsValue } from "./ProfileForms";
import { AccountCard, type AccountInfo } from "./AccountCard";
import { Button, EmptyState, SectionTitle, StatTile } from "./ui";

/** The weight converted to the other unit, e.g. "176.4 LB" for 80 kg. */
const inOtherUnit = (value: number, unit: WeightUnit) => {
    const other: WeightUnit = unit === "kg" ? "lb" : "kg";
    return `${convertWeight(value, unit, other)} ${unitLabel(other)}`;
};

/** The height in the unit that isn't displayed, e.g. "68.1 Inches" for 173 cm. */
const otherHeight = (value: number, unit: HeightUnit, shown: HeightUnit) => {
    const other: HeightUnit = shown === "cm" ? "in" : "cm";
    return `${convertHeight(value, unit, other)} ${unitLabel(other)}`;
};

/** A weight in both units; the unit it was entered in is marked. */
function BothWeights({ value, unit }: { value: number; unit: WeightUnit }) {
    return (
        <>
            {value} {unitLabel(unit)} <span className="text-xs font-normal text-slate-400">(entered)</span>
            <span className="mx-2 text-slate-500">·</span>
            {inOtherUnit(value, unit)}
        </>
    );
}

export function ProfileView({ account }: { account: AccountInfo }) {
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
    const basicsChanged =
        basics.name !== profile.name ||
        basics.birthdate !== profile.birthdate ||
        JSON.stringify(basics.units) !== JSON.stringify(profile.units);

    return (
        <div className="space-y-4">
            <Card heading={<SectionTitle text="Profile" pageTitle />}>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-fr gap-3">
                        <StatTile
                            label="Age"
                            value={age !== null ? `${age}` : "-"}
                            hint={profile.birthdate ? formatISODate(profile.birthdate) : undefined}
                        />
                        <StatTile
                            label="Weight"
                            value={latestWeight ? `${latestWeight.value} ${unitLabel(latestWeight.unit)}` : "-"}
                            hint={latestWeight ? inOtherUnit(latestWeight.value, latestWeight.unit) : undefined}
                        />
                        <StatTile
                            label="Height"
                            value={latestHeight ? `${convertHeight(latestHeight.value, latestHeight.unit, units.height)} ${unitLabel(units.height)}` : "-"}
                            hint={latestHeight ? otherHeight(latestHeight.value, latestHeight.unit, units.height) : undefined}
                        />
                        <BmiCard weight={latestWeight} height={latestHeight} />
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
                    <History entries={profile.weightHistory} render={(e) => <BothWeights value={e.value} unit={e.unit} />} onRemove={removeWeight} />
                </div>
            </Card>

            <Card heading={<SectionTitle text="Height History" />}>
                <div className="space-y-4">
                    <AddMeasurement<HeightUnit> label="Height" units={HEIGHT_UNITS} defaultUnit={units.height} onAdd={addHeight} />
                    <History
                        entries={profile.heightHistory}
                        render={(e) => (
                            <>
                                {convertHeight(e.value, e.unit, units.height)} {unitLabel(units.height)}
                                {e.unit !== units.height && (
                                    <span className="ml-2 text-xs font-normal text-slate-400">
                                        (entered {e.value} {unitLabel(e.unit)})
                                    </span>
                                )}
                            </>
                        )}
                        onRemove={removeHeight}
                    />
                </div>
            </Card>

            <GymsCard />

            <DataTransfer />

            <AccountCard {...account} />
        </div>
    );
}

function History<U extends string>({
    entries,
    render,
    onRemove,
}: {
    entries: MeasurementEntry<U>[];
    render: (entry: MeasurementEntry<U>) => ReactNode;
    onRemove: (id: string) => Promise<void>;
}) {
    if (entries.length === 0) return <EmptyState>No entries yet.</EmptyState>;
    return (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
            {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 border-b border-slate-700 px-3 py-2 last:border-b-0">
                    <span className="text-sm text-slate-300 w-28 shrink-0">{formatISODate(e.date)}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-100">{render(e)}</span>
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
