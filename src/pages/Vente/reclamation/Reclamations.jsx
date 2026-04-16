import { useEffect, useState } from "react";
import {
  getReclamations,
  createReclamation,
  updateReclamation,
  deleteReclamation,
  changerStatutReclamation,
  getClients,
} from "../../../api/api";
import "./reclamations.css";

const EMPTY_FORM = {
  clientId: "",
  description: "",
  commentaireVendeur: "",
};

const STATUTS = [
  { value: "OUVERTE", label: "Ouverte", cls: "badge-ouverte" },
  { value: "EN_COURS", label: "En cours", cls: "badge-encours" },
  { value: "FERMEE", label: "Fermée", cls: "badge-fermee" },
];

const statutInfo = (s) => STATUTS.find((x) => x.value === s) || { label: s, cls: "badge-default" };

function Reclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRec, setEditingRec] = useState(null);
  const [detailRec, setDetailRec] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatut, setFilterStatut] = useState("ALL");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([getReclamations(), getClients()]);
      setReclamations(r);
      setClients(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* ── Formulaire ── */
  const openCreate = () => {
    setEditingRec(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setDetailRec(null);
  };

  const openEdit = (rec) => {
    setEditingRec(rec);
    setForm({
      clientId: rec.clientId || rec.client?.id || "",
      description: rec.description || "",
      commentaireVendeur: rec.commentaireVendeur || "",
    });
    setShowForm(true);
    setDetailRec(null);
  };

  const closeForm = () => { setShowForm(false); setEditingRec(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        clientId: Number(form.clientId),
        description: form.description,
        commentaireVendeur: form.commentaireVendeur || null,
      };
      if (editingRec) await updateReclamation(editingRec.id, payload);
      else await createReclamation(payload);
      closeForm();
      loadData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  /* ── Statut rapide ── */
  const handleStatut = async (id, statut) => {
    try {
      await changerStatutReclamation(id, statut);
      // update detail modal si ouvert
      setDetailRec((prev) => prev?.id === id ? { ...prev, statut } : prev);
      loadData();
    } catch (e) { console.error(e); }
  };

  /* ── Suppression ── */
  const handleDelete = async (id) => {
    try { await deleteReclamation(id); setDeleteConfirm(null); setDetailRec(null); loadData(); }
    catch (e) { console.error(e); }
  };

  /* ── Filtre ── */
  const displayed = filterStatut === "ALL"
    ? reclamations
    : reclamations.filter((r) => r.statut === filterStatut);

  /* ── Stats ── */
  const stats = {
    total: reclamations.length,
    ouverte: reclamations.filter((r) => r.statut === "OUVERTE").length,
    enCours: reclamations.filter((r) => r.statut === "EN_COURS").length,
    fermee: reclamations.filter((r) => r.statut === "FERMEE").length,
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Réclamations</h1>
          <p className="page-subtitle">{reclamations.length} réclamation{reclamations.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouvelle réclamation</button>
      </div>

      {/* ── Metric cards ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card stat-ouverte">
          <span className="stat-label">Ouvertes</span>
          <span className="stat-value">{stats.ouverte}</span>
        </div>
        <div className="stat-card stat-encours">
          <span className="stat-label">En cours</span>
          <span className="stat-value">{stats.enCours}</span>
        </div>
        <div className="stat-card stat-fermee">
          <span className="stat-label">Fermées</span>
          <span className="stat-value">{stats.fermee}</span>
        </div>
      </div>

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="form-panel-title">
                {editingRec ? `Modifier réclamation #${editingRec.id}` : "Nouvelle réclamation"}
              </h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>

              <div className="form-group">
                <label className="form-label">Client *</label>
                <select className="form-control" value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">Description *</label>
                <textarea className="form-control" rows={4}
                  placeholder="Décrire la réclamation du client..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">Commentaire vendeur</label>
                <textarea className="form-control" rows={2}
                  placeholder="Notes internes, actions prises..."
                  value={form.commentaireVendeur}
                  onChange={(e) => setForm({ ...form, commentaireVendeur: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Enregistrement..." : editingRec ? "Mettre à jour" : "Créer la réclamation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailRec && (
        <div className="modal-overlay" onClick={() => setDetailRec(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h4 className="modal-title">Réclamation #{detailRec.id}</h4>
                <span className={`badge ${statutInfo(detailRec.statut).cls}`}>
                  {statutInfo(detailRec.statut).label}
                </span>
              </div>
              <button className="modal-close" onClick={() => setDetailRec(null)}>✕</button>
            </div>

            <div className="detail-grid">
              {/* Client */}
              <div className="detail-section">
                <p className="detail-section-title">Client</p>
                {detailRec.client ? (
                  <>
                    <div className="client-cell" style={{ marginBottom: 8 }}>
                      <div className="avatar">{detailRec.client.nom?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="client-name">{detailRec.client.nom} {detailRec.client.prenom}</div>
                        <div className="client-email">{detailRec.client.email}</div>
                      </div>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Téléphone</span>
                      <span className="detail-value mono">{detailRec.client.telephone || "—"}</span>
                    </div>
                  </>
                ) : <p className="detail-empty">—</p>}
              </div>

              {/* Dates */}
              <div className="detail-section">
                <p className="detail-section-title">Dates</p>
                <div className="detail-row">
                  <span className="detail-label">Créée le</span>
                  <span className="detail-value">{formatDate(detailRec.dateCreation)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mise à jour</span>
                  <span className="detail-value">{formatDate(detailRec.dateMiseAJour)}</span>
                </div>
              </div>

              {/* Description */}
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Description</p>
                <p className="rec-description">{detailRec.description}</p>
              </div>

              {/* Commentaire */}
              {detailRec.commentaireVendeur && (
                <div className="detail-section detail-section-full">
                  <p className="detail-section-title">Commentaire vendeur</p>
                  <p className="rec-description rec-comment">{detailRec.commentaireVendeur}</p>
                </div>
              )}

              {/* Changer statut */}
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Changer le statut</p>
                <div className="statut-actions">
                  {STATUTS.map((s) => (
                    <button
                      key={s.value}
                      className={`statut-btn ${detailRec.statut === s.value ? "statut-btn-active" : ""}`}
                      onClick={() => handleStatut(detailRec.id, s.value)}
                      disabled={detailRec.statut === s.value}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-danger" onClick={() => setDeleteConfirm(detailRec)}>Supprimer</button>
              <button className="btn-secondary" onClick={() => setDetailRec(null)}>Fermer</button>
              <button className="btn-primary" onClick={() => openEdit(detailRec)}>✏️ Modifier</button>
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
              Supprimer la réclamation <strong>#{deleteConfirm.id}</strong> de&nbsp;
              <strong>{deleteConfirm.client?.nom} {deleteConfirm.client?.prenom}</strong> ?
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtre statut ── */}
      <div className="filter-bar">
        {[{ value: "ALL", label: "Toutes" }, ...STATUTS].map((s) => (
          <button
            key={s.value}
            className={`filter-btn ${filterStatut === s.value ? "filter-btn-active" : ""}`}
            onClick={() => setFilterStatut(s.value)}
          >
            {s.label}
            <span className="filter-count">
              {s.value === "ALL" ? reclamations.length : reclamations.filter((r) => r.statut === s.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des réclamations...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucune réclamation trouvée.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Date création</th>
                  <th>Mise à jour</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => {
                  const si = statutInfo(r.statut);
                  return (
                    <tr key={r.id}>
                      <td className="id-cell">{r.id}</td>
                      <td>
                        <div className="client-cell">
                          <div className="avatar">{r.client?.nom?.[0]?.toUpperCase() ?? "?"}</div>
                          <div>
                            <div className="client-name">{r.client ? `${r.client.nom} ${r.client.prenom}` : "—"}</div>
                            <div className="client-email">{r.client?.telephone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="desc-cell">
                        {r.description?.length > 60 ? r.description.slice(0, 60) + "..." : r.description}
                      </td>
                      <td><span className={`badge ${si.cls}`}>{si.label}</span></td>
                      <td className="date-cell">{formatDate(r.dateCreation)}</td>
                      <td className="date-cell">{formatDate(r.dateMiseAJour)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-view" onClick={() => setDetailRec(r)} title="Voir">👁</button>
                          <button className="btn-action btn-edit" onClick={() => openEdit(r)} title="Modifier">✏️</button>
                          <button className="btn-action btn-delete" onClick={() => setDeleteConfirm(r)} title="Supprimer">🗑️</button>
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

export default Reclamations;