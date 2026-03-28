"use client";

import { useEffect, useState, useRef } from "react";

type Leverancier = {
    leverancier_id: string;
    leverancier_naam: string | null;
    transporteur: string | null;
    username: string;
    email: string | null;
    ppu: number;
    role: string | null;
};

type CreateLeverancierPayload = {
    leverancier_id: string;
    leverancier_naam: string | null;
    transporteur: string | null;
    username: string;
    password: string;
    email: string | null;
    ppu: number;
    role: string;
};

type PatchLeverancierPayload = {
    leverancier_naam?: string | null;
    transporteur?: string | null;
    email?: string | null;
    ppu?: number;
};

export default function Home() {
    const [accounts, setAccounts] = useState<Leverancier[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [allAccounts, setAllAccounts] = useState<Leverancier[]>([]);

    const ACCOUNTS_PER_PAGE = 10;

    const [form, setForm] = useState({
        leverancier_id: "",
        leverancier_naam: "",
        transporteur: "",
        username: "",
        password: "",
        email: "",
        ppu: "",
    });

    const [selectedAccount, setSelectedAccount] = useState<Leverancier | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editForm, setEditForm] = useState({
        leverancier_naam: "",
        transporteur: "",
        email: "",
        ppu: "",
    });

    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    const inputClass =
        "w-full border border-slate-300 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";

    const fieldRefs = {
        leverancier_id: useRef<HTMLInputElement>(null),
        leverancier_naam: useRef<HTMLInputElement>(null),
        transporteur: useRef<HTMLInputElement>(null),
        username: useRef<HTMLInputElement>(null),
        password: useRef<HTMLInputElement>(null),
        email: useRef<HTMLInputElement>(null),
        ppu: useRef<HTMLInputElement>(null),
    };

    async function fetchAccounts() {
        setLoading(true);
        setError(null);
        setSearchQuery("");

        try {
            const res = await fetch(`${API_BASE}/leveranciers`, { method: "GET" });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch accounts (${res.status}): ${text}`);
            }

            const data = (await res.json()) as Leverancier[];
            setAllAccounts(data);
            setAccounts(data);
            setCurrentPage(1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    function handleSearchChange(query: string) {
        setSearchQuery(query);
        setCurrentPage(1);

        if (query.trim() === "") {
            setAccounts(allAccounts);
            return;
        }

        const queryLower = query.toLowerCase();
        const filtered = allAccounts.filter((account) =>
            account.leverancier_id.toLowerCase().includes(queryLower) ||
            account.leverancier_naam?.toLowerCase().includes(queryLower)
        );
        setAccounts(filtered);
    }

    useEffect(() => {
        fetchAccounts();
    }, []);

    function openCreateModal() {
        setShowCreateModal(true);
        setError(null);
        setSuccessMsg(null);
        setForm({
            leverancier_id: "",
            leverancier_naam: "",
            transporteur: "",
            username: "",
            password: "",
            email: "",
            ppu: "",
        });
        setTimeout(() => fieldRefs.leverancier_id.current?.focus(), 0);
    }

    function closeCreateModal() {
        setShowCreateModal(false);
        setForm({
            leverancier_id: "",
            leverancier_naam: "",
            transporteur: "",
            username: "",
            password: "",
            email: "",
            ppu: "",
        });
    }

    function handleCreateKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>,
        field: string
    ) {
        if (e.key === "Enter") {
            e.preventDefault();
            const fieldOrder = [
                "leverancier_id",
                "leverancier_naam",
                "transporteur",
                "username",
                "password",
                "email",
                "ppu",
            ];
            const currentIndex = fieldOrder.indexOf(field);
            const nextIndex = currentIndex + 1;

            if (nextIndex < fieldOrder.length) {
                const nextField = fieldOrder[nextIndex] as keyof typeof fieldRefs;
                setTimeout(() => {
                    fieldRefs[nextField].current?.focus();
                }, 0);
            }
        }
    }

    function openEditModal(account: Leverancier) {
        setSelectedAccount(account);
        setEditForm({
            leverancier_naam: account.leverancier_naam ?? "",
            transporteur: account.transporteur ?? "",
            email: account.email ?? "",
            ppu: String(account.ppu ?? ""),
        });
        setError(null);
        setSuccessMsg(null);
    }

    function closeEditModal() {
        setSelectedAccount(null);
        setEditForm({
            leverancier_naam: "",
            transporteur: "",
            email: "",
            ppu: "",
        });
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const leverancier_id = String(form.leverancier_id);
            const ppu = Number(form.ppu);

            const payload: CreateLeverancierPayload = {
                leverancier_id,
                leverancier_naam: form.leverancier_naam.trim() === "" ? null : form.leverancier_naam.trim(),
                transporteur: form.transporteur.trim() === "" ? null : form.transporteur.trim(),
                username: form.username.trim(),
                password: form.password,
                email: form.email.trim() === "" ? null : form.email.trim(),
                ppu,
                role: "user",
            };

            if (!payload.username || !payload.password) {
                throw new Error("username and password are required.");
            }

            if (!Number.isFinite(payload.ppu)) {
                throw new Error("leverancier_id and ppu must be valid numbers.");
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
            closeCreateModal();
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePatch(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedAccount) return;

        setUpdating(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const payload: PatchLeverancierPayload = {};

            const trimmedLeverancierNaam = editForm.leverancier_naam.trim();
            const leverancierNaamAsNullable = trimmedLeverancierNaam === "" ? null : trimmedLeverancierNaam;
            if (leverancierNaamAsNullable !== (selectedAccount.leverancier_naam ?? null)) {
                payload.leverancier_naam = leverancierNaamAsNullable;
            }

            const trimmedTransporteur = editForm.transporteur.trim();
            const transporteurAsNullable = trimmedTransporteur === "" ? null : trimmedTransporteur;
            if (transporteurAsNullable !== (selectedAccount.transporteur ?? null)) {
                payload.transporteur = transporteurAsNullable;
            }

            const trimmedEmail = editForm.email.trim();
            const emailAsNullable = trimmedEmail === "" ? null : trimmedEmail;
            if (emailAsNullable !== (selectedAccount.email ?? null)) {
                payload.email = emailAsNullable;
            }

            const parsedPpu = Number(editForm.ppu);
            if (!Number.isFinite(parsedPpu)) {
                throw new Error("ppu must be a valid number.");
            }
            if (parsedPpu !== selectedAccount.ppu) {
                payload.ppu = parsedPpu;
            }

            if (Object.keys(payload).length === 0) {
                closeEditModal();
                return;
            }

            const res = await fetch(
                `${API_BASE}/leveranciers/${selectedAccount.leverancier_id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Update failed (${res.status}): ${text}`);
            }

            setSuccessMsg("Leverancier updated successfully.");
            closeEditModal();
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!selectedAccount) return;

        setDeleting(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE}/leveranciers/${selectedAccount.leverancier_id}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Delete failed (${res.status}): ${text}`);
            }

            setSuccessMsg(`Leverancier ${selectedAccount.leverancier_id} deleted successfully.`);
            closeEditModal();
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setDeleting(false);
        }
    }

    // Pagination logic
    const totalPages = Math.ceil(accounts.length / ACCOUNTS_PER_PAGE);
    const startIndex = (currentPage - 1) * ACCOUNTS_PER_PAGE;
    const endIndex = startIndex + ACCOUNTS_PER_PAGE;
    const paginatedAccounts = accounts.slice(startIndex, endIndex);

    return (
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 bg-slate-100">
            <div className="mx-auto max-w-6xl">
                <section className="bg-white rounded-xl shadow p-6 flex flex-col">
                    {/* Header Row */}
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-xl font-semibold text-[#013c59]">All Accounts</h2>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by ID or leverancier's naam..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={openCreateModal}
                                className="bg-[#013c59] text-white px-4 py-2 rounded-md hover:bg-[#013c59]/90 transition font-semibold"
                            >
                                Create
                            </button>
                            <button
                                onClick={fetchAccounts}
                                className="border border-[#013c59] text-[#013c59] px-4 py-2 rounded-md hover:bg-[#013c59] hover:text-white transition font-semibold"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-700 mb-4">
                        Left click a row to update <strong>leverancier's naam</strong>, <strong>transporteur</strong>, <strong>email</strong> and <strong>ppu</strong>.
                    </p>

                    {loading ? (
                        <p className="text-slate-700">Loading...</p>
                    ) : accounts.length === 0 ? (
                        <p className="text-slate-700">No accounts found.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-300 text-slate-900">
                                    <thead className="bg-slate-200 text-slate-900">
                                        <tr>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Lev-nr</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Lev-naam</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Transporteur</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Username</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Email</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">PPU</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedAccounts.map((a) => (
                                            <tr
                                                key={a.leverancier_id}
                                                className="hover:bg-slate-100 cursor-pointer"
                                                onClick={() => openEditModal(a)}
                                            >
                                                <td className="p-3 border-b border-slate-200">{a.leverancier_id}</td>
                                                <td className="p-3 border-b border-slate-200">{a.leverancier_naam ?? "-"}</td>
                                                <td className="p-3 border-b border-slate-200">{a.transporteur ?? "-"}</td>
                                                <td className="p-3 border-b border-slate-200">{a.username}</td>
                                                <td className="p-3 border-b border-slate-200">{a.email ?? "-"}</td>
                                                <td className="p-3 border-b border-slate-200">{a.ppu}</td>
                                                <td className="p-3 border-b border-slate-200">{a.role ?? "user"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-300">
                                <p className="text-sm text-slate-700">
                                    Showing {accounts.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, accounts.length)} of {accounts.length} accounts
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 rounded-md transition ${currentPage === page
                                                    ? "bg-[#013c59] text-white"
                                                    : "border border-[#013c59] text-[#013c59] hover:bg-[#013c59] hover:text-white"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {successMsg && <p className="text-green-700 text-sm font-semibold mt-4">{successMsg}</p>}
                    {error && <p className="text-red-700 text-sm font-semibold mt-4">{error}</p>}
                </section>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={closeCreateModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">
                            Create Leverancier
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-3">
                            <input
                                ref={fieldRefs.leverancier_id}
                                type="text"
                                className={inputClass}
                                placeholder="LGxxx-xx"
                                value={form.leverancier_id}
                                onChange={(e) => setForm((s) => ({ ...s, leverancier_id: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "leverancier_id")}
                            />

                            <input
                                ref={fieldRefs.leverancier_naam}
                                type="text"
                                className={inputClass}
                                placeholder="Leverancier's naam (optional)"
                                value={form.leverancier_naam}
                                onChange={(e) => setForm((s) => ({ ...s, leverancier_naam: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "leverancier_naam")}
                            />

                            <input
                                ref={fieldRefs.transporteur}
                                type="text"
                                className={inputClass}
                                placeholder="Transporteur (optional)"
                                value={form.transporteur}
                                onChange={(e) => setForm((s) => ({ ...s, transporteur: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "transporteur")}
                            />

                            <input
                                ref={fieldRefs.username}
                                type="text"
                                className={inputClass}
                                placeholder="username"
                                value={form.username}
                                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "username")}
                            />

                            <input
                                ref={fieldRefs.password}
                                type="password"
                                className={inputClass}
                                placeholder="password"
                                value={form.password}
                                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "password")}
                            />

                            <input
                                ref={fieldRefs.email}
                                type="email"
                                className={inputClass}
                                placeholder="email (optional)"
                                value={form.email}
                                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "email")}
                            />

                            <input
                                ref={fieldRefs.ppu}
                                type="number"
                                className={inputClass}
                                placeholder="ppu"
                                value={form.ppu}
                                onChange={(e) => setForm((s) => ({ ...s, ppu: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "ppu")}
                            />

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 bg-[#013c59] text-white py-2 rounded-md disabled:opacity-60"
                                >
                                    {submitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {selectedAccount && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={closeEditModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#013c59]">
                                Update #{selectedAccount.leverancier_id}
                            </h3>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-60 text-sm font-semibold transition"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>

                        <form onSubmit={handlePatch} className="space-y-3">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Leverancier's naam (empty = null)"
                                value={editForm.leverancier_naam}
                                onChange={(e) => setEditForm((s) => ({ ...s, leverancier_naam: e.target.value }))}
                            />

                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Transporteur (empty = null)"
                                value={editForm.transporteur}
                                onChange={(e) => setEditForm((s) => ({ ...s, transporteur: e.target.value }))}
                            />

                            <input
                                type="email"
                                className={inputClass}
                                placeholder="email (empty = null)"
                                value={editForm.email}
                                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                            />

                            <input
                                type="number"
                                className={inputClass}
                                placeholder="ppu"
                                value={editForm.ppu}
                                onChange={(e) => setEditForm((s) => ({ ...s, ppu: e.target.value }))}
                            />

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-1/2 bg-[#013c59] text-white py-2 rounded-md disabled:opacity-60"
                                >
                                    {updating ? "Updating..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
