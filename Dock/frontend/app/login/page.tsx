"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
    id: number;
    username: string;
    role: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    const inputClass =
        "w-full border border-slate-300 rounded-md px-3 py-2 !text-slate-900 placeholder:text-slate-400 focus:!text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1) login
            const loginRes = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            if (!loginRes.ok) {
                const text = await loginRes.text().catch(() => "");
                console.error("Login failed:", loginRes.status, text);
                setError(
                    loginRes.status === 401
                        ? "Invalid username or password"
                        : `Login failed (${loginRes.status})`
                );
                return;
            }

            // 2) session check
            const meRes = await fetch(`${API_BASE}/me`, {
                method: "GET",
                credentials: "include",
            });

            if (!meRes.ok) {
                const text = await meRes.text().catch(() => "");
                console.error("Me failed:", meRes.status, text);
                setError(`Session verification failed (${meRes.status})`);
                return;
            }

            const me = (await meRes.json()) as MeResponse;

            if (!me?.role) {
                console.error("Invalid /me payload:", me);
                setError("Invalid session payload");
                return;
            }

            // 3) redirect
            if (me.role === "admin") router.push("/admin");
            else if (me.role === "warehouse") router.push("/warehouse");
            else router.push("/user");
        } catch (err) {
            console.error("Login flow crashed:", err);
            setError("Network/CORS error. Check backend + CORS config.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex-1 flex items-start justify-center px-4 pt-16 sm:pt-20 bg-slate-100">
            <section className="w-full max-w-xl bg-white rounded-2xl shadow p-8 sm:p-10">
                <h1 className="text-4xl font-bold text-[#013c59] mb-2">Welcome back</h1>
                <p className="text-slate-500 mb-8 text-lg">Sign in to continue</p>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[#013c59] mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#013c59] mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={inputClass}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#b5bd00] text-[#013c59] font-semibold py-3 rounded-md hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {error && <p className="text-red-700 text-sm font-semibold mt-4">{error}</p>}
            </section>
        </main>
    );
}
