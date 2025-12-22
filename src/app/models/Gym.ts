export type SetType = "weight" | "time";
export type WeightUnit = "kg" | "lb" | "secs" | "mins" | "hours";

export type GymSet = {
    weight?: number | null;
    reps?: number | null;
    time?: number | null; // time in seconds for time-based sets
    completed?: boolean | null;
};

export type GymExercise = {
    id: string;
    name: string;
    muscleGroup?: string;
    setType?: SetType; // default to "weight" if not set
    weightUnit?: WeightUnit; // default to "kg" if not set
    sets: GymSet[];
};

export type GymPlanDay = {
    id: string;
    title: string;
    order?: number;
    note?: string;
    exercises: GymExercise[];
};

export type GymPlan = {
    id: string;
    title: string;
    note?: string;
    userId?: string | null;
    createdAt?: number | null;
    updatedAt?: number | null;
    days: GymPlanDay[];
};

export type GymLogExercise = {
    name: string;
    muscleGroup?: string;
    setType?: SetType;
    weightUnit?: WeightUnit;
    sets: GymSet[];
    completed?: boolean | null;
};

export type GymLogEntry = {
    id: string;
    planId: string;
    planTitle: string;
    dayId: string;
    dayTitle: string;
    date: string;
    userId?: string | null;
    exercises: GymLogExercise[];
    note?: string | null;
    createdAt: number;
    startedAt?: number | null;
    completedAt?: number | null;
    status?: "running" | "completed" | null;
};

const cleanObject = <T extends Record<string, any>>(obj: T): T => {
    const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
    return Object.fromEntries(entries) as T;
};

const sanitizeExercise = (ex: any): GymExercise => ({
    id: ex?.id ?? "",
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? undefined,
    setType: ex?.setType ?? undefined,
    weightUnit: ex?.weightUnit ?? undefined,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? undefined,
            reps: s?.reps ?? undefined,
            time: s?.time ?? undefined,
            completed: s?.completed ?? undefined,
        }))
        : [],
});

const sanitizeLogExercise = (ex: any): GymLogExercise => ({
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? undefined,
    setType: ex?.setType ?? undefined,
    weightUnit: ex?.weightUnit ?? undefined,
    completed: ex?.completed ?? undefined,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? undefined,
            reps: s?.reps ?? undefined,
            time: s?.time ?? undefined,
            completed: s?.completed ?? undefined,
        }))
        : [],
});

const sanitizeExerciseForWrite = (ex: any) => cleanObject({
    id: ex?.id ?? "",
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? null,
    setType: ex?.setType ?? null,
    weightUnit: ex?.weightUnit ?? null,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? null,
            reps: s?.reps ?? null,
            time: s?.time ?? null,
            completed: s?.completed ?? null,
        }))
        : [],
});

const sanitizeLogExerciseForWrite = (ex: any) => cleanObject({
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? null,
    setType: ex?.setType ?? null,
    weightUnit: ex?.weightUnit ?? null,
    completed: ex?.completed ?? null,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? null,
            reps: s?.reps ?? null,
            time: s?.time ?? null,
            completed: s?.completed ?? null,
        }))
        : [],
});

export const planToFirestore = (plan: GymPlan) => cleanObject({
    title: plan.title,
    note: plan.note ?? null,
    userId: plan.userId ?? null,
    createdAt: plan.createdAt ?? null,
    updatedAt: plan.updatedAt ?? null,
    days: (plan.days ?? []).filter(Boolean).map((day) => cleanObject({
        id: day?.id ?? "",
        title: day?.title ?? "",
        order: day?.order ?? null,
        note: day?.note ?? null,
        exercises: (day?.exercises ?? []).filter(Boolean).map((ex) => sanitizeExerciseForWrite(ex)),
    })),
});

export const planFromFirestore = (id: string, data: any): GymPlan => ({
    id,
    title: data?.title ?? "",
    note: data?.note ?? undefined,
    userId: data?.userId ?? undefined,
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
    days: Array.isArray(data?.days)
        ? data.days.map((day: any) => ({
            id: day?.id ?? "",
            title: day?.title ?? "",
            order: day?.order ?? undefined,
            note: day?.note ?? undefined,
            exercises: Array.isArray(day?.exercises) ? day.exercises.map((ex: any) => sanitizeExercise(ex)) : [],
        }))
        : [],
});

export const logEntryToFirestore = (log: Omit<GymLogEntry, "id">) => cleanObject({
    planId: log.planId,
    planTitle: log.planTitle,
    dayId: log.dayId,
    dayTitle: log.dayTitle,
    date: log.date,
    userId: log.userId ?? null,
    exercises: (log.exercises ?? []).filter(Boolean).map((ex) => sanitizeLogExerciseForWrite(ex)),
    note: log.note ?? null,
    createdAt: log.createdAt,
    startedAt: log.startedAt ?? null,
    completedAt: log.completedAt ?? null,
    status: log.status ?? null,
});

export const logEntryFromFirestore = (id: string, data: any): GymLogEntry => ({
    id,
    planId: data?.planId ?? "",
    planTitle: data?.planTitle ?? "",
    dayId: data?.dayId ?? "",
    dayTitle: data?.dayTitle ?? "",
    date: data?.date ?? "",
    userId: data?.userId ?? undefined,
    exercises: Array.isArray(data?.exercises) ? data.exercises.map((ex: any) => sanitizeLogExercise(ex)) : [],
    note: data?.note ?? undefined,
    createdAt: data?.createdAt ?? 0,
    startedAt: data?.startedAt ?? undefined,
    completedAt: data?.completedAt ?? undefined,
    status: data?.status ?? undefined,
});
