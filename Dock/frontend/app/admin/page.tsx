"use client";

import { useEffect, useState } from "react";

type Leverancier = {
    leverancier_id: number;
    username: string;
    email: string | null;
    ppu: number;
    role: string | null;
};

type CreateLeverancierPayload = {
    leverancier_nmr: number;
    username: string;
    password: string;
    email: string | null;
    ppu: number;
    role: string;
};

export default function Home() {
    const [accounts, setAccounts] = useState<Leverancier[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [form, setForm] = useState({
        leverancier_nmr: "",
        username: "",
        password: "",
        email: "",
        ppu: "",
    });

    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    const inputClass =
        "w-full border border-slate-300 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";

    async function fetchAccounts() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/leveranciers`, { method: "GET" });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch accounts (${res.status}): ${text}`);
            }

            const data = (await res.json()) as Leverancier[];
            setAccounts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAccounts();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const leverancier_nmr = Number(form.leverancier_nmr);
            const ppu = Number(form.ppu);

            const payload: CreateLeverancierPayload = {
                leverancier_nmr,
                username: form.username.trim(),
                password: form.password,
                email: form.email.trim() === "" ? null : form.email.trim(),
                ppu,
                role: "user", // auto-set here
            };

            if (!payload.username || !payload.password) {
                throw new Error("username and password are required.");
            }

            if (!Number.isFinite(payload.leverancier_nmr) || !Number.isFinite(payload.ppu)) {
                throw new Error("leverancier_nmr and ppu must be valid numbers.");
            }

            const res = await fetch(`${API_BASE}/leveranciers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Create failed (${res.status}): ${text}`);
            }

            setSuccessMsg("Leverancier created successfully.");
            setForm({
                leverancier_nmr: "",
                username: "",
                password: "",
                email: "",
                ppu: "",
            });

            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="bg-[#013c59] h-[12vh] w-full">
                <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
                    <div className="text-[#b5b500] font-extrabold leading-tight">
                        <div className="text-3xl tracking-wide">BSB</div>
                        <div className="text-3xl tracking-wide px-7">DockIT</div>
                    </div>

                    <div className="flex items-center gap-8">
                        <nav className="text-white font-medium flex gap-8">
                            <a href="#" className="hover:text-[#b5b500] transition">News</a>
                            <a href="#" className="hover:text-[#b5b500] transition">Dashboard</a>
                        </nav>

                        <button className="bg-[#b5b500] text-[#013c59] font-semibold px-4 py-2 rounded-md hover:opacity-90 transition">
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 bg-slate-100">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-1 bg-white rounded-xl shadow p-5">
                        <h2 className="text-xl font-semibold text-[#013c59] mb-4">
                            Create Leverancier
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="number"
                                className={inputClass}
                                placeholder="1000"
                                value={form.leverancier_nmr}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, leverancier_nmr: e.target.value }))
                                }
                            />

                            <input
                                type="text"
                                className={inputClass}
                                placeholder="username"
                                value={form.username}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, username: e.target.value }))
                                }
                            />

                            <input
                                type="password"
                                className={inputClass}
                                placeholder="•••"
                                value={form.password}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, password: e.target.value }))
                                }
                            />

                            <input
                                type="email"
                                className={inputClass}
                                placeholder="email (optional)"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, email: e.target.value }))
                                }
                            />

                            <input
                                type="number"
                                className={inputClass}
                                placeholder="15"
                                value={form.ppu}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, ppu: e.target.value }))
                                }
                            />

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#013c59] text-white font-semibold py-2 rounded-md disabled:opacity-60"
                            >
                                {submitting ? "Creating..." : "Create"}
                            </button>
                        </form>

                        {successMsg && <p className="text-green-700 mt-3 text-sm">{successMsg}</p>}
                        {error && <p className="text-red-700 mt-3 text-sm">{error}</p>}
                    </section>

                    <section className="lg:col-span-2 bg-white rounded-xl shadow p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-[#013c59]">All Accounts</h2>
                            <button
                                onClick={fetchAccounts}
                                className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition"
                            >
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-slate-700">Loading...</p>
                        ) : accounts.length === 0 ? (
                            <p className="text-slate-700">No accounts found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-slate-300 text-slate-900">
                                    <thead className="bg-slate-200 text-slate-900">
                                        <tr>
                                            <th className="text-left p-2 border-b border-slate-300 font-semibold">ID</th>
                                            <th className="text-left p-2 border-b border-slate-300 font-semibold">Username</th>
                                            <th className="text-left p-2 border-b border-slate-300 font-semibold">Email</th>
                                            <th className="text-left p-2 border-b border-slate-300 font-semibold">PPU</th>
                                            <th className="text-left p-2 border-b border-slate-300 font-semibold">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((a) => (
                                            <tr key={a.leverancier_id} className="hover:bg-slate-100">
                                                <td className="p-2 border-b border-slate-200 text-slate-900">{a.leverancier_id}</td>
                                                <td className="p-2 border-b border-slate-200 text-slate-900">{a.username}</td>
                                                <td className="p-2 border-b border-slate-200 text-slate-800">{a.email ?? "-"}</td>
                                                <td className="p-2 border-b border-slate-200 text-slate-900">{a.ppu}</td>
                                                <td className="p-2 border-b border-slate-200 text-slate-900">{a.role ?? "user"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
