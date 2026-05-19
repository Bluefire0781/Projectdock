"use client";

import { useEffect, useMemo, useState } from "react";

// Types
type Dock = { id: number; status: boolean };
type Assignment = { dock_id: number; rit_type: number };
type RitTypeApi = { id: number; rittypeid: number; description: string };

type RitType = {
    id: string;
    rittypeid: number;
    description: string;
    dockIds: number[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://app.local/api";
const inputClass = "w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 placeholder:text-slate-600 focus:text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";
const updateSelectClass = "border border-slate-500 bg-white text-slate-800 rounded px-2 py-1 text-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-[#013c59]/40";

// Out-of-component (best practice)
async function createDockWithStatus(API_BASE: string, status: boolean) {
    const res = await fetch(`${API_BASE}/docks`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Create dock failed (${res.status}): ${await res.text()}`);
}

export default function DockRitTypeManagerPage() {
    const [allDocks, setAllDocks] = useState<Dock[]>([]);
    const [loadingDocks, setLoadingDocks] = useState(false);
    const [creatingDock, setCreatingDock] = useState(false);
    const [bulkCreatingDock, setBulkCreatingDock] = useState(false);
    const [updatingDockId, setUpdatingDockId] = useState<number | null>(null);
    const [deletingDockId, setDeletingDockId] = useState<number | null>(null);

    const [ritTypes, setRitTypes] = useState<RitType[]>([]);
    const [selectedRitTypeId, setSelectedRitTypeId] = useState<string | null>(null);
    const [ritTypeEditing, setRitTypeEditing] = useState<RitType | null>(null);
    const [editModalDescription, setEditModalDescription] = useState("");
    const [editModalRitTypeId, setEditModalRitTypeId] = useState<number | null>(null);
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

    // MODAL: RitType creation
    const [ritTypeFormDescription, setRitTypeFormDescription] = useState("");
    const [ritTypeFormNumber, setRitTypeFormNumber] = useState<number>(0);

    // Assignment table state from backend
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    // No need for assignmentVersion anymore!

    // ------------------------------
    // NEW: Parallel fetch-all logic
    // ------------------------------
    async function fetchAllInitialData() {
        setLoadingDocks(true);
        setError(null);
        try {
            const [docksRes, assignmentsRes, ritTypesRes] = await Promise.all([
                fetch(`${API_BASE}/docks`, { method: "GET", credentials: "include" }),
                fetch(`${API_BASE}/toegestanedock`, { method: "GET", credentials: "include" }),
                fetch(`${API_BASE}/rittypes`, { method: "GET", credentials: "include" }),
            ]);
            if (!docksRes.ok) throw new Error(`Failed to fetch docks (${docksRes.status}): ${await docksRes.text()}`);
            if (!assignmentsRes.ok) throw new Error(`Failed to fetch assignments (${assignmentsRes.status}): ${await assignmentsRes.text()}`);
            if (!ritTypesRes.ok) throw new Error(`Failed to fetch rittypes (${ritTypesRes.status}): ${await ritTypesRes.text()}`);

            const [docks, assignmentsData, ritTypesApiData] = await Promise.all([
                docksRes.json(),
                assignmentsRes.json(),
                ritTypesRes.json(),
            ]);
            setAllDocks(docks);
            setAssignments(assignmentsData);

            // Rebuild ritTypes with assignments mapping:
            const ritTypesMapped: RitType[] = ritTypesApiData.map((r: RitTypeApi) => ({
                id: String(r.id),
                rittypeid: r.rittypeid,
                description: r.description,
                dockIds: assignmentsData.filter((a: Assignment) => a.rit_type === r.rittypeid).map((a: Assignment) => a.dock_id),
            }));
            setRitTypes(ritTypesMapped);

            // handle initial selection if needed
            if (!selectedRitTypeId && ritTypesMapped.length) {
                setSelectedRitTypeId(ritTypesMapped[0].id);
            } else if (selectedRitTypeId && !ritTypesMapped.some((r) => r.id === selectedRitTypeId)) {
                setSelectedRitTypeId(ritTypesMapped[0]?.id ?? null);
            }

            const valid = new Set(docks.map((d: Dock) => d.id));
            setSelectedDockIds((prev) => prev.filter((id) => valid.has(id)));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoadingDocks(false);
        }
    }

    // -----------------------------------------------
    // Only ONE effect needed for initial page mount:
    // -----------------------------------------------
    useEffect(() => {
        fetchAllInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Derived state logic (unchanged)
    const sortedAllDocks = useMemo(() => [...allDocks].sort((a, b) => a.id - b.id), [allDocks]);
    const selectedRitType = useMemo(
        () => ritTypes.find((r) => r.id === selectedRitTypeId) ?? null,
        [ritTypes, selectedRitTypeId]
    );
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
            const matchStatus =
                statusFilter === "all" ||
                (statusFilter === "open" && dock.status) ||
                (statusFilter === "closed" && !dock.status);
            const matchRitDropdown =
                ritTypeFilter === "all"
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
    const assignedDocks = useMemo(
        () => (!selectedRitType ? [] : sortedAllDocks.filter((d) => assignedDockSet.has(d.id))),
        [selectedRitType, sortedAllDocks, assignedDockSet]
    );
    const filteredAssignedDocks = useMemo(
        () => assignedDocks.filter((dock) => assignedStatusFilter === "all" ? true : assignedStatusFilter === "open" ? dock.status : !dock.status),
        [assignedDocks, assignedStatusFilter]
    );
    const unassignedFilteredDocks = useMemo(
        () => filteredDocks.filter((d) => !assignedDockSet.has(d.id)),
        [filteredDocks, assignedDockSet]
    );

    // Assignment actions (backend-managed)
    async function assignSelectedToCurrentRitType() {
        if (!selectedRitTypeId) return setError("Select a RitType first.");
        if (!selectedDockIds.length) return setError("Select at least one dock.");
        const rt = ritTypes.find(rt => rt.id === selectedRitTypeId);
        if (!rt) return;
        try {
            for (const dockId of selectedDockIds) {
                await fetch(`${API_BASE}/toegestanedock`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dock_id: dockId, rit_type: rt.rittypeid }),
                });
            }
            setSuccessMsg(`Assigned ${selectedDockIds.length} dock(s) in database.`);
            // Refresh all data to get the updated assignments
            await fetchAllInitialData();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }
    async function unassignSelectedFromCurrentRitType() {
        if (!selectedRitTypeId) return setError("Select a RitType first.");
        if (!selectedDockIds.length) return setError("Select at least one dock.");
        const rt = ritTypes.find(rt => rt.id === selectedRitTypeId);
        if (!rt) return;
        try {
            for (const dockId of selectedDockIds) {
                await fetch(`${API_BASE}/toegestanedock/${dockId}/${rt.rittypeid}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }
            setSuccessMsg(`Unassigned ${selectedDockIds.length} dock(s) in database.`);
            await fetchAllInitialData();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }

    // Local (UI only) selection actions
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

    async function handleCreateSingleDock() {
        setCreatingDock(true); setError(null);
        try {
            await createDockWithStatus(API_BASE, createDockFormStatus);
            setShowCreateDockModal(false);
            setSuccessMsg("Dock created.");
            await fetchAllInitialData();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setCreatingDock(false);
        }
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
                    body: JSON.stringify({ status: bulkCreateStatus }),
                })
            ));
            const failed = results.filter((r) => !r.ok);
            if (failed.length) throw new Error(`${failed.length}/${bulkCreateCount} bulk creates failed.`);
            setShowBulkCreateModal(false); setSuccessMsg(`${bulkCreateCount} docks created.`); await fetchAllInitialData();
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
                body: JSON.stringify({ status: nextStatus }),
            });
            if (!res.ok) throw new Error(`Update dock failed (${res.status}): ${await res.text()}`);
            // Optimistic state update to avoid flicker:
            setAllDocks(prev =>
                prev.map(d =>
                    d.id === dock.id ? { ...d, status: nextStatus } : d
                )
            );
            setSuccessMsg(`Dock ${dock.id} updated.`);
            // Optionally, re-fetch all to update derived state:
            // await fetchAllInitialData();
        } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
        finally { setUpdatingDockId(null); }
    }
    async function deleteDock(dockId: number) {
        setDeletingDockId(dockId); setError(null);
        try {
            const res = await fetch(`${API_BASE}/docks/${dockId}`, {
                method: "DELETE", credentials: "include"
            });
            if (!res.ok) throw new Error(`Delete dock failed (${res.status}): ${await res.text()}`);
            setSuccessMsg(`Dock ${dockId} deleted.`);
            await fetchAllInitialData();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setDeletingDockId(null);
        }
    }

    async function createRitTypeFromModal() {
        const description = ritTypeFormDescription.trim();
        const rittypeid = ritTypeFormNumber;
        if (!description) return setError("Description is required.");
        if (!rittypeid || Number.isNaN(rittypeid)) return setError("RitType number is required.");
        try {
            const res = await fetch(`${API_BASE}/rittypes`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rittypeid, description }),
            });
            if (!res.ok) throw new Error(`Create RitType failed (${res.status}): ${await res.text()}`);
            setShowCreateRitTypeModal(false);
            setRitTypeFormDescription("");
            setRitTypeFormNumber(0);
            setSuccessMsg("RitType created.");
            await fetchAllInitialData();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }

    function beginEditRitType(rt: RitType) {
        setRitTypeEditing(rt);
        setEditModalDescription(rt.description);
        setEditModalRitTypeId(rt.rittypeid);
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
        const description = editModalDescription.trim();
        const rittypeid = editModalRitTypeId;
        if (!description) return setError("Description is required.");
        if (!rittypeid || Number.isNaN(rittypeid)) return setError("RitType number is required.");
        try {
            const res = await fetch(`${API_BASE}/rittypes/${ritTypeEditing.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rittypeid, description }),
            });
            if (!res.ok) throw new Error(`Update IORtype failed (${res.status}): ${await res.text()}`);
            setSuccessMsg("IORtype updated.");
            await fetchAllInitialData();
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
            if (!res.ok) throw new Error(`Delete IORtype failed (${res.status}): ${await res.text()}`);
            setSuccessMsg("IORtype deleted.");
            closeEditRitTypeModal();
            await fetchAllInitialData();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setIsEditModalDeleting(false);
        }
    }

    function openRitTypeModal() {
        setRitTypeFormDescription("");
        setRitTypeFormNumber(0);
        setShowCreateRitTypeModal(true);
    }

    // --- Refactor: Extract nested ternary for docks panel display ---
    let docksContent;
    if (loadingDocks) {
        docksContent = <p>Loading...</p>;
    } else if (filteredDocks.length === 0) {
        docksContent = <p>No docks found.</p>;
    } else {
        docksContent = (
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
                                    {assignedRts.length
                                        ? `${assignedRts.map((r) => `${r.rittypeid}: ${r.description}`).join(", ")}`
                                        : "Unassigned"}
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
                                type="button"
                            >
                                {deletingDockId === dock.id ? "..." : "Delete"}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    }

    // --- Refactor: Extract nested ternary for assignment canvas assigned docks ---
    let assignedDocksContent;
    if (filteredAssignedDocks.length === 0) {
        assignedDocksContent = (
            <p className="text-sm text-slate-600">No assigned docks for this status filter.</p>
        );
    } else {
        assignedDocksContent = (
            <>
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
            </>
        );
    }

    return (
        <main className="flex-1 bg-slate-100 overflow-y-auto h-[calc(100dvh-64px)] overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 pb-3">
                <section className="bg-white rounded-xl shadow p-4 sm:p-5 border border-slate-200">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h1 className="text-3xl font-semibold text-[#013c59]">Dock ⇄ IORtype Manager</h1>
                        <div className="flex items-center gap-2">
                            <button onClick={openRitTypeModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md" type="button">Create IORtype</button>
                            <button onClick={() => setShowCreateDockModal(true)} className="bg-[#013c59] text-white px-4 py-2 rounded-md" type="button">Create Dock</button>
                            <button onClick={() => setShowBulkCreateModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md" type="button">Bulk Create</button>
                            <button
                                onClick={fetchAllInitialData}
                                className="border border-[#013c59] text-[#013c59] px-4 py-2 rounded-md"
                                type="button"
                            >
                                {loadingDocks ? "Refreshing..." : "Refresh"}
                            </button>                        </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[410px]">
                        {/* RitTypes sidebar */}
                        <aside className="xl:col-span-3 border border-slate-300 rounded-lg p-3">
                            <h2 className="text-4xl font-bold text-[#013c59] mb-3">IORtypes</h2>
                            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
                                {ritTypes.map((rt) => {
                                    const active = rt.id === selectedRitTypeId;
                                    return (
                                        <div
                                            key={rt.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedRitTypeId(rt.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") setSelectedRitTypeId(rt.id);
                                            }}
                                            className={`w-full text-left rounded-md border px-3 py-2 transition cursor-pointer outline-none ${active
                                                ? "bg-[#013c59] text-white border-[#013c59]"
                                                : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="font-semibold line-clamp-2">
                                                {rt.rittypeid}: {rt.description}
                                            </div>
                                            <div className={`text-sm ${active ? "text-slate-100" : "text-slate-600"}`}>{rt.dockIds.length} dock(s)</div>
                                            <div className="mt-2 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); beginEditRitType(rt); }}
                                                    className="text-xs px-2 py-1 rounded border border-blue-400 text-blue-600 hover:bg-blue-50"
                                                >Edit</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </aside>
                        {/* Assignment Canvas */}
                        <section className="xl:col-span-5 border border-slate-300 rounded-lg p-3">
                            <h2 className="text-3xl font-semibold text-[#013c59] mb-2">Assignment Canvas</h2>
                            <p className="text-slate-700 mb-2">Selected: <span className="font-semibold">{selectedRitType?.description ?? "None"}</span></p>
                            <div className="flex gap-2 mb-3">
                                <button onClick={assignSelectedToCurrentRitType} className="bg-emerald-600 text-white px-3 py-2 rounded-md" type="button">
                                    Assign selected →
                                </button>
                                <button onClick={unassignSelectedFromCurrentRitType} className="bg-amber-500 text-white px-3 py-2 rounded-md" type="button">
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
                                    {assignedDocksContent}
                                </div>
                            </div>
                        </section>
                        {/* Docks panel */}
                        <section className="xl:col-span-4 border border-slate-300 rounded-lg p-3">
                            <h2 className="text-3xl font-semibold text-[#013c59] mb-2">Docks</h2>
                            <div className="space-y-2 mb-2">
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search dock ID (e.g. "1" or "1,2,3")' className={inputClass} />
                                <select className={inputClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}>
                                    <option value='all'>All statuses</option>
                                    <option value='open'>Open</option>
                                    <option value='closed'>Closed</option>
                                </select>
                                <select className={inputClass} value={ritTypeFilter} onChange={e => setRitTypeFilter(e.target.value)}>
                                    <option value='all'>All IORtypes</option>
                                    <option value='unassigned'>Unassigned only</option>
                                    {ritTypes.map((rt) => (
                                        <option key={rt.id} value={rt.id}>
                                            {rt.rittypeid}: {rt.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {docksContent}
                            <div className="flex gap-2 mt-2">
                                <button onClick={selectVisible} className="border border-slate-300 text-slate-800 px-2 py-1 rounded text-sm" type="button">Select visible</button>
                                <button onClick={clearSelection} className="border border-slate-300 text-slate-800 px-2 py-1 rounded text-sm" type="button">Clear</button>
                            </div>
                        </section>
                    </div>
                    {successMsg && <p className="text-green-700 text-sm font-semibold mt-2">{successMsg}</p>}
                    {error && <p className="text-red-700 text-sm font-semibold mt-2">{error}</p>}
                </section>
            </div>

            {/* Create RitType modal (number + description) */}
            {showCreateRitTypeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                    role="presentation"
                    tabIndex={0}
                    onClick={() => setShowCreateRitTypeModal(false)}
                    onKeyDown={e => {
                        if (e.key === "Escape") setShowCreateRitTypeModal(false);
                    }}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Create RitType</h3>
                        <div className="space-y-3">
                            <input
                                type="number"
                                placeholder="RitType number"
                                className={inputClass}
                                value={ritTypeFormNumber}
                                min={1}
                                onChange={e => setRitTypeFormNumber(Number(e.target.value))}
                            />
                            <textarea
                                value={ritTypeFormDescription}
                                onChange={e => setRitTypeFormDescription(e.target.value)}
                                placeholder="Description"
                                className={`${inputClass} min-h-[100px] resize-y`}
                            />
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setShowCreateRitTypeModal(false)} className="w-1/2 border border-slate-300 text-slate-800 py-2 rounded-md hover:bg-slate-100">Cancel</button>
                                <button type="button" onClick={createRitTypeFromModal} className="w-1/2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit RitType Modal (includes rittypeid field) */}
            {ritTypeEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                    role="presentation"
                    tabIndex={0}
                    onClick={closeEditRitTypeModal}
                    onKeyDown={e => {
                        if (e.key === "Escape") closeEditRitTypeModal();
                    }}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Edit RitType</h3>
                        <input
                            type="number"
                            min={1}
                            value={editModalRitTypeId ?? ""}
                            onChange={e => setEditModalRitTypeId(Number(e.target.value))}
                            className={inputClass}
                            placeholder="RitType number"
                        />
                        <textarea value={editModalDescription} onChange={e => setEditModalDescription(e.target.value)} placeholder="Description" className={`${inputClass} min-h-[100px] resize-y`} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                    role="presentation"
                    tabIndex={0}
                    onClick={() => setShowCreateDockModal(false)}
                    onKeyDown={e => {
                        if (e.key === "Escape") setShowCreateDockModal(false);
                    }}
                >
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

            {/* Bulk Create Dock Modal */}
            {showBulkCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                    role="presentation"
                    tabIndex={0}
                    onClick={() => setShowBulkCreateModal(false)}
                    onKeyDown={e => {
                        if (e.key === "Escape") setShowBulkCreateModal(false);
                    }}
                >
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
