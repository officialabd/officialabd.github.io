"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Card from "./Card";
import LinePulse from "../../_layouts/pulse/line";
import { WEIGHT_UNITS } from "../constants";
import type { GymExercise, GymLogEntry, WeightUnit } from "../types";
import { coversFrom, useExercisesStore, useLogsStore, usePlansStore, useProfileStore } from "../stores";
import {
    addDays,
    bodyWeightTrend,
    consistency,
    dateValue,
    exerciseRecords,
    exerciseSessions,
    exerciseTrends,
    filterLogs,
    formatISODate,
    groupLabel,
    loggedWeightExercises,
    logsInWeek,
    median,
    muscleSets,
    NO_GYM,
    periodStart,
    REP_RANGES,
    repRangeCounts,
    round,
    runs,
    sessionDurations,
    todayISO,
    unitLabel,
    weekStart,
    weeksInPeriod,
    type StatsPeriod,
    type Trend,
} from "../utils";
import { BarList, CalendarHeatmap, LineChart, SegmentedBar, SERIES_COLORS } from "./charts";
import {
    compactInputClass,
    EmptyState,
    Field,
    FilterBar,
    InfoTip,
    inputClass,
    Notice,
    RefreshButton,
    SectionTitle,
    Segmented,
    StatTile,
    TermList,
} from "./ui";

const PERIODS: { value: StatsPeriod; label: string }[] = [
    { value: "3m", label: "3 months" },
    { value: "6m", label: "6 months" },
    { value: "1y", label: "1 year" },
    { value: "all", label: "All" },
];

/** Sessions without progress before an exercise counts as stalled. */
const STALL_WINDOW = 4;

export function StatsView() {
    const { cache: allLogs, coveredFrom, isLoading: downloading, error, reload, ensureFrom } = useLogsStore();
    const library = useExercisesStore((s) => s.exercises);
    const libraryById = useExercisesStore((s) => s.byId);
    const profile = useProfileStore((s) => s.profile);

    const [period, setPeriod] = useState<StatsPeriod>("6m");
    const [gym, setGym] = useState("");
    const [unit, setUnit] = useState<WeightUnit>(profile.units.weight);

    const today = todayISO();
    const from = periodStart(period, today);
    // Download only the period being viewed ("" = all); already cached dates are reused.
    const needFrom = from ?? "";
    useEffect(() => {
        ensureFrom(needFrom);
    }, [needFrom, ensureFrom]);
    const isLoading = downloading || (!coversFrom(coveredFrom, needFrom) && !error);
    const logs = useMemo(() => filterLogs(allLogs, from, gym), [allLogs, from, gym]);
    const gymOptions = useMemo(
        () => Array.from(new Set([...profile.gyms, ...allLogs.map((l) => l.gym).filter((g): g is string => !!g)])),
        [profile.gyms, allLogs]
    );

    return (
        <Card
            heading={
                <SectionTitle text="Stats" pageTitle />
            }
        >
            <div className="space-y-4">
                <FilterBar>
                    <Field as="div" label="Period">
                        <Segmented value={period} options={PERIODS} onChange={setPeriod} />
                    </Field>
                    {gymOptions.length > 0 && (
                        <Field label="Gym">
                            <select className={inputClass} value={gym} onChange={(e) => setGym(e.target.value)}>
                                <option value="">All gyms</option>
                                {gymOptions.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                                <option value={NO_GYM}>No gym set</option>
                            </select>
                        </Field>
                    )}
                    {/* Weights in and Refresh share a row on phones; on wider screens they flow with the other filters. */}
                    <div className="flex items-end gap-3 sm:contents">
                        <Field as="div" label="Weights in">
                            <Segmented value={unit} options={WEIGHT_UNITS.map((u) => ({ value: u }))} onChange={setUnit} />
                        </Field>
                        <RefreshButton onClick={reload} disabled={isLoading} />
                    </div>
                </FilterBar>

                {isLoading && allLogs.length === 0 && <LinePulse />}
                {error && <Notice tone="error">{error}</Notice>}

                <div className={`space-y-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                    {logs.length === 0 && !isLoading ? (
                        <EmptyState>No finished sessions in this period.</EmptyState>
                    ) : (
                        <>
                            <ConsistencyPanel logs={logs} from={from} today={today} />
                            <StrengthPanel logs={logs} library={library} unit={unit} />
                            <RecordsPanel logs={logs} library={library} unit={unit} />
                            <ProgressPanel logs={logs} library={library} unit={unit} />
                            <MusclePanel logs={logs} from={from} today={today} library={libraryById} />
                            <RepRangePanel logs={logs} />
                            <DurationPanel logs={logs} />
                            <RunningPanel logs={logs} />
                        </>
                    )}
                    <BodyWeightPanel from={from} unit={unit} />
                </div>
            </div>
        </Card>
    );
}

// ============================================================================
// Layout pieces
// ============================================================================

type Terms = [string, ReactNode][];

/** A Stats section: title, optional controls, and a tip button explaining its terms. */
function Panel({
    title,
    subtitle,
    actions,
    tips,
    children,
}: {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    tips: Terms;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 flex-wrap items-start justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-semibold text-teal-200">{title}</h3>
                        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>
                <InfoTip title={title}>
                    <TermList terms={tips} />
                </InfoTip>
            </div>
            {children}
        </section>
    );
}

const compactSelect = compactInputClass;

function ExerciseSelect({ exercises, value, onChange }: { exercises: GymExercise[]; value: string; onChange: (id: string) => void }) {
    return (
        <select className={compactSelect} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Exercise">
            {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                    {e.name}
                </option>
            ))}
        </select>
    );
}

const fmt = (value: number, unit: string) => `${round(value)} ${unit}`;
const pct = (share: number) => `${Math.round(share * 100)}%`;

function Table({ head, children }: { head: string[]; children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                        {head.map((h, i) => (
                            <th key={h} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200 tabular-nums">{children}</tbody>
            </table>
        </div>
    );
}

function Cell({ children, sub, first }: { children: ReactNode; sub?: string; first?: boolean }) {
    return (
        <td className={`px-3 py-2 ${first ? "font-medium text-slate-100" : "text-right"}`}>
            <div>{children}</div>
            {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
        </td>
    );
}

// ============================================================================
// Consistency
// ============================================================================

function ConsistencyPanel({ logs, from, today }: { logs: GymLogEntry[]; from: string | null; today: string }) {
    const stats = useMemo(() => consistency(logs, from, today), [logs, from, today]);
    const durations = sessionDurations(logs).map((d) => d.minutes);
    const typical = median(durations);
    // The calendar always shows a full year so it reads like a calendar, regardless of the period.
    const firstWeek = weekStart(addDays(today, -364));
    const calendarWeeks = Array.from({ length: 53 }, (_, i) => addDays(firstWeek, i * 7)).filter((w) => w <= today);

    return (
        <Panel
            title="Consistency"
            subtitle="Training days over the last year."
            tips={[
                ["Sessions", "Finished sessions in the selected period (and gym)."],
                ["Per week", "Sessions divided by the number of weeks in the period."],
                ["Week streak", "Weeks in a row (Monday–Sunday) with at least one session, up to now. The current week only breaks it once it's over. \"Best\" is the longest streak in the period."],
                ["Typical session", "Median duration: half of your sessions are shorter, half longer."],
                ["Calendar", "Each square is a day; brighter means more sessions. Hover a day to see what you trained."],
            ]}
        >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label="Sessions" value={`${logs.length}`} hint="in this period" />
                <StatTile label="Per week" value={`${stats.averagePerWeek}`} hint="average" />
                <StatTile label="Week streak" value={`${stats.currentStreak}`} hint={`best ${stats.longestStreak}`} />
                <StatTile label="Typical session" value={typical !== null ? `${Math.round(typical)} min` : "-"} hint="median duration" />
            </div>
            <CalendarHeatmap
                weeks={calendarWeeks}
                today={today}
                addDays={addDays}
                count={(date) => stats.byDate.get(date)?.length ?? 0}
                describe={(date) => {
                    const sessions = stats.byDate.get(date) ?? [];
                    return (
                        <>
                            <div className="text-slate-400">{formatISODate(date)}</div>
                            {sessions.length === 0 ? (
                                <div className="font-semibold text-slate-100">Rest day</div>
                            ) : (
                                sessions.map((s) => (
                                    <div key={s.id} className="font-semibold text-slate-100">
                                        {s.dayTitle}
                                        {s.gym && <span className="font-normal text-slate-400"> · {s.gym}</span>}
                                    </div>
                                ))
                            )}
                        </>
                    );
                }}
            />
        </Panel>
    );
}

// ============================================================================
// Strength
// ============================================================================

/** Selected exercise id, falling back to the first option when it isn't available. */
function useExerciseChoice(options: GymExercise[]) {
    const [chosen, setChosen] = useState("");
    const id = options.some((o) => o.id === chosen) ? chosen : options[0]?.id ?? "";
    return [id, setChosen] as const;
}

function StrengthPanel({ logs, library, unit }: { logs: GymLogEntry[]; library: GymExercise[]; unit: WeightUnit }) {
    const options = useMemo(() => loggedWeightExercises(logs, library), [logs, library]);
    const [exerciseId, setExerciseId] = useExerciseChoice(options);
    const sessions = useMemo(() => (exerciseId ? exerciseSessions(logs, exerciseId, unit) : []), [logs, exerciseId, unit]);
    const u = unitLabel(unit);

    if (options.length === 0) return null;
    const withE1rm = sessions.filter((s) => s.e1rm !== null);

    return (
        <Panel
            title="Strength trend"
            subtitle={`Per session, in ${u}. Dots mark personal records.`}
            tips={[
                ["Est. 1 Rep Max", "An estimate of the heaviest weight you could lift once, from your best set: weight × (1 + reps ÷ 30). Sets above 20 reps are left out."],
                ["Heaviest set", "The heaviest weight you lifted in that session."],
                ["Dots", "The latest session and every personal record: a session that beat your previous best Est. 1 Rep Max."],
                ["Units", "Sessions logged in kg and lb are converted to the selected unit, so they form one line."],
            ]}
            actions={<ExerciseSelect exercises={options} value={exerciseId} onChange={setExerciseId} />}
        >
            <LineChart
                ariaLabel="Strength trend"
                formatY={(v) => fmt(v, u)}
                series={[
                    {
                        label: "Est. 1 Rep Max",
                        color: SERIES_COLORS[0],
                        points: withE1rm.map((s) => ({ x: dateValue(s.date), y: s.e1rm!, marked: s.isPr })),
                    },
                    {
                        label: "Heaviest set",
                        color: SERIES_COLORS[1],
                        points: sessions.map((s) => ({ x: dateValue(s.date), y: s.topWeight })),
                    },
                ].filter((s) => s.points.length > 0)}
                describe={(x) => {
                    const s = sessions.find((session) => dateValue(session.date) === x);
                    return s?.topReps ? <div className="text-slate-400">Heaviest set: {s.topReps} reps</div> : null;
                }}
            />
        </Panel>
    );
}

function RecordsPanel({ logs, library, unit }: { logs: GymLogEntry[]; library: GymExercise[]; unit: WeightUnit }) {
    const records = useMemo(
        () => exerciseRecords(logs, library, unit).sort((a, b) => a.exercise.name.localeCompare(b.exercise.name)),
        [logs, library, unit]
    );
    if (records.length === 0) return null;
    const u = unitLabel(unit);

    return (
        <Panel
            title="Personal records"
            subtitle={`Best results in this period, in ${u}.`}
            tips={[
                ["Best weight", "The heaviest single set."],
                ["Est. 1 Rep Max", "The best estimate of the heaviest weight you could lift once: weight × (1 + reps ÷ 30)."],
                ["Best set volume", "The most weight × reps done in a single set."],
                ["Last vs best", "Your last session's heaviest set as a share of your best weight. 100% means you're at your best."],
                ["Sessions", "How many sessions included the exercise."],
            ]}
        >
            <Table head={["Exercise", "Best weight", "Est. 1 Rep Max", "Best set volume", "Last vs best"]}>
                {records.map((r) => (
                    <tr key={r.exercise.id}>
                        <Cell first sub={`${r.sessions} session${r.sessions === 1 ? "" : "s"}`}>
                            {r.exercise.name}
                        </Cell>
                        <Cell sub={formatISODate(r.bestWeight.date)}>{fmt(r.bestWeight.value, u)}</Cell>
                        <Cell sub={r.bestE1rm ? formatISODate(r.bestE1rm.date) : undefined}>{r.bestE1rm ? fmt(r.bestE1rm.value, u) : "-"}</Cell>
                        <Cell sub={r.bestSetVolume ? formatISODate(r.bestSetVolume.date) : undefined}>
                            {r.bestSetVolume ? fmt(r.bestSetVolume.value, u) : "-"}
                        </Cell>
                        <Cell sub={`${fmt(r.last.topWeight, u)} · ${formatISODate(r.last.date)}`}>{pct(r.lastVsBest)}</Cell>
                    </tr>
                ))}
            </Table>
        </Panel>
    );
}

const TREND_LABEL: Record<Trend, { text: string; color: string }> = {
    improving: { text: "▲ Improving", color: "text-emerald-300" },
    stalled: { text: "■ Stalled", color: "text-amber-200" },
    declining: { text: "▼ Declining", color: "text-rose-300" },
};

function ProgressPanel({ logs, library, unit }: { logs: GymLogEntry[]; library: GymExercise[]; unit: WeightUnit }) {
    const trends = useMemo(() => exerciseTrends(logs, library, unit, STALL_WINDOW), [logs, library, unit]);
    const u = unitLabel(unit);
    return (
        <Panel
            title="Progress by exercise"
            subtitle={`Your last ${STALL_WINDOW} sessions against your earlier best.`}
            tips={[
                ["Improving", `A new best in the last ${STALL_WINDOW} sessions.`],
                ["Stalled", `No new best in the last ${STALL_WINDOW} sessions, but within 5% of your earlier best.`],
                ["Declining", `Your best of the last ${STALL_WINDOW} sessions is more than 5% below your earlier best.`],
                ["Earlier best", `Your best Est. 1 Rep Max before the last ${STALL_WINDOW} sessions (heaviest set when no reps were logged).`],
                ["Recent best", `Your best Est. 1 Rep Max in the last ${STALL_WINDOW} sessions, and its share of the earlier best.`],
                ["Last PR", "When you last set a personal record, and how many sessions ago."],
            ]}
        >
            {trends.length === 0 ? (
                <EmptyState>No exercise has more than {STALL_WINDOW} sessions in this period yet.</EmptyState>
            ) : (
                <Table head={["Exercise", "Status", "Earlier best", "Recent best", "Last PR"]}>
                    {trends.map((s) => (
                        <tr key={s.exercise.id}>
                            <Cell first>{s.exercise.name}</Cell>
                            <Cell>
                                <span className={TREND_LABEL[s.trend].color}>{TREND_LABEL[s.trend].text}</span>
                            </Cell>
                            <Cell>{fmt(s.previousBest, u)}</Cell>
                            <Cell sub={pct(s.recentBest / s.previousBest)}>{fmt(s.recentBest, u)}</Cell>
                            <Cell sub={`${s.sessionsSincePr} sessions ago`}>{formatISODate(s.lastPrDate)}</Cell>
                        </tr>
                    ))}
                </Table>
            )}
        </Panel>
    );
}

// ============================================================================
// Training balance
// ============================================================================

type MuscleWindow = "average" | "this" | "last";

function MusclePanel({
    logs,
    from,
    today,
    library,
}: {
    logs: GymLogEntry[];
    from: string | null;
    today: string;
    library: Map<string, GymExercise>;
}) {
    const [range, setRange] = useState<MuscleWindow>("average");
    const rows = useMemo(() => {
        if (range === "average") {
            const weeks = weeksInPeriod(logs, from, today);
            return muscleSets(logs, library).map((m) => ({ ...m, sets: round(m.sets / weeks) }));
        }
        const week = weekStart(range === "this" ? today : addDays(today, -7));
        return muscleSets(logsInWeek(logs, week), library);
    }, [logs, from, today, library, range]);

    return (
        <Panel
            title="Weekly sets per muscle group"
            subtitle="Completed sets against the recommended 10–20 per week."
            tips={[
                ["Sets", "Completed sets. An exercise counts for each of its muscle groups; skipped exercises don't count."],
                ["Avg / week", "Total sets in the period divided by its number of weeks."],
                ["This week / Last week", "Sets from Monday to Sunday."],
                ["Shaded band", "10–20 sets per muscle per week, a common recommendation for building muscle."],
            ]}
            actions={
                <Segmented<MuscleWindow>
                    size="sm"
                    value={range}
                    options={[
                        { value: "average", label: "Avg / week" },
                        { value: "this", label: "This week" },
                        { value: "last", label: "Last week" },
                    ]}
                    onChange={setRange}
                />
            }
        >
            {rows.length === 0 ? (
                <EmptyState>No sets with muscle groups in this range. Add groups to your exercises to see this.</EmptyState>
            ) : (
                <BarList
                    rows={rows.map((r) => ({ key: r.group, label: groupLabel(r.group), value: r.sets }))}
                    formatValue={(v) => `${v}`}
                    band={{ from: 10, to: 20, label: "10–20" }}
                />
            )}
        </Panel>
    );
}

function RepRangePanel({ logs }: { logs: GymLogEntry[] }) {
    const counts = useMemo(() => repRangeCounts(logs), [logs]);
    if (counts.every((c) => c === 0)) return null;
    return (
        <Panel
            title="Rep ranges"
            subtitle="How your completed sets split by number of reps."
            tips={[
                ["1–5 reps", "Heavy work, mostly builds strength."],
                ["6–12 reps", "Moderate work, mostly builds muscle size."],
                ["13+ reps", "Light work, mostly builds muscular endurance."],
                ["Counted", "Every completed set with reps, from weight and reps-only exercises."],
            ]}
        >
            <SegmentedBar parts={REP_RANGES.map((r, i) => ({ label: r.label, value: counts[i], color: SERIES_COLORS[i] }))} />
        </Panel>
    );
}

function DurationPanel({ logs }: { logs: GymLogEntry[] }) {
    const plans = usePlansStore((s) => s.plans);
    const [dayId, setDayId] = useState("");
    const durations = useMemo(() => sessionDurations(logs, dayId), [logs, dayId]);
    const days = useMemo(() => {
        const ids = new Set(logs.map((l) => l.dayId));
        return plans.flatMap((p) => p.days.filter((d) => ids.has(d.id)).map((d) => ({ id: d.id, title: d.title })));
    }, [plans, logs]);
    const typical = median(durations.map((d) => d.minutes));

    return (
        <Panel
            title="Session duration"
            subtitle="Minutes from start to finish."
            tips={[
                ["Duration", "Time between pressing Start and Complete."],
                ["Median line", "Half of the sessions shown are shorter, half longer."],
                ["Day filter", "Show one plan day only."],
            ]}
            actions={
                <select className={compactSelect} value={dayId} onChange={(e) => setDayId(e.target.value)} aria-label="Plan day">
                    <option value="">All days</option>
                    {days.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.title}
                        </option>
                    ))}
                </select>
            }
        >
            {durations.length === 0 ? (
                <EmptyState>No timed sessions in this range.</EmptyState>
            ) : (
                <LineChart
                    ariaLabel="Session duration"
                    formatY={(v) => `${Math.round(v)} min`}
                    reference={typical !== null ? { y: typical, label: `median ${Math.round(typical)} min` } : undefined}
                    series={[
                        {
                            label: "Duration",
                            color: SERIES_COLORS[0],
                            // Several sessions on one date: keep the longest so each date has one point.
                            points: Array.from(
                                durations.reduce((m, d) => m.set(d.date, Math.max(m.get(d.date) ?? 0, d.minutes)), new Map<string, number>()),
                                ([date, minutes]) => ({ x: dateValue(date), y: minutes })
                            ),
                        },
                    ]}
                    describe={(x) => (
                        <div className="text-slate-400">
                            {durations
                                .filter((d) => dateValue(d.date) === x)
                                .map((d) => d.dayTitle)
                                .join(", ")}
                        </div>
                    )}
                />
            )}
        </Panel>
    );
}

// ============================================================================
// Cardio & body
// ============================================================================

type RunMetric = "distance" | "pace" | "calories";

const formatPaceValue = (minutes: number) => {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, "0")}`;
};

function RunningPanel({ logs }: { logs: GymLogEntry[] }) {
    const distanceUnit = useProfileStore((s) => s.profile.units.distance);
    const [metric, setMetric] = useState<RunMetric>("distance");
    const data = useMemo(() => runs(logs, distanceUnit), [logs, distanceUnit]);
    if (data.length === 0) return null;

    const d = unitLabel(distanceUnit);
    const value = (r: (typeof data)[number]) => (metric === "distance" ? r.distance : metric === "pace" ? r.pace : r.calories);
    const points = data.flatMap((r) => {
        const y = value(r);
        return y !== null && y > 0 ? [{ x: dateValue(r.date), y }] : [];
    });
    const format = (v: number) =>
        metric === "distance" ? `${round(v, 2)} ${d}` : metric === "pace" ? `${formatPaceValue(v)} /${d}` : `${Math.round(v)} kcal`;
    const total = round(data.reduce((sum, r) => sum + r.distance, 0), 1);
    const paces = data.map((r) => r.pace).filter((p): p is number => p !== null);

    return (
        <Panel
            title="Running"
            subtitle={`Per session, in ${d}.`}
            tips={[
                ["Distance", "Total distance of the session's running sets, in your profile's distance unit."],
                ["Pace", `Minutes per ${d} (min:sec). Lower is faster.`],
                ["Calories", "kcal entered on the running sets."],
                ["Best pace", "Your fastest session pace in the period."],
            ]}
            actions={
                <Segmented<RunMetric>
                    size="sm"
                    value={metric}
                    options={[
                        { value: "distance", label: "Distance" },
                        { value: "pace", label: "Pace" },
                        { value: "calories", label: "Calories" },
                    ]}
                    onChange={setMetric}
                />
            }
        >
            <div className="grid grid-cols-3 gap-3">
                <StatTile label="Runs" value={`${data.length}`} />
                <StatTile label="Total distance" value={`${total} ${d}`} />
                <StatTile label="Best pace" value={paces.length ? `${formatPaceValue(Math.min(...paces))} /${d}` : "-"} />
            </div>
            {points.length === 0 ? (
                <EmptyState>No {metric} recorded for these runs.</EmptyState>
            ) : (
                <LineChart
                    ariaLabel={`Running ${metric}`}
                    formatY={format}
                    series={[{ label: metric, color: SERIES_COLORS[0], points }]}
                    describe={(x) => {
                        const r = data.find((run) => dateValue(run.date) === x);
                        if (!r) return null;
                        return (
                            <div className="text-slate-400">
                                {r.distance} {d} in {r.minutes} min
                                {r.speed !== null && ` · ${r.speed} ${d}/h`}
                                {r.calories !== null && ` · ${r.calories} kcal`}
                            </div>
                        );
                    }}
                />
            )}
        </Panel>
    );
}

function BodyWeightPanel({ from, unit }: { from: string | null; unit: WeightUnit }) {
    const profile = useProfileStore((s) => s.profile);
    const trend = useMemo(() => bodyWeightTrend(profile, from, unit), [profile, from, unit]);
    const u = unitLabel(unit);
    if (profile.weightHistory.length === 0) return null;

    return (
        <Panel
            title="Body weight"
            tips={[
                ["Weigh-ins", "Body weights entered in your profile, in the selected unit."],
                ["Target line", "The weight that gives your target BMI at your latest height. Set the target BMI in your profile."],
            ]}
            subtitle={
                trend.target !== null
                    ? `Weigh-ins in ${u}. The line marks the weight for your target BMI of ${profile.targetBmi}.`
                    : `Weigh-ins in ${u}. Set a target BMI in your profile to see your target weight here.`
            }
        >
            {trend.points.length === 0 ? (
                <EmptyState>No weigh-ins in this period.</EmptyState>
            ) : (
                <LineChart
                    ariaLabel="Body weight"
                    formatY={(v) => fmt(v, u)}
                    reference={trend.target !== null ? { y: trend.target, label: `target ${fmt(trend.target, u)}` } : undefined}
                    series={[{ label: "Body weight", color: SERIES_COLORS[0], points: trend.points.map((p) => ({ x: dateValue(p.date), y: p.weight })) }]}
                />
            )}
        </Panel>
    );
}
