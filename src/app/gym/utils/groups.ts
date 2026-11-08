import { MUSCLE_GROUPS } from "../constants";
import type { MuscleGroup } from "../types";

const BY_VALUE = new Map(MUSCLE_GROUPS.map((g) => [g.value, g]));

export const isMuscleGroup = (value: unknown): value is MuscleGroup => BY_VALUE.has(value as MuscleGroup);

export const groupLabel = (group: MuscleGroup): string => BY_VALUE.get(group)?.label ?? group;

export const formatGroups = (groups: MuscleGroup[]): string => groups.map(groupLabel).join(", ");

/** Stripe color of an exercise, from its first muscle group. */
export const groupColor = (groups: MuscleGroup[]): string => BY_VALUE.get(groups[0])?.color ?? "bg-slate-600";

/** Groups in the order of the fixed list, without duplicates. */
export const sortGroups = (groups: MuscleGroup[]): MuscleGroup[] =>
    MUSCLE_GROUPS.map((g) => g.value).filter((g) => groups.includes(g));

/** Keyword rules mapping free-text muscle names (the old `group` field) onto the fixed list. */
const TEXT_RULES: [MuscleGroup[], RegExp][] = [
    [["hamstrings"], /hamstring|femoris|semitendinosus|semimembranosus/],
    [["biceps"], /bicep(?!s?\s+femoris)/],
    [["biceps", "triceps"], /\barms?\b/],
    [["chest"], /chest|pec/],
    [["back"], /\bback\b|\blats?\b|latissimus|rhomboid/],
    [["traps"], /trap/],
    [["shoulders"], /shoulder|delt/],
    [["triceps"], /tricep/],
    [["forearms"], /forearm|grip/],
    [["core"], /core|\babs?\b|abdomin|oblique/],
    [["glutes"], /glute/],
    [["quads"], /quad/],
    [["adductors"], /adductor/],
    [["calves"], /\bcalf|calves|calfs/],
    [["fullBody"], /full\s*body/],
    [["cardio"], /cardio|running/],
];

/** Best-effort mapping of an old free-text group, e.g. "Quadriceps, glutes" -> quads, glutes. */
export const groupsFromText = (text: string): MuscleGroup[] => {
    const lower = text.toLowerCase();
    return sortGroups(TEXT_RULES.filter(([, re]) => re.test(lower)).flatMap(([groups]) => groups));
};

/** Reads `groups` (list), falling back to the legacy single `group` string. */
export const parseGroups = (groups: unknown, legacyGroup: unknown): MuscleGroup[] => {
    if (Array.isArray(groups)) return sortGroups(groups.filter(isMuscleGroup));
    return typeof legacyGroup === "string" ? groupsFromText(legacyGroup) : [];
};
