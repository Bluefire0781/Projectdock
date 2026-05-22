"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type PieItem = {
    rit_type: number;
    aantal: number;
    percentage: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://app.local/api";
const PIE_API = `${API_BASE}/Rittypechart`;

const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
    "#C4161C", "#8884d8", "#8dd1e1"
];

export default function RitTypePiechartPage() {
    const [data, setData] = useState<PieItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch pie data
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(PIE_API, { credentials: "include" })
            .then(async res => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(data => {
                setData(Array.isArray(data) ? data : []);
            })
            .catch(err => setError(err.message || "Unknown error"))
            .finally(() => setLoading(false));
    }, []);

    let content;
    if (loading) {
        content = <p className="text-slate-600">Loading pie chart…</p>;
    } else if (error) {
        content = <p className="text-red-600 font-semibold">Error: {error}</p>;
    } else if (!data.length) {
        content = <p className="text-slate-800">No analytic data available.</p>;
    } else {
        content = (
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
                            label={({ rit_type, percentage }) =>
                                `Type ${rit_type}: ${percentage.toFixed(1)}%`
                            }
                        >
                            {data.map((entry, idx) => (
                                <Cell key={entry.rit_type} fill={COLORS[idx % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) =>
                                [`${value.toFixed(1)}%`, "Percentage"]
                            }
                        />
                        <Legend
                            formatter={(value: string | number) => {
                                const item = data.find(x => x.rit_type === value);
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
    }

    return (
        <main className="w-full max-w-2xl mx-auto py-8 px-3 bg-white rounded shadow min-h-[480px]">
            <h1 className="text-2xl font-bold text-[#013c59] mb-6">Orders per RitType (Pie Chart)</h1>
            {content}
        </main>
    );
}
