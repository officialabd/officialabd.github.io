"use client";

import { useEffect, useState } from "react";
import type { HeightEntry, WeightEntry } from "../types";
import { useProfileStore } from "../stores";
import {
    BMI_RANGES,
    bmiCategory,
    computeBmi,
    convertWeight,
    healthyWeightRange,
    MAX_TARGET_BMI,
    MIN_TARGET_BMI,
    round,
    weightForBmi,
} from "../utils";
import { InfoTip } from "./ui";

const kgAndLb = (kg: number) => `${kg} KG / ${convertWeight(kg, "kg", "lb")} LB`;

interface BmiCardProps {
    weight: WeightEntry | undefined;
    height: HeightEntry | undefined;
}

/** Current BMI, a user-set target BMI with its target weight, and a tip with the BMI ranges. */
export function BmiCard({ weight, height }: BmiCardProps) {
    const { profile, save } = useProfileStore();
    const [targetInput, setTargetInput] = useState(profile.targetBmi?.toString() ?? "");

    // Keep the input in sync if the profile is reloaded (e.g. after an import).
    useEffect(() => setTargetInput(profile.targetBmi?.toString() ?? ""), [profile.targetBmi]);

    const bmi = weight && height ? computeBmi(weight.value, weight.unit, height.value, height.unit) : null;
    const category = bmi !== null ? bmiCategory(bmi) : null;

    const parsedTarget = targetInput.trim() === "" ? null : Number(targetInput);
    const targetValid =
        parsedTarget === null || (Number.isFinite(parsedTarget) && parsedTarget >= MIN_TARGET_BMI && parsedTarget <= MAX_TARGET_BMI);

    const commitTarget = () => {
        if (!targetValid) return;
        const next = parsedTarget === null ? null : round(parsedTarget);
        if (next !== profile.targetBmi) save({ targetBmi: next });
    };

    const targetKg = height && parsedTarget !== null && targetValid ? weightForBmi(parsedTarget, height.value, height.unit) : null;
    const currentKg = weight ? convertWeight(weight.value, weight.unit, "kg") : null;
    const diffKg = targetKg !== null && currentKg !== null ? round(targetKg - currentKg) : null;
    const healthy = height ? healthyWeightRange(height.value, height.unit) : null;

    return (
        <div className="relative rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 space-y-1.5">
            <InfoTip title="BMI ranges (adults)" className="!absolute right-2 top-2">
                    <ul className="space-y-1 text-xs">
                        {BMI_RANGES.map((r) => (
                            <li key={r.label} className="flex justify-between gap-3">
                                <span className={r.color}>{r.label}</span>
                                <span className="text-slate-300">{r.range}</span>
                            </li>
                        ))}
                    </ul>
                    {healthy && (
                        <p className="text-[11px] text-slate-400">
                            Normal range for your height: {healthy[0]}–{healthy[1]} KG / {convertWeight(healthy[0], "kg", "lb")}–
                            {convertWeight(healthy[1], "kg", "lb")} LB.
                        </p>
                    )}
                    <p className="text-[11px] text-slate-500">BMI doesn&apos;t account for muscle mass, so treat it as a rough guide.</p>
            </InfoTip>

            <div>
                <div className="text-xs text-slate-400">BMI</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-slate-100">{bmi ?? "-"}</span>
                    {category && <span className={`text-xs ${category.color}`}>{category.label}</span>}
                </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400">
                Target
                <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_TARGET_BMI}
                    max={MAX_TARGET_BMI}
                    step="0.1"
                    placeholder="e.g. 24"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onBlur={commitTarget}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    className={`w-16 rounded-lg bg-slate-900/70 border px-2 py-0.5 text-xs text-white focus:outline-none focus:border-teal-400 ${
                        targetValid ? "border-slate-700" : "border-rose-500"
                    }`}
                />
            </label>

            {!targetValid && (
                <div className="text-[11px] text-rose-300">
                    Enter a BMI between {MIN_TARGET_BMI} and {MAX_TARGET_BMI}.
                </div>
            )}
            {targetKg !== null && (
                <div className="text-[11px] leading-tight">
                    <div className="font-semibold text-slate-200">{kgAndLb(targetKg)}</div>
                    {diffKg !== null && diffKg !== 0 && (
                        <div className="text-slate-400">
                            {diffKg < 0 ? "Lose" : "Gain"} {kgAndLb(Math.abs(diffKg))}
                        </div>
                    )}
                </div>
            )}
            {!height && parsedTarget !== null && (
                <div className="text-[11px] text-slate-400">Add your height to see the target weight.</div>
            )}
        </div>
    );
}
