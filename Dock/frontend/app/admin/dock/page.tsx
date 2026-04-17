"use client";

import { useEffect, useMemo, useState } from "react";

// --- TYPES ---
type Dock = { id: number; status: boolean };
type CreateDockPayload = { status: boolean };
type PatchDockPayload = { status?: boolean };

type RitTypeApi = { id: number; desc: string };
type CreateRitTypePayload = { desc: string };
type PatchRitTypePayload = { desc?: string };

type RitType = {
    id: string;
    description: string;
    dockIds: number[];
};

type LocalAssignmentsState = {
    byRitTypeId: Record<string, number[]>;
};

const LS_ASSIGN_KEY = "dock_rittype_assignments_v1";

export default function DockRitTypeManagerPage() {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    // --- STATE ---
    const inputClass = "w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder:text-slate-600 focus:text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";
    const updateSelectClass = "border border-slate-500 bg-white text-slate-800 rounded px-2 py-1 text-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-[#013c59]/40";

    const [allDocks, setAllDocks] = useState<Dock[]>([]);
    const [loadingDocks, setLoadingDocks] = useState(false);

    const [creatingDock, setCreatingDock] = useState(false);
    const [bulkCreatingDock, setBulkCreatingDock] = useState(false);
    const [updatingDockId, setUpdatingDockId] = useState<number | null>(null);
    const [deletingDockId, setDeletingDockId] = useState<number | null>(null);

    const [ritTypes, setRitTypes] = useState<RitType[]>([]);
    const [selectedRitTypeId, setSelectedRitTypeId] = useState<string | null>(null);
    const [ritTypeEditing, setRitTypeEditing] = useState<RitType | null>(null); // Show edit modal
    const [editModalDesc, setEditModalDesc] = useState(""); // Modal editable desc
    const [isEditModalDeleting, setIsEditModalDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
    const [ritTypeFilter, setRitTypeFilter] = useState<"all" | "unassigned" | string>("all");
    const [assignedStatusFilter, setAssignedStatusFilter] = useState<"all" | "open" | "closed">("all");
    const [selectedDockIds, setSelectedDockIds] = useState<number[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [showCreateDockModal, setShowCreateDockModal] = useState(false);
    const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
    const [showCreateRitTypeModal, setShowCreateRitTypeModal] = useState(false);

    const [createDockFormStatus, setCreateDockFormStatus] = useState<boolean>(true);
    const [bulkCreateStatus, setBulkCreateStatus] = useState<boolean>(true);
    const [bulkCreateCount, setBulkCreateCount] = useState<number>(10);

    // Create modal only has description
    const [ritTypeFormDescription, setRitTypeFormDescription] = useState("");
    const [localAssignments, setLocalAssignments] = useState<Record<string, number[]>>({});

    // --- LOCAL ASSIGNMENTS LOGIC ---
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_ASSIGN_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as LocalAssignmentsState;
            setLocalAssignments(parsed.byRitTypeId ?? {});
        } catch {
            setLocalAssignments({});
        }
    }, []);
    useEffect(() => {
        localStorage.setItem(LS_ASSIGN_KEY, JSON.stringify({ byRitTypeId: localAssignments } as LocalAssignmentsState));
    }, [localAssignments]);

    // --- FETCH ---
    async function fetchDocks() {
        setLoadingDocks(true);
        try {
            const res = await fetch(`${API_BASE}/docks`, { method: "GET", credentials: "include" });
            if (!res.ok) throw new Error(`Failed to fetch docks (${res.status}): ${await res.text()}`);
            const data = (await res.json()) as Dock[];
            setAllDocks(data);

            const valid = new Set(data.map((d) => d.id));
            setSelectedDockIds((prev) => prev.filter((id) => valid.has(id)));
            setLocalAssignments((prev) => {
                const next: Record<string, number[]> = {};
                for (const [k, dockIds] of Object.entries(prev)) {
                    next[k] = dockIds.filter((id) => valid.has(id));
                }
                return next;
            });
        } finally {
            setLoadingDocks(false);
        }
    }
    async function fetchRitTypes() {
        const res = await fetch(`${API_BASE}/rittypes`, { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error(`Failed to fetch rittypes (${res.status}): ${await res.text()}`);
        const apiData = (await res.json()) as RitTypeApi[];
        const mapped: RitType[] = apiData.map((r) => ({
            id: String(r.id),
            description: r.desc,
            dockIds: localAssignments[String(r.id)] ?? [],
        }));
        setRitTypes(mapped);

        if (!selectedRitTypeId && mapped.length) {
            setSelectedRitTypeId(mapped[0].id);
        } else if (selectedRitTypeId && !mapped.some((r) => r.id === selectedRitTypeId)) {
            setSelectedRitTypeId(mapped[0]?.id ?? null);
        }
        const validRtIds = new Set(mapped.map((m) => m.id));
        setLocalAssignments((prev) => {
            const next: Record<string, number[]> = {};
            for (const [k, v] of Object.entries(prev)) {
                if (validRtIds.has(k)) next[k] = v;
            }
            return next;
        });
    }
    async function refreshAll() {
        setError(null);
        try {
            await Promise.all([fetchDocks(), fetchRitTypes()]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }
    useEffect(() => {
        refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        setRitTypes((prev) => prev.map((rt) => ({ ...rt, dockIds: localAssignments[rt.id] ?? [] })));
    }, [localAssignments]);

    // --- MEMOS ---
    const sortedAllDocks = useMemo(() => [...allDocks].sort((a, b) => a.id - b.id), [allDocks]);
    const selectedRitType = useMemo(() => ritTypes.find((r) => r.id === selectedRitTypeId) ?? null, [ritTypes, selectedRitTypeId]);
    const dockToRitTypesMap = useMemo(() => {
        const map = new Map<number, RitType[]>();
        for (const rt of ritTypes) for (const dockId of rt.dockIds) map.set(dockId, [...(map.get(dockId) ?? []), rt]);
        return map;
    }, [ritTypes]);
    const filteredDocks = useMemo(() => {
        const raw = searchQuery.trim().toLowerCase();
        const idTokens = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
        return sortedAllDocks.filter((dock) => {
            const assignedRts = dockToRitTypesMap.get(dock.id) ?? [];
            const matchStatus = statusFilter === "all" || (statusFilter === "open" && dock.status) || (statusFilter === "closed" && !dock.status);
            const matchRitDropdown = ritTypeFilter === "all"
                ? true
                : ritTypeFilter === "unassigned"
                    ? assignedRts.length === 0
                    : assignedRts.some((r) => r.id === ritTypeFilter);
            let matchSearch = true;
            if (raw) {
                if (idTokens.length > 1 || raw.includes(",")) matchSearch = idTokens.some((t) => String(dock.id) === t);
                else matchSearch = String(dock.id).includes(raw);
            }
            return matchStatus && matchRitDropdown && matchSearch;
        });
    }, [sortedAllDocks, searchQuery, statusFilter, ritTypeFilter, dockToRitTypesMap]);
    const assignedDockSet = useMemo(() => new Set(selectedRitType?.dockIds ?? []), [selectedRitType]);
    const assignedDocks = useMemo(() => (!selectedRitType ? [] : sortedAllDocks.filter((d) => assignedDockSet.has(d.id))), [selectedRitType, sortedAllDocks, assignedDockSet]);
    const filteredAssignedDocks = useMemo(() => assignedDocks.filter((dock) => assignedStatusFilter === "all" ? true : assignedStatusFilter === "open" ? dock.status : !dock.status), [assignedDocks, assignedStatusFilter]);
    const unassignedFilteredDocks = useMemo(() => filteredDocks.filter((d) => !assignedDockSet.has(d.id)), [filteredDocks, assignedDockSet]);

    // --- RITTYPE CREATE / EDIT MODAL LOGIC ---
    function openRitTypeModal() {
        setRitTypeFormDescription("");
        setShowCreateRitTypeModal(true);
    }
    async function createRitTypeFromModal() {
        const desc = ritTypeFormDescription.trim();
        if (!desc) return setError("Description is required.");
        try {
            const res = await fetch(`${API_BASE}/rittypes`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ desc } as CreateRitTypePayload),
            });
            if (!res.ok) throw new Error(`Create RitType failed (${res.status}): ${await res.text()}`);
            const created = (await res.json()) as RitTypeApi;
            const newId = String(created.id);
            setLocalAssignments((prev) => ({ ...prev, [newId]: [] }));
            setShowCreateRitTypeModal(false);
            setSelectedRitTypeId(newId);
            setRitTypeFormDescription("");
            setSuccessMsg("RitType created.");
            await fetchRitTypes();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }

    function beginEditRitType(rt: RitType) {
        setRitTypeEditing(rt);
        setEditModalDesc(rt.description);
        setError(null);
        setSuccessMsg(null);
        setIsEditModalDeleting(false);
    }

    function closeEditRitTypeModal() {
        setRitTypeEditing(null);
        setError(null);
        setIsEditModalDeleting(false);
    }

    async function saveEditRitType() {
        if (!ritTypeEditing) return;
        const desc = editModalDesc.trim();
        if (!desc) return setError("Description is required.");

        try {
            const res = await fetch(`${API_BASE}/rittypes/${ritTypeEditing.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ desc } as PatchRitTypePayload),
            });
            if (!res.ok) throw new Error(`Update RitType failed (${res.status}): ${await res.text()}`);
            setSuccessMsg("RitType updated.");
            await fetchRitTypes();
            closeEditRitTypeModal();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }

    async function deleteRitTypeModal() {
        if (!ritTypeEditing) return;
        setIsEditModalDeleting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const res = await fetch(`${API_BASE}/rittypes/${ritTypeEditing.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Delete RitType failed (${res.status}): ${await res.text()}`);
            setLocalAssignments((prev) => {
                const next = { ...prev };
                delete next[ritTypeEditing.id];
                return next;
            });
            await fetchRitTypes();
            setSuccessMsg("RitType deleted.");
            closeEditRitTypeModal();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setIsEditModalDeleting(false);
        }
    }

    // --- DOCKS / BULK CREATE / UPDATE LOGIC ---
    async function createDockWithStatus(status: boolean) {
        const res = await fetch(`${API_BASE}/docks`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status } as CreateDockPayload),
        });
        if (!res.ok) throw new Error(`Create dock failed (${res.status}): ${await res.text()}`);
    }
    async function handleCreateSingleDock() {
        setCreatingDock(true); setError(null);
        try { await createDockWithStatus(createDockFormStatus); setShowCreateDockModal(false); setSuccessMsg("Dock created."); await fetchDocks(); } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
        finally { setCreatingDock(false); }
    }
    async function handleBulkCreateDock() {
        setBulkCreatingDock(true); setError(null);
        try {
            if (!Number.isInteger(bulkCreateCount) || bulkCreateCount <= 0) throw new Error("Bulk count must be a positive integer.");
            if (bulkCreateCount > 200) throw new Error("Bulk count too high (max 200).");
            const results = await Promise.all(Array.from({ length: bulkCreateCount }).map(() =>
                fetch(`${API_BASE}/docks`, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: bulkCreateStatus } as CreateDockPayload),
                })
            ));
            const failed = results.filter((r) => !r.ok);
            if (failed.length) throw new Error(`${failed.length}/${bulkCreateCount} bulk creates failed.`);
            setShowBulkCreateModal(false); setSuccessMsg(`${bulkCreateCount} docks created.`); await fetchDocks();
        } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
        finally { setBulkCreatingDock(false); }
    }
    async function updateDockStatus(dock: Dock, nextStatus: boolean) {
        if (dock.status === nextStatus) return;
        setUpdatingDockId(dock.id); setError(null);
        try {
            const res = await fetch(`${API_BASE}/docks/${dock.id}`, {
                method: "PATCH", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus } as PatchDockPayload),
            });
            if (!res.ok) throw new Error(`Update dock failed (${res.status}): ${await res.text()}`);
            setSuccessMsg(`Dock ${dock.id} updated.`); await fetchDocks();
        } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
        finally { setUpdatingDockId(null); }
    }
    async function deleteDock(dockId: number) {
        setDeletingDockId(dockId); setError(null);
        try {
            const res = await fetch(`${API_BASE}/docks/${dockId}`, {
                method: "DELETE", credentials: "include"
            }); if (!res.ok) throw new Error(`Delete dock failed (${res.status}): ${await res.text()}`);
            setLocalAssignments((prev) => {
                const next: Record<string, number[]> = {};
                for (const [rtId, ids] of Object.entries(prev)) next[rtId] = ids.filter((id) => id !== dockId);
                return next;
            });
            setSelectedDockIds((prev) => prev.filter((id) => id !== dockId));
            setSuccessMsg(`Dock ${dockId} deleted.`);
            await fetchDocks();
        } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
        finally { setDeletingDockId(null); }
    }
    function toggleDockSelection(dockId: number) {
        setSelectedDockIds((prev) =>
            prev.includes(dockId) ? prev.filter((id) => id !== dockId) : [...prev, dockId]
        );
    }
    function selectVisible() {
        const visibleIds = unassignedFilteredDocks.map((d) => d.id);
        setSelectedDockIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
    function clearSelection() { setSelectedDockIds([]); }
    function assignSelectedToCurrentRitType() {
        if (!selectedRitTypeId) return setError("Select a RitType first.");
        if (!selectedDockIds.length) return setError("Select at least one dock.");
        setLocalAssignments((prev) => {
            const current = prev[selectedRitTypeId] ?? [];
            return {
                ...prev,
                [selectedRitTypeId]: Array.from(new Set([...current, ...selectedDockIds])),
            };
        });
        setSuccessMsg(`Assigned ${selectedDockIds.length} dock(s) locally.`);
    }
    function unassignSelectedFromCurrentRitType() {
        if (!selectedRitTypeId) return setError("Select a RitType first.");
        if (!selectedDockIds.length) return setError("Select at least one dock.");
        setLocalAssignments((prev) => {
            const current = prev[selectedRitTypeId] ?? [];
            return {
                ...prev,
                [selectedRitTypeId]: current.filter((id) => !selectedDockIds.includes(id)),
            };
        });
        setSuccessMsg(`Unassigned ${selectedDockIds.length} dock(s) locally.`);
    }
    function clearLocalAssignments() {
        setLocalAssignments({});
        setSelectedDockIds([]);
        setSuccessMsg("All local assignments cleared.");
    }

    // --- RENDER ---
    return (
        <main className="flex-1 bg-slate-100 overflow-y-auto h-[calc(100dvh-64px)] overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 pb-3">
                <section className="bg-white rounded-xl shadow p-4 sm:p-5 border border-slate-200">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h1 className="text-3xl font-semibold text-[#013c59]">Dock ⇄ RitType Manager</h1>
                        <div className="flex items-center gap-2">
                            <button onClick={openRitTypeModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md">Create RitType</button>
                            <button onClick={() => setShowCreateDockModal(true)} className="bg-[#013c59] text-white px-4 py-2 rounded-md">Create Dock</button>
                            <button onClick={() => setShowBulkCreateModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md">Bulk Create</button>
                            <button onClick={refreshAll} className="border border-[#013c59] text-[#013c59] px-4 py-2 rounded-md">{loadingDocks ? "Refreshing..." : "Refresh"}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[410px]">
                        {/* RitType panel */}
                        <aside className="xl:col-span-3 border border-slate-300 rounded-lg p-3">
                            <h2 className="text-4xl font-bold text-[#013c59] mb-3">RitTypes</h2>
                            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
                                {ritTypes.map((rt) => {
                                    const active = rt.id === selectedRitTypeId;
                                    return (
                                        <div
                                            key={rt.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedRitTypeId(rt.id)}
                                            onKeyPress={e => { if (e.key === " " || e.key === "Enter") setSelectedRitTypeId(rt.id) }}
                                            className={`w-full text-left rounded-md border px-3 py-2 transition cursor-pointer outline-none ${active
                                                ? "bg-[#013c59] text-white border-[#013c59]"
                                                : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="font-semibold line-clamp-2">
                                                {rt.description}
                                            </div>
                                            <div className={`text-sm ${active ? "text-slate-100" : "text-slate-600"}`}>{rt.dockIds.length} dock(s)</div>
                                            <div className="mt-2 flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => beginEditRitType(rt)}
                                                    className="text-xs px-2 py-1 rounded border border-blue-400 text-blue-600 hover:bg-blue-50"
                                                >Edit</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={clearLocalAssignments} className="mt-3 w-full border border-amber-400 text-amber-700 px-3 py-2 rounded-md">Clear all local assignments</button>
                        </aside>
                        {/* Assignment Canvas */}
                        <section className="xl:col-span-5 border border-slate-300 rounded-lg p-3">
                            <h2 className="text-3xl font-semibold text-[#013c59] mb-2">Assignment Canvas</h2>
                            <p className="text-slate-700 mb-2">Selected: <span className="font-semibold">{selectedRitType?.description ?? "None"}</span></p>
                            <div className="flex gap-2 mb-3">
                                <button onClick={assignSelectedToCurrentRitType} className="bg-emerald-600 text-white px-3 py-2 rounded-md">
                                    Assign selected →
                                </button>
                                <button onClick={unassignSelectedFromCurrentRitType} className="bg-amber-500 text-white px-3 py-2 rounded-md">
                                    ← Unassign selected
                                </button>
                            </div>
                            <div className="mb-2 flex items-center gap-2">
                                <label className="text-sm font-semibold text-slate-700">Assigned status:</label>
                                <select className="border border-slate-300 rounded-md px-2 py-1 text-sm text-slate-800 bg-white"
                                    value={assignedStatusFilter}
                                    onChange={e => setAssignedStatusFilter(e.target.value as "all" | "open" | "closed")}
                                >
                                    <option value="all">All</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="border border-slate-300 rounded-md overflow-hidden">
                                <div className="px-3 py-2 bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
                                    Assigned Docks
                                </div>
                                <div className="p-3 h-[285px] overflow-y-auto bg-slate-50">
                                    {filteredAssignedDocks.map((dock) => (
                                        <div
                                            key={dock.id}
                                            className="flex items-center justify-between border border-slate-300 bg-white rounded-md px-3 py-2 mb-2"
                                        >
                                            <p className="font-semibold text-slate-800">
                                                Dock {dock.id} <span className="text-slate-700">({dock.status ? "Open" : "Closed"})</span>
                                            </p>
                                        </div>
                                    ))}
                                    {filteredAssignedDocks.length === 0 &&
                                        <p className="text-sm text-slate-600">No assigned docks for this status filter.</p>
                                    }
                                </div>
                            </div>
                        </section>
                        {/* Docks panel */}
                        <section className="xl:col-span-4 border border-slate-300 rounded-lg p-3">
                            <h2 className="text-3xl font-semibold text-[#013c59] mb-2">Docks</h2>
                            <div className="space-y-2 mb-2">
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search dock ID (e.g. "1" or "1,2,3")' className={inputClass} />
                                <select className={inputClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                                    <option value="all">All statuses</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <select className={inputClass} value={ritTypeFilter} onChange={e => setRitTypeFilter(e.target.value)}>
                                    <option value="all">All RitTypes</option>
                                    <option value="unassigned">Unassigned only</option>
                                    {ritTypes.map((rt) => (
                                        <option key={rt.id} value={rt.id}>{rt.description}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="border border-slate-300 rounded-md h-[320px] overflow-y-auto overflow-x-hidden">
                                {filteredDocks.map((dock) => {
                                    const assignedRts = dockToRitTypesMap.get(dock.id) ?? [];
                                    return (
                                        <div key={dock.id} className="grid grid-cols-[20px_minmax(0,1fr)_92px_64px] items-center gap-2 p-2 border-b border-slate-200">
                                            <input type="checkbox" checked={selectedDockIds.includes(dock.id)} onChange={() => toggleDockSelection(dock.id)} />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 truncate">
                                                    Dock {dock.id} <span className="text-slate-700">({dock.status ? "Open" : "Closed"})</span>
                                                </p>
                                                <p className="text-xs text-slate-600 truncate">
                                                    {assignedRts.length ? `RitTypes: ${assignedRts.map((r) => r.description).join(", ")}` : "Unassigned"}
                                                </p>
                                            </div>
                                            <select value={String(dock.status)} onChange={e => updateDockStatus(dock, e.target.value === "true")} disabled={updatingDockId === dock.id} className={updateSelectClass}>
                                                <option value="true">Open</option>
                                                <option value="false">Closed</option>
                                            </select>
                                            <button
                                                onClick={() => deleteDock(dock.id)}
                                                disabled={deletingDockId === dock.id}
                                                className="border border-red-400 text-red-600 px-2 py-1 rounded text-sm"
                                            >
                                                {deletingDockId === dock.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={selectVisible} className="border border-slate-300 text-slate-800 px-2 py-1 rounded text-sm">Select visible</button>
                                <button onClick={clearSelection} className="border border-slate-300 text-slate-800 px-2 py-1 rounded text-sm">Clear</button>
                            </div>
                        </section>
                    </div>
                    {successMsg && <p className="text-green-700 text-sm font-semibold mt-2">{successMsg}</p>}
                    {error && <p className="text-red-700 text-sm font-semibold mt-2">{error}</p>}
                </section>
            </div>

            {/* Create RitType Modal (description only) */}
            {showCreateRitTypeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowCreateRitTypeModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Create RitType</h3>
                        <div className="space-y-3">
                            <textarea value={ritTypeFormDescription} onChange={e => setRitTypeFormDescription(e.target.value)} placeholder="Description" className={`${inputClass} min-h-[100px] resize-y`} />
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setShowCreateRitTypeModal(false)} className="w-1/2 border border-slate-300 text-slate-800 py-2 rounded-md hover:bg-slate-100">Cancel</button>
                                <button type="button" onClick={createRitTypeFromModal} className="w-1/2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit RitType Modal */}
            {ritTypeEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={closeEditRitTypeModal}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Edit RitType</h3>
                        <textarea value={editModalDesc} onChange={e => setEditModalDesc(e.target.value)} placeholder="Description" className={`${inputClass} min-h-[100px] resize-y`} />
                        <div className="flex gap-2 pt-4">
                            <button type="button" onClick={closeEditRitTypeModal} className="w-1/2 border border-slate-300 text-slate-800 py-2 rounded-md hover:bg-slate-100">Cancel</button>
                            <button type="button" onClick={saveEditRitType} className="w-1/2 bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700">Update</button>
                        </div>
                        <button type="button" onClick={deleteRitTypeModal} disabled={isEditModalDeleting} className="w-full mt-6 border border-red-400 text-white bg-red-500 py-2 rounded-md hover:bg-red-700">
                            {isEditModalDeleting ? "Deleting..." : "Delete"}
                        </button>
                        {error && <p className="text-red-700 text-sm font-semibold mt-4">{error}</p>}
                        {successMsg && <p className="text-green-700 text-sm font-semibold mt-4">{successMsg}</p>}
                    </div>
                </div>
            )}

            {/* Create Dock Modal */}
            {showCreateDockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowCreateDockModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Create Dock</h3>
                        <div className="space-y-3">
                            <select className={inputClass} value={String(createDockFormStatus)} onChange={e => setCreateDockFormStatus(e.target.value === "true")}>
                                <option value="true">Open</option>
                                <option value="false">Closed</option>
                            </select>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setShowCreateDockModal(false)} className="w-1/2 border border-slate-300 text-slate-800 py-2 rounded-md hover:bg-slate-100">Cancel</button>
                                <button type="button" onClick={handleCreateSingleDock} disabled={creatingDock} className="w-1/2 bg-[#013c59] text-white py-2 rounded-md disabled:opacity-60">{creatingDock ? "Creating..." : "Create"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Create Modal */}
            {showBulkCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowBulkCreateModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Bulk Create Docks</h3>
                        <div className="space-y-3">
                            <select className={inputClass} value={String(bulkCreateStatus)} onChange={e => setBulkCreateStatus(e.target.value === "true")}>
                                <option value="true">Open</option>
                                <option value="false">Closed</option>
                            </select>
                            <input type="number" min={1} max={200} value={bulkCreateCount} onChange={e => setBulkCreateCount(Number(e.target.value))} className={inputClass} placeholder="How many docks?" />
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setShowBulkCreateModal(false)} className="w-1/2 border border-slate-300 text-slate-800 py-2 rounded-md hover:bg-slate-100">Cancel</button>
                                <button type="button" onClick={handleBulkCreateDock} disabled={bulkCreatingDock} className="w-1/2 bg-emerald-600 text-white py-2 rounded-md disabled:opacity-60">
                                    {bulkCreatingDock ? "Creating..." : `Create ${bulkCreateCount}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
