import { useEffect, useState } from "react";
import {
  getReclamations,
  createReclamation,
  deleteReclamation,
  repondreReclamation,
  changerStatutReclamation,
  getClients,
  getCustomerGroups,
  updateReclamation,
} from "../../../api/api";
import Pagination from "../../../components/Pagination";
import "./reclamations.css";

const EMPTY_FORM = {
  clientId: "",
  EMPTY_FORM: "",
  description: "",
  commentaireVendeur: "",
  commentaireDsi: "",
  statut: "EN_COURS",
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
  const [groups, setGroups] = useState([]);
  const [clientSearchMode, setClientSearchMode] = useState("client");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRec, setEditingRec] = useState(null);
  const [detailRec, setDetailRec] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatut, setFilterStatut] = useState("ALL");
  const [clientSearch, setClientSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState(EMPTY_FORM);
  const [reponseForm, setReponseForm] = useState({ commentaireDsi: "", statut: "EN_COURS" });
  const [submittingReponse, setSubmittingReponse] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([getReclamations(), getClients()]);
      setReclamations(r);
      setClients(c.content || []);
      loadGroups()
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadGroups = async () => {
    try {
      const g = await getCustomerGroups();
      setGroups(g);
    } catch (e) { console.error(e); }
  }

  /* ── Formulaire ── */
  const openCreate = () => {
    setEditingRec(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setDetailRec(null);
  };

  const openEdit = (rec) => {
    setEditingRec(rec);
    const isGroupe = !!rec.groupId || !!rec.groupe;
    setClientSearchMode(isGroupe ? "groupe" : "client");
    setForm({
      clientId: rec.clientId || rec.client?.id || "",
      groupId: rec.groupId || rec.groupe?.id || "",
      description: rec.description || "",
      commentaireVendeur: rec.commentaireVendeur || "",
    });
    setShowForm(true);
    setDetailRec(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRec(null);
    setForm(EMPTY_FORM);
    setClientSearch("");
    setClientSearchMode("client");
  };

  const handleReponse = async (id) => {
    if (!reponseForm.commentaireDsi.trim()) return;
    setSubmittingReponse(true);
    try {
      await repondreReclamation(id, reponseForm);
      setDetailRec((prev) => prev?.id === id
        ? { ...prev, commentaireDsi: reponseForm.commentaireDsi, statut: reponseForm.statut }
        : prev
      );
      setReponseForm({ commentaireDsi: "", statut: "EN_COURS" });
      loadData();
    } catch (e) { console.error(e); }
    finally { setSubmittingReponse(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...(clientSearchMode === "client"
          ? { clientId: Number(form.clientId) }
          : { groupId: Number(form.groupId) }),
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

  const pageCount = Math.ceil(displayed.length / itemsPerPage);
  const pageItems = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatut]);

  /* ── Stats ── */
  const stats = {
    total: reclamations.length,
    ouverte: reclamations.filter((r) => r.statut === "OUVERTE").length,
    enCours: reclamations.filter((r) => r.statut === "EN_COURS").length,
    fermee: reclamations.filter((r) => r.statut === "FERMEE").length,
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const role = localStorage.getItem("role");
  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Réclamations</h1>
          <p className="page-subtitle">{reclamations.length} réclamation{reclamations.length !== 1 ? "s" : ""}</p>
        </div>
        {/* {
          role === "VENTE" && (
            <button className="btn-primary" onClick={openCreate}>+ Nouvelle réclamation</button>
          )
        } */}
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
      {showForm &&
        (
          (editingRec && role === "VENTE") ||

          (!editingRec && role === "VENTE")
        ) && (
          <div className="modal-overlay" onClick={closeForm}>
            <div
              className="modal-box modal-form"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="form-panel-title">
                  {editingRec
                    ? `Modifier réclamation #${editingRec.id}`
                    : "Nouvelle réclamation"}
                </h3>

                <button className="modal-close" onClick={closeForm}>
                  ✕
                </button>
              </div>

              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Client / Groupe</label>

                  {editingRec ? (
                    /* ── Mode lecture seule en modification ── */
                    <div className="client-readonly">
                      {clientSearchMode === "groupe" ? (
                        <>
                          <span className="client-readonly-icon">👥</span>
                          <div className="client-info">
                            <div className="client-name">
                              {editingRec.groupe?.name || editingRec.groupe?.nom || "Groupe #" + (editingRec.groupId || editingRec.groupe?.id)}
                            </div>
                            <div className="client-meta">Groupe de clients</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="avatar">
                            {editingRec.client?.nom?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="client-info">
                            <div className="client-name">
                              {editingRec.client?.nom} {editingRec.client?.prenom}
                            </div>
                            <div className="client-meta">
                              {editingRec.client?.email || editingRec.client?.cin || "—"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* ── Mode création : toggle + recherche + liste ── */
                    <>
                      <div className="search-mode-toggle">
                        <button
                          type="button"
                          className={`toggle-btn ${clientSearchMode === "client" ? "toggle-active" : ""}`}
                          onClick={() => { setClientSearchMode("client"); setClientSearch(""); setForm({ ...form, clientId: "", groupId: "" }); }}
                        >
                          👤 Par client
                        </button>
                        <button
                          type="button"
                          className={`toggle-btn ${clientSearchMode === "groupe" ? "toggle-active" : ""}`}
                          onClick={() => { setClientSearchMode("groupe"); setClientSearch(""); setForm({ ...form, clientId: "", groupId: "" }); }}
                        >
                          👥 Par groupe
                        </button>
                      </div>

                      <input
                        type="text"
                        className="form-control"
                        placeholder={clientSearchMode === "client"
                          ? "🔎 Nom, prénom, email ou CIN..."
                          : "🔎 Nom du groupe..."}
                        value={clientSearch}
                        onChange={(e) => { setClientSearch(e.target.value); setForm({ ...form, clientId: "" }); }}
                        style={{ marginBottom: 6 }}
                      />

                      <div className="client-list">
                        {clientSearchMode === "client"
                          ? clients
                            .filter((c) => {
                              const q = clientSearch.toLowerCase().trim();
                              return !q || [c.nom, c.prenom, c.email, c.cin].some((v) => v?.toLowerCase().includes(q));
                            })
                            .map((c) => (
                              <label
                                key={c.id}
                                className={`client-item ${form.clientId === c.id ? "active" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="client"
                                  value={c.id}
                                  checked={form.clientId === c.id}
                                  onChange={() => setForm({ ...form, clientId: c.id })}
                                />
                                <div className="client-info">
                                  <div className="client-name">{c.nom} {c.prenom}</div>
                                  <div className="client-meta">{c.email || c.cin || "—"}</div>
                                </div>
                              </label>
                            ))
                          : groups
                            .filter((g) => {
                              const q = clientSearch.toLowerCase().trim();
                              return !q || g.name?.toLowerCase().includes(q);
                            })
                            .map((g) => (
                              <label
                                key={g.id}
                                className={`client-item ${form.groupId === g.id ? "active" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="groupe"
                                  value={g.id}
                                  checked={form.groupId === g.id}
                                  onChange={() => setForm({ ...form, groupId: g.id, clientId: "" })}
                                />
                                <div className="client-info">
                                  <div className="client-name">👥 {g.name}</div>
                                  <div className="client-meta">{g.memberCount || 0} clients</div>
                                </div>
                              </label>
                            ))
                        }
                      </div>
                    </>
                  )}
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">Description *</label>

                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Décrire la réclamation du client..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">
                    Commentaire vendeur
                  </label>

                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Notes internes, actions prises..."
                    value={form.commentaireVendeur}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        commentaireVendeur: e.target.value,
                      })
                    }
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeForm}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting || (!form.clientId && !form.groupId)}
                  >
                    {submitting
                      ? "Enregistrement..."
                      : editingRec
                        ? "Mettre à jour"
                        : "Créer la réclamation"}
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

              {
                role === "DSI" && (
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
                )
              }

              {/* ── Panneau réponse DSI ── */}
              {role === "DSI" && (
                <div className="detail-section detail-section-full">
                  <p className="detail-section-title">Réponse DSI</p>

                  {detailRec.commentaireDsi && (
                    <p className="rec-description rec-comment" style={{ marginBottom: 12 }}>
                      <strong>Réponse envoyée :</strong> {detailRec.commentaireDsi}
                    </p>
                  )}

                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Rédiger la réponse au client..."
                    value={reponseForm.commentaireDsi}
                    onChange={(e) => setReponseForm({ ...reponseForm, commentaireDsi: e.target.value })}
                    style={{ resize: "vertical", marginBottom: 10 }}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <select
                      className="form-control"
                      style={{ width: "auto" }}
                      value={reponseForm.statut}
                      onChange={(e) => setReponseForm({ ...reponseForm, statut: e.target.value })}
                    >
                      {STATUTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    <button
                      className="btn-primary"
                      onClick={() => handleReponse(detailRec.id)}
                      disabled={submittingReponse || !reponseForm.commentaireDsi.trim()}
                    >
                      {submittingReponse ? "Envoi..." : "📨 Envoyer la réponse"}
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8 }}>
                    Un email sera envoyé automatiquement au client.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-danger" onClick={() => setDeleteConfirm(detailRec)}>Supprimer</button>
              <button className="btn-secondary" onClick={() => setDetailRec(null)}>Fermer</button>
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
                {pageItems.map((r) => {
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
                          {
                            role === "VENTE" && (
                              <button className="btn-action btn-edit" onClick={() => openEdit(r)} title="Modifier">✏️</button>
                            )
                          }
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
        <Pagination currentPage={currentPage} totalPages={pageCount} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default Reclamations;