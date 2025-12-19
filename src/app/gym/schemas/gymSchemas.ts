import { z } from "zod";

// ============================================================================
// PRIMITIVE SCHEMAS
// ============================================================================

export const setTypeSchema = z.enum(["weight", "time"]);
export const weightUnitSchema = z.enum(["kg", "lb"]);
export const sessionStatusSchema = z.enum(["running", "completed"]).nullable();

// ============================================================================
// SET SCHEMA
// ============================================================================

export const gymSetSchema = z.object({
    weight: z.number().min(0).nullable().optional(),
    reps: z.number().int().min(0).nullable().optional(),
    time: z.number().min(0).nullable().optional(), // time in minutes
    note: z.string().nullable().optional(),
    completed: z.boolean().nullable().optional(),
});

export type GymSetInput = z.infer<typeof gymSetSchema>;

// ============================================================================
// EXERCISE SCHEMAS
// ============================================================================

export const gymExerciseSchema = z.object({
    id: z.string().min(1, "Exercise ID is required"),
    name: z.string().min(1, "Exercise name is required"),
    muscleGroup: z.string().optional(),
    setType: setTypeSchema.optional().default("weight"),
    weightUnit: weightUnitSchema.optional().default("kg"),
    sets: z.array(gymSetSchema).default([]),
    note: z.string().optional(),
});

export type GymExerciseInput = z.infer<typeof gymExerciseSchema>;

export const gymLogExerciseSchema = z.object({
    name: z.string().min(1, "Exercise name is required"),
    muscleGroup: z.string().optional(),
    setType: setTypeSchema.optional().default("weight"),
    weightUnit: weightUnitSchema.optional().default("kg"),
    sets: z.array(gymSetSchema).default([]),
    note: z.string().optional(),
    completed: z.boolean().nullable().optional(),
});

export type GymLogExerciseInput = z.infer<typeof gymLogExerciseSchema>;

// ============================================================================
// DAY SCHEMA
// ============================================================================

export const gymPlanDaySchema = z.object({
    id: z.string().min(1, "Day ID is required"),
    title: z.string().min(1, "Day title is required"),
    order: z.number().int().optional(),
    note: z.string().optional(),
    exercises: z.array(gymExerciseSchema).default([]),
});

export type GymPlanDayInput = z.infer<typeof gymPlanDaySchema>;

// ============================================================================
// PLAN SCHEMA
// ============================================================================

export const gymPlanSchema = z.object({
    id: z.string().min(1, "Plan ID is required"),
    title: z.string().min(1, "Plan title is required"),
    note: z.string().optional(),
    userId: z.string().nullable().optional(),
    createdAt: z.number().nullable().optional(),
    updatedAt: z.number().nullable().optional(),
    days: z.array(gymPlanDaySchema).default([]),
});

export type GymPlanInput = z.infer<typeof gymPlanSchema>;

// For creating a new plan (without id)
export const createPlanSchema = gymPlanSchema.omit({ id: true }).extend({
    title: z.string().min(1, "Plan title is required").max(100, "Title too long"),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

// ============================================================================
// LOG ENTRY SCHEMA
// ============================================================================

export const gymLogEntrySchema = z.object({
    id: z.string().min(1, "Log ID is required"),
    planId: z.string().min(1, "Plan ID is required"),
    planTitle: z.string(),
    dayId: z.string().min(1, "Day ID is required"),
    dayTitle: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    userId: z.string().nullable().optional(),
    exercises: z.array(gymLogExerciseSchema).default([]),
    note: z.string().nullable().optional(),
    createdAt: z.number(),
    startedAt: z.number().nullable().optional(),
    completedAt: z.number().nullable().optional(),
    status: sessionStatusSchema.optional(),
});

export type GymLogEntryInput = z.infer<typeof gymLogEntrySchema>;

// For creating a log draft (without id and createdAt)
export const logDraftSchema = gymLogEntrySchema.omit({ id: true, createdAt: true });

export type LogDraftInput = z.infer<typeof logDraftSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const logsFilterSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    planId: z.string().optional(),
    dayId: z.string().optional(),
});

export type LogsFilterInput = z.infer<typeof logsFilterSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and parse a plan input, returning errors if invalid
 */
export function validatePlan(data: unknown): { success: true; data: GymPlanInput } | { success: false; errors: string[] } {
    const result = gymPlanSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
}

/**
 * Validate and parse a log draft, returning errors if invalid
 */
export function validateLogDraft(data: unknown): { success: true; data: LogDraftInput } | { success: false; errors: string[] } {
    const result = logDraftSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
}

/**
 * Validate a new plan title
 */
export function validatePlanTitle(title: string): { valid: boolean; error?: string } {
    const trimmed = title.trim();
    if (!trimmed) {
        return { valid: false, error: "Plan title is required" };
    }
    if (trimmed.length > 100) {
        return { valid: false, error: "Plan title must be 100 characters or less" };
    }
    return { valid: true };
}

/**
 * Validate a new day title
 */
export function validateDayTitle(title: string): { valid: boolean; error?: string } {
    const trimmed = title.trim();
    if (!trimmed) {
        return { valid: false, error: "Day title is required" };
    }
    if (trimmed.length > 100) {
        return { valid: false, error: "Day title must be 100 characters or less" };
    }
    return { valid: true };
}
