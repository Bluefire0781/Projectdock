"use client";

import React, { memo, useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

type PieItem = {
    rit_type: number;
    aantal: number;
    percentage: number;
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://app.local/api";
const PIE_API = `${API_BASE}/Rittypechart`;

// Gebruik jouw SSE endpoint (pas aan naar jouw route)
const SSE_URL = `${API_BASE}/sse`; // bv: http://app.local/api/sse

const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#C4161C",
    "#8884d8",
    "#8dd1e1",
];

// Chart apart memoizen zodat SSE updates (lastSseMessage) de chart niet steeds “hertekenen”
const PieChartBlock = memo(function PieChartBlock({ data }: { data: PieItem[] }) {
    if (!data.length) {
        return <p className="text-slate-800">No analytic data available.</p>;
    }

    return (
        <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        dataKey="percentage"
                        nameKey="rit_type"
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        // BELANGRIJK: animatie uit, anders lijkt het alsof hij elke 5 sec “refresht”
                        isAnimationActive={false}
                        label={({ rit_type, percentage }: any) =>
                            `Type ${rit_type}: ${Number(percentage).toFixed(1)}%`
                        }
                    >
                        {data.map((entry, idx) => (
                            <Cell
                                key={entry.rit_type}
                                fill={COLORS[idx % COLORS.length]}
                            />
                        ))}
                    </Pie>

                    <Tooltip
                        formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Percentage"]}
                    />

                    <Legend
                        formatter={(value: any) => {
                            const item = data.find((x) => x.rit_type === value);
                            return item
                                ? `Type ${item.rit_type} (${item.aantal}x)`
                                : `Type ${value}`;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>

            <div className="mt-2 text-xs text-slate-700">
                <span className="font-bold">Total:</span>{" "}
                {data.reduce((sum, x) => sum + x.aantal, 0)} orders
            </div>
        </div>
    );
});

export default function RitTypePiechartPage() {
    const [data, setData] = useState<PieItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // SSE state
    const [sseStatus, setSseStatus] = useState<
        "connecting" | "open" | "error" | "closed"
    >("connecting");
    const [lastSseMessage, setLastSseMessage] = useState<string>("");

    // Fetch pie data (1x bij laden)
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(PIE_API, { credentials: "include" })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((json) => {
                setData(Array.isArray(json) ? json : []);
            })
            .catch((err) => setError(err.message || "Unknown error"))
            .finally(() => setLoading(false));
    }, []);

    // SSE: alleen tekst updaten (geen graph refresh door data fetch)
    useEffect(() => {
        const es = new EventSource(SSE_URL);

        setSseStatus("connecting");

        es.onopen = () => setSseStatus("open");

        es.onmessage = (ev) => {
            // alleen UI-tekst updaten
            setLastSseMessage(String(ev.data ?? ""));
        };

        es.onerror = () => setSseStatus("error");

        return () => {
            es.close();
            setSseStatus("closed");
        };
    }, []);

    return (
        <main className="w-full max-w-2xl mx-auto py-8 px-3 bg-white rounded shadow min-h-[480px]">
            <h1 className="text-2xl font-bold text-[#013c59] mb-2">
                Orders per RitType (Pie Chart)
            </h1>

            {/* SSE status blok (iets leesbaarder) */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">Live updates</div>

                    <span
                        className={[
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                            sseStatus === "open"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : sseStatus === "connecting"
                                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                                    : sseStatus === "error"
                                        ? "bg-red-50 text-red-700 ring-red-200"
                                        : "bg-slate-100 text-slate-700 ring-slate-200",
                        ].join(" ")}
                    >
                        {sseStatus === "open"
                            ? "Verbonden"
                            : sseStatus === "connecting"
                                ? "Verbinden…"
                                : sseStatus === "error"
                                    ? "Probleem (reconnect)"
                                    : "Gesloten"}
                    </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-slate-600">Laatste server tijd:</span>
                        <span className="font-mono text-slate-900">{lastSseMessage || "—"}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-slate-600">SSE URL:</span>
                        <code className="break-all rounded bg-slate-50 px-2 py-1 text-xs text-slate-800 ring-1 ring-slate-200">
                            {SSE_URL}
                        </code>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <p className="text-slate-600">Loading pie chart…</p>
            ) : error ? (
                <p className="text-red-600 font-semibold">Error: {error}</p>
            ) : (
                <PieChartBlock data={data} />
            )}
        </main>
    );
}
