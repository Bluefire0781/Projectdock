"use client";

import { useEffect, useState, useRef } from "react";

// Types
type Account = {
    id: number;
    username: string;
    email: string | null;
    role: string | null;
};

type Leverancier = {
    leverancier_id: string;
    leverancier_naam: string | null;
    transporteur: string | null;
    ppu: number;
    account_id: number;
    account_username?: string;
};

type CreateLeverancierPayload = {
    leverancier_id: string;
    leverancier_naam: string | null;
    transporteur: string | null;
    ppu: number;
    account_id: number;
};

type PatchLeverancierPayload = {
    leverancier_naam?: string | null;
    transporteur?: string | null;
    ppu?: number;
    account_id?: number;
};

export default function Home() {
    // State
    const [leveranciers, setLeveranciers] = useState<Leverancier[]>([]);
    const [accountsList, setAccountsList] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [allLeveranciers, setAllLeveranciers] = useState<Leverancier[]>([]);

    const [showCreateModal, setShowCreateModal] = useState(false);

    // Edit modal/delete confirm state
    const [selectedLeverancier, setSelectedLeverancier] = useState<Leverancier | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Form state
    const ACCOUNTS_PER_PAGE = 10;
    const [form, setForm] = useState({
        leverancier_id: "",
        leverancier_naam: "",
        transporteur: "",
        ppu: "",
        account_id: "",
        account_search: "",
    });
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        leverancier_naam: "",
        transporteur: "",
        ppu: "",
        account_id: "",
        account_search: "",
    });
    const [filteredEditAccounts, setFilteredEditAccounts] = useState<Account[]>([]);
    const [showEditAccountDropdown, setShowEditAccountDropdown] = useState(false);

    // Refs for form focus
    const fieldRefs = {
        leverancier_id: useRef<HTMLInputElement>(null),
        leverancier_naam: useRef<HTMLInputElement>(null),
        transporteur: useRef<HTMLInputElement>(null),
        ppu: useRef<HTMLInputElement>(null),
        account_search: useRef<HTMLInputElement>(null),
    };

    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";
    const inputClass =
        "w-full border border-slate-300 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";

    // Fetchers
    async function fetchLeveranciers() {
        setLoading(true);
        setError(null);
        setSearchQuery("");

        try {
            const res = await fetch(`${API_BASE}/leveranciers`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch leveranciers (${res.status}): ${text}`);
            }
            const data = (await res.json()) as Leverancier[];

            // Fetch all accounts to map IDs to usernames
            const accountsRes = await fetch(`${API_BASE}/accounts`, {
                method: "GET",
                credentials: "include",
            });
            if (accountsRes.ok) {
                const accountsData = (await accountsRes.json()) as Account[];
                setAccountsList(accountsData);

                const enrichedData = data.map((leverancier) => ({
                    ...leverancier,
                    account_username:
                        accountsData.find((acc) => acc.id === leverancier.account_id)?.username || "Unknown",
                }));

                setAllLeveranciers(enrichedData);
                setLeveranciers(enrichedData);
            } else {
                setAllLeveranciers(data);
                setLeveranciers(data);
            }

            setCurrentPage(1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchLeveranciers();
    }, []);

    // Form Logic
    function handleSearchChange(query: string) {
        setSearchQuery(query);
        setCurrentPage(1);

        if (query.trim() === "") {
            setLeveranciers(allLeveranciers);
            return;
        }

        const queryLower = query.toLowerCase();
        setLeveranciers(
            allLeveranciers.filter(
                (lev) =>
                    lev.leverancier_id.toLowerCase().includes(queryLower) ||
                    lev.leverancier_naam?.toLowerCase().includes(queryLower)
            )
        );
    }

    function handleAccountSearch(query: string) {
        setForm((s) => ({ ...s, account_search: query }));
        if (query.trim() === "") {
            setFilteredAccounts([]);
            setShowAccountDropdown(false);
            return;
        }
        const queryLower = query.toLowerCase();
        setFilteredAccounts(accountsList.filter((acc) => acc.username.toLowerCase().includes(queryLower)));
        setShowAccountDropdown(true);
    }
    function handleEditAccountSearch(query: string) {
        setEditForm((s) => ({ ...s, account_search: query }));
        if (query.trim() === "") {
            setFilteredEditAccounts([]);
            setShowEditAccountDropdown(false);
            return;
        }
        const queryLower = query.toLowerCase();
        setFilteredEditAccounts(accountsList.filter((acc) => acc.username.toLowerCase().includes(queryLower)));
        setShowEditAccountDropdown(true);
    }
    function selectAccount(account: Account) {
        setForm((s) => ({ ...s, account_id: String(account.id), account_search: account.username }));
        setShowAccountDropdown(false);
    }
    function selectEditAccount(account: Account) {
        setEditForm((s) => ({ ...s, account_id: String(account.id), account_search: account.username }));
        setShowEditAccountDropdown(false);
    }

    function handleCreateKeyDown(e: React.KeyboardEvent<HTMLInputElement>, field: string) {
        if (e.key === "Enter") {
            e.preventDefault();
            const fieldOrder = ["leverancier_id", "leverancier_naam", "transporteur", "ppu", "account_search"];
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

    function openCreateModal() {
        setShowCreateModal(true);
        setError(null);
        setSuccessMsg(null);
        setForm({
            leverancier_id: "",
            leverancier_naam: "",
            transporteur: "",
            ppu: "",
            account_id: "",
            account_search: "",
        });
        setFilteredAccounts([]);
        setShowAccountDropdown(false);
        setTimeout(() => fieldRefs.leverancier_id.current?.focus(), 0);
    }
    function closeCreateModal() {
        setShowCreateModal(false);
        setForm({
            leverancier_id: "",
            leverancier_naam: "",
            transporteur: "",
            ppu: "",
            account_id: "",
            account_search: "",
        });
        setFilteredAccounts([]);
        setShowAccountDropdown(false);
    }

    function openEditModal(leverancier: Leverancier) {
        setSelectedLeverancier(leverancier);
        setEditForm({
            leverancier_naam: leverancier.leverancier_naam ?? "",
            transporteur: leverancier.transporteur ?? "",
            ppu: String(leverancier.ppu ?? ""),
            account_id: String(leverancier.account_id ?? ""),
            account_search: leverancier.account_username ?? "",
        });
        setFilteredEditAccounts([]);
        setShowEditAccountDropdown(false);
        setConfirmingDelete(false);
        setError(null);
        setSuccessMsg(null);
    }
    function closeEditModal() {
        setSelectedLeverancier(null);
        setEditForm({
            leverancier_naam: "",
            transporteur: "",
            ppu: "",
            account_id: "",
            account_search: "",
        });
        setFilteredEditAccounts([]);
        setShowEditAccountDropdown(false);
        setConfirmingDelete(false);
    }

    // CRUD Operations
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const leverancier_id = String(form.leverancier_id);
            const ppu = Number(form.ppu);
            const account_id = Number(form.account_id);

            if (!form.account_id) {
                throw new Error("Account is required.");
            }
            const payload: CreateLeverancierPayload = {
                leverancier_id,
                leverancier_naam: form.leverancier_naam.trim() === "" ? null : form.leverancier_naam.trim(),
                transporteur: form.transporteur.trim() === "" ? null : form.transporteur.trim(),
                ppu,
                account_id,
            };
            if (!Number.isFinite(payload.ppu)) {
                throw new Error("ppu must be a valid number.");
            }

            const res = await fetch(`${API_BASE}/leveranciers`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Create failed (${res.status}): ${text}`);
            }

            setSuccessMsg("Leverancier created successfully.");
            closeCreateModal();
            await fetchLeveranciers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePatch(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedLeverancier) return;

        setUpdating(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const payload: PatchLeverancierPayload = {};

            const trimmedLeverancierNaam = editForm.leverancier_naam.trim();
            const leverancierNaamAsNullable = trimmedLeverancierNaam === "" ? null : trimmedLeverancierNaam;
            if (leverancierNaamAsNullable !== (selectedLeverancier.leverancier_naam ?? null)) {
                payload.leverancier_naam = leverancierNaamAsNullable;
            }

            const trimmedTransporteur = editForm.transporteur.trim();
            const transporteurAsNullable = trimmedTransporteur === "" ? null : trimmedTransporteur;
            if (transporteurAsNullable !== (selectedLeverancier.transporteur ?? null)) {
                payload.transporteur = transporteurAsNullable;
            }

            const parsedPpu = Number(editForm.ppu);
            if (!Number.isFinite(parsedPpu)) {
                throw new Error("ppu must be a valid number.");
            }
            if (parsedPpu !== selectedLeverancier.ppu) {
                payload.ppu = parsedPpu;
            }

            const parsedAccountId = Number(editForm.account_id);
            if (parsedAccountId !== selectedLeverancier.account_id) {
                payload.account_id = parsedAccountId;
            }

            if (Object.keys(payload).length === 0) {
                closeEditModal();
                return;
            }

            const res = await fetch(`${API_BASE}/leveranciers/${selectedLeverancier.leverancier_id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Update failed (${res.status}): ${text}`);
            }

            setSuccessMsg("Leverancier updated successfully.");
            closeEditModal();
            await fetchLeveranciers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!selectedLeverancier) return;

        setDeleting(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/leveranciers/${selectedLeverancier.leverancier_id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Delete failed (${res.status}): ${text}`);
            }

            setSuccessMsg(`Leverancier ${selectedLeverancier.leverancier_id} deleted successfully.`);
            closeEditModal();
            await fetchLeveranciers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setDeleting(false);
            setConfirmingDelete(false);
        }
    }

    // Pagination logic
    const totalPages = Math.ceil(leveranciers.length / ACCOUNTS_PER_PAGE);
    const startIndex = (currentPage - 1) * ACCOUNTS_PER_PAGE;
    const endIndex = startIndex + ACCOUNTS_PER_PAGE;
    const paginatedLeveranciers = leveranciers.slice(startIndex, endIndex);

    // Render
    return (
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 bg-slate-100">
            <div className="mx-auto max-w-6xl">
                <section className="bg-white rounded-xl shadow p-6 flex flex-col">
                    {/* Header Row */}
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-xl font-semibold text-[#013c59]">All Leveranciers</h2>
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
                                onClick={fetchLeveranciers}
                                className="border border-[#013c59] text-[#013c59] px-4 py-2 rounded-md hover:bg-[#013c59] hover:text-white transition font-semibold"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-700 mb-4">Click a row to edit or delete.</p>

                    {loading ? (
                        <p className="text-slate-700">Loading...</p>
                    ) : leveranciers.length === 0 ? (
                        <p className="text-slate-700">No leveranciers found.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-300 text-slate-900">
                                    <thead className="bg-slate-200 text-slate-900">
                                        <tr>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Lev-nr</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Lev-naam</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Transporteur</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">PPU</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Account</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLeveranciers.map((lev) => (
                                            <tr
                                                key={lev.leverancier_id}
                                                className="hover:bg-slate-100 cursor-pointer"
                                                onClick={() => openEditModal(lev)}
                                            >
                                                <td className="p-3 border-b border-slate-200">{lev.leverancier_id}</td>
                                                <td className="p-3 border-b border-slate-200">{lev.leverancier_naam ?? "-"}</td>
                                                <td className="p-3 border-b border-slate-200">{lev.transporteur ?? "-"}</td>
                                                <td className="p-3 border-b border-slate-200">{lev.ppu}</td>
                                                <td className="p-3 border-b border-slate-200 font-semibold text-[#013c59]">
                                                    {lev.account_username}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-300">
                                <p className="text-sm text-slate-700">
                                    Showing {leveranciers.length > 0 ? startIndex + 1 : 0} to{" "}
                                    {Math.min(endIndex, leveranciers.length)} of {leveranciers.length} leveranciers
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Create Leverancier</h3>

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
                                ref={fieldRefs.ppu}
                                type="number"
                                className={inputClass}
                                placeholder="ppu"
                                value={form.ppu}
                                onChange={(e) => setForm((s) => ({ ...s, ppu: e.target.value }))}
                                onKeyDown={(e) => handleCreateKeyDown(e, "ppu")}
                            />

                            {/* Account Search with Autocomplete */}
                            <div className="relative">
                                <input
                                    ref={fieldRefs.account_search}
                                    type="text"
                                    className={inputClass}
                                    placeholder="Search account..."
                                    value={form.account_search}
                                    onChange={(e) => handleAccountSearch(e.target.value)}
                                    onKeyDown={(e) => handleCreateKeyDown(e, "account_search")}
                                    onFocus={() => form.account_search && setShowAccountDropdown(true)}
                                />

                                {showAccountDropdown && filteredAccounts.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredAccounts.map((acc) => (
                                            <div
                                                key={acc.id}
                                                onClick={() => selectAccount(acc)}
                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
                                            >
                                                <div className="font-semibold text-[#013c59]">{acc.username}</div>
                                                <div className="text-xs text-slate-600">{acc.email ?? "-"}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

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

            {/* Edit Modal (with inline delete) */}
            {selectedLeverancier && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={closeEditModal}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">
                            Update #{selectedLeverancier.leverancier_id}
                        </h3>

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
                                type="number"
                                className={inputClass}
                                placeholder="ppu"
                                value={editForm.ppu}
                                onChange={(e) => setEditForm((s) => ({ ...s, ppu: e.target.value }))}
                            />

                            {/* Account Search with Autocomplete for Edit */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Search account..."
                                    value={editForm.account_search}
                                    onChange={(e) => handleEditAccountSearch(e.target.value)}
                                    onFocus={() => editForm.account_search && setShowEditAccountDropdown(true)}
                                />

                                {showEditAccountDropdown && filteredEditAccounts.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredEditAccounts.map((acc) => (
                                            <div
                                                key={acc.id}
                                                onClick={() => selectEditAccount(acc)}
                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
                                            >
                                                <div className="font-semibold text-[#013c59]">{acc.username}</div>
                                                <div className="text-xs text-slate-600">{acc.email ?? "-"}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
                                    disabled={updating || deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating || deleting}
                                    className="w-1/2 bg-[#013c59] text-white py-2 rounded-md disabled:opacity-60"
                                >
                                    {updating ? "Updating..." : "Save"}
                                </button>
                            </div>
                        </form>

                        {/* Inline Delete in Edit Modal */}
                        <div className="mt-6">
                            {!confirmingDelete ? (
                                <button
                                    type="button"
                                    onClick={() => setConfirmingDelete(true)}
                                    className="w-full bg-red-100 text-red-700 border border-red-300 rounded-md py-2 font-semibold hover:bg-red-200"
                                    disabled={updating || deleting}
                                >
                                    Delete Leverancier
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-red-700 mb-2 text-center">
                                        Are you sure you want to delete <strong>{selectedLeverancier.leverancier_id}</strong>?
                                        <br />
                                        This cannot be undone.
                                    </p>
                                    <div className="flex gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={() => setConfirmingDelete(false)}
                                            className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
                                            disabled={deleting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="w-1/2 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-60"
                                        >
                                            {deleting ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* End inline delete */}
                    </div>
                </div>
            )}
        </main>
    );
}
