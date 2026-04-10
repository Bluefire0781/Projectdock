"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        try {
            const API_BASE =
                process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

            await fetch(`${API_BASE}/logout`, {
                method: "POST",
                credentials: "include", // send cookie so backend can clear it
            });
        } catch {
            // even if request fails, continue redirect
        } finally {
            // optional cleanup if you still store anything client-side
            localStorage.removeItem("token");
            router.push("/");
            router.refresh();
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="bg-[#b5b500] text-[#013c59] font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
        >
            Log Out
        </button>
    );
}
