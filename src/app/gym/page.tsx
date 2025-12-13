"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../../../firebase";
import staticData from "../staticData";
import Card from "../_layouts/card/card";
import Basic from "../_layouts/texts/basic";
import LinePulse from "../_layouts/pulse/line";
import {
    GymExercise,
    GymLogEntry,
    GymPlan,
    GymPlanDay,
    GymSet,
    logEntryFromFirestore,
    logEntryToFirestore,
    planFromFirestore,
    planToFirestore,
} from "../models/Gym";

const generateId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));

const toLocalISODate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const todayISO = () => toLocalISODate(new Date());
const lastMonthISO = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toLocalISODate(d);
};

const formatTime = (ts?: number | null) => (ts ? new Date(ts).toLocaleString() : "-");
const formatDuration = (start?: number | null, end?: number | null) => {
    if (!start || !end) return "-";
    const mins = Math.max(0, Math.round((end - start) / 60000));
    return `${mins} min`;
};
const formatRemaining = (ms?: number | null) => {
    if (ms === null || ms === undefined) return "-";
    if (ms <= 0) return "expired";
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
};

const ensureSetCount = (count: number, existing: GymSet[]) => {
    const safe = Math.max(0, count);
    const next = [...existing];
    if (next.length < safe) {
        while (next.length < safe) next.push({ weight: null, reps: null, completed: false });
    } else if (next.length > safe) {
        next.length = safe;
    }
    return next;
};

const getExerciseStatus = (sets: GymSet[]) => {
    const total = sets?.length ?? 0;
    const filled = (sets ?? []).filter((s) => s && s.weight !== null && s.weight !== undefined).length;
    if (total > 0 && filled === total) return { label: "Completed", color: "text-emerald-300" } as const;
    if (filled > 0) return { label: "Partial", color: "text-orange-300" } as const;
    return { label: "Unattempted", color: "text-rose-300" } as const;
};

const openExerciseSearch = (name: string, muscle?: string | null) => {
    if (typeof window === "undefined") return;
    const query = encodeURIComponent(`${muscle ? `${muscle}: ` : ""}${name}`.trim());
    const url = `https://www.google.com/search?q=${query}`;
    const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = url;
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
    }
};

const sanitizeLogForWrite = (draft: Omit<GymLogEntry, "id" | "createdAt">) => ({
    ...draft,
    planId: draft.planId ?? "",
    planTitle: draft.planTitle ?? "",
    dayId: draft.dayId ?? "",
    dayTitle: draft.dayTitle ?? "",
    date: draft.date ?? todayISO(),
    userId: draft.userId ?? null,
    note: draft.note ?? null,
    startedAt: draft.startedAt ?? null,
    completedAt: draft.completedAt ?? null,
    status: draft.status ?? null,
    exercises: (draft.exercises ?? []).filter(Boolean).map((ex) => {
        const sets = Array.isArray(ex.sets)
            ? ex.sets.map((s) => {
                const hasWeight = s?.weight !== null && s?.weight !== undefined;
                return {
                    weight: s?.weight ?? null,
                    reps: s?.reps ?? null,
                    note: s?.note ?? null,
                    completed: hasWeight ? true : null,
                } as GymSet;
            })
            : [];
        const filled = sets.filter((s) => s.completed).length;
        const completed = sets.length > 0 && filled === sets.length ? true : null;
        return {
            name: ex.name ?? "",
            muscleGroup: ex.muscleGroup ?? null,
            note: ex.note ?? null,
            completed,
            sets,
        };
    }),
});

const gymCollections = staticData.firebaseConst.collections.gym;
type ViewTab = "plans" | "edit" | "session" | "logs";

export default function GymPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [activeView, setActiveView] = useState<ViewTab>("plans");

    const [plans, setPlans] = useState<GymPlan[]>([]);
    const [planDrafts, setPlanDrafts] = useState<Record<string, GymPlan>>({});
    const [planDirty, setPlanDirty] = useState<Record<string, boolean>>({});
    const [plansLoading, setPlansLoading] = useState(false);
    const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
    const [newPlanTitle, setNewPlanTitle] = useState("");
    const [newDayTitle, setNewDayTitle] = useState("");

    const [sessionIssuedAt, setSessionIssuedAt] = useState<number | null>(null);
    const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
    const [nowTs, setNowTs] = useState<number>(() => Date.now());

    const [viewPlanId, setViewPlanId] = useState<string>("");
    const [viewDayId, setViewDayId] = useState<string>("");
    const [editPlanId, setEditPlanId] = useState<string>("");
    const [editDayId, setEditDayId] = useState<string>("");

    const [logPlanId, setLogPlanId] = useState<string>("");
    const [logDayId, setLogDayId] = useState<string>("");
    const [logDraft, setLogDraft] = useState<Omit<GymLogEntry, "id" | "createdAt"> | null>(null);
    const [logSubmitting, setLogSubmitting] = useState(false);
    const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null);
    const [dragOverExerciseId, setDragOverExerciseId] = useState<string | null>(null);

    const [logsFeed, setLogsFeed] = useState<GymLogEntry[]>([]);
    const [logsFeedLoading, setLogsFeedLoading] = useState(false);
    const [logFilterFrom, setLogFilterFrom] = useState(lastMonthISO());
    const [logFilterTo, setLogFilterTo] = useState(todayISO());
    const [logFilterPlanId, setLogFilterPlanId] = useState<string>("");
    const [logFilterDayId, setLogFilterDayId] = useState<string>("");

    const refreshSessionTimes = async (u: User | null) => {
        if (!u) {
            setSessionIssuedAt(null);
            setSessionExpiresAt(null);
            return;
        }
        try {
            const token = await u.getIdTokenResult();
            const issued = Date.parse(token.issuedAtTime);
            const expires = Date.parse(token.expirationTime);
            setSessionIssuedAt(Number.isFinite(issued) ? issued : null);
            setSessionExpiresAt(Number.isFinite(expires) ? expires : null);
        } catch (err) {
            console.error("Failed to fetch session token info", err);
            setSessionIssuedAt(null);
            setSessionExpiresAt(null);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthLoading(false);
            refreshSessionTimes(u);
            if (!u) {
                setPlans([]);
                setPlanDrafts({});
                setViewPlanId("");
                setEditPlanId("");
                setLogPlanId("");
                setViewDayId("");
                setEditDayId("");
                setLogDayId("");
                setLogDraft(null);
                setLogsFeed([]);
                setSessionIssuedAt(null);
                setSessionExpiresAt(null);
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (user) refreshSessionTimes(user);
    }, [user]);

    useEffect(() => {
        const id = setInterval(() => setNowTs(Date.now()), 60000);
        return () => clearInterval(id);
    }, []);

    const loadPlans = async (preferredPlanId?: string) => {
        if (!user) {
            setPlans([]);
            setPlanDrafts({});
            setViewPlanId("");
            setEditPlanId("");
            setLogPlanId("");
            setViewDayId("");
            setEditDayId("");
            setLogDayId("");
            setLogDraft(null);
            return;
        }
        setPlansLoading(true);
        try {
            const snap = await getDocs(query(collection(db, gymCollections.plans), where("userId", "==", user?.uid ?? "")));
            const items = snap.docs.map((d) => planFromFirestore(d.id, d.data()));
            items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.title.localeCompare(b.title));
            setPlans(items);
            const drafts: Record<string, GymPlan> = {};
            items.forEach((p) => (drafts[p.id] = { ...p, days: [...(p.days ?? [])] }));
            setPlanDrafts(drafts);
            const dirty: Record<string, boolean> = {};
            items.forEach((p) => (dirty[p.id] = false));
            setPlanDirty(dirty);

            const resolvePlanId = (current: string, preferred?: string) => {
                if (current && items.some((i) => i.id === current)) return current;
                if (preferred && items.some((i) => i.id === preferred)) return preferred;
                return items[0]?.id ?? "";
            };

            const resolveDayId = (current: string, planId: string) => {
                const plan = items.find((p) => p.id === planId);
                if (!plan) return "";
                if (current && plan.days.some((d) => d.id === current)) return current;
                return plan.days[0]?.id ?? "";
            };

            const nextViewPlanId = resolvePlanId(viewPlanId, preferredPlanId);
            const nextEditPlanId = resolvePlanId(editPlanId, preferredPlanId);
            const nextLogPlanId = resolvePlanId(logPlanId, preferredPlanId);

            const nextViewDayId = resolveDayId(viewDayId, nextViewPlanId);
            const nextEditDayId = resolveDayId(editDayId, nextEditPlanId);
            const nextLogDayId = resolveDayId(logDayId, nextLogPlanId);

            setViewPlanId(nextViewPlanId);
            setEditPlanId(nextEditPlanId);
            setLogPlanId(nextLogPlanId);
            setViewDayId(nextViewDayId);
            setEditDayId(nextEditDayId);
            setLogDayId(nextLogDayId);

            if (!items.length) {
                setLogDraft(null);
            }
        } finally {
            setPlansLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadPlans();
        }
    }, [user]);

    useEffect(() => {
        if (logPlanId && logDayId && user) {
            const plan = plans.find((p) => p.id === logPlanId);
            const day = plan?.days.find((d) => d.id === logDayId);
            if (plan && day) {
                setLogDraft(makeLogDraft(plan, day));
                return;
            }
        }
        setLogDraft(null);
    }, [logPlanId, logDayId, plans, user]);

    useEffect(() => {
        const plan = plans.find((p) => p.id === viewPlanId);
        if (!plan) {
            setViewDayId("");
            return;
        }
        if (!plan.days.some((d) => d.id === viewDayId)) {
            setViewDayId(plan.days[0]?.id ?? "");
        }
    }, [viewPlanId, plans, viewDayId]);

    useEffect(() => {
        const plan = planDrafts[editPlanId] ?? plans.find((p) => p.id === editPlanId);
        if (!plan) {
            setEditDayId("");
            return;
        }
        if (!plan.days.some((d) => d.id === editDayId)) {
            setEditDayId(plan.days[0]?.id ?? "");
        }
    }, [editPlanId, plans, planDrafts, editDayId]);

    useEffect(() => {
        const plan = plans.find((p) => p.id === logPlanId);
        if (!plan) {
            setLogDayId("");
            return;
        }
        if (!plan.days.some((d) => d.id === logDayId)) {
            setLogDayId(plan.days[0]?.id ?? "");
        }
    }, [logPlanId, plans, logDayId]);

    useEffect(() => {
        const plan = plans.find((p) => p.id === logFilterPlanId);
        if (!plan) {
            setLogFilterDayId("");
            return;
        }
        if (!plan.days.some((d) => d.id === logFilterDayId)) {
            setLogFilterDayId("");
        }
    }, [logFilterPlanId, plans, logFilterDayId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (err: any) {
            setAuthError(err?.message ?? "Login failed");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const updatePlanDraft = (planId: string, updater: (draft: GymPlan) => GymPlan) => {
        setPlanDrafts((prev) => {
            const base = prev[planId] ?? plans.find((p) => p.id === planId);
            if (!base) return prev;
            const cloned: GymPlan = { ...base, days: [...(base.days ?? [])] };
            const nextDraft = updater(cloned);
            setPlanDirty((d) => ({ ...d, [planId]: true }));
            return { ...prev, [planId]: nextDraft };
        });
    };

    const updateDayDraft = (planId: string, dayId: string, updater: (day: GymPlanDay) => GymPlanDay) => {
        updatePlanDraft(planId, (draft) => {
            const next = { ...draft, days: [...(draft.days ?? [])] };
            const idx = next.days.findIndex((d) => d.id === dayId);
            if (idx === -1) return next;
            next.days[idx] = updater({ ...next.days[idx], exercises: [...(next.days[idx].exercises ?? [])] });
            return next;
        });
    };

    const reorderExercises = (planId: string, dayId: string, sourceId: string, targetId: string) => {
        if (!sourceId || !targetId || sourceId === targetId) return;
        updateDayDraft(planId, dayId, (day) => {
            const exercises = [...(day.exercises ?? [])];
            const fromIdx = exercises.findIndex((ex) => ex.id === sourceId);
            const toIdx = exercises.findIndex((ex) => ex.id === targetId);
            if (fromIdx === -1 || toIdx === -1) return day;
            const [moved] = exercises.splice(fromIdx, 1);
            exercises.splice(toIdx, 0, moved);
            return { ...day, exercises };
        });
    };

    const handleAddPlan = async () => {
        if (!user || !newPlanTitle.trim()) return;
        const now = Date.now();
        const payload: GymPlan = {
            id: "temp",
            title: newPlanTitle.trim(),
            note: "",
            userId: user?.uid ?? null,
            createdAt: now,
            updatedAt: now,
            days: [],
        };
        const docRef = await addDoc(collection(db, gymCollections.plans), planToFirestore(payload));
        setNewPlanTitle("");
        loadPlans(docRef.id);
    };

    const handleSavePlan = async (planId: string) => {
        const draft = planDrafts[planId];
        if (!draft) return;
        setSavingPlanId(planId);
        try {
            const now = Date.now();
            const cleaned: GymPlan = {
                ...draft,
                userId: user?.uid ?? null,
                createdAt: draft.createdAt ?? now,
                updatedAt: now,
                days: (draft.days ?? []).map((day) => ({
                    ...day,
                    exercises: (day.exercises ?? []).filter(Boolean).map((ex) => ({
                        ...ex,
                        sets: Array.isArray(ex.sets)
                            ? ex.sets.map((s) => ({
                                weight: s?.weight ?? null,
                                reps: s?.reps ?? null,
                                note: s?.note ?? null,
                                completed: s?.completed ?? null,
                            }))
                            : [],
                    })),
                })),
            };
            await setDoc(doc(db, gymCollections.plans, planId), planToFirestore(cleaned), { merge: true });
            setPlanDirty((d) => ({ ...d, [planId]: false }));
            await loadPlans(planId);
        } finally {
            setSavingPlanId(null);
        }
    };

    const handleDeletePlan = async (planId: string) => {
        const planTitle = planDrafts[planId]?.title || plans.find((p) => p.id === planId)?.title || "this plan";
        const confirmed = typeof window === "undefined" ? true : window.confirm(`Delete plan "${planTitle}"? This cannot be undone.`);
        if (!confirmed) return;

        await deleteDoc(doc(db, gymCollections.plans, planId));
        if (logPlanId === planId) {
            setLogPlanId("");
            setLogDayId("");
            setLogDraft(null);
        }
        if (viewPlanId === planId) {
            setViewPlanId("");
            setViewDayId("");
        }
        if (editPlanId === planId) {
            setEditPlanId("");
            setEditDayId("");
        }
        setPlanDirty((d) => {
            const next = { ...d };
            delete next[planId];
            return next;
        });
        loadPlans();
    };

    const handleAddDayToPlan = (planId: string) => {
        if (!planId || !newDayTitle.trim()) return;
        const day: GymPlanDay = {
            id: generateId(),
            title: newDayTitle.trim(),
            note: "",
            order: Date.now(),
            exercises: [],
        };
        updatePlanDraft(planId, (draft) => ({ ...draft, days: [...(draft.days ?? []), day] }));
        setNewDayTitle("");
        setEditDayId(day.id);
    };

    const handleDeleteDayFromPlan = (planId: string, dayId: string) => {
        updatePlanDraft(planId, (draft) => ({ ...draft, days: (draft.days ?? []).filter((d) => d.id !== dayId) }));
        if (viewDayId === dayId) setViewDayId("");
        if (editDayId === dayId) setEditDayId("");
        if (logDayId === dayId) setLogDayId("");
    };

    const makeLogDraft = (plan: GymPlan, day: GymPlanDay): Omit<GymLogEntry, "id" | "createdAt"> => ({
        planId: plan.id,
        planTitle: plan.title,
        dayId: day.id,
        dayTitle: day.title,
        date: todayISO(),
        userId: user?.uid ?? null,
        exercises: (day.exercises ?? []).map((ex) => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            note: "",
            completed: null,
            sets: ensureSetCount(ex.sets?.length && ex.sets.length > 0 ? ex.sets.length : 3, ex.sets || []).map(() => ({ weight: null, reps: null, note: null } as GymSet)),
        })),
        note: "",
        startedAt: undefined,
        completedAt: undefined,
        status: undefined,
    });

    const updateLogDraft = (updater: (draft: Omit<GymLogEntry, "id" | "createdAt">) => Omit<GymLogEntry, "id" | "createdAt">) => {
        setLogDraft((prev) => (prev ? updater(prev) : prev));
    };

    const handleSubmitLog = async () => {
        if (!user || !logDraft) return;
        setLogSubmitting(true);
        try {
            const now = Date.now();
            const payload = sanitizeLogForWrite({
                ...logDraft,
                userId: user?.uid ?? null,
                createdAt: now,
                startedAt: logDraft.startedAt ?? now,
                completedAt: logDraft.completedAt ?? now,
                status: logDraft.status ?? "completed",
            } as any);
            await addDoc(collection(db, gymCollections.logs), logEntryToFirestore(payload as any));
            await loadLogsFeed();
        } finally {
            setLogSubmitting(false);
        }
    };

    const loadLogsFeed = async () => {
        if (!user) return;
        setLogsFeedLoading(true);
        try {
            const fromTs = new Date(logFilterFrom).getTime();
            const toTs = new Date(logFilterTo).getTime() + 24 * 60 * 60 * 1000 - 1;
            const constraints: any[] = [
                where("userId", "==", user.uid),
                where("createdAt", ">=", fromTs),
                where("createdAt", "<=", toTs),
                orderBy("createdAt", "desc"),
            ];
            if (logFilterPlanId) {
                constraints.push(where("planId", "==", logFilterPlanId));
            }
            if (logFilterDayId) {
                constraints.push(where("dayId", "==", logFilterDayId));
            }
            const q = query(collection(db, gymCollections.logs), ...constraints);
            const snap = await getDocs(q);
            setLogsFeed(snap.docs.map((d) => logEntryFromFirestore(d.id, d.data())));
        } finally {
            setLogsFeedLoading(false);
        }
    };

    useEffect(() => {
        if (user && activeView === "logs") {
            loadLogsFeed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeView]);

    useEffect(() => {
        if (user && activeView === "logs") {
            loadLogsFeed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logFilterFrom, logFilterTo, logFilterPlanId, logFilterDayId]);

    const viewPlan = useMemo(() => plans.find((p) => p.id === viewPlanId), [plans, viewPlanId]);
    const editPlan = useMemo(() => plans.find((p) => p.id === editPlanId), [plans, editPlanId]);
    const editDraft = editPlan ? planDrafts[editPlan.id] ?? editPlan : null;
    const editDay = useMemo(() => editDraft?.days.find((d) => d.id === editDayId), [editDraft, editDayId]);
    const selectedLogPlan = useMemo(() => plans.find((p) => p.id === logPlanId), [plans, logPlanId]);
    const canEditExercises = !!logDraft?.startedAt;

    return (
        <div className="min-h-screen bg-[#0b1222] text-white">
            <div className="mx-auto max-w-screen-xl px-0 py-10">
                <div className="px-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <Basic
                            text="Gym Plan Manager"
                            fontSize="text-3xl sm:text-4xl"
                            fontFamily="font-Nunito"
                            fontWeight="font-bold"
                            textColor="text-[#BFACDF]"
                        />
                        {user && (
                            <button onClick={handleLogout} className="text-sm text-slate-300 hover:text-white underline whitespace-nowrap">
                                Sign out
                            </button>
                        )}
                    </div>
                    {user && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-xs sm:text-sm text-slate-200">
                            <span className="font-semibold text-white break-all">Hello {user.email}</span>
                            <span className="text-[11px] sm:text-xs text-slate-400">
                                Logged in Session: {formatTime(sessionIssuedAt)} • Renews in {formatRemaining(sessionExpiresAt ? sessionExpiresAt - nowTs : null)}
                            </span>
                        </div>
                    )}
                </div>

                {!user && (
                    <Card heading={<Basic text="Sign in" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-300">Email</label>
                                    <input
                                        className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-300">Password</label>
                                    <input
                                        className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        required
                                    />
                                </div>
                            </div>
                            {authError && <p className="text-sm text-red-400">{authError}</p>}
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400"
                            >
                                {authLoading ? "Loading..." : "Sign in"}
                            </button>
                        </form>
                    </Card>
                )}

                {user && (
                    <div className="mt-6 space-y-8">
                        <div className="flex flex-wrap gap-3 px-4">
                            {[{ id: "plans", label: "Plans" }, { id: "edit", label: "Edit Plans" }, { id: "session", label: "Log Session" }, { id: "logs", label: "Logs" }].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id as ViewTab)}
                                    className={`rounded-full px-4 py-2 text-sm font-semibold border ${activeView === tab.id ? "border-teal-400 bg-teal-500/20 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeView === "plans" && (
                            <Card heading={<Basic text="Plans" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm text-slate-300">Select plan</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={viewPlanId}
                                                onChange={(e) => setViewPlanId(e.target.value)}
                                            >
                                                <option value="">Select plan</option>
                                                {plans.map((p) => (
                                                    <option key={`view-${p.id}`} value={p.id}>
                                                        {p.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (viewPlanId) {
                                                    setEditPlanId(viewPlanId);
                                                    setActiveView("edit");
                                                }
                                            }}
                                            disabled={!viewPlanId}
                                            className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold ${viewPlanId ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-slate-800 text-slate-500"}`}
                                        >
                                            Edit this plan
                                        </button>
                                    </div>

                                    {plansLoading && <LinePulse />}

                                    {!plansLoading && plans.length === 0 && (
                                        <p className="text-sm text-slate-400">No plans yet. Create one from the Edit Plans tab.</p>
                                    )}

                                    {viewPlan && (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-xl font-semibold text-teal-200">{viewPlan.title}</div>
                                                    <div className="text-xs text-slate-400">Created: {formatTime(viewPlan.createdAt)} • Updated: {formatTime(viewPlan.updatedAt)}</div>
                                                </div>
                                                {viewPlan.note && <div className="text-sm text-slate-300">{viewPlan.note}</div>}
                                            </div>

                                            <div className="space-y-4">
                                                {viewPlan.days.length === 0 && <div className="text-sm text-slate-400">No days in this plan yet.</div>}

                                                {viewPlan.days.map((day) => (
                                                    <div key={day.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="text-teal-200 font-semibold">{day.title}</div>
                                                            <span className="text-xs text-slate-400">Exercises: {day.exercises.length}</span>
                                                        </div>
                                                        {day.note && <div className="text-sm text-slate-300">{day.note}</div>}

                                                        {day.exercises.length === 0 && <div className="text-xs text-slate-500">No exercises yet.</div>}
                                                        {day.exercises.map((ex) => (
                                                            <div key={ex.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="text-teal-200 font-semibold">{ex.name || "Exercise"}</div>
                                                                        {ex.muscleGroup && <div className="text-xs text-slate-400">{ex.muscleGroup}</div>}
                                                                    </div>
                                                                    <span className="text-xs text-slate-400">Sets: {ex.sets?.length ?? 0}</span>
                                                                </div>
                                                                {!ex.sets?.length && <div className="text-xs text-slate-500">No sets configured yet.</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeView === "edit" && (
                            <div className="space-y-4">
                                <Card heading={<Basic text="Edit Plans" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm text-slate-300">New Plan Name</label>
                                                <div className="flex flex-row items-stretch gap-2">
                                                    <input
                                                        className="flex-1 min-w-0 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                        placeholder="New Plan"
                                                        value={newPlanTitle}
                                                        onChange={(e) => setNewPlanTitle(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleAddPlan}
                                                        className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400 whitespace-nowrap"
                                                    >
                                                        Add plan
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 w-full">
                                                <label className="text-sm text-slate-300">Select plan to edit</label>
                                                <select
                                                    className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                    value={editPlanId}
                                                    onChange={(e) => setEditPlanId(e.target.value)}
                                                >
                                                    <option value="">Choose a plan</option>
                                                    {plans.map((p) => (
                                                        <option key={`edit-${p.id}`} value={p.id}>
                                                            {p.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {plansLoading && <LinePulse />}

                                        {!plansLoading && !editPlan && <p className="text-sm text-slate-400">Select a plan to start editing.</p>}

                                        {!plansLoading && editPlan && editDraft && (
                                            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
                                                <div className="flex flex-wrap items-center gap-3 justify-between">
                                                    <div className="flex flex-col gap-2 w-full sm:flex-1">
                                                        <label className="text-xs text-slate-400">Plan title</label>
                                                        <input
                                                            className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                            value={editDraft.title}
                                                            onChange={(e) => updatePlanDraft(editPlan.id, (d) => ({ ...d, title: e.target.value }))}
                                                        />
                                                        <div className="text-[11px] text-slate-500">Created: {formatTime(editDraft.createdAt)} • Updated: {formatTime(editDraft.updatedAt)}</div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {planDirty[editPlan.id] && (
                                                            <span className="text-[11px] text-amber-300">Unsaved changes — press Save</span>
                                                        )}
                                                        <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSavePlan(editPlan.id)}
                                                            className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400"
                                                            disabled={savingPlanId === editPlan.id}
                                                        >
                                                            {savingPlanId === editPlan.id ? "Saving..." : "Save"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePlan(editPlan.id)}
                                                            className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                                                        >
                                                            Delete
                                                        </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs text-slate-400">Plan notes</label>
                                                    <textarea
                                                        className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                        rows={2}
                                                        value={editDraft.note ?? ""}
                                                        onChange={(e) => updatePlanDraft(editPlan.id, (d) => ({ ...d, note: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card heading={<Basic text="Days & Exercises" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                    <div className="space-y-6">
                                        {plansLoading && <LinePulse />}

                                        {!plansLoading && !editPlan && <p className="text-sm text-slate-400">Select a plan to manage its days.</p>}

                                        {!plansLoading && editPlan && editDraft && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-end">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-xs text-slate-400">New Day Title</label>
                                                        <div className="flex flex-row items-stretch gap-2">
                                                            <input
                                                                className="flex-1 min-w-0 rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                                placeholder="New Day"
                                                                value={newDayTitle}
                                                                onChange={(e) => setNewDayTitle(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleAddDayToPlan(editPlan.id)}
                                                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400 whitespace-nowrap"
                                                            >
                                                                Add day
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-xs text-slate-400">Current day</label>
                                                        <select
                                                            className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                            value={editDayId}
                                                            onChange={(e) => setEditDayId(e.target.value)}
                                                        >
                                                            <option value="">Choose a day</option>
                                                            {editDraft.days.map((d) => (
                                                                <option key={`edit-day-switch-${d.id}`} value={d.id}>
                                                                    {d.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {editDay && (
                                                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
                                                        <div className="flex flex-wrap items-center gap-3 justify-between">
                                                            <div className="flex flex-col gap-2 w-full sm:flex-1">
                                                                <label className="text-xs text-slate-400">Day title</label>
                                                                <input
                                                                    className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                                    value={editDay.title}
                                                                    onChange={(e) => updateDayDraft(editPlan.id, editDay.id, (d) => ({ ...d, title: e.target.value }))}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteDayFromPlan(editPlan.id, editDay.id)}
                                                                className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                                                            >
                                                                Delete day
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-2">
                                                            <label className="text-xs text-slate-400">Day notes</label>
                                                            <textarea
                                                                className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                                rows={2}
                                                                value={editDay.note ?? ""}
                                                                onChange={(e) => updateDayDraft(editPlan.id, editDay.id, (d) => ({ ...d, note: e.target.value }))}
                                                            />
                                                        </div>

                                                        <div className="my-4 h-px w-full bg-slate-800" />

                                                        {planDirty[editPlan.id] && (
                                                            <div className="text-[11px] text-amber-300">Unsaved changes — press Save</div>
                                                        )}

                                                        <div className="mt-2 overflow-x-auto sm:overflow-visible">
                                                            <table className="min-w-[640px] w-full text-sm border-collapse">
                                                                <thead>
                                                                    <tr className="text-left text-slate-300">
                                                                        <th className="py-2 w-12 text-center">Move</th>
                                                                        <th className="py-2">Exercise</th>
                                                                        <th className="py-2">Muscle</th>
                                                                        <th className="py-2">Sets</th>
                                                                        <th className="py-2 text-center">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {editDay.exercises.map((ex, exIdx) => (
                                                                        <tr
                                                                            key={ex.id}
                                                                            onDragEnter={(e) => {
                                                                                e.preventDefault();
                                                                                if (!draggingExerciseId || draggingExerciseId === ex.id) return;
                                                                                setDragOverExerciseId(ex.id);
                                                                            }}
                                                                            onDragOver={(e) => {
                                                                                e.preventDefault();
                                                                                if (!draggingExerciseId || draggingExerciseId === ex.id) return;
                                                                            }}
                                                                            onDragLeave={() => {
                                                                                if (dragOverExerciseId === ex.id) setDragOverExerciseId(null);
                                                                            }}
                                                                            onDrop={(e) => {
                                                                                e.preventDefault();
                                                                                const source = draggingExerciseId || e.dataTransfer.getData("text/plain");
                                                                                reorderExercises(editPlan.id, editDay.id, source, ex.id);
                                                                                setDragOverExerciseId(null);
                                                                                setDraggingExerciseId(null);
                                                                            }}
                                                                            className={`border-t border-slate-800 transition-all duration-150 ease-out ${draggingExerciseId === ex.id ? "bg-slate-900/60 shadow-inner scale-[0.995]" : dragOverExerciseId === ex.id ? "bg-slate-900/50 ring-1 ring-teal-500/40" : ""}`}
                                                                        >
                                                                            <td className="py-2 text-center align-middle">
                                                                                <button
                                                                                    draggable
                                                                                    onDragStart={(e) => {
                                                                                        setDraggingExerciseId(ex.id);
                                                                                        setDragOverExerciseId(null);
                                                                                        e.dataTransfer.effectAllowed = "move";
                                                                                        e.dataTransfer.setData("text/plain", ex.id);
                                                                                    }}
                                                                                    onDragEnd={() => {
                                                                                        setDragOverExerciseId(null);
                                                                                        setDraggingExerciseId(null);
                                                                                    }}
                                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-white cursor-grab"
                                                                                    aria-label="Drag to reorder"
                                                                                    title="Drag to reorder"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                                                        <path d="M10 4h4" />
                                                                                        <path d="M10 9h4" />
                                                                                        <path d="M10 14h4" />
                                                                                        <path d="M10 19h4" />
                                                                                    </svg>
                                                                                </button>
                                                                            </td>
                                                                            <td className="py-2 pr-0.5 sm:pr-2 min-w-[220px]">
                                                                                <input
                                                                                    className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                                                                    value={ex.name}
                                                                                    onChange={(e) => updateDayDraft(editPlan.id, editDay.id, (d) => {
                                                                                        const next = { ...d };
                                                                                        const exercises = [...(next.exercises ?? [])];
                                                                                        exercises[exIdx] = { ...exercises[exIdx], name: e.target.value };
                                                                                        next.exercises = exercises;
                                                                                        return next;
                                                                                    })}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 pr-0.5 min-w-[140px]">
                                                                                <input
                                                                                    className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                                                                    value={ex.muscleGroup ?? ""}
                                                                                    onChange={(e) => updateDayDraft(editPlan.id, editDay.id, (d) => {
                                                                                        const next = { ...d };
                                                                                        const exercises = [...(next.exercises ?? [])];
                                                                                        exercises[exIdx] = { ...exercises[exIdx], muscleGroup: e.target.value };
                                                                                        next.exercises = exercises;
                                                                                        return next;
                                                                                    })}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 pr-0.5 w-16">
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                                                                    value={ex.sets?.length ?? 0}
                                                                                    onChange={(e) => updateDayDraft(editPlan.id, editDay.id, (d) => {
                                                                                        const count = Number(e.target.value) || 0;
                                                                                        const next = { ...d };
                                                                                        const exercises = [...(next.exercises ?? [])];
                                                                                        exercises[exIdx] = { ...exercises[exIdx], sets: ensureSetCount(count, exercises[exIdx].sets || []) };
                                                                                        next.exercises = exercises;
                                                                                        return next;
                                                                                    })}
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 text-center">
                                                                                <div className="flex items-center justify-center gap-2">
                                                                                    <button
                                                                                        onClick={() => updateDayDraft(editPlan.id, editDay.id, (d) => ({
                                                                                            ...d,
                                                                                            exercises: (d.exercises ?? []).filter((_, i) => i !== exIdx),
                                                                                        }))}
                                                                                        className="py-2 text-rose-400 hover:text-rose-300"
                                                                                        aria-label="Remove exercise"
                                                                                        title="Remove exercise"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                                                            <polyline points="3 6 5 6 21 6" />
                                                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                                                            <path d="M14 10v8" />
                                                                                            <path d="M10 10v8" />
                                                                                            <path d="M9 6l1-2h4l1 2" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => openExerciseSearch(ex.name, ex.muscleGroup)}
                                                                                        className="p-1 text-indigo-300 hover:text-indigo-100"
                                                                                        aria-label="Search exercise"
                                                                                        title="Search exercise"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                                                            <circle cx="11" cy="11" r="7" />
                                                                                            <line x1="16.65" y1="16.65" x2="21" y2="21" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>

                                                            <button
                                                                onClick={() => updateDayDraft(editPlan.id, editDay.id, (d) => ({
                                                                    ...d,
                                                                    exercises: [...(d.exercises ?? []), { id: generateId(), name: "", muscleGroup: "", sets: ensureSetCount(3, []) } as GymExercise],
                                                                }))}
                                                                className="mt-3 text-sm text-indigo-300 hover:text-indigo-200"
                                                            >
                                                                + Add exercise
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeView === "session" && (
                            <Card heading={<Basic text="Log Session" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Plan</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logPlanId}
                                                onChange={(e) => setLogPlanId(e.target.value)}
                                            >
                                                <option value="">Select plan</option>
                                                {plans.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Day</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logDayId}
                                                onChange={(e) => setLogDayId(e.target.value)}
                                                disabled={!selectedLogPlan?.days.length}
                                            >
                                                <option value="">Select day</option>
                                                {selectedLogPlan?.days.map((d) => (
                                                    <option key={`log-day-${d.id}`} value={d.id}>
                                                        {d.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Date</label>
                                            <input
                                                type="date"
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logDraft?.date ?? todayISO()}
                                                onChange={(e) => updateLogDraft((d) => ({ ...d, date: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {selectedLogPlan && logDayId && logDraft ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                                                <button
                                                    onClick={() => updateLogDraft((d) => ({ ...d, startedAt: d.startedAt ?? Date.now(), status: "running" }))}
                                                    className="rounded-lg bg-indigo-500 px-3 py-2 font-semibold text-white hover:bg-indigo-400"
                                                >
                                                    Start session
                                                </button>
                                                <button
                                                    onClick={() => updateLogDraft((d) => ({ ...d, completedAt: Date.now(), status: "completed" }))}
                                                    className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500"
                                                    disabled={!logDraft.startedAt}
                                                >
                                                    Complete session
                                                </button>
                                                <span className="text-xs text-slate-400">Status: {logDraft.status ?? "not started"}</span>
                                                <span className="text-xs text-slate-400">Started: {formatTime(logDraft.startedAt)}</span>
                                                <span className="text-xs text-slate-400">Finished: {formatTime(logDraft.completedAt)}</span>
                                            </div>

                                            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 hidden sm:block">
                                                <table className="w-full text-sm border-collapse">
                                                    <thead className="text-slate-300">
                                                        <tr>
                                                            <th className="py-2 text-left">Exercise</th>
                                                            <th className="py-2">Sets #</th>
                                                            <th className="py-2 text-left">Weights per set</th>
                                                            <th className="py-2 text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {logDraft.exercises.map((ex, exIdx) => {
                                                            const status = getExerciseStatus(ex.sets);
                                                            return (
                                                                <tr key={`${ex.name}-${exIdx}`} className="border-t border-slate-800">
                                                                    <td className="py-3 pr-3 align-top">
                                                                        <div className="flex items-start gap-2">
                                                                            <div className="flex-1">
                                                                                <div className="text-teal-200 font-semibold">{ex.name || "Exercise"}</div>
                                                                                {ex.muscleGroup && <div className="text-xs text-slate-400">{ex.muscleGroup}</div>}
                                                                            </div>
                                                                            <button
                                                                                onClick={() => openExerciseSearch(ex.name, ex.muscleGroup)}
                                                                                className="p-2 text-indigo-300 hover:text-indigo-100"
                                                                                aria-label="Search exercise"
                                                                                title="Search exercise"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                                                    <circle cx="11" cy="11" r="7" />
                                                                                    <line x1="16.65" y1="16.65" x2="21" y2="21" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-2 align-top w-28 text-center">
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                                            value={ex.sets.length}
                                                                            disabled={!canEditExercises}
                                                                            onChange={(e) => updateLogDraft((d) => {
                                                                                const count = Number(e.target.value) || 0;
                                                                                const next = { ...d };
                                                                                const sets = ensureSetCount(count, next.exercises[exIdx].sets);
                                                                                next.exercises = [...next.exercises];
                                                                                next.exercises[exIdx] = { ...next.exercises[exIdx], sets };
                                                                                return next;
                                                                            })}
                                                                        />
                                                                    </td>
                                                                    <td className="py-3 px-2 align-top">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                            {ex.sets.map((set, setIdx) => (
                                                                                <div key={setIdx} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 space-y-2">
                                                                                    <p className="text-xs text-slate-400">Set {setIdx + 1}</p>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="0.5"
                                                                                        className="w-full rounded bg-slate-950/70 border border-slate-800 px-2 py-1 text-sm focus:outline-none focus:border-teal-400"
                                                                                        placeholder="Weight"
                                                                                        value={set.weight ?? ""}
                                                                                        disabled={!canEditExercises}
                                                                                        onChange={(e) => updateLogDraft((d) => {
                                                                                            const next = { ...d };
                                                                                            const sets = [...next.exercises[exIdx].sets];
                                                                                            sets[setIdx] = { ...sets[setIdx], weight: e.target.value === "" ? null : Number(e.target.value) };
                                                                                            next.exercises = [...next.exercises];
                                                                                            next.exercises[exIdx] = { ...next.exercises[exIdx], sets };
                                                                                            return next;
                                                                                        })}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-2 align-top text-center">
                                                                        <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* Mobile cards */}
                                            <div className="space-y-3 sm:hidden">
                                                {logDraft.exercises.map((ex, exIdx) => {
                                                    const status = getExerciseStatus(ex.sets);
                                                    return (
                                                        <div key={`m-${exIdx}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
                                                            <div className="flex justify-between items-center gap-2">
                                                                <div className="flex items-start gap-2">
                                                                    <div>
                                                                        <div className="text-teal-200 font-semibold text-sm">{ex.name || "Exercise"}</div>
                                                                        {ex.muscleGroup && <div className="text-[11px] text-slate-400">{ex.muscleGroup}</div>}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => openExerciseSearch(ex.name, ex.muscleGroup)}
                                                                        className="p-1 text-indigo-300 hover:text-indigo-100"
                                                                        aria-label="Search exercise"
                                                                        title="Search exercise"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                                            <circle cx="11" cy="11" r="7" />
                                                                            <line x1="16.65" y1="16.65" x2="21" y2="21" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                <span className={`text-[11px] font-semibold ${status.color}`}>{status.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <span>Sets:</span>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    className="w-20 rounded-lg bg-slate-950/70 border border-slate-800 px-2 py-1 text-sm focus:outline-none focus:border-teal-400"
                                                                    value={ex.sets.length}
                                                                    disabled={!canEditExercises}
                                                                    onChange={(e) => updateLogDraft((d) => {
                                                                        const count = Number(e.target.value) || 0;
                                                                        const next = { ...d };
                                                                        const sets = ensureSetCount(count, next.exercises[exIdx].sets);
                                                                        next.exercises = [...next.exercises];
                                                                        next.exercises[exIdx] = { ...next.exercises[exIdx], sets };
                                                                        return next;
                                                                    })}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {ex.sets.map((set, setIdx) => (
                                                                    <div key={setIdx} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1">
                                                                        <span className="text-[11px] text-slate-400">{setIdx + 1}</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.5"
                                                                            className="w-16 rounded bg-slate-950/70 border border-slate-800 px-2 py-1 text-xs focus:outline-none focus:border-teal-400"
                                                                            placeholder="Wt"
                                                                            value={set.weight ?? ""}
                                                                            disabled={!canEditExercises}
                                                                            onChange={(e) => updateLogDraft((d) => {
                                                                                const next = { ...d };
                                                                                const sets = [...next.exercises[exIdx].sets];
                                                                                sets[setIdx] = { ...sets[setIdx], weight: e.target.value === "" ? null : Number(e.target.value) };
                                                                                next.exercises = [...next.exercises];
                                                                                next.exercises[exIdx] = { ...next.exercises[exIdx], sets };
                                                                                return next;
                                                                            })}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs text-slate-400">Session notes</label>
                                                <textarea
                                                    className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                    rows={3}
                                                    value={logDraft.note ?? ""}
                                                    onChange={(e) => updateLogDraft((d) => ({ ...d, note: e.target.value }))}
                                                />
                                            </div>

                                            <button
                                                onClick={handleSubmitLog}
                                                className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400"
                                                disabled={!canEditExercises || logSubmitting}
                                            >
                                                {logSubmitting ? "Saving..." : "Save log"}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">Select a plan and day to start logging.</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeView === "logs" && (
                            <Card heading={<Basic text="Logs" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Plan (optional)</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logFilterPlanId}
                                                onChange={(e) => setLogFilterPlanId(e.target.value)}
                                            >
                                                <option value="">All plans</option>
                                                {plans.map((p) => (
                                                    <option key={`filter-${p.id}`} value={p.id}>{p.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Day (optional)</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logFilterDayId}
                                                onChange={(e) => setLogFilterDayId(e.target.value)}
                                                disabled={!logFilterPlanId}
                                            >
                                                <option value="">All days</option>
                                                {plans.find((p) => p.id === logFilterPlanId)?.days.map((d) => (
                                                    <option key={`filter-day-${d.id}`} value={d.id}>{d.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">From</label>
                                            <input
                                                type="date"
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logFilterFrom}
                                                onChange={(e) => setLogFilterFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">To</label>
                                            <input
                                                type="date"
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logFilterTo}
                                                onChange={(e) => setLogFilterTo(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={loadLogsFeed}
                                            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400"
                                        >
                                            Refresh
                                        </button>
                                    </div>

                                    {logsFeedLoading && <LinePulse />}
                                    {!logsFeedLoading && logsFeed.length === 0 && (
                                        <p className="text-sm text-slate-400">No logs in this range.</p>
                                    )}

                                    <div className="space-y-4">
                                        {logsFeed.map((log) => (
                                            <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                                                <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-200">
                                                    <span className="font-semibold text-teal-200">{log.planTitle} • {log.dayTitle}</span>
                                                    <span>{log.date}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    <span>Started: {formatTime(log.startedAt)}</span>
                                                    <br />
                                                    <span>Finished: {formatTime(log.completedAt)}</span>
                                                    <br />
                                                    <span>Duration: {formatDuration(log.startedAt, log.completedAt)}</span>
                                                </div>
                                                {log.note && <p className="text-sm text-slate-200">Session note: {log.note}</p>}

                                                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50 hidden sm:block">
                                                    <table className="w-full text-sm border-collapse min-w-[640px]">
                                                        <thead className="text-slate-300">
                                                            <tr>
                                                                <th className="py-2 px-3 text-left">Exercise</th>
                                                                <th className="py-2 px-3">Sets #</th>
                                                                <th className="py-2 px-3 text-left">Weights per set</th>
                                                                <th className="py-2 px-3">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {log.exercises.map((ex, idx) => {
                                                                const status = getExerciseStatus(ex.sets);
                                                                return (
                                                                    <tr key={`${log.id}-${idx}`} className="border-t border-slate-800">
                                                                        <td className="py-2 px-3">
                                                                            <div className="text-teal-200 font-semibold">{ex.name}</div>
                                                                            {ex.muscleGroup && <div className="text-xs text-slate-400">{ex.muscleGroup}</div>}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center">{ex.sets.length}</td>
                                                                        <td className="py-2 px-3">
                                                                            <div className="flex flex-wrap gap-1 justify-start">
                                                                                {ex.sets.length === 0 && <span className="text-xs text-slate-500">-</span>}
                                                                                {ex.sets.map((s, i) => (
                                                                                    <span
                                                                                        key={`${log.id}-${idx}-set-${i}`}
                                                                                        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-100"
                                                                                    >
                                                                                        <span className="text-slate-400">#{i + 1}</span>
                                                                                        <span className="font-semibold">{s.weight ?? "-"}</span>
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center text-xs">
                                                                            <span className={`font-semibold ${status.color}`}>{status.label}</span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {/* Mobile cards */}
                                                <div className="space-y-3 sm:hidden">
                                                    {log.exercises.map((ex, idx) => {
                                                        const status = getExerciseStatus(ex.sets);
                                                        return (
                                                            <div key={`${log.id}-m-${idx}`} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                                                                <div className="flex justify-between text-sm text-teal-200 font-semibold">
                                                                    <span>{ex.name}</span>
                                                                    <span className={`text-[11px] font-semibold ${status.color}`}>{status.label}</span>
                                                                </div>
                                                                {ex.muscleGroup && <div className="text-[11px] text-slate-400">{ex.muscleGroup}</div>}
                                                                <div className="text-[11px] text-slate-300">Sets: {ex.sets.length}</div>
                                                                <div className="flex flex-wrap gap-1 text-[11px] text-slate-200">Weights:
                                                                    {ex.sets.length === 0 && <span className="ml-1 text-slate-500">-</span>}
                                                                    {ex.sets.map((s, i) => (
                                                                        <span
                                                                            key={`${log.id}-m-${idx}-set-${i}`}
                                                                            className="ml-1 inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1"
                                                                        >
                                                                            <span className="text-slate-400">#{i + 1}</span>
                                                                            <span className="font-semibold">{s.weight ?? "-"}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
