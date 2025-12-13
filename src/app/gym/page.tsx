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
    GymPlanDay,
    GymSet,
    logEntryFromFirestore,
    logEntryToFirestore,
    planDayFromFirestore,
    planDayToFirestore,
} from "../models/Gym";

const generateId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));

const todayISO = () => new Date().toISOString().slice(0, 10);
const lastMonthISO = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
};

const formatTime = (ts?: number | null) => (ts ? new Date(ts).toLocaleString() : "-");
const formatDuration = (start?: number | null, end?: number | null) => {
    if (!start || !end) return "-";
    const mins = Math.max(0, Math.round((end - start) / 60000));
    return `${mins} min`;
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

const sanitizeLogForWrite = (draft: Omit<GymLogEntry, "id" | "createdAt">) => ({
    ...draft,
    dayId: draft.dayId ?? "",
    dayTitle: draft.dayTitle ?? "",
    date: draft.date ?? todayISO(),
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
type ViewTab = "plan" | "session" | "logs";

export default function GymPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [activeView, setActiveView] = useState<ViewTab>("plan");

    const [plans, setPlans] = useState<GymPlanDay[]>([]);
    const [planDrafts, setPlanDrafts] = useState<Record<string, GymPlanDay>>({});
    const [plansLoading, setPlansLoading] = useState(false);
    const [savingDayId, setSavingDayId] = useState<string | null>(null);
    const [newDayTitle, setNewDayTitle] = useState("");

    const [logDayId, setLogDayId] = useState<string>("");
    const [logDraft, setLogDraft] = useState<Omit<GymLogEntry, "id" | "createdAt"> | null>(null);
    const [logSubmitting, setLogSubmitting] = useState(false);

    const [logsFeed, setLogsFeed] = useState<GymLogEntry[]>([]);
    const [logsFeedLoading, setLogsFeedLoading] = useState(false);
    const [logFilterFrom, setLogFilterFrom] = useState(lastMonthISO());
    const [logFilterTo, setLogFilterTo] = useState(todayISO());
    const [logFilterDayId, setLogFilterDayId] = useState<string>("");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthLoading(false);
            if (!u) {
                setPlans([]);
                setPlanDrafts({});
                setLogDayId("");
                setLogDraft(null);
                setLogsFeed([]);
            }
        });
        return () => unsub();
    }, []);

    const loadPlans = async () => {
        setPlansLoading(true);
        try {
            const snap = await getDocs(collection(db, gymCollections.plans));
            const items = snap.docs.map((d) => planDayFromFirestore(d.id, d.data()));
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));
            setPlans(items);
            const drafts: Record<string, GymPlanDay> = {};
            items.forEach((p) => (drafts[p.id] = { ...p }));
            setPlanDrafts(drafts);
            if (items.length && !logDayId) {
                setLogDayId(items[0].id);
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
        if (logDayId && user) {
            const plan = plans.find((p) => p.id === logDayId);
            if (plan) {
                setLogDraft(makeLogDraft(plan));
            }
        }
    }, [logDayId, plans, user]);

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

    const handleAddDay = async () => {
        if (!newDayTitle.trim()) return;
        const payload: GymPlanDay = {
            id: "temp",
            title: newDayTitle.trim(),
            note: "",
            order: Date.now(),
            exercises: [],
        };
        await addDoc(collection(db, gymCollections.plans), planDayToFirestore(payload));
        setNewDayTitle("");
        loadPlans();
    };

    const updateDraft = (dayId: string, updater: (draft: GymPlanDay) => GymPlanDay) => {
        setPlanDrafts((prev) => ({ ...prev, [dayId]: updater(prev[dayId] ?? plans.find((p) => p.id === dayId)!) }));
    };

    const handleSaveDay = async (dayId: string) => {
        const draft = planDrafts[dayId];
        if (!draft) return;
        setSavingDayId(dayId);
        try {
            const cleaned: GymPlanDay = {
                ...draft,
                exercises: (draft.exercises ?? []).filter(Boolean).map((ex) => ({
                    ...ex,
                    sets: Array.isArray(ex.sets) ? ex.sets.map((s) => ({
                        weight: s?.weight ?? null,
                        reps: s?.reps ?? null,
                        note: s?.note ?? null,
                        completed: s?.completed ?? null,
                    })) : [],
                })),
            };
            await setDoc(doc(db, gymCollections.plans, dayId), planDayToFirestore(cleaned), { merge: true });
            await loadPlans();
        } finally {
            setSavingDayId(null);
        }
    };

    const handleDeleteDay = async (dayId: string) => {
        await deleteDoc(doc(db, gymCollections.plans, dayId));
        if (logDayId === dayId) {
            setLogDayId("");
            setLogDraft(null);
        }
        loadPlans();
    };

    const makeLogDraft = (plan: GymPlanDay): Omit<GymLogEntry, "id" | "createdAt"> => ({
        dayId: plan.id,
        dayTitle: plan.title,
        date: todayISO(),
        exercises: plan.exercises.map((ex) => ({
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
        if (!logDraft) return;
        setLogSubmitting(true);
        try {
            const now = Date.now();
            const payload = sanitizeLogForWrite({
                ...logDraft,
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
                where("createdAt", ">=", fromTs),
                where("createdAt", "<=", toTs),
                orderBy("createdAt", "desc"),
            ];
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
    }, [logFilterFrom, logFilterTo, logFilterDayId]);

    const selectedPlan = useMemo(() => plans.find((p) => p.id === logDayId), [plans, logDayId]);
    const canEditExercises = !!logDraft?.startedAt;

    return (
        <div className="min-h-screen bg-[#0b1222] text-white">
            <div className="mx-auto max-w-screen-xl px-0 py-10">
                <div className="flex items-center justify-between flex-wrap gap-4 px-4">
                    <Basic
                        text="Gym Plan Manager"
                        fontSize="text-3xl sm:text-4xl"
                        fontFamily="font-Nunito"
                        fontWeight="font-bold"
                        textColor="text-[#BFACDF]"
                    />
                    {user && (
                        <button onClick={handleLogout} className="text-sm text-slate-300 hover:text-white underline">
                            Sign out
                        </button>
                    )}
                </div>

                {!user && (
                    <Card heading={<Basic text="Sign in" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            {[{ id: "plan", label: "Plan" }, { id: "session", label: "Log Session" }, { id: "logs", label: "Logs" }].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id as ViewTab)}
                                    className={`rounded-full px-4 py-2 text-sm font-semibold border ${activeView === tab.id ? "border-teal-400 bg-teal-500/20 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeView === "plan" && (
                            <Card heading={<Basic text="Plan" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-3 items-end">
                                        <div className="flex flex-col gap-2 w-full sm:w-64">
                                            <label className="text-sm text-slate-300">Add day</label>
                                            <input
                                                className="rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                placeholder="Day 1 - Push"
                                                value={newDayTitle}
                                                onChange={(e) => setNewDayTitle(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddDay}
                                            className="inline-flex h-10 items-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400"
                                        >
                                            Add day
                                        </button>
                                    </div>

                                    {plansLoading && <LinePulse />}

                                    {!plansLoading && plans.length === 0 && (
                                        <p className="text-sm text-slate-400">No plan yet. Add your first day.</p>
                                    )}

                                    <div className="space-y-6">
                                        {plans.map((plan) => {
                                            const draft = planDrafts[plan.id] ?? plan;
                                            return (
                                                <div key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
                                                    <div className="flex flex-wrap items-center gap-3 justify-between">
                                                        <div className="flex flex-col gap-2 w-full sm:flex-1">
                                                            <label className="text-xs text-slate-400">Day title</label>
                                                            <input
                                                                className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                                value={draft.title}
                                                                onChange={(e) => updateDraft(plan.id, (d) => ({ ...d, title: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveDay(plan.id)}
                                                                className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400"
                                                                disabled={savingDayId === plan.id}
                                                            >
                                                                {savingDayId === plan.id ? "Saving..." : "Save"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDay(plan.id)}
                                                                className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-1 gap-2">
                                                        <label className="text-xs text-slate-400">Notes</label>
                                                        <textarea
                                                            className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                            rows={2}
                                                            value={draft.note ?? ""}
                                                            onChange={(e) => updateDraft(plan.id, (d) => ({ ...d, note: e.target.value }))}
                                                        />
                                                    </div>

                                                    <div className="mt-4 overflow-x-auto sm:overflow-visible">
                                                        <table className="w-full text-sm border-collapse">
                                                            <thead>
                                                                <tr className="text-left text-slate-300">
                                                                    <th className="py-2">Exercise</th>
                                                                    <th className="py-2">Muscle</th>
                                                                    <th className="py-2">Sets</th>
                                                                    <th className="py-2 text-center">-</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {draft.exercises.map((ex, exIdx) => (
                                                                    <tr key={ex.id} className="border-t border-slate-800">
                                                                        <td className="py-2 pr-0.5 sm:pr-2 min-w-[180px]">
                                                                            <input
                                                                                className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                                                                value={ex.name}
                                                                                onChange={(e) => updateDraft(plan.id, (d) => {
                                                                                    const next = { ...d };
                                                                                    next.exercises = [...next.exercises];
                                                                                    next.exercises[exIdx] = { ...next.exercises[exIdx], name: e.target.value };
                                                                                    return next;
                                                                                })}
                                                                            />
                                                                        </td>
                                                                        <td className="py-2 pr-0.5">
                                                                            <input
                                                                                className="w-full sm:w-44 rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                                                                value={ex.muscleGroup ?? ""}
                                                                                onChange={(e) => updateDraft(plan.id, (d) => {
                                                                                    const next = { ...d };
                                                                                    next.exercises = [...next.exercises];
                                                                                    next.exercises[exIdx] = { ...next.exercises[exIdx], muscleGroup: e.target.value };
                                                                                    return next;
                                                                                })}
                                                                            />
                                                                        </td>
                                                                        <td className="py-2 pr-0.5 w-11 sm:w-20">
                                                                            <input
                                                                                type="number"
                                                                                min={0}
                                                                                className="w-full rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-white"
                                                                                value={ex.sets?.length ?? 0}
                                                                                onChange={(e) => updateDraft(plan.id, (d) => {
                                                                                    const count = Number(e.target.value) || 0;
                                                                                    const next = { ...d };
                                                                                    next.exercises = [...next.exercises];
                                                                                    next.exercises[exIdx] = { ...next.exercises[exIdx], sets: ensureSetCount(count, next.exercises[exIdx].sets || []) };
                                                                                    return next;
                                                                                })}
                                                                            />
                                                                        </td>
                                                                        <td className="py-2 text-center">
                                                                            <button
                                                                                onClick={() => updateDraft(plan.id, (d) => {
                                                                                    const next = { ...d };
                                                                                    next.exercises = next.exercises.filter((_, i) => i !== exIdx);
                                                                                    return next;
                                                                                })}
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
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        <button
                                                            onClick={() => updateDraft(plan.id, (d) => ({
                                                                ...d,
                                                                exercises: [...d.exercises, { id: generateId(), name: "", muscleGroup: "", sets: ensureSetCount(3, []) } as GymExercise],
                                                            }))}
                                                            className="mt-3 text-sm text-indigo-300 hover:text-indigo-200"
                                                        >
                                                            + Add exercise
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeView === "session" && (
                            <Card heading={<Basic text="Log Session" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Day</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logDayId}
                                                onChange={(e) => setLogDayId(e.target.value)}
                                            >
                                                <option value="">Select day</option>
                                                {plans.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.title}
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

                                    {selectedPlan && logDraft ? (
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
                                                                        <div className="text-teal-200 font-semibold">{ex.name || "Exercise"}</div>
                                                                        {ex.muscleGroup && <div className="text-xs text-slate-400">{ex.muscleGroup}</div>}
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
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <div className="text-teal-200 font-semibold text-sm">{ex.name || "Exercise"}</div>
                                                                    {ex.muscleGroup && <div className="text-[11px] text-slate-400">{ex.muscleGroup}</div>}
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
                                        <p className="text-sm text-slate-400">Select a day to start logging.</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeView === "logs" && (
                            <Card heading={<Basic text="Logs" fontFamily="font-RobotoMono" fontSize="text-2xl" textColor="text-teal-300" />}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-slate-400">Day (optional)</label>
                                            <select
                                                className="rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                                                value={logFilterDayId}
                                                onChange={(e) => setLogFilterDayId(e.target.value)}
                                            >
                                                <option value="">All days</option>
                                                {plans.map((p) => (
                                                    <option key={`filter-${p.id}`} value={p.id}>{p.title}</option>
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
                                                    <span className="font-semibold text-teal-200">{log.dayTitle}</span>
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
