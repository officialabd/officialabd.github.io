import type { DistanceUnit, HeightUnit, TimeUnit, Unit, WeightUnit } from "../types";

const LB_IN_KG = 0.45359237;
const MI_IN_KM = 1.609344;
const IN_IN_CM = 2.54;

export const round = (value: number, decimals = 1): number => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
};

export const isWeightUnit = (unit: Unit | string | null | undefined): unit is WeightUnit =>
    unit === "kg" || unit === "lb";

export const isTimeUnit = (unit: Unit | string | null | undefined): unit is TimeUnit =>
    unit === "secs" || unit === "mins" || unit === "hours";

export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
    if (from === to) return value;
    return round(from === "kg" ? value / LB_IN_KG : value * LB_IN_KG);
};

export const convertDistance = (value: number, from: DistanceUnit, to: DistanceUnit): number => {
    if (from === to) return value;
    return round(from === "km" ? value / MI_IN_KM : value * MI_IN_KM, 2);
};

export const convertHeight = (value: number, from: HeightUnit, to: HeightUnit): number => {
    if (from === to) return value;
    return round(from === "cm" ? value / IN_IN_CM : value * IN_IN_CM);
};

export const toMinutes = (value: number, unit: TimeUnit): number => {
    if (unit === "secs") return value / 60;
    if (unit === "hours") return value * 60;
    return value;
};

/** Pace as "m:ss" per distance unit, or null when it can't be computed. */
export const formatPace = (distance: number | null, duration: number | null, timeUnit: TimeUnit): string | null => {
    if (!distance || !duration) return null;
    const minutesPerUnit = toMinutes(duration, timeUnit) / distance;
    if (!Number.isFinite(minutesPerUnit)) return null;
    let mins = Math.floor(minutesPerUnit);
    let secs = Math.round((minutesPerUnit - mins) * 60);
    if (secs === 60) {
        mins += 1;
        secs = 0;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
};

/** Speed in distance units per hour, or null when it can't be computed. */
export const computeSpeed = (distance: number | null, duration: number | null, timeUnit: TimeUnit): number | null => {
    if (!distance || !duration) return null;
    const hours = toMinutes(duration, timeUnit) / 60;
    return hours > 0 ? round(distance / hours, 2) : null;
};

export const computeBmi = (weight: number, weightUnit: WeightUnit, height: number, heightUnit: HeightUnit): number | null => {
    const kg = weightUnit === "kg" ? weight : weight * LB_IN_KG;
    const meters = (heightUnit === "cm" ? height : height * IN_IN_CM) / 100;
    if (kg <= 0 || meters <= 0) return null;
    return round(kg / (meters * meters));
};

export const bmiCategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-sky-300" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-300" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-300" };
    return { label: "Obese", color: "text-rose-300" };
};

export const computeAge = (birthdate: string | null, today = new Date()): number | null => {
    if (!birthdate) return null;
    const [y, m, d] = birthdate.split("-").map(Number);
    if (!y || !m || !d) return null;
    let age = today.getFullYear() - y;
    const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
};
