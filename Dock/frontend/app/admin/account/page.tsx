"use client";

import { useEffect, useState, useRef } from "react";

type Account = {
    id: number;
    username: string;
    email: string | null;
    role: string | null;
};

type CreateAccountPayload = {
    username: string;
    password: string;
    email: string | null;
    role: string;
};

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [allAccounts, setAllAccounts] = useState<Account[]>([]);

    const ACCOUNTS_PER_PAGE = 10;

    const [form, setForm] = useState({
        username: "",
        password: "",
        email: "",
    });

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    const inputClass =
        "w-full border border-slate-300 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";

    const fieldRefs = {
        username: useRef<HTMLInputElement>(null),
        password: useRef<HTMLInputElement>(null),
        email: useRef<HTMLInputElement>(null),
    };

    async function fetchAccounts() {
        setLoading(true);
        setError(null);
        setSearchQuery("");

        try {
            const res = await fetch(`${API_BASE}/accounts`, { method: "GET" });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch accounts (${res.status}): ${text}`);
            }

            const data = (await res.json()) as Account[];
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
        const filtered = allAccounts.filter(
            (account) =>
                account.username.toLowerCase().includes(queryLower) ||
                account.email?.toLowerCase().includes(queryLower)
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
            username: "",
            password: "",
            email: "",
        });
        setTimeout(() => fieldRefs.username.current?.focus(), 0);
    }

    function closeCreateModal() {
        setShowCreateModal(false);
        setForm({
            username: "",
            password: "",
            email: "",
        });
    }

    function handleCreateKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>,
        field: string
    ) {
        if (e.key === "Enter") {
            e.preventDefault();
            const fieldOrder = ["username", "password", "email"];
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

    function openDeleteConfirm(account: Account) {
        setSelectedAccount(account);
        setShowDeleteConfirm(true);
        setError(null);
        setSuccessMsg(null);
    }

    function closeDeleteConfirm() {
        setSelectedAccount(null);
        setShowDeleteConfirm(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const payload: CreateAccountPayload = {
                username: form.username.trim(),
                password: form.password,
                email: form.email.trim() === "" ? null : form.email.trim(),
                role: "user",
            };

            if (!payload.username || !payload.password) {
                throw new Error("username and password are required.");
            }

            const res = await fetch(`${API_BASE}/accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Create failed (${res.status}): ${text}`);
            }

            setSuccessMsg("Account created successfully.");
            closeCreateModal();
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!selectedAccount) return;

        setDeleting(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/accounts/${selectedAccount.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Delete failed (${res.status}): ${text}`);
            }

            setSuccessMsg(`Account ${selectedAccount.username} deleted successfully.`);
            closeDeleteConfirm();
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
                                placeholder="Search by username or email..."
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
                        Right click a row to delete an account.
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
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">
                                                ID
                                            </th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">
                                                Username
                                            </th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">
                                                Email
                                            </th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">
                                                Role
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedAccounts.map((account) => (
                                            <tr
                                                key={account.id}
                                                className="hover:bg-slate-100 cursor-pointer"
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    openDeleteConfirm(account);
                                                }}
                                            >
                                                <td className="p-3 border-b border-slate-200">
                                                    {account.id}
                                                </td>
                                                <td className="p-3 border-b border-slate-200 font-semibold">
                                                    {account.username}
                                                </td>
                                                <td className="p-3 border-b border-slate-200">
                                                    {account.email ?? "-"}
                                                </td>
                                                <td className="p-3 border-b border-slate-200">
                                                    {account.role ?? "user"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-300">
                                <p className="text-sm text-slate-700">
                                    Showing {accounts.length > 0 ? startIndex + 1 : 0} to{" "}
                                    {Math.min(endIndex, accounts.length)} of {accounts.length} accounts
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) => Math.max(1, p - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1
                                        ).map((page) => (
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
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {successMsg && (
                        <p className="text-green-700 text-sm font-semibold mt-4">
                            {successMsg}
                        </p>
                    )}
                    {error && (
                        <p className="text-red-700 text-sm font-semibold mt-4">
                            {error}
                        </p>
                    )}
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
                            Create Account
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-3">
                            <input
                                ref={fieldRefs.username}
                                type="text"
                                className={inputClass}
                                placeholder="username"
                                value={form.username}
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        username: e.target.value,
                                    }))
                                }
                                onKeyDown={(e) =>
                                    handleCreateKeyDown(e, "username")
                                }
                            />

                            <input
                                ref={fieldRefs.password}
                                type="password"
                                className={inputClass}
                                placeholder="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        password: e.target.value,
                                    }))
                                }
                                onKeyDown={(e) =>
                                    handleCreateKeyDown(e, "password")
                                }
                            />

                            <input
                                ref={fieldRefs.email}
                                type="email"
                                className={inputClass}
                                placeholder="email (optional)"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, email: e.target.value }))
                                }
                                onKeyDown={(e) => handleCreateKeyDown(e, "email")}
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedAccount && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={closeDeleteConfirm}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-red-600 mb-4">
                            Delete Account?
                        </h3>

                        <p className="text-slate-700 mb-6">
                            Are you sure you want to delete account{" "}
                            <strong>{selectedAccount.username}</strong>? This action
                            cannot be undone.
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
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
                </div>
            )}
        </main>
    );
}
