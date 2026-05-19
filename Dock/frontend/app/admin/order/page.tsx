"use client";

import { useEffect, useState } from "react";

// --- Types ---
type Rit = {
    id: number;
    rit_id: string;
    leverancier_nmr: number;
    pellet_tot: number;
    rit_type: number;
    datum: string;

    // backend DateTime serializes to string in JSON
    afspraak_starttijd?: string | null;
};

type Leverancier = {
    id: number;
    leverancier_id: string;
    leverancier_naam?: string | null;
};

type RitType = {
    id: number;
    rittypeid: number;
    description: string;
};

export default function RitPage() {
    // --- State ---
    const [rits, setRits] = useState<Rit[]>([]);
    const [leveranciers, setLeveranciers] = useState<Leverancier[]>([]);
    const [ritTypes, setRitTypes] = useState<RitType[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRit, setSelectedRit] = useState<Rit | null>(null);

    // --- Import state ---
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    // --- Form/Modal State
    const emptyForm = {
        rit_id: "",
        leverancier_nmr: "",
        leverancier_display: "",
        pellet_tot: "",
        rit_type: "",
        rit_type_display: "",
        datum: "",
    };
    const [form, setForm] = useState({ ...emptyForm });
    const [filteredLeveranciers, setFilteredLeveranciers] = useState<Leverancier[]>([]);
    const [showLevDropdown, setShowLevDropdown] = useState(false);
    const [filteredRitTypes, setFilteredRitTypes] = useState<RitType[]>([]);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const PER_PAGE = 10;
    const [page, setPage] = useState(1);

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ ...emptyForm });
    const [filteredEditLeveranciers, setFilteredEditLeveranciers] = useState<Leverancier[]>([]);
    const [showEditLevDropdown, setShowEditLevDropdown] = useState(false);
    const [filteredEditTypes, setFilteredEditTypes] = useState<RitType[]>([]);
    const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // --- API base ---
    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

    // --- Fetchers ---
    useEffect(() => {
        fetchRit();
        fetchLeveranciers();
        fetchRitTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchRit() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/rits`, { credentials: "include" });
            if (!res.ok) throw new Error((await res.text()) || `Failed to fetch ior's (${res.status})`);
            setRits(await res.json());
        } catch (e: any) {
            setError("Failed to fetch ior's" + (e?.message ? ": " + e.message : ""));
        } finally {
            setLoading(false);
        }
    }
    async function fetchLeveranciers() {
        try {
            const res = await fetch(`${API_BASE}/leveranciers`, { credentials: "include" });
            setLeveranciers(await res.json());
        } catch { }
    }
    async function fetchRitTypes() {
        try {
            const res = await fetch(`${API_BASE}/rittypes`, { credentials: "include" });
            setRitTypes(await res.json());
        } catch { }
    }

    // --- Helper functions ---
    function getLevName(id: number | string) {
        const l = leveranciers.find(lv => lv.id === Number(id));
        return l ? l.leverancier_naam ?? "" : "";
    }
    function getLevDisplay(lv: Leverancier) {
        return (
            <>
                <div className="font-semibold text-[#013c59]">{lv.leverancier_naam ?? "-"}</div>
                <div className="text-xs text-slate-600">{lv.leverancier_id}</div>
            </>
        );
    }
    function getTypeLabel(id: number | string) {
        const t = ritTypes.find(rt => rt.id === Number(id));
        return t ? `${t.rittypeid} - ${t.description}` : "";
    }

    // Local NL time (Europe/Amsterdam) formatting: display only HH:MM
    // NOTE: This will interpret the timestamp based on what the backend sends:
    // - If backend sends ISO with timezone (e.g. ...Z or +02:00): perfect.
    // - If backend sends "2026-04-29 13:00:00" (no timezone): JS parsing can be inconsistent.
    //   In that case, we fall back to extracting HH:MM from the string.
    function formatStarttijd(value?: string | null) {
        if (!value) return "-";

        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            return new Intl.DateTimeFormat("nl-NL", {
                timeZone: "Europe/Amsterdam",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(d);
        }

        // Fallback: extract HH:MM if parsing fails
        const m = value.match(/(\d{2}):(\d{2})/);
        if (m) return `${m[1]}:${m[2]}`;

        return value;
    }

    // --- Table filtering ---
    const filteredRits = rits.filter(rit => {
        const q = search.toLowerCase();
        return (
            rit.rit_id?.toLowerCase().includes(q) ||
            getLevName(rit.leverancier_nmr).toLowerCase().includes(q)
        );
    });

    // --- CSV Import ---
    function parseCsv(text: string) {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(",").map(h => h.trim());
        return lines.slice(1).map(line => {
            const values: string[] = [];
            let current = "", inQuotes = false;
            for (let i = 0; i < line.length; ++i) {
                if (line[i] === '"') {
                    if (line[i + 1] === '"') { current += '"'; ++i; }
                    else inQuotes = !inQuotes;
                }
                else if (line[i] === "," && !inQuotes) {
                    values.push(current);
                    current = "";
                } else {
                    current += line[i];
                }
            }
            values.push(current);
            const obj: any = {};
            headers.forEach((h, idx) => { obj[h] = (values[idx] || "").trim(); });
            return obj;
        });
    }

    async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
        setImporting(true);
        setImportError(null);
        setImportSuccess(null);

        const file = e.target.files?.[0];
        if (!file) {
            setImportError("No file selected.");
            setImporting(false);
            return;
        }
        const text = await file.text();
        const rows = parseCsv(text);
        if (!Array.isArray(rows) || rows.length === 0) {
            setImportError("CSV is empty or invalid.");
            setImporting(false);
            return;
        }

        let created = 0, failed = 0;
        for (const row of rows) {
            const leverancierRow = leveranciers.find((l) => l.leverancier_id === row.leverancier_id);
            if (!leverancierRow) { failed++; continue; }
            const payload = {
                rit_id: row.rit_id,
                leverancier_nmr: leverancierRow.id,
                pellet_tot: Number(row.pellet_tot),
                rit_type: Number(row.rit_type),
                datum: row.datum,
            };
            if (!payload.rit_id || !payload.leverancier_nmr || isNaN(payload.pellet_tot) || isNaN(payload.rit_type) || !payload.datum) {
                failed++; continue;
            }
            try {
                const res = await fetch(`${API_BASE}/rits`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) failed++; else created++;
            } catch {
                failed++;
            }
        }
        setImportSuccess(`Import klaar: ${created} succesvol, ${failed} mislukt.`);
        setImporting(false);
        fetchRit();
    }

    // --- Form logic: Autocomplete/dropdown for leveranciers and rittypes ---
    function openCreateModal() {
        setShowCreateModal(true);
        setForm({ ...emptyForm });
        setFilteredLeveranciers([]);
        setShowLevDropdown(false);
        setFilteredRitTypes([]);
        setShowTypeDropdown(false);
        setError(null);
        setSuccess(null);
    }
    function closeCreateModal() { setShowCreateModal(false); }
    function handleLevSearch(value: string) {
        setForm(f => ({ ...f, leverancier_display: value }));
        if (!value) {
            setFilteredLeveranciers([]);
            setShowLevDropdown(false);
            return;
        }
        setFilteredLeveranciers(
            leveranciers.filter(lv =>
                (lv.leverancier_naam?.toLowerCase() ?? "").includes(value.toLowerCase()) ||
                lv.leverancier_id.toLowerCase().includes(value.toLowerCase())
            )
        );
        setShowLevDropdown(true);
    }
    function selectLeverancier(lv: Leverancier) {
        setForm(f => ({
            ...f,
            leverancier_nmr: String(lv.id),
            leverancier_display: lv.leverancier_naam || "",
        }));
        setShowLevDropdown(false);
    }
    function handleRitTypeSearch(val: string) {
        setForm(f => ({ ...f, rit_type_display: val }));
        if (!val) {
            setFilteredRitTypes([]);
            setShowTypeDropdown(false);
            return;
        }
        setFilteredRitTypes(
            ritTypes.filter(rt =>
                getTypeLabel(rt.id).toLowerCase().includes(val.toLowerCase())
            )
        );
        setShowTypeDropdown(true);
    }
    function selectRitType(rt: RitType) {
        setForm(f => ({
            ...f,
            rit_type: String(rt.id),
            rit_type_display: getTypeLabel(rt.id),
        }));
        setShowTypeDropdown(false);
    }
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        if (!form.rit_id ||
            !form.leverancier_nmr || isNaN(Number(form.leverancier_nmr)) ||
            !form.pellet_tot || isNaN(Number(form.pellet_tot)) ||
            !form.rit_type || isNaN(Number(form.rit_type)) ||
            !form.datum || !/^\d{4}-\d{2}-\d{2}$/.test(form.datum)
        ) {
            setError("Alle velden zijn verplicht.");
            setSubmitting(false);
            return;
        }
        try {
            const payload = {
                rit_id: form.rit_id,
                leverancier_nmr: Number(form.leverancier_nmr),
                pellet_tot: Number(form.pellet_tot),
                rit_type: Number(form.rit_type),
                datum: form.datum,
            };
            const res = await fetch(`${API_BASE}/rits`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.text()) || `Create failed (${res.status})`);
            setSuccess("Rit succesvol aangemaakt.");
            closeCreateModal();
            await fetchRit();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    // --- Edit logic (mirrors create logic) ---
    function openEditModal(rit: Rit) {
        setSelectedRit(rit);
        setShowEditModal(true);

        setEditForm({
            rit_id: rit.rit_id,
            leverancier_nmr: String(rit.leverancier_nmr),
            leverancier_display: getLevName(rit.leverancier_nmr),
            pellet_tot: String(rit.pellet_tot),
            rit_type: String(rit.rit_type),
            rit_type_display: getTypeLabel(rit.rit_type),
            datum: rit.datum,
        });
        setFilteredEditLeveranciers([]);
        setShowEditLevDropdown(false);
        setFilteredEditTypes([]);
        setShowEditTypeDropdown(false);
        setError(null);
        setSuccess(null);
    }
    function closeEditModal() {
        setShowEditModal(false);
        setSelectedRit(null);
    }
    function handleEditLevSearch(value: string) {
        setEditForm(f => ({ ...f, leverancier_display: value }));
        if (!value) {
            setFilteredEditLeveranciers([]);
            setShowEditLevDropdown(false);
            return;
        }
        setFilteredEditLeveranciers(
            leveranciers.filter(lv =>
                (lv.leverancier_naam?.toLowerCase() ?? "").includes(value.toLowerCase()) ||
                lv.leverancier_id.toLowerCase().includes(value.toLowerCase())
            )
        );
        setShowEditLevDropdown(true);
    }
    function selectEditLeverancier(lv: Leverancier) {
        setEditForm(f => ({
            ...f,
            leverancier_nmr: String(lv.id),
            leverancier_display: lv.leverancier_naam || "",
        }));
        setShowEditLevDropdown(false);
    }
    function handleEditTypeSearch(value: string) {
        setEditForm(f => ({ ...f, rit_type_display: value }));
        if (!value) {
            setFilteredEditTypes([]);
            setShowEditTypeDropdown(false);
            return;
        }
        setFilteredEditTypes(
            ritTypes.filter(rt =>
                getTypeLabel(rt.id).toLowerCase().includes(value.toLowerCase())
            )
        );
        setShowEditTypeDropdown(true);
    }
    function selectEditRitType(rt: RitType) {
        setEditForm(f => ({
            ...f,
            rit_type: String(rt.id),
            rit_type_display: getTypeLabel(rt.id),
        }));
        setShowEditTypeDropdown(false);
    }
    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRit) return;
        setSubmitting(true);
        setError(null);
        if (!editForm.rit_id ||
            !editForm.leverancier_nmr || isNaN(Number(editForm.leverancier_nmr)) ||
            !editForm.pellet_tot || isNaN(Number(editForm.pellet_tot)) ||
            !editForm.rit_type || isNaN(Number(editForm.rit_type)) ||
            !editForm.datum || !/^\d{4}-\d{2}-\d{2}$/.test(editForm.datum)
        ) {
            setError("Alle velden zijn verplicht.");
            setSubmitting(false);
            return;
        }
        try {
            const payload = {
                rit_id: editForm.rit_id,
                leverancier_nmr: Number(editForm.leverancier_nmr),
                pellet_tot: Number(editForm.pellet_tot),
                rit_type: Number(editForm.rit_type),
                datum: editForm.datum,
            };
            const res = await fetch(`${API_BASE}/rits/${selectedRit.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.text()) || "Kon rit niet bijwerken.");
            setSuccess("Rit bijgewerkt.");
            closeEditModal();
            await fetchRit();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }
    async function handleDelete() {
        if (!selectedRit) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/rits/${selectedRit.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Niet gelukt te verwijderen");
            setSuccess("Rit verwijderd");
            closeEditModal();
            await fetchRit();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    // --- Render ---
    const inputClass =
        "w-full border border-slate-300 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-[#013c59]/30";

    return (
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 bg-slate-100">
            <div className="mx-auto max-w-6xl">
                <section className="bg-white rounded-xl shadow p-6 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-xl font-semibold text-[#013c59]">All IOR's</h2>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by ior_id or leverancier naam..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={openCreateModal}
                                className="bg-[#013c59] text-white px-4 py-2 rounded-md hover:bg-[#013c59]/90 transition font-semibold"
                            >Create</button>
                            <label className="bg-[#013c59] text-white px-4 py-2 rounded-md hover:bg-[#013c59]/90 transition font-semibold cursor-pointer">
                                Import CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    style={{ display: "none" }}
                                    onChange={handleCsvImport}
                                    disabled={importing}
                                />
                            </label>
                            <button
                                onClick={fetchRit}
                                className="border border-[#013c59] text-[#013c59] px-4 py-2 rounded-md hover:bg-[#013c59] hover:text-white transition font-semibold"
                            >Refresh</button>
                        </div>
                    </div>

                    {importSuccess && <p className="text-green-700 text-sm font-semibold mt-2">{importSuccess}</p>}
                    {importError && <p className="text-red-700 text-sm font-semibold mt-2">{importError}</p>}

                    <p className="text-xs text-slate-700 mb-4">Click a row to edit or delete.</p>

                    {loading ? (
                        <p className="text-slate-700">Loading...</p>
                    ) : filteredRits.length === 0 ? (
                        <p className="text-slate-700">No ritten found.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-300 text-slate-900">
                                    <thead className="bg-slate-200 text-slate-900">
                                        <tr>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">IOR-ID</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Leverancier</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Pellet Tot</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">IOR Type</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Datum</th>
                                            <th className="text-left p-3 border-b border-slate-300 font-semibold">Starttijd</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRits.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(row => (
                                            <tr key={row.id}
                                                className="hover:bg-slate-100 cursor-pointer"
                                                onClick={() => openEditModal(row)}
                                            >
                                                <td className="p-3 border-b border-slate-200">{row.rit_id}</td>
                                                <td className="p-3 border-b border-slate-200">{getLevName(row.leverancier_nmr)}</td>
                                                <td className="p-3 border-b border-slate-200">{row.pellet_tot}</td>
                                                <td className="p-3 border-b border-slate-200">{getTypeLabel(row.rit_type)}</td>
                                                <td className="p-3 border-b border-slate-200 font-mono">{row.datum}</td>
                                                <td className="p-3 border-b border-slate-200 font-mono">
                                                    {formatStarttijd(row.afspraak_starttijd)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-300">
                                <p className="text-sm text-slate-700">
                                    Showing {filteredRits.length > 0 ? (page - 1) * PER_PAGE + 1 : 0} to{" "}
                                    {Math.min(page * PER_PAGE, filteredRits.length)} of {filteredRits.length} ior's
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >Previous</button>
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: Math.ceil(filteredRits.length / PER_PAGE) }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => setPage(pg)}
                                                className={`px-3 py-1 rounded-md transition ${page === pg
                                                    ? "bg-[#013c59] text-white"
                                                    : "border border-[#013c59] text-[#013c59] hover:bg-[#013c59] hover:text-white"
                                                    }`}
                                            >{pg}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => setPage(p => Math.min(Math.ceil(filteredRits.length / PER_PAGE), p + 1))}
                                        disabled={page === Math.ceil(filteredRits.length / PER_PAGE)}
                                        className="border border-[#013c59] text-[#013c59] px-3 py-1 rounded-md hover:bg-[#013c59] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >Next</button>
                                </div>
                            </div>
                        </>
                    )}

                    {success && <p className="text-green-700 text-sm font-semibold mt-4">{success}</p>}
                    {error && <p className="text-red-700 text-sm font-semibold mt-4">{error}</p>}
                </section>
            </div>

            {/* --- Create Modal --- */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={closeCreateModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">Create Rit</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Rit-ID"
                                value={form.rit_id}
                                onChange={e => setForm(f => ({ ...f, rit_id: e.target.value }))}
                            />
                            {/* Leverancier Autocomplete */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Zoek leverancier..."
                                    value={form.leverancier_display}
                                    onChange={e => handleLevSearch(e.target.value)}
                                    onFocus={() => form.leverancier_display && setShowLevDropdown(true)}
                                    autoComplete="off"
                                />
                                {showLevDropdown && filteredLeveranciers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredLeveranciers.map(lv => (
                                            <div
                                                key={lv.id}
                                                onClick={() => selectLeverancier(lv)}
                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
                                            >
                                                {getLevDisplay(lv)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="number"
                                className={inputClass}
                                placeholder="Pellet tot"
                                value={form.pellet_tot}
                                onChange={e => setForm(f => ({ ...f, pellet_tot: e.target.value }))}
                            />
                            {/* Rit Type Autocomplete */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Zoek rit type..."
                                    value={form.rit_type_display}
                                    onChange={e => handleRitTypeSearch(e.target.value)}
                                    onFocus={() => form.rit_type_display && setShowTypeDropdown(true)}
                                    autoComplete="off"
                                />
                                {showTypeDropdown && filteredRitTypes.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredRitTypes.map(rt => (
                                            <div
                                                key={rt.id}
                                                onClick={() => selectRitType(rt)}
                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
                                            >
                                                <div className="font-semibold text-[#013c59]">
                                                    {rt.rittypeid} - {rt.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="date"
                                className={inputClass}
                                placeholder="Datum"
                                value={form.datum}
                                onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                            />
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
                                    disabled={submitting}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="w-1/2 bg-[#013c59] text-white py-2 rounded-md disabled:opacity-60"
                                    disabled={submitting}
                                >{submitting ? "Creating..." : "Create"}</button>
                            </div>
                        </form>
                        {error && <p className="text-red-700 text-sm mt-2">{error}</p>}
                    </div>
                </div>
            )}

            {/* --- Edit Modal --- */}
            {showEditModal && selectedRit && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={closeEditModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-[#013c59] mb-4">
                            Update #{selectedRit.rit_id}
                        </h3>

                        <div className="text-sm text-slate-700 mb-3">
                            <span className="font-semibold">Starttijd:</span>{" "}
                            <span className="font-mono">{formatStarttijd(selectedRit.afspraak_starttijd)}</span>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-3">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Rit-ID"
                                value={editForm.rit_id}
                                onChange={e => setEditForm(f => ({ ...f, rit_id: e.target.value }))}
                            />
                            {/* Leverancier edit autocomplete */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Zoek leverancier..."
                                    value={editForm.leverancier_display}
                                    onChange={e => handleEditLevSearch(e.target.value)}
                                    onFocus={() => editForm.leverancier_display && setShowEditLevDropdown(true)}
                                    autoComplete="off"
                                />
                                {showEditLevDropdown && filteredEditLeveranciers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredEditLeveranciers.map(lv => (
                                            <div
                                                key={lv.id}
                                                onClick={() => selectEditLeverancier(lv)}
                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
                                            >
                                                {getLevDisplay(lv)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="number"
                                className={inputClass}
                                placeholder="Pellet tot"
                                value={editForm.pellet_tot}
                                onChange={e => setEditForm(f => ({ ...f, pellet_tot: e.target.value }))}
                            />
                            {/* Rit type edit autocomplete */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Zoek rit type..."
                                    value={editForm.rit_type_display}
                                    onChange={e => handleEditTypeSearch(e.target.value)}
                                    onFocus={() => editForm.rit_type_display && setShowEditTypeDropdown(true)}
                                    autoComplete="off"
                                />
                                {showEditTypeDropdown && filteredEditTypes.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredEditTypes.map(rt => (
                                            <div
                                                key={rt.id}
                                                onClick={() => selectEditRitType(rt)}
                                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-200 last:border-b-0"
                                            >
                                                <div className="font-semibold text-[#013c59]">{rt.rittypeid} - {rt.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="date"
                                className={inputClass}
                                placeholder="Datum"
                                value={editForm.datum}
                                onChange={e => setEditForm(f => ({ ...f, datum: e.target.value }))}
                            />
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="w-1/2 border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-100"
                                    disabled={submitting}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="w-1/2 bg-[#013c59] text-white py-2 rounded-md disabled:opacity-60"
                                    disabled={submitting}
                                >{submitting ? "Updating..." : "Save"}</button>
                            </div>
                        </form>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full bg-red-100 text-red-700 border border-red-300 rounded-md py-2 font-semibold hover:bg-red-200 mt-2"
                                disabled={submitting}
                            >Delete Rit</button>
                        </div>
                        {error && <p className="text-red-700 text-sm mt-2">{error}</p>}
                    </div>
                </div>
            )}
        </main>
    );
}
