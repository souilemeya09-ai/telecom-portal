import { useEffect, useState } from "react";
import {
  getContrats,
  createContrat,
  updateContrat,
  deleteContrat,
  resilierContrat,
  getClients,
  getOffres,
} from "../../../api/api";
import "../../../styles/CreateContrat.css";

const EMPTY_FORM = {
  clientId: "", offreId: "",
  dateDebut: "", dateFin: "", directoryNumber: "",
};

function Contrats() {
  const [contrats, setContrats] = useState([]);
  const [clients, setClients] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // panels / modals
  const [showForm, setShowForm] = useState(false);
  const [editingContrat, setEditing] = useState(null);   // null = create, obj = edit
  const [detailContrat, setDetail] = useState(null);   // modal détail
  const [deleteConfirm, setDeleteConfirm] = useState(null); // modal suppression

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, cl, o] = await Promise.all([getContrats(), getClients(), getOffres()]);
      setContrats(c); setClients(cl); setOffers(o);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  /* ── Ouvrir formulaire création ── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  /* ── Ouvrir formulaire édition ── */
  const openEdit = (contrat) => {
    setEditing(contrat);
    setForm({
      clientId: contrat.clientId || contrat.client?.id || "",
      offreId: contrat.offreId || contrat.offre?.id || "",
      dateDebut: contrat.dateDebut || "",
      dateFin: contrat.dateFin || "",
      directoryNumber: contrat.directoryNumber || "",
    });
    setShowForm(true);
    setDetail(null);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  /* ── Submit création / modification ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        clientId: Number(form.clientId),
        offreId: Number(form.offreId),
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || null,
        directoryNumber: form.directoryNumber ? String(form.directoryNumber) : null,
      };
      if (editingContrat) await updateContrat(editingContrat.id, payload);
      else await createContrat(payload);
      closeForm();
      loadData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

const handleDelete = async (id) => {
  try {
    await deleteContrat(id);
    setDeleteConfirm(null);
    loadData();
  } catch (err) {
    console.error("Erreur suppression :", err);
  }
};

  /* ── Résilier ── */
  const handleResilier = async (id) => {
    try { await resilierContrat(id); setDetail(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const statutClass = (s) => {
    if (s === "ACTIF") return "badge badge-actif";
    if (s === "RESILIE") return "badge badge-resilie";
    return "badge badge-default";
  };

  /* ─────────────────────────────────────────── */
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contrats</h1>
          <p className="page-subtitle">
            {contrats.length} contrat{contrats.length !== 1 ? "s" : ""} enregistré{contrats.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau contrat</button>
      </div>

      {/* ── Formulaire panel (création + édition) ── */}
      {showForm && (
        <div className="form-panel">
          <h3 className="form-panel-title">
            {editingContrat ? `Modifier contrat #${editingContrat.id}` : "Créer un nouveau contrat"}
          </h3>
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

            <div className="form-group">
              <label className="form-label">Offre *</label>
              <select className="form-control" value={form.offreId}
                onChange={(e) => setForm({ ...form, offreId: e.target.value })} required>
                <option value="">Sélectionner une offre</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>{o.nomOffre || o.nom || "Sans nom"}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date début *</label>
              <input className="form-control" type="date" value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Date fin</label>
              <input className="form-control" type="date" value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Directory Number</label>
              <input className="form-control" type="text" placeholder="ex: 21620123456"
                value={form.directoryNumber}
                onChange={(e) => setForm({ ...form, directoryNumber: e.target.value })} />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Enregistrement..." : editingContrat ? "Mettre à jour" : "Créer le contrat"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailContrat && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div>
                <h4 className="modal-title">Contrat #{detailContrat.id}</h4>
                <span className={statutClass(detailContrat.statut)}>{detailContrat.statut}</span>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="detail-grid">
              {/* Client */}
              <div className="detail-section">
                <p className="detail-section-title">Client</p>
                {detailContrat.client ? (
                  <>
                    <div className="client-cell" style={{ marginBottom: 8 }}>
                      <div className="avatar">{detailContrat.client.nom?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="client-name">{detailContrat.client.nom} {detailContrat.client.prenom}</div>
                        <div className="client-email">{detailContrat.client.email}</div>
                      </div>
                    </div>
                    <DetailRow label="Téléphone" value={detailContrat.client.telephone} />
                  </>
                ) : <p className="detail-empty">—</p>}
              </div>

              {/* Offre */}
              <div className="detail-section">
                <p className="detail-section-title">Offre</p>
                {detailContrat.offre ? (
                  <>
                    <DetailRow label="Nom" value={detailContrat.offre.nom} />
                    <DetailRow label="Description" value={detailContrat.offre.description} />
                    <DetailRow label="Prix" value={detailContrat.offre.prix ? `${detailContrat.offre.prix} TND/mois` : "—"} />
                  </>
                ) : <p className="detail-empty">—</p>}
              </div>

              {/* Contrat */}
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Informations contrat</p>
                <div className="detail-row-grid">
                  <DetailRow label="Date début" value={detailContrat.dateDebut} />
                  <DetailRow label="Date fin" value={detailContrat.dateFin || "—"} />
                  <DetailRow label="Directory Number" value={detailContrat.directoryNumber || "—"} mono />
                  <DetailRow label="Statut" value={detailContrat.statut} />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              {detailContrat.statut !== "RESILIE" && (
                <button className="btn-warning"
                  onClick={() => { if (window.confirm("Résilier ce contrat ?")) handleResilier(detailContrat.id); }}>
                  Résilier
                </button>
              )}
              <button className="btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
              <button className="btn-primary" onClick={() => openEdit(detailContrat)}>✏️ Modifier</button>
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
        Supprimer le contrat <strong>#{deleteConfirm.id}</strong> de&nbsp;
        <strong>
          {deleteConfirm.client?.nom} {deleteConfirm.client?.prenom}
        </strong> ?
        Cette action est irréversible.
      </p>

      <div className="modal-actions">
        <button
          className="btn-secondary"
          onClick={() => setDeleteConfirm(null)}
        >
          Annuler
        </button>

        <button
          className="btn-danger"
          onClick={() => handleDelete(deleteConfirm.id)}
        >
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}
      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des contrats...</div>
        ) : contrats.length === 0 ? (
          <div className="empty-state"><p>Aucun contrat enregistré.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Offre</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Statut</th>
                  <th>Numéro</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contrats.map((c) => (
                  <tr key={c.id}>
                    <td className="id-cell">{c.id}</td>
                    <td>
                      <div className="client-cell">
                        <div className="avatar">{c.client?.nom?.[0]?.toUpperCase() ?? "?"}</div>
                        <div>
                          <div className="client-name">{c.client ? `${c.client.nom} ${c.client.prenom}` : "—"}</div>
                          <div className="client-email">{c.client?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="offre-cell">{c.offre?.nom ?? "—"}</td>
                    <td>{c.dateDebut}</td>
                    <td>{c.dateFin || "—"}</td>
                    <td><span className={statutClass(c.statut)}>{c.statut}</span></td>
                    <td className="mono">{c.directoryNumber || "—"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view"
                          onClick={() => setDetail(c)} title="Voir détails">
                          👁
                        </button>
                        <button className="btn-action btn-edit"
                          onClick={() => openEdit(c)} title="Modifier">
                          ✏️
                        </button>
                        <button className="btn-action btn-delete"
                          onClick={() => setDeleteConfirm(c)} title="Supprimer">
                          🗑️
                        </button>
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

/* ── Petit composant utilitaire ── */
function DetailRow({ label, value, mono }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${mono ? " mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export default Contrats;