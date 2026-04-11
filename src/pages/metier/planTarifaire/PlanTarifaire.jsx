import { useEffect, useState, useMemo } from "react";
import {
  getPlansTarifaires,
  createPlanTarifaire,
  updatePlanTarifaire,
  deletePlanTarifaire,
} from "../../../api/api";
import "../../../styles/plans.css";

const EMPTY_FORM = { nom: "", prixMensuel: "", description: "" };

function getValue(obj, field) {
  switch (field) {
    case "id":          return obj.id;
    case "nom":         return obj.nom         ?? "";
    case "prixMensuel": return Number(obj.prixMensuel) || 0;
    case "description": return obj.description ?? "";
    default:            return "";
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

function PlansTarifaires() {
  const [plans, setPlans]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [editingPlan, setEditing]         = useState(null);
  const [detailPlan, setDetail]           = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [search, setSearch]               = useState("");
  const [sortField, setSortField]         = useState("id");
  const [sortOrder, setSortOrder]         = useState("asc");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setPlans(await getPlansTarifaires()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   plans.length,
    minPrix: plans.length ? Math.min(...plans.map((p) => Number(p.prixMensuel) || 0)) : 0,
    maxPrix: plans.length ? Math.max(...plans.map((p) => Number(p.prixMensuel) || 0)) : 0,
    avgPrix: plans.length
      ? (plans.reduce((acc, p) => acc + (Number(p.prixMensuel) || 0), 0) / plans.length).toFixed(2)
      : 0,
  }), [plans]);

  // ── Sort + search ─────────────────────────────────────────
  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = term
      ? plans.filter((p) =>
          p.nom?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          String(p.prixMensuel).includes(term)
        )
      : plans;

    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [plans, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  // ── Formulaire ────────────────────────────────────────────
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit   = (p) => {
    setEditing(p);
    setForm({ nom: p.nom || "", prixMensuel: p.prixMensuel || "", description: p.description || "" });
    setShowForm(true); setDetail(null);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = {
        nom:         form.nom,
        prixMensuel: Number(form.prixMensuel),
        description: form.description || null,
      };
      if (editingPlan) await updatePlanTarifaire(editingPlan.id, payload);
      else             await createPlanTarifaire(payload);
      closeForm(); loadData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deletePlanTarifaire(id); setDeleteConfirm(null); setDetail(null); loadData(); }
    catch (e) { console.error(e); }
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Plans tarifaires</h1>
          <p className="page-subtitle">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} disponible{plans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau plan</button>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card stat-min">
          <span className="stat-label">Prix min</span>
          <span className="stat-value">{stats.minPrix} <small>TND</small></span>
        </div>
        <div className="stat-card stat-max">
          <span className="stat-label">Prix max</span>
          <span className="stat-value">{stats.maxPrix} <small>TND</small></span>
        </div>
        <div className="stat-card stat-avg">
          <span className="stat-label">Prix moyen</span>
          <span className="stat-value">{stats.avgPrix} <small>TND</small></span>
        </div>
      </div>

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="form-panel">
          <h3 className="form-panel-title">
            {editingPlan ? `Modifier — ${editingPlan.nom}` : "Nouveau plan tarifaire"}
          </h3>
          <form className="form-grid" onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="form-label">Nom du plan *</label>
              <input className="form-control" value={form.nom} onChange={set("nom")}
                placeholder="ex: Plan Standard" required />
            </div>

            <div className="form-group">
              <label className="form-label">Prix mensuel (TND) *</label>
              <div className="input-with-prefix">
                <span className="input-prefix">TND</span>
                <input className="form-control" type="number" min="0" step="0.01"
                  value={form.prixMensuel} onChange={set("prixMensuel")}
                  placeholder="0.00" required />
              </div>
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3}
                value={form.description} onChange={set("description")}
                placeholder="ex: Appels illimités + 10 Go data, valable 30 jours..."
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Enregistrement..." : editingPlan ? "Mettre à jour" : "Créer le plan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailPlan && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">{detailPlan.nom}</h4>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="detail-grid">
              <div className="detail-section">
                <p className="detail-section-title">Informations</p>
                <div className="detail-row">
                  <span className="detail-label">ID</span>
                  <span className="detail-value mono">{detailPlan.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Nom</span>
                  <span className="detail-value">{detailPlan.nom}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Prix mensuel</span>
                  <span className="detail-value plan-prix-value">{detailPlan.prixMensuel} TND/mois</span>
                </div>
              </div>

              <div className="detail-section">
                <p className="detail-section-title">Description</p>
                <p className="rec-description">{detailPlan.description || "—"}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-danger"    onClick={() => setDeleteConfirm(detailPlan)}>Supprimer</button>
              <button className="btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
              <button className="btn-primary"   onClick={() => openEdit(detailPlan)}>✏️ Modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Suppression ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h4 className="modal-title">Confirmer la suppression</h4>
            <p className="modal-text">
              Supprimer le plan <strong>{deleteConfirm.nom}</strong> ?
              Les offres liées perdront leur plan tarifaire.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-danger"    onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="search-bar">
        <input type="text" placeholder="Rechercher par nom, description, prix..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des plans...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun plan trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#"           field="id"          {...thProps} />
                  <Th label="Nom"         field="nom"         {...thProps} />
                  <Th label="Prix (TND)"  field="prixMensuel" {...thProps} />
                  <Th label="Description" field="description" {...thProps} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((p) => (
                  <tr key={p.id}>
                    <td className="id-cell">{p.id}</td>
                    <td>
                      <div className="plan-name-cell">
                        <div className="plan-icon">📋</div>
                        <span className="client-name">{p.nom}</span>
                      </div>
                    </td>
                    <td>
                      <span className="plan-prix-badge">{p.prixMensuel} TND</span>
                    </td>
                    <td className="desc-cell">
                      {p.description?.length > 70
                        ? p.description.slice(0, 70) + "..."
                        : p.description || "—"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view"
                          onClick={() => setDetail(p)} title="Voir">👁</button>
                        <button className="btn-action btn-edit"
                          onClick={() => openEdit(p)} title="Modifier">✏️</button>
                        <button className="btn-action btn-delete"
                          onClick={() => setDeleteConfirm(p)} title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlansTarifaires;