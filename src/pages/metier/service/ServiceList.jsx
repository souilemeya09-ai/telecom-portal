import { useEffect, useState, useMemo } from "react";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../../../api/api";
import "../../../styles/offres.css";

const EMPTY_FORM = { nomService: "", description: "" };

function getValue(obj, field) {
  switch (field) {
    case "id":          return obj.id;
    case "nomService":  return obj.nomService  ?? "";
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

function Services() {
  const [services, setServices]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [editingService, setEditing]      = useState(null);
  const [detailService, setDetail]        = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [search, setSearch]               = useState("");
  const [sortField, setSortField]         = useState("id");
  const [sortOrder, setSortOrder]         = useState("asc");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setServices(await getServices()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = term
      ? services.filter((s) =>
          s.nomService?.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
        )
      : services;

    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [services, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit   = (s) => {
    setEditing(s);
    setForm({ nomService: s.nomService || "", description: s.description || "" });
    setShowForm(true); setDetail(null);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { nomService: form.nomService, description: form.description };
      if (editingService) await updateService(editingService.id, payload);
      else                await createService(payload);
      closeForm(); loadData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteService(id); setDeleteConfirm(null); setDetail(null); loadData(); }
    catch (e) { console.error(e); }
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">
            {services.length} service{services.length !== 1 ? "s" : ""} disponible{services.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau service</button>
      </div>

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="form-panel">
          <h3 className="form-panel-title">
            {editingService ? `Modifier — ${editingService.nomService}` : "Ajouter un service"}
          </h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group form-group-full">
              <label className="form-label">Nom du service *</label>
              <input className="form-control" value={form.nomService}
                onChange={(e) => setForm({ ...form, nomService: e.target.value })}
                placeholder="ex: Appels illimités, Data 20Go..." required />
            </div>
            <div className="form-group form-group-full">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Décrire le service..."
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Enregistrement..." : editingService ? "Mettre à jour" : "Créer le service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailService && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">{detailService.nomService}</h4>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Informations</p>
                <div className="detail-row-grid">
                  <div className="detail-row">
                    <span className="detail-label">ID</span>
                    <span className="detail-value mono">{detailService.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Nom</span>
                    <span className="detail-value">{detailService.nomService}</span>
                  </div>
                </div>
              </div>
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Description</p>
                <p className="rec-description">{detailService.description || "—"}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-danger"    onClick={() => setDeleteConfirm(detailService)}>Supprimer</button>
              <button className="btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
              <button className="btn-primary"   onClick={() => openEdit(detailService)}>✏️ Modifier</button>
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
              Supprimer le service <strong>{deleteConfirm.nomService}</strong> ? Cette action est irréversible.
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
        <input type="text" placeholder="Rechercher par nom, description..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des services...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun service trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#"           field="id"          {...thProps} />
                  <Th label="Nom"         field="nomService"  {...thProps} />
                  <Th label="Description" field="description" {...thProps} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((s) => (
                  <tr key={s.id}>
                    <td className="id-cell">{s.id}</td>
                    <td>
                      <div className="service-name-cell">
                        <div className="service-icon">{s.nomService?.[0]?.toUpperCase() ?? "S"}</div>
                        <span className="client-name">{s.nomService}</span>
                      </div>
                    </td>
                    <td className="desc-cell">
                      {s.description?.length > 70
                        ? s.description.slice(0, 70) + "..."
                        : s.description || "—"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view"   onClick={() => setDetail(s)}        title="Voir">👁</button>
                        <button className="btn-action btn-edit"   onClick={() => openEdit(s)}          title="Modifier">✏️</button>
                        <button className="btn-action btn-delete" onClick={() => setDeleteConfirm(s)}  title="Supprimer">🗑️</button>
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

export default Services;