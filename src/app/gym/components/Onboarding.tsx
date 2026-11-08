"use client";

import { useState } from "react";
import Card from "../../_layouts/card/card";
import { HEIGHT_UNITS, WEIGHT_UNITS } from "../constants";
import type { GymProfile } from "../types";
import { useProfileStore } from "../stores";
import { generateId } from "../utils";
import {
    BasicsFields,
    emptyMeasurement,
    MeasurementFields,
    parseMeasurement,
    type BasicsValue,
} from "./ProfileForms";
import { Button, Notice, SectionTitle } from "./ui";

/** First-run profile setup. Everything is optional and can be skipped. */
export function Onboarding() {
    const { profile, isSaving, save } = useProfileStore();
    const [basics, setBasics] = useState<BasicsValue>({ name: profile.name, birthdate: profile.birthdate, units: profile.units });
    const [weight, setWeight] = useState(() => emptyMeasurement(profile.units.weight));
    const [height, setHeight] = useState(() => emptyMeasurement(profile.units.height));
    const [error, setError] = useState<string | null>(null);

    const submit = async (changes: Partial<GymProfile>) => {
        setError(null);
        try {
            await save({ ...changes, onboardedAt: Date.now() });
        } catch (err) {
            console.error(err);
            setError("Could not save your profile. Please try again.");
        }
    };

    const handleSave = () => {
        const now = Date.now();
        const w = parseMeasurement(weight);
        const h = parseMeasurement(height);
        submit({
            ...basics,
            name: basics.name.trim(),
            weightHistory: w ? [{ ...w, id: generateId(), createdAt: now }] : profile.weightHistory,
            heightHistory: h ? [{ ...h, id: generateId(), createdAt: now }] : profile.heightHistory,
        });
    };

    return (
        <Card heading={<SectionTitle text="Welcome! Set up your profile" />}>
            <div className="space-y-5">
                <p className="text-sm text-slate-300">
                    Add a few details to track your body weight, height and BMI over time. You can skip this and fill it in
                    later from the Profile tab.
                </p>
                <BasicsFields
                    value={basics}
                    onChange={(next) => {
                        // Keep the measurement units in step with the chosen preferences.
                        if (next.units.weight !== basics.units.weight) setWeight({ ...weight, unit: next.units.weight });
                        if (next.units.height !== basics.units.height) setHeight({ ...height, unit: next.units.height });
                        setBasics(next);
                    }}
                />
                <MeasurementFields label="Current body weight" units={WEIGHT_UNITS} value={weight} onChange={setWeight} />
                <MeasurementFields label="Height" units={HEIGHT_UNITS} value={height} onChange={setHeight} />
                {error && <Notice tone="error">{error}</Notice>}
                <div className="flex flex-wrap gap-2">
                    <Button variant="save" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save profile"}
                    </Button>
                    <Button variant="neutral" onClick={() => submit({})} disabled={isSaving}>
                        Skip for now
                    </Button>
                </div>
            </div>
        </Card>
    );
}
