import { useEffect, useState, useMemo } from "react";
import {
    getPromotions,
    createPromotion,
    validerPromotion,
    rejeterPromotion,
    activerPromotion,
    suspendrePromotion,
} from "../../../api/api";
import "../../../styles/promotions.css";

// ── Config statuts ───────────────────────────────────────────
const STATUTS = [
    { value: "EN_ATTENTE", label: "En attente", cls: "badge-attente" },
    { value: "VALIDEE", label: "Validée", cls: "badge-validee" },
    { value: "REJETEE", label: "Rejetée", cls: "badge-rejetee" },
    { value: "ACTIVE", label: "Active", cls: "badge-active" },
    { value: "SUSPENDUE", label: "Suspendue", cls: "badge-suspendue" },
];

const TYPE_REDUCTION = [
    { value: "POURCENTAGE", label: "Pourcentage (%)" },
    { value: "MONTANT_FIXE", label: "Montant fixe (TND)" },
];

const statutInfo = (s) => STATUTS.find((x) => x.value === s) || { label: s, cls: "badge-default" };

// ✅ Corrigé selon l'entité Promotion
const EMPTY_FORM = {
    nomPromotion: "",
    typeReduction: "POURCENTAGE",
    valeurReduction: "",
    dateDebut: "",
    dateFin: "",
    regleEligibilite: "",
    ancienneteMinimale: "",
};

// ── Sort helpers ─────────────────────────────────────────────
function getValue(obj, field) {
    switch (field) {
        case "id": return obj.id;
        case "nomPromotion": return obj.nomPromotion ?? "";
        case "typeReduction": return obj.typeReduction ?? "";
        case "valeurReduction": return Number(obj.valeurReduction) || 0;
        case "dateDebut": return obj.dateDebut ?? "";
        case "dateFin": return obj.dateFin ?? "";
        case "statut": return obj.statut ?? "";
        default: return "";
    }
}

function SortIcon({ field, sortField, sortOrder }) {
    if (sortField !== field) return <span className="sort-icon sort-idle">⇅</span>;
    return <span className="sort-icon sort-active">{sortOrder === "asc" ? "↑" : "↓"}</span>;
}

function Th({ label, field, sortField, sortOrder, onSort }) {
    return (
        <th className="sortable-th" onClick={() => onSort(field)}>
            <span className="th-inner">
                {label}
                <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
            </span>
        </th>
    );
}

// ── Composant principal ──────────────────────────────────────
function Promotions() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [detailPromo, setDetail] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [filterStatut, setFilterStatut] = useState("ALL");
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    // ✅ Extraire l'ID du user connecté depuis le JWT
    const currentUserId = useMemo(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log(payload);
            
            return payload.id || payload.userId || payload.sub || null;
        } catch { return null; }
    }, []);

    // ID validateur depuis le JWT
    const validateurId = useMemo(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.id || payload.userId || null;
        } catch { return null; }
    }, []);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { setPromotions(await getPromotions()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // ── Sort + search + filter ────────────────────────────────
    const displayed = useMemo(() => {
        const term = search.toLowerCase();
        let list = promotions;

        if (filterStatut !== "ALL")
            list = list.filter((p) => p.statut === filterStatut);

        if (term)
            list = list.filter((p) =>
                p.nomPromotion?.toLowerCase().includes(term) ||
                p.typeReduction?.toLowerCase().includes(term) ||
                p.regleEligibilite?.toLowerCase().includes(term) ||
                String(p.valeurReduction).includes(term)
            );

        return [...list].sort((a, b) => {
            const va = getValue(a, sortField);
            const vb = getValue(b, sortField);
            const cmp = typeof va === "number"
                ? va - vb
                : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
            return sortOrder === "asc" ? cmp : -cmp;
        });
    }, [promotions, filterStatut, search, sortField, sortOrder]);

    const handleSort = (field) => {
        if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        else { setSortField(field); setSortOrder("asc"); }
    };

    // ── Stats ─────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: promotions.length,
        enAttente: promotions.filter((p) => p.statut === "EN_ATTENTE").length,
        active: promotions.filter((p) => p.statut === "ACTIVE").length,
        validee: promotions.filter((p) => p.statut === "VALIDEE").length,
    }), [promotions]);

    // ── Formulaire ────────────────────────────────────────────
    const openCreate = () => { setForm(EMPTY_FORM); setShowForm(true); setDetail(null); };
    const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); };
    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createPromotion({
                createurId: currentUserId,
                nomPromotion: form.nomPromotion,
                typeReduction: form.typeReduction,
                valeurReduction: Number(form.valeurReduction),
                dateDebut: form.dateDebut,
                dateFin: form.dateFin || null,
                regleEligibilite: form.regleEligibilite || null,
                ancienneteMinimale: form.ancienneteMinimale
                    ? Number(form.ancienneteMinimale)
                    : null,
            });
            closeForm();
            loadData();
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    // ── Actions métier ────────────────────────────────────────
    const execAction = async () => {
        if (!confirmAction) return;
        const { type, promo } = confirmAction;
        try {
            switch (type) {
                case "valider": await validerPromotion(promo.id, validateurId); break;
                case "rejeter": await rejeterPromotion(promo.id, validateurId); break;
                case "activer": await activerPromotion(promo.id); break;
                case "suspendre": await suspendrePromotion(promo.id); break;
                default: break;
            }
            setConfirmAction(null); setDetail(null); loadData();
        } catch (err) { console.error(err); }
    };

    const actionMeta = {
        valider: { label: "Valider", cls: "btn-success", msg: "Valider cette promotion ?" },
        rejeter: { label: "Rejeter", cls: "btn-danger", msg: "Rejeter cette promotion ?" },
        activer: { label: "Activer", cls: "btn-primary", msg: "Activer cette promotion ?" },
        suspendre: { label: "Suspendre", cls: "btn-warning", msg: "Suspendre cette promotion ?" },
    };

    const getActions = (promo) => {
        switch (promo.statut) {
            case "EN_ATTENTE": return ["valider", "rejeter"];
            case "VALIDEE": return ["activer"];
            case "ACTIVE": return ["suspendre"];
            case "SUSPENDUE": return ["activer"];
            default: return [];
        }
    };

    // ── Affichage valeur réduction ────────────────────────────
    const formatValeur = (p) =>
        p.typeReduction === "POURCENTAGE"
            ? `${p.valeurReduction}%`
            : `${p.valeurReduction} TND`;

    const thProps = { sortField, sortOrder, onSort: handleSort };

    // ────────────────────────────────────────────────────────────
    return (
        <div className="page-wrapper">

            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Promotions</h1>
                    <p className="page-subtitle">{promotions.length} promotion{promotions.length !== 1 ? "s" : ""}</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Nouvelle promotion</button>
            </div>

            {/* ── Stats ── */}
            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{stats.total}</span>
                </div>
                <div className="stat-card stat-attente">
                    <span className="stat-label">En attente</span>
                    <span className="stat-value">{stats.enAttente}</span>
                </div>
                <div className="stat-card stat-active-promo">
                    <span className="stat-label">Actives</span>
                    <span className="stat-value">{stats.active}</span>
                </div>
                <div className="stat-card stat-validee">
                    <span className="stat-label">Validées</span>
                    <span className="stat-value">{stats.validee}</span>
                </div>
            </div>

            {/* ── Formulaire ── */}
            {showForm && (
                <div className="form-panel">
                    <h3 className="form-panel-title">Nouvelle promotion</h3>
                    <form className="form-grid" onSubmit={handleSubmit}>

                        {/* Nom */}
                        <div className="form-group">
                            <label className="form-label">Nom de la promotion *</label>
                            <input className="form-control" value={form.nomPromotion}
                                onChange={set("nomPromotion")}
                                placeholder="ex: Promo Ramadan 2026" required />
                        </div>

                        {/* Type réduction */}
                        <div className="form-group">
                            <label className="form-label">Type de réduction *</label>
                            <select className="form-control" value={form.typeReduction}
                                onChange={set("typeReduction")}>
                                {TYPE_REDUCTION.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Valeur réduction */}
                        <div className="form-group">
                            <label className="form-label">
                                Valeur {form.typeReduction === "POURCENTAGE" ? "(%)" : "(TND)"} *
                            </label>
                            <div className="input-with-prefix">
                                <span className="input-prefix">
                                    {form.typeReduction === "POURCENTAGE" ? "%" : "TND"}
                                </span>
                                <input className="form-control" type="number" min="0" step="0.01"
                                    value={form.valeurReduction} onChange={set("valeurReduction")}
                                    placeholder="ex: 20" required />
                            </div>
                        </div>

                        {/* Ancienneté minimale */}
                        <div className="form-group">
                            <label className="form-label">Ancienneté minimale (mois)</label>
                            <input className="form-control" type="number" min="0"
                                value={form.ancienneteMinimale} onChange={set("ancienneteMinimale")}
                                placeholder="ex: 6 mois" />
                        </div>

                        {/* Dates */}
                        <div className="form-group">
                            <label className="form-label">Date début *</label>
                            <input className="form-control" type="date" value={form.dateDebut}
                                onChange={set("dateDebut")} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date fin</label>
                            <input className="form-control" type="date" value={form.dateFin}
                                onChange={set("dateFin")} />
                        </div>

                        {/* Règle éligibilité */}
                        <div className="form-group form-group-full">
                            <label className="form-label">Règle d'éligibilité</label>
                            <textarea className="form-control" rows={2}
                                value={form.regleEligibilite} onChange={set("regleEligibilite")}
                                placeholder="ex: Réservé aux clients avec offre MOBILE, ancienneté > 6 mois..."
                                style={{ resize: "vertical" }}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={submitting}>
                                {submitting ? "Création..." : "Créer la promotion"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Modal Détail ── */}
            {detailPromo && (
                <div className="modal-overlay" onClick={() => setDetail(null)}>
                    <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <h4 className="modal-title">{detailPromo.nomPromotion}</h4>
                                <span className={`badge ${statutInfo(detailPromo.statut).cls}`}>
                                    {statutInfo(detailPromo.statut).label}
                                </span>
                            </div>
                            <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
                        </div>

                        <div className="detail-grid">
                            {/* Infos réduction */}
                            <div className="detail-section">
                                <p className="detail-section-title">Réduction</p>
                                <div className="detail-row">
                                    <span className="detail-label">Type</span>
                                    <span className="detail-value">
                                        {TYPE_REDUCTION.find((t) => t.value === detailPromo.typeReduction)?.label ?? detailPromo.typeReduction}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Valeur</span>
                                    <span className="detail-value remise-value">{formatValeur(detailPromo)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Date début</span>
                                    <span className="detail-value">{detailPromo.dateDebut || "—"}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Date fin</span>
                                    <span className="detail-value">{detailPromo.dateFin || "—"}</span>
                                </div>
                            </div>

                            {/* Éligibilité */}
                            <div className="detail-section">
                                <p className="detail-section-title">Éligibilité</p>
                                <div className="detail-row">
                                    <span className="detail-label">Ancienneté min.</span>
                                    <span className="detail-value">
                                        {detailPromo.ancienneteMinimale
                                            ? `${detailPromo.ancienneteMinimale} mois`
                                            : "—"}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Règle</span>
                                    <span className="detail-value" style={{ fontSize: "0.82rem" }}>
                                        {detailPromo.regleEligibilite || "—"}
                                    </span>
                                </div>
                            </div>

                            {/* Créateur / Validateur */}
                            <div className="detail-section detail-section-full">
                                <p className="detail-section-title">Intervenants</p>
                                <div className="detail-row-grid">
                                    <div className="detail-row">
                                        <span className="detail-label">Créateur</span>
                                        <span className="detail-value">
                                            {detailPromo.createur
                                                ? `${detailPromo.createur.username ?? detailPromo.createur.email}`
                                                : "—"}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Validateur</span>
                                        <span className="detail-value">
                                            {detailPromo.validateur
                                                ? `${detailPromo.validateur.username ?? detailPromo.validateur.email}`
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions métier */}
                            {getActions(detailPromo).length > 0 && (
                                <div className="detail-section detail-section-full">
                                    <p className="detail-section-title">Actions disponibles</p>
                                    <div className="statut-actions">
                                        {getActions(detailPromo).map((type) => (
                                            <button key={type}
                                                className={`statut-btn ${actionMeta[type].cls}`}
                                                onClick={() => setConfirmAction({ type, promo: detailPromo })}>
                                                {actionMeta[type].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Confirmation ── */}
            {confirmAction && (
                <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h4 className="modal-title">{actionMeta[confirmAction.type].msg}</h4>
                        <p className="modal-text">
                            Promotion : <strong>{confirmAction.promo.nomPromotion}</strong>
                        </p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Annuler</button>
                            <button className={actionMeta[confirmAction.type].cls} onClick={execAction}>
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filtre + search ── */}
            <div className="filter-search-row">
                <div className="filter-bar">
                    {[{ value: "ALL", label: "Toutes" }, ...STATUTS].map((s) => (
                        <button key={s.value}
                            className={`filter-btn ${filterStatut === s.value ? "filter-btn-active" : ""}`}
                            onClick={() => setFilterStatut(s.value)}>
                            {s.label}
                            <span className="filter-count">
                                {s.value === "ALL"
                                    ? promotions.length
                                    : promotions.filter((p) => p.statut === s.value).length}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="search-bar" style={{ marginBottom: 0, flex: 1 }}>
                    <input type="text" placeholder="Rechercher par nom, type, règle..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="table-card" style={{ marginTop: "1rem" }}>
                {loading ? (
                    <div className="loading-state">Chargement des promotions...</div>
                ) : displayed.length === 0 ? (
                    <div className="empty-state"><p>Aucune promotion trouvée.</p></div>
                ) : (
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <Th label="#" field="id"             {...thProps} />
                                    <Th label="Nom" field="nomPromotion"   {...thProps} />
                                    <Th label="Type" field="typeReduction"  {...thProps} />
                                    <Th label="Valeur" field="valeurReduction"{...thProps} />
                                    <Th label="Date début" field="dateDebut"      {...thProps} />
                                    <Th label="Date fin" field="dateFin"        {...thProps} />
                                    <Th label="Statut" field="statut"         {...thProps} />
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map((p) => {
                                    const si = statutInfo(p.statut);
                                    const actions = getActions(p);
                                    return (
                                        <tr key={p.id}>
                                            <td className="id-cell">{p.id}</td>
                                            <td>
                                                <div className="service-name-cell">
                                                    <div className="promo-icon">🏷️</div>
                                                    <div>
                                                        <div className="client-name">{p.nomPromotion}</div>
                                                        {p.regleEligibilite && (
                                                            <div className="client-email">
                                                                {p.regleEligibilite.length > 40
                                                                    ? p.regleEligibilite.slice(0, 40) + "..."
                                                                    : p.regleEligibilite}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`type-badge ${p.typeReduction === "POURCENTAGE" ? "type-pct" : "type-fixe"}`}>
                                                    {p.typeReduction === "POURCENTAGE" ? "%" : "TND fixe"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="remise-badge">{formatValeur(p)}</span>
                                            </td>
                                            <td className="date-cell">{p.dateDebut || "—"}</td>
                                            <td className="date-cell">{p.dateFin || "—"}</td>
                                            <td><span className={`badge ${si.cls}`}>{si.label}</span></td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-action btn-view"
                                                        onClick={() => setDetail(p)} title="Voir">👁</button>
                                                    {actions.map((type) => (
                                                        <button key={type}
                                                            className={`btn-action btn-action-${type}`}
                                                            onClick={() => setConfirmAction({ type, promo: p })}
                                                            title={actionMeta[type].label}>
                                                            {type === "valider" ? "✅" : type === "rejeter" ? "❌" : type === "activer" ? "▶️" : "⏸️"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Promotions;