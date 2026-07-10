"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type RitDetail = {
    id: number;
    rit_id: string;
    leverancier_nmr: number;
    pellet_tot: number;
    rit_type: number;
    datum: string; // "YYYY-MM-DD"
};

type Slot = {
    start: string; // ISO datetime
    end: string;
    available: boolean;
};

type DockAvailability = {
    dock_id: number;
    slots: Slot[];
};

type Beschikbaarheid = {
    rit_id: number;
    datum: string;
    duration_minutes: number;
    docks: DockAvailability[];
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://app.local/api";

const ROW_HEIGHT_REM = 2.25; // hoogte van 1 tijdvak (15 min) in het rooster

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function isHourMark(iso: string) {
    return new Date(iso).getMinutes() === 0;
}

export default function InplannenPage() {
    const params = useParams<{ id: string }>();
    const ritId = params?.id;

    const [rit, setRit] = useState<RitDetail | null>(null);
    const [beschikbaarheid, setBeschikbaarheid] = useState<Beschikbaarheid | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSlot, setSelectedSlot] = useState<{
        dockId: number;
        start: string;
        end: string;
    } | null>(null);
    const [landingType, setLandingType] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const loadData = () => {
        if (!ritId) return;
        setLoading(true);
        setError(null);

        Promise.all([
            fetch(`${API_BASE}/rits/${ritId}`, { credentials: "include" }).then(
                async (res) => {
                    if (!res.ok) throw new Error(await res.text());
                    return res.json();
                }
            ),
            fetch(`${API_BASE}/rits/${ritId}/beschikbaarheid`, {
                credentials: "include",
            }).then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            }),
        ])
            .then(([ritData, beschikbaarheidData]) => {
                setRit(ritData);
                setBeschikbaarheid(beschikbaarheidData);
            })
            .catch((err) => setError(err.message || "Onbekende fout"))
            .finally(() => setLoading(false));
    };

    useEffect(loadData, [ritId]);

    // Alle unieke starttijden over alle docks heen, gesorteerd (het rooster van de dag)
    const tijden = useMemo(() => {
        if (!beschikbaarheid) return [];
        const set = new Set<string>();
        beschikbaarheid.docks.forEach((d) =>
            d.slots.forEach((s) => set.add(s.start))
        );
        return Array.from(set).sort();
    }, [beschikbaarheid]);

    function handlePick(dockId: number, slot: Slot) {
        setSubmitError(null);
        setSubmitted(false);
        setSelectedSlot({ dockId, start: slot.start, end: slot.end });
    }

    async function handleConfirm() {
        if (!selectedSlot || !ritId) return;
        if (!landingType.trim()) {
            setSubmitError("Vul een type landing in.");
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch(`${API_BASE}/rits/${ritId}/inplannen`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dock_id: selectedSlot.dockId,
                    start: selectedSlot.start,
                    landing_type: landingType.trim(),
                }),
            });

            if (res.status === 409) {
                setSubmitError(
                    "Deze tijd is net ingenomen (of deze rit is al ingepland). Ververs en kies opnieuw."
                );
                loadData();
                return;
            }
            if (!res.ok) throw new Error(await res.text());

            setSubmitted(true);
            setSelectedSlot(null);
        } catch (err: any) {
            setSubmitError(err.message || "Onbekende fout bij inplannen");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="w-full max-w-6xl mx-auto py-8 px-3">
            <Link
                href="/user"
                className="text-sm text-slate-500 hover:text-[#013c59] mb-4 inline-block"
            >
                ← Terug naar overzicht
            </Link>

            <h1 className="text-2xl font-bold text-[#013c59] mb-4">
                Rit inplannen
            </h1>

            {loading ? (
                <p className="text-slate-600">Laden…</p>
            ) : error ? (
                <p className="text-red-600 font-semibold">Fout: {error}</p>
            ) : !rit || !beschikbaarheid ? (
                <p className="text-slate-600">Rit niet gevonden.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
                    {/* Agenda */}
                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
                        <h2 className="text-sm font-bold text-slate-900 mb-3">
                            Dagrooster — kies een vrije tijd per dock
                        </h2>

                        {beschikbaarheid.docks.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Geen docks toegestaan voor dit rittype.
                            </p>
                        ) : (
                            <div
                                className="overflow-auto rounded-md border border-slate-200"
                                style={{ maxHeight: "36rem" }}
                            >
                                <div
                                    className="grid"
                                    style={{
                                        gridTemplateColumns: `64px repeat(${beschikbaarheid.docks.length}, minmax(110px, 1fr))`,
                                    }}
                                >
                                    {/* Header rij */}
                                    <div className="sticky top-0 left-0 z-20 bg-white border-b border-slate-200" />
                                    {beschikbaarheid.docks.map((d) => (
                                        <div
                                            key={d.dock_id}
                                            className="sticky top-0 z-10 bg-white text-center text-xs font-semibold text-slate-600 uppercase tracking-wide py-2 border-b border-slate-200"
                                        >
                                            Dock {d.dock_id}
                                        </div>
                                    ))}

                                    {/* Tijdrijen */}
                                    {tijden.map((t) => {
                                        const hourMark = isHourMark(t);
                                        return (
                                            <React.Fragment key={t}>
                                                <div
                                                    className={[
                                                        "sticky left-0 z-10 bg-white text-right pr-2 text-[11px] font-mono text-slate-400 flex items-start justify-end",
                                                        hourMark ? "border-t border-slate-200" : "",
                                                    ].join(" ")}
                                                    style={{ height: `${ROW_HEIGHT_REM}rem` }}
                                                >
                                                    {hourMark ? (
                                                        <span className="-translate-y-1/2 bg-white pl-1">
                                                            {formatTime(t)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {beschikbaarheid.docks.map((d) => {
                                                    const slot = d.slots.find((s) => s.start === t);
                                                    const isSelected =
                                                        selectedSlot?.dockId === d.dock_id &&
                                                        selectedSlot?.start === t;

                                                    if (!slot) {
                                                        return (
                                                            <div
                                                                key={d.dock_id}
                                                                className={hourMark ? "border-t border-slate-100" : ""}
                                                                style={{ height: `${ROW_HEIGHT_REM}rem` }}
                                                            />
                                                        );
                                                    }

                                                    if (!slot.available) {
                                                        return (
                                                            <div
                                                                key={d.dock_id}
                                                                title={`Bezet ${formatTime(slot.start)}–${formatTime(
                                                                    slot.end
                                                                )}`}
                                                                className={hourMark ? "border-t border-slate-100" : ""}
                                                                style={{ height: `${ROW_HEIGHT_REM}rem`, padding: "1px 3px" }}
                                                            >
                                                                <div className="h-full w-full rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                                                                    Bezet
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={d.dock_id}
                                                            className={hourMark ? "border-t border-slate-100" : ""}
                                                            style={{ height: `${ROW_HEIGHT_REM}rem`, padding: "1px 3px" }}
                                                        >
                                                            <button
                                                                onClick={() => handlePick(d.dock_id, slot)}
                                                                title={`Plan hier: ${formatTime(
                                                                    slot.start
                                                                )}–${formatTime(slot.end)}`}
                                                                className={[
                                                                    "h-full w-full rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors shadow-sm",
                                                                    isSelected
                                                                        ? "bg-[#013c59] text-white"
                                                                        : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100",
                                                                ].join(" ")}
                                                            >
                                                                {isSelected ? "Geselecteerd" : "Vrij"}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Zijbalk: rit info + bevestiging */}
                    <div className="flex flex-col gap-4 lg:sticky lg:top-6">
                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
                            <div className="text-sm text-slate-500">Rit</div>
                            <div className="text-lg font-semibold text-slate-900 mb-3">
                                {rit.rit_id}
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">Datum</span>
                                    <span className="font-mono text-slate-900">{rit.datum}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">Type</span>
                                    <span className="text-slate-900">{rit.rit_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">Benodigde tijd</span>
                                    <span className="text-slate-900">
                                        {beschikbaarheid.duration_minutes} min
                                    </span>
                                </div>
                            </div>
                        </div>

                        {submitted ? (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                <div className="mb-2">Rit is ingepland.</div>
                                <Link
                                    href="/user"
                                    className="font-semibold underline hover:no-underline"
                                >
                                    Terug naar overzicht
                                </Link>
                            </div>
                        ) : selectedSlot ? (
                            <div className="rounded-lg border border-[#013c59]/30 bg-[#013c59]/5 p-4">
                                <div className="text-sm font-semibold text-slate-900 mb-3">
                                    Dock {selectedSlot.dockId} · {formatTime(selectedSlot.start)}–
                                    {formatTime(selectedSlot.end)}
                                </div>

                                <label className="block text-xs text-slate-600 mb-1">
                                    Type landing
                                </label>
                                <input
                                    value={landingType}
                                    onChange={(e) => setLandingType(e.target.value)}
                                    placeholder="bv. lossen / laden"
                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-black mb-3 focus:outline-none focus:ring-2 focus:ring-[#013c59]/40"
                                />

                                {submitError && (
                                    <p className="text-sm text-red-600 mb-2">{submitError}</p>
                                )}

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={submitting}
                                        className="rounded-md bg-[#013c59] text-white text-sm font-semibold px-4 py-1.5 disabled:opacity-50"
                                    >
                                        {submitting ? "Bezig…" : "Bevestig inplannen"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedSlot(null);
                                            setSubmitError(null);
                                        }}
                                        className="rounded-md border border-slate-300 text-slate-700 text-sm px-4 py-1.5"
                                    >
                                        Annuleren
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                                Kies een vrije tijd in het rooster hiernaast om in te plannen.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
