export type GymSet = {
    weight?: number | null;
    reps?: number | null;
    note?: string | null;
    completed?: boolean | null;
};

export type GymExercise = {
    id: string;
    name: string;
    muscleGroup?: string;
    sets: GymSet[];
    note?: string;
};

export type GymPlanDay = {
    id: string;
    title: string;
    order?: number;
    note?: string;
    exercises: GymExercise[];
};

export type GymLogExercise = {
    name: string;
    muscleGroup?: string;
    sets: GymSet[];
    note?: string;
    completed?: boolean | null;
};

export type GymLogEntry = {
    id: string;
    dayId: string;
    dayTitle: string;
    date: string;
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
    note: ex?.note ?? undefined,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? undefined,
            reps: s?.reps ?? undefined,
            note: s?.note ?? undefined,
            completed: s?.completed ?? undefined,
        }))
        : [],
});

const sanitizeLogExercise = (ex: any): GymLogExercise => ({
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? undefined,
    note: ex?.note ?? undefined,
    completed: ex?.completed ?? undefined,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? undefined,
            reps: s?.reps ?? undefined,
            note: s?.note ?? undefined,
            completed: s?.completed ?? undefined,
        }))
        : [],
});

const sanitizeExerciseForWrite = (ex: any) => cleanObject({
    id: ex?.id ?? "",
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? null,
    note: ex?.note ?? null,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? null,
            reps: s?.reps ?? null,
            note: s?.note ?? null,
            completed: s?.completed ?? null,
        }))
        : [],
});

const sanitizeLogExerciseForWrite = (ex: any) => cleanObject({
    name: ex?.name ?? "",
    muscleGroup: ex?.muscleGroup ?? null,
    note: ex?.note ?? null,
    completed: ex?.completed ?? null,
    sets: Array.isArray(ex?.sets)
        ? ex.sets.map((s: any) => cleanObject({
            weight: s?.weight ?? null,
            reps: s?.reps ?? null,
            note: s?.note ?? null,
            completed: s?.completed ?? null,
        }))
        : [],
});

export const planDayToFirestore = (plan: GymPlanDay) => cleanObject({
    title: plan.title,
    order: plan.order ?? null,
    note: plan.note ?? null,
    exercises: (plan.exercises ?? []).filter(Boolean).map((ex) => sanitizeExerciseForWrite(ex)),
});

export const planDayFromFirestore = (id: string, data: any): GymPlanDay => ({
    id,
    title: data?.title ?? "",
    order: data?.order ?? undefined,
    note: data?.note ?? undefined,
    exercises: Array.isArray(data?.exercises) ? data.exercises.map((ex: any) => sanitizeExercise(ex)) : [],
});

export const logEntryToFirestore = (log: Omit<GymLogEntry, "id">) => cleanObject({
    dayId: log.dayId,
    dayTitle: log.dayTitle,
    date: log.date,
    exercises: (log.exercises ?? []).filter(Boolean).map((ex) => sanitizeLogExerciseForWrite(ex)),
    note: log.note ?? null,
    createdAt: log.createdAt,
    startedAt: log.startedAt ?? null,
    completedAt: log.completedAt ?? null,
    status: log.status ?? null,
});

export const logEntryFromFirestore = (id: string, data: any): GymLogEntry => ({
    id,
    dayId: data?.dayId ?? "",
    dayTitle: data?.dayTitle ?? "",
    date: data?.date ?? "",
    exercises: Array.isArray(data?.exercises) ? data.exercises.map((ex: any) => sanitizeLogExercise(ex)) : [],
    note: data?.note ?? undefined,
    createdAt: data?.createdAt ?? 0,
    startedAt: data?.startedAt ?? undefined,
    completedAt: data?.completedAt ?? undefined,
    status: data?.status ?? undefined,
});
