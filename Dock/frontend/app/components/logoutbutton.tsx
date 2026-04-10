"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
    id: number;
    username: string;
    role: string;
};

export default function AccountMenu() {
    const router = useRouter();
    const [username, setUsername] = useState("...");
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    useEffect(() => {
        async function fetchMe() {
            try {
                const res = await fetch(`${API_BASE}/me`, {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok) return;
                const me = (await res.json()) as MeResponse;
                setUsername(me.username);
            } catch {
                // ignore
            }
        }
        fetchMe();
    }, [API_BASE]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    async function handleLogout() {
        try {
            await fetch(`${API_BASE}/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // ignore
        } finally {
            localStorage.removeItem("token");
            router.push("/");
            router.refresh();
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#012a3e] text-[#b5b500] hover:opacity-90 transition font-semibold"
            >
                <div className="w-8 h-8 rounded-full bg-[#013c59]/20 flex items-center justify-center text-sm font-bold text-[#b5b500]">
                    {username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="text-left leading-tight">
                    <div className="text-xs text-[#b5b500]/80">Logged in as</div>
                    <div className="text-sm font-semibold">{username}</div>
                </div>
                <span className="text-[#013c59]/80">▾</span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-64 rounded-md overflow-hidden shadow-xl border border-slate-700 bg-[#2b2b2b] text-white z-50">
                    <button
                        onClick={() => {
                            setOpen(false);
                            router.push("/account/settings");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[#3a3a3a] transition"
                    >
                        Account Settings
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 hover:bg-[#3a3a3a] transition text-red-300"
                    >
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}
