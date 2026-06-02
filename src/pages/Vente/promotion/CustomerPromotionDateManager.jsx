// GroupPromotionTable.jsx

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    getCustomerGroups,
    getCustomerGroupById,
    getPromotionsByGroup,
    bulkUpdateCustomerDates,
    getAssignmentsByPromotion,
} from "../../../api/api";
import "./CustomerPromotionDateManager.css";

// ─── Helpers ─────────────────────────────────────────────────
const TYPE_ICONS = { ENTERPRISE: "🏢", FAMILY: "👨‍👩‍👧", SME: "📊", OTHER: "📁" };
const TYPE_LABELS = { ENTERPRISE: "Entreprise", FAMILY: "Famille", SME: "PME", OTHER: "Autre" };

const AVATAR_COLORS = [
    { bg: "#B5D4F4", color: "#0C447C" },
    { bg: "#FAC775", color: "#633806" },
    { bg: "#9FE1CB", color: "#085041" },
    { bg: "#CECBF6", color: "#3C3489" },
    { bg: "#F5C4B3", color: "#712B13" },
];

const getAvatarStyle = (str = "") => {
    const idx = str.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
};

const fmt = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

const calcPeriode = (start, end) => {
    if (!start) return null;
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const days = Math.round((e - s) / 86400000);
    if (days < 0) return "0 j";
    if (days < 30) return `${days} j`;
    const months = Math.floor(days / 30);
    return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? "s" : ""}`;
};

const fmtVal = (p) =>
    p?.typeReduction === "POURCENTAGE"
        ? `${p.valeurReduction}%`
        : `${p?.valeurReduction} TND`;

// ─── Helpers période ─────────────────────────────────────────
const PERIOD_UNITS = [
    { value: "jours", label: "Jours", labelShort: "j" },
    { value: "mois", label: "Mois", labelShort: "mois" },
    { value: "ans", label: "Ans", labelShort: "an" },
];

/**
 * Ajoute une durée à une date ISO et retourne la date fin au format YYYY-MM-DD.
 */
const computeEndDate = (startISO, amount, unit) => {
    if (!startISO || !amount || amount <= 0) return "";
    const d = new Date(startISO);
    if (isNaN(d)) return "";
    const n = parseInt(amount, 10);
    if (unit === "jours") d.setDate(d.getDate() + n);
    else if (unit === "mois") d.setMonth(d.getMonth() + n);
    else if (unit === "ans") d.setFullYear(d.getFullYear() + n);
    // retourner YYYY-MM-DD
    return d.toISOString().split("T")[0];
};

/**
 * Déduit une durée approximative depuis deux dates.
 * Retourne { amount, unit } ou null.
 */
const inferPeriod = (startISO, endISO) => {
    if (!startISO || !endISO) return { amount: "", unit: "mois" };
    const days = Math.round((new Date(endISO) - new Date(startISO)) / 86400000);
    if (days <= 0) return { amount: "", unit: "mois" };
    if (days < 30) return { amount: days, unit: "jours" };
    if (days < 365) return { amount: Math.round(days / 30), unit: "mois" };
    return { amount: Math.round(days / 365), unit: "ans" };
};

// ─── PromoCard ────────────────────────────────────────────────
function PromoCard({ promo, customerId, groupId, onUpdated }) {
    const [editing, setEditing] = useState(false);
    const [startDate, setStart] = useState(promo.effectiveStartDate ?? "");
    const [periodAmount, setAmount] = useState(() => inferPeriod(promo.effectiveStartDate, promo.effectiveEndDate).amount);
    const [periodUnit, setUnit] = useState(() => inferPeriod(promo.effectiveStartDate, promo.effectiveEndDate).unit);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const userId = localStorage.getItem("userId");

    // Date fin calculée automatiquement
    const computedEndDate = computeEndDate(startDate, periodAmount, periodUnit);

    const showFeedback = (ok, msg) => {
        setFeedback({ ok, msg });
        setTimeout(() => setFeedback(null), 3500);
    };

    const handleStartChange = (val) => {
        setStart(val);
        // La date fin se recalcule via computedEndDate, rien à faire de plus
    };

    const handleSave = async () => {
        if (!startDate) {
            showFeedback(false, "La date de début est obligatoire");
            return;
        }
        if (!periodAmount || periodAmount <= 0) {
            showFeedback(false, "La période est obligatoire");
            return;
        }
        setSaving(true);
        try {
            const response = await bulkUpdateCustomerDates({
                userId: userId,
                promotionId: promo.promotionId ?? promo.id,
                groupId: groupId,
                customerIds: [Number(customerId)],
                newStartDate: startDate || null,
                newEndDate: computedEndDate || null,
            });

            // bulkUpdate retourne { successCount, failedCount, errors[] }
            if (response?.successCount > 0) {
                onUpdated(promo.assignmentId ?? promo.id, startDate, computedEndDate || null);
                showFeedback(true, "Dates enregistrées — en attente de validation par l'exploit ⏳");
                setEditing(false);
            } else {
                const errMsg = response?.errors?.[0]?.errorMessage || "Erreur lors de la mise à jour";
                throw new Error(errMsg);
            }
        } catch (e) {
            showFeedback(false, e.response?.data?.message || e.message || "Erreur lors de la mise à jour");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setStart(startDate);
        const inf = inferPeriod(promo.effectiveStartDate, promo.effectiveEndDate);
        setAmount(inf.amount);
        setUnit(inf.unit);
        setEditing(false);
        setFeedback(null);
    };

    const displayStart = editing ? startDate : promo.effectiveStartDate;
    const displayEnd = editing ? computedEndDate : promo.effectiveEndDate;
    const periode = calcPeriode(displayStart, displayEnd);

    return (
        <div className={`promo-card-item${editing ? " editing" : ""}`}>
            {/* En-tête */}
            <div className="promo-card-top">
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "2px 10px",
                    borderRadius: 20,
                    marginBottom: 8,
                    background: promo.validationStatus === "VALIDATED"
                        ? "#e8f5e9" : promo.validationStatus === "REJECTED"
                            ? "#fdecea" : "#fff8e1",
                    color: promo.validationStatus === "VALIDATED"
                        ? "#2e7d32" : promo.validationStatus === "REJECTED"
                            ? "#c62828" : "#f57f17",
                }}>
                    {promo.validationStatus === "VALIDATED" && "✓ Actif"}
                    {promo.validationStatus === "REJECTED" && "✗ Rejeté"}
                    {(!promo.validationStatus || promo.validationStatus === "PENDING") && "⏳ En attente de validation"}
                </div>
                <div>
                    <div className="promo-card-name">
                        {promo.typeReduction === "POURCENTAGE" ? "🎯" : "💰"}{" "}
                        {promo.nomPromotion ?? promo.promotionName}
                    </div>
                    <div className="promo-card-sub">
                        {promo.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                    </div>
                </div>
                <div className="promo-card-value">{fmtVal(promo)}</div>
            </div>

            {/* Date début */}
            <div className="date-field" style={{ marginBottom: 8 }}>
                <label>📅 Date début</label>
                {editing
                    ? <input type="date" value={startDate} onChange={e => handleStartChange(e.target.value)} />
                    : <div className="date-display">{fmt(promo.effectiveStartDate) || "—"}</div>}
            </div>

            {/* Période (saisie manuelle) */}
            {editing ? (
                <div className="periode-input-row">
                    <label className="periode-input-label">⏱ Période</label>
                    <div className="periode-input-group">
                        <input
                            type="number"
                            min="1"
                            value={periodAmount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="ex: 3"
                            className="periode-number-input"
                        />
                        <div className="periode-unit-tabs">
                            {PERIOD_UNITS.map(u => (
                                <button
                                    key={u.value}
                                    type="button"
                                    className={`periode-unit-btn${periodUnit === u.value ? " active" : ""}`}
                                    onClick={() => setUnit(u.value)}
                                >
                                    {u.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                periode && (
                    <div className="periode-row">
                        <span className="periode-chip">
                            ⏱ {periode}{!displayEnd && " · en cours"}
                        </span>
                    </div>
                )
            )}

            {/* Date fin calculée (lecture seule) */}
            <div className="date-field" style={{ marginTop: 8 }}>
                <label>📆 Date fin {editing && <span className="auto-badge">calculée auto</span>}</label>
                <div className={`date-display${editing ? " date-display-computed" : ""}`}>
                    {editing
                        ? (computedEndDate ? fmt(computedEndDate) : <span className="date-placeholder">— saisissez une période —</span>)
                        : (fmt(promo.effectiveEndDate) || "∞")}
                </div>
            </div>

            {/* Feedback */}
            {feedback && (
                <div className={`save-feedback${feedback.ok ? "" : " err"}`} style={{ marginTop: 8 }}>
                    {feedback.ok ? "✓" : "✗"} {feedback.msg}
                </div>
            )}

            {/* Actions */}
            <div className="promo-card-actions" style={{ marginTop: 10 }}>
                {editing ? (
                    <>
                        <button className="btn-xs cancel" onClick={handleCancel} disabled={saving}>
                            Annuler
                        </button>
                        <button className="btn-xs save" onClick={handleSave} disabled={saving}>
                            {saving ? "Sauvegarde..." : "✓ Assigner"}
                        </button>
                    </>
                ) : (
                    <button
                        className="btn-xs edit"
                        onClick={() => setEditing(true)}
                        disabled={promo.validationStatus === "VALIDATED"}
                        title={promo.validationStatus === "VALIDATED"
                            ? "Cet assignment est déjà validé par l'exploit"
                            : "Modifier les dates"}
                    >
                        ✏ Modifier les dates
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── ClientRow ────────────────────────────────────────────────
function ClientRow({ row, groupId, colSpan, onUpdatePromo, refreshTrigger }) {
    const [open, setOpen] = useState(false);
    const [promos, setPromos] = useState(null);
    const [promoLoad, setPromoLoad] = useState(false);
    const [promoError, setPromoError] = useState(null);

    const loadPromos = useCallback(async () => {
        setPromoLoad(true);
        setPromoError(null);
        try {
            const groupPromos = await getPromotionsByGroup(groupId);
            const promoList = Array.isArray(groupPromos) ? groupPromos : groupPromos.content ?? [];

            if (promoList.length === 0) { setPromos([]); return; }

            const promosWithDates = await Promise.all(
                promoList.map(async (promo) => {
                    try {
                        const assignments = await getAssignmentsByPromotion(promo.id);
                        const assignmentsList = Array.isArray(assignments)
                            ? assignments
                            : assignments.content ?? [];

                        // 1. Chercher d'abord un assignment individuel pour ce client
                        // Trier par id desc pour prendre le plus récent
                        const customerAssignments = assignmentsList
                            .filter(a => a.targetType === "CUSTOMER" && a.targetCustomerId === row.client.id)
                            .sort((a, b) => b.id - a.id);

                        if (customerAssignments.length > 0) {
                            const ca = customerAssignments[0];
                            return {
                                ...promo,
                                effectiveStartDate: ca.effectiveStartDate,
                                effectiveEndDate: ca.effectiveEndDate,
                                assignmentId: ca.id,
                                assignmentMode: ca.assignmentMode,
                                validationStatus: ca.validationStatus,  // ✅ inclure
                                status: ca.status,
                            };
                        }

                        // 2. Sinon chercher l'assignment groupe
                        const groupAssignment = assignmentsList
                            .filter(a => a.targetType === "CUSTOMER_GROUP" && a.targetGroupId === groupId)
                            .sort((a, b) => b.id - a.id)[0];

                        if (groupAssignment) {
                            return {
                                ...promo,
                                effectiveStartDate: groupAssignment.effectiveStartDate,
                                effectiveEndDate: groupAssignment.effectiveEndDate,
                                assignmentId: groupAssignment.id,
                                assignmentMode: groupAssignment.assignmentMode,
                                validationStatus: groupAssignment.validationStatus, // ✅ inclure
                                status: groupAssignment.status,
                            };
                        }

                        // 3. Aucun assignment trouvé — promo sans dates
                        return { ...promo, validationStatus: "PENDING", status: "PENDING" };

                    } catch {
                        return { ...promo, validationStatus: "PENDING" };
                    }
                }),
            );
            setPromos(promosWithDates);
        } catch (e) {
            setPromoError(e.response?.data?.message || e.message || "Erreur de chargement");
        } finally {
            setPromoLoad(false);
        }
    }, [row.client.id, groupId]);

    useEffect(() => {
        if (open && refreshTrigger !== undefined) loadPromos();
    }, [refreshTrigger]);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadPromos();
    };

    const handleUpdated = (assignmentId, startDate, endDate) => {
        setPromos(prev =>
            prev.map(p =>
                (p.assignmentId ?? p.id) === assignmentId
                    ? {
                        ...p,
                        effectiveStartDate: startDate,
                        effectiveEndDate: endDate,
                        validationStatus: "PENDING",
                        status: "PENDING",
                    }
                    : p,
            ),
        );
        onUpdatePromo(row.id, assignmentId, startDate, endDate);
    };

    const avatarStyle = getAvatarStyle(row.client?.nom ?? "");

    return (
        <>
            <tr className={open ? "row-expanded" : ""}>
                {/* Expand */}
                <td>
                    <button
                        className={`expand-btn${open ? " open" : ""}`}
                        onClick={handleToggle}
                        aria-label={open ? "Réduire" : "Développer"}
                    >
                        ›
                    </button>
                </td>

                {/* Client */}
                <td>
                    <div className="cell-client">
                        <div
                            className="client-avatar"
                            style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                        >
                            {row.client?.nom?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                            <div className="client-name">{row.client?.nom} {row.client?.prenom}</div>
                            <div className="client-email">{row.client?.email}</div>
                        </div>
                    </div>
                </td>

                {/* Groupe */}
                <td>
                    <div className="cell-group">
                        <span>{TYPE_ICONS[row.group?.groupType] || "👥"}</span>
                        <div>
                            <div className="group-name">{row.group?.name}</div>
                            <span className="group-type-badge">
                                {TYPE_LABELS[row.group?.groupType] || row.group?.groupType}
                            </span>
                        </div>
                    </div>
                </td>

                {/* Nb promotions */}
                <td>
                    <span
                        className={`promo-count-pill${row.promoCount > 0 ? " has" : " empty"}`}
                        onClick={() => row.promoCount > 0 && handleToggle()}
                    >
                        🎁 {row.promoCount} promo{row.promoCount !== 1 ? "s" : ""}
                        {row.promoCount > 0 && (open ? " ▲" : " ▼")}
                    </span>
                </td>

                {/* Statut */}
                <td>
                    <span className={`status-badge${row.statut === "ACTIF" ? " actif" : " inactif"}`}>
                        <span className="status-dot" />
                        {row.statut}
                    </span>
                </td>
            </tr>

            {/* Sous-panneau */}
            {open && (
                <tr className="promo-subrow">
                    <td colSpan={colSpan}>
                        <div className="promo-subpanel">
                            <div className="promo-subpanel-header">
                                <div className="promo-subpanel-title">
                                    🎁 Promotions de {row.client?.nom} {row.client?.prenom}
                                </div>
                            </div>

                            {promoLoad && (
                                <div className="promo-loading-inline">
                                    <div className="spinner spinner-sm" /> Chargement des promotions...
                                </div>
                            )}

                            {promoError && (
                                <div className="gpt-error" style={{ marginBottom: 0 }}>
                                    ⚠ {promoError}
                                    <button onClick={loadPromos}>Réessayer</button>
                                </div>
                            )}

                            {!promoLoad && !promoError && promos !== null && promos.length === 0 && (
                                <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "8px 0" }}>
                                    Aucune promotion assignée à ce client.
                                </div>
                            )}

                            {!promoLoad && !promoError && promos?.length > 0 && (
                                <div className="promo-cards-grid">
                                    {promos.map((p, i) => (
                                        <PromoCard
                                            key={p.assignmentId ?? p.id ?? i}
                                            promo={p}
                                            customerId={row.client.id}
                                            groupId={groupId}
                                            onUpdated={handleUpdated}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Composant principal ──────────────────────────────────────
function CustomerPromotionDateManager() {
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);
    const [rows, setRows] = useState([]);
    const [groupPromos, setGroupPromos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Filtres
    const [search, setSearch] = useState("");
    const [filterPromoId, setFilterPromoId] = useState("all");
    const [sortKey, setSortKey] = useState("client");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 10;

    // 1. Charger les groupes au montage
    useEffect(() => {
        (async () => {
            try {
                const data = await getCustomerGroups();
                const list = Array.isArray(data) ? data : data.content ?? [];
                setGroups(list);
                if (list.length > 0) setActiveGroup(list[0]);
            } catch (e) {
                setError(e.response?.data?.message || e.message || "Impossible de charger les groupes");
            }
        })();
    }, []);

    // 2. Quand le groupe actif change
    useEffect(() => {
        if (activeGroup) loadGroupData(activeGroup);
    }, [activeGroup]);

    const loadGroupData = async (group) => {
        setLoading(true);
        setError(null);
        setRows([]);
        setGroupPromos([]);
        setPage(0);
        setFilterPromoId("all");
        try {
            const [groupDetail, promosRaw] = await Promise.all([
                getCustomerGroupById(group.id),
                getPromotionsByGroup(group.id).catch(() => []),
            ]);

            const promoList = Array.isArray(promosRaw) ? promosRaw : promosRaw.content ?? [];
            setGroupPromos(promoList);

            const members = groupDetail.members ?? groupDetail.customers ?? [];

            // Récupérer toutes les assignations
            const allAssignments = await Promise.all(
                promoList.map(p => getAssignmentsByPromotion(p.id).catch(() => [])),
            );

            const assignmentsMap = new Map();
            promoList.forEach((promo, i) => {
                const list = Array.isArray(allAssignments[i]) ? allAssignments[i] : allAssignments[i].content ?? [];
                assignmentsMap.set(promo.id, list);
            });

            const rowsBuilt = members.map((member) => {
                const client = member.customer ?? member.client ?? {
                    id: member.customerId,
                    nom: member.nom ?? member.customerName ?? "",
                    prenom: member.prenom ?? "",
                    email: member.email ?? member.customerEmail ?? "",
                };

                let firstPromo = null;
                if (promoList.length > 0) {
                    const fp = promoList[0];
                    const assignments = assignmentsMap.get(fp.id) || [];
                    const cA = assignments.find(a => a.targetType === "CUSTOMER" && a.targetCustomerId === client.id);
                    if (cA) {
                        firstPromo = { ...fp, effectiveStartDate: cA.effectiveStartDate, effectiveEndDate: cA.effectiveEndDate, assignmentId: cA.id };
                    } else {
                        const gA = assignments.find(a => a.targetType === "CUSTOMER_GROUP" && a.targetGroupId === group.id);
                        firstPromo = gA?.inheritedToMembers
                            ? { ...fp, effectiveStartDate: gA.effectiveStartDate, effectiveEndDate: gA.effectiveEndDate, assignmentId: gA.id }
                            : fp;
                    }
                }

                return {
                    id: member.customerId ?? client.id,
                    client,
                    group,
                    statut: member.status ?? member.statut ?? "ACTIF",
                    promoCount: promoList.length,
                    firstPromo,
                };
            });

            setRows(rowsBuilt);
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePromo = (rowId, assignmentId, startDate, endDate) => {
        setRows(prev =>
            prev.map(r => {
                if (r.id !== rowId) return r;
                return {
                    ...r,
                    firstPromo: r.firstPromo
                        ? { ...r.firstPromo, effectiveStartDate: startDate, effectiveEndDate: endDate }
                        : r.firstPromo,
                };
            }),
        );
        setTimeout(() => setRefreshKey(k => k + 1), 500);
    };

    // Filtrage + tri
    const filtered = useMemo(() => {
        let res = rows;
        if (search) {
            const t = search.toLowerCase();
            res = res.filter(r =>
                `${r.client?.nom} ${r.client?.prenom}`.toLowerCase().includes(t) ||
                r.client?.email?.toLowerCase().includes(t),
            );
        }
        return [...res].sort((a, b) => {
            let va, vb;
            if (sortKey === "client") {
                va = `${a.client?.nom} ${a.client?.prenom}`;
                vb = `${b.client?.nom} ${b.client?.prenom}`;
            } else if (sortKey === "promos") {
                va = a.promoCount; vb = b.promoCount;
            }
            const cmp = typeof va === "number" ? va - vb : (va ?? "").localeCompare(vb ?? "");
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [rows, search, sortKey, sortDir]);

    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
        setPage(0);
    };

    const SortArrow = ({ k }) => (
        <span className={`sort-arrow${sortKey === k ? " active" : ""}`}>
            {sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
        </span>
    );

    const COL_SPAN = 5;
    const totalAssignments = rows.reduce((s, r) => s + r.promoCount, 0);

    return (
        <div className="gpt-root">

            {/* Header */}
            <div className="gpt-header">
                <div className="gpt-title-block">
                    <h2>Clients &amp; Promotions par groupe</h2>
                    <p>Visualisez et modifiez les dates d'assignation de chaque promotion par client</p>
                </div>
                <div className="gpt-badges">
                    <div className="gpt-badge blue">👥 {groups.length} groupes</div>
                    <div className="gpt-badge blue">👤 {rows.length} clients</div>
                    <div className="gpt-badge green">🎁 {totalAssignments} assignations</div>
                    {groupPromos.length > 0 && (
                        <div className="gpt-badge yellow">✨ {groupPromos.length} promos actives</div>
                    )}
                </div>
            </div>

            {/* Erreur globale */}
            {error && (
                <div className="gpt-error">
                    ⚠ {error}
                    <button onClick={() => activeGroup && loadGroupData(activeGroup)}>Réessayer</button>
                </div>
            )}

            {/* Onglets groupes */}
            {groups.length > 0 && (
                <div className="group-tabs">
                    {groups.map(g => (
                        <button
                            key={g.id}
                            className={`group-tab${activeGroup?.id === g.id ? " active" : ""}`}
                            onClick={() => { setActiveGroup(g); setSearch(""); }}
                        >
                            {TYPE_ICONS[g.groupType] || "👥"} {g.name}
                            <span className="tab-count">
                                {g.memberCount ?? g.members?.length ?? 0}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Toolbar */}
            <div className="gpt-toolbar">
                <div className="gpt-search">
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                    />
                    <span className="gpt-search-icon">🔍</span>
                </div>
                <button
                    className="btn-refresh"
                    onClick={() => activeGroup && loadGroupData(activeGroup)}
                    disabled={loading}
                >
                    {loading
                        ? <><div className="spinner spinner-sm" /> Chargement...</>
                        : "↻ Actualiser"}
                </button>
            </div>

            {/* Tableau */}
            <div className="gpt-table-wrap">
                {loading ? (
                    <div className="gpt-loading">
                        <div className="spinner" /> Chargement des clients...
                    </div>
                ) : (
                    <>
                        <table className="gpt-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 36 }} />
                                    <th className="sortable" onClick={() => handleSort("client")}>
                                        Client <SortArrow k="client" />
                                    </th>
                                    <th>Groupe</th>
                                    <th className="sortable" onClick={() => handleSort("promos")}>
                                        Promotions <SortArrow k="promos" />
                                    </th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={COL_SPAN}>
                                            <div className="gpt-empty">
                                                <div className="gpt-empty-icon">🔍</div>
                                                <h4>Aucun client trouvé</h4>
                                                <p>
                                                    {groups.length === 0
                                                        ? "Aucun groupe disponible"
                                                        : search
                                                            ? "Modifiez vos critères de recherche"
                                                            : "Ce groupe n'a pas encore de membres"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(row => (
                                        <ClientRow
                                            key={row.id}
                                            row={row}
                                            groupId={activeGroup?.id}
                                            colSpan={COL_SPAN}
                                            onUpdatePromo={handleUpdatePromo}
                                            refreshTrigger={refreshKey}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="gpt-pagination">
                                <span>
                                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} sur {filtered.length} clients
                                </span>
                                <div className="pagination-btns">
                                    <button className="page-btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
                                    <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</button>
                                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                                        <button
                                            key={i}
                                            className={`page-btn${page === i ? " active" : ""}`}
                                            onClick={() => setPage(i)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}>›</button>
                                    <button className="page-btn" onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default CustomerPromotionDateManager;