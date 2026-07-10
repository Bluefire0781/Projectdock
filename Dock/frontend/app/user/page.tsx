"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Rit = {
    id: number;
    rit_id: string;
    leverancier_nmr: number;
    pellet_tot: number;
    rit_type: number;
    datum: string; // "YYYY-MM-DD"
    afspraak_starttijd: string | null;
    afspraak_eindtijd: string | null;
    dock_nmr: number | null;
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://app.local/api";
const RITS_API = `${API_BASE}/rits`;

const DOCK_COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#C4161C",
    "#8884d8",
    "#8dd1e1",
    "#013c59",
];

function dockColor(dockNmr: number) {
    return DOCK_COLORS[dockNmr % DOCK_COLORS.length];
}

const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function startOfWeek(d: Date) {
    const date = new Date(d);
    const day = date.getDay(); // 0 = zondag
    const diff = (day === 0 ? -6 : 1) - day; // verschuiven naar maandag
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(d: Date) {
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function Home() {
    const [ritten, setRitten] = useState<Rit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(RITS_API, { credentials: "include" })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((ritData) => {
                setRitten(Array.isArray(ritData) ? ritData : []);
            })
            .catch((err) => setError(err.message || "Onbekende fout"))
            .finally(() => setLoading(false));
    }, []);

    const { gepland, nietGepland } = useMemo(() => {
        const gepland: Rit[] = [];
        const nietGepland: Rit[] = [];
        for (const r of ritten) {
            if (r.afspraak_starttijd && r.dock_nmr !== null) gepland.push(r);
            else nietGepland.push(r);
        }
        return { gepland, nietGepland };
    }, [ritten]);

    const weekDates = useMemo(() => {
        const monday = startOfWeek(new Date());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, []);

    const geplandByDay = useMemo(() => {
        return weekDates.map((day) =>
            gepland
                .filter((r) => sameDay(new Date(r.afspraak_starttijd as string), day))
                .sort(
                    (a, b) =>
                        new Date(a.afspraak_starttijd as string).getTime() -
                        new Date(b.afspraak_starttijd as string).getTime()
                )
        );
    }, [gepland, weekDates]);

    const today = new Date();

    return (
        <main className="w-full max-w-5xl mx-auto py-8 px-3">
            <h1 className="text-2xl font-bold text-[#013c59] mb-1">Ritplanning</h1>
            <p className="text-sm text-slate-600 mb-6">
                Overzicht van geplande en niet-geplande ritten, en het weekrooster per
                dock.
            </p>

            {loading ? (
                <p className="text-slate-600">Laden…</p>
            ) : error ? (
                <p className="text-red-600 font-semibold">Fout: {error}</p>
            ) : (
                <>
                    {/* Statcijfers */}
                    <div className="flex gap-3 mb-6">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2">
                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                Ingepland
                            </span>
                            <div className="text-xl font-bold text-emerald-800">
                                {gepland.length}
                            </div>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                Niet ingepland
                            </span>
                            <div className="text-xl font-bold text-amber-800">
                                {nietGepland.length}
                            </div>
                        </div>
                    </div>

                    {/* Ritlijsten */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
                            <h2 className="text-sm font-bold text-slate-900 mb-3">
                                Geplande ritten
                            </h2>
                            {gepland.length === 0 ? (
                                <p className="text-sm text-slate-500">Geen geplande ritten.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {gepland.map((r) => (
                                        <li
                                            key={r.id}
                                            className="py-2 flex items-center justify-between text-sm"
                                        >
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    {r.rit_id}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {r.datum} · Type {r.rit_type} · {r.pellet_tot} pellets
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-xs text-slate-700">
                                                    {formatTime(r.afspraak_starttijd as string)}–
                                                    {formatTime(r.afspraak_eindtijd as string)}
                                                </div>
                                                <span
                                                    className="inline-block mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                                                    style={{ backgroundColor: dockColor(r.dock_nmr as number) }}
                                                >
                                                    Dock {r.dock_nmr}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
                            <h2 className="text-sm font-bold text-slate-900 mb-3">
                                Niet ingeplande ritten
                            </h2>
                            {nietGepland.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    Alle ritten zijn ingepland.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {nietGepland.map((r) => (
                                        <li key={r.id}>
                                            <Link
                                                href={`/user/ritten/${r.id}/inplannen`}
                                                className="block py-2 text-sm rounded-md -mx-2 px-2 hover:bg-amber-50 transition-colors"
                                            >
                                                <div className="font-semibold text-slate-900">
                                                    {r.rit_id}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {r.datum} · Type {r.rit_type} · {r.pellet_tot} pellets
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    {/* Weekrooster */}
                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
                        <h2 className="text-sm font-bold text-slate-900 mb-3">
                            Weekrooster
                        </h2>
                        <div className="grid grid-cols-7 gap-2">
                            {weekDates.map((day, i) => (
                                <div key={i} className="min-w-0">
                                    <div
                                        className={[
                                            "text-center rounded-md py-1 mb-2 text-xs font-semibold",
                                            sameDay(day, today)
                                                ? "bg-[#013c59] text-white"
                                                : "bg-slate-50 text-slate-700",
                                        ].join(" ")}
                                    >
                                        {DAY_LABELS[i]} {formatDayLabel(day)}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {geplandByDay[i].length === 0 ? (
                                            <div className="text-[11px] text-slate-300 text-center py-2">
                                                —
                                            </div>
                                        ) : (
                                            geplandByDay[i].map((r) => (
                                                <div
                                                    key={r.id}
                                                    className="rounded-md px-1.5 py-1 text-[11px] text-white leading-tight"
                                                    style={{ backgroundColor: dockColor(r.dock_nmr as number) }}
                                                    title={`Dock ${r.dock_nmr} · ${r.rit_id}`}
                                                >
                                                    <div className="font-mono">
                                                        {formatTime(r.afspraak_starttijd as string)}–
                                                        {formatTime(r.afspraak_eindtijd as string)}
                                                    </div>
                                                    <div className="opacity-90">Dock {r.dock_nmr}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}
