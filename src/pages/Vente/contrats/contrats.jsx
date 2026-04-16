import { useEffect, useState, useMemo } from "react";
import {
  getContrats, createContrat, updateContrat,
  deleteContrat, resilierContrat, getClients, getOffres,
} from "../../../api/api";
import "../../../styles/CreateContrat.css";

const EMPTY_FORM = {
  clientId: "", offreId: "",
  dateDebut: "", dateFin: "", directoryNumber: "",
};

// ── Date helpers ─────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

function validateDates(dateDebut, dateFin) {
  const errors = {};
  const now = today();

  if (dateDebut && dateDebut < now) {
    errors.dateDebut = "La date de début doit être aujourd'hui ou dans le futur.";
  }
  if (dateFin && dateDebut && dateFin <= dateDebut) {
    errors.dateFin = "La date de fin doit être postérieure à la date de début.";
  }
  if (dateFin && dateFin < now) {
    errors.dateFin = "La date de fin doit être dans le futur.";
  }
  return errors;
}

// ── Sort helpers ─────────────────────────────────────────────
function getValue(obj, field) {
  switch (field) {
    case "id": return obj.id;
    case "client": return obj.client ? `${obj.client.nom} ${obj.client.prenom}` : "";
    case "offre": return obj.offre?.nom ?? "";
    case "dateDebut": return obj.dateDebut ?? "";
    case "dateFin": return obj.dateFin ?? "";
    case "statut": return obj.statut ?? "";
    case "directoryNumber": return obj.directoryNumber ?? "";
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

// ────────────────────────────────────────────────────────────
function Contrats() {
  const [contrats, setContrats] = useState([]);
  const [clients, setClients] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContrat, setEditing] = useState(null);
  const [detailContrat, setDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateErrors, setDateErrors] = useState({});
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, cl, o] = await Promise.all([getContrats(), getClients(), getOffres()]);
      setContrats(c); setClients(cl); setOffers(o);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Sort + search ─────────────────────────────────────────
  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = term
      ? contrats.filter((c) =>
        `${c.client?.nom} ${c.client?.prenom}`.toLowerCase().includes(term) ||
        c.offre?.nom?.toLowerCase().includes(term) ||
        c.statut?.toLowerCase().includes(term) ||
        (c.directoryNumber ?? "").toLowerCase().includes(term)
      )
      : contrats;

    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [contrats, sortField, sortOrder, search]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  // ── Numéro helpers ────────────────────────────────────────
  function genererNumero() {
    const prefixes = ["20", "21", "22", "23", "25", "50", "52", "53", "55", "58", "90", "92", "94", "97", "98"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000);
    return `216${prefix}${suffix}`;
  }

  function formatNumero(num) {
    const s = String(num);
    if (s.length === 11 && s.startsWith("216"))
      return `+${s.slice(0, 3)} ${s.slice(3, 5)} ${s.slice(5, 8)} ${s.slice(8, 11)}`;
    return s;
  }

  // ── Mise à jour form avec validation dates en temps réel ──
  const updateForm = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (patch.dateDebut !== undefined || patch.dateFin !== undefined) {
      setDateErrors(validateDates(next.dateDebut, next.dateFin));
    }
  };

  // ── Formulaire ────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, directoryNumber: genererNumero() });
    setDateErrors({});
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      clientId: c.clientId || c.client?.id || "",
      offreId: c.offreId || c.offre?.id || "",
      dateDebut: c.dateDebut || "",
      dateFin: c.dateFin || "",
      directoryNumber: c.directoryNumber || "",
    });
    setDateErrors({});
    setShowForm(true);
    setDetail(null);
  };

  const closeForm = () => {
    setShowForm(false); setEditing(null);
    setForm(EMPTY_FORM); setDateErrors({});
  };

  const hasDateErrors = Object.keys(dateErrors).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation finale avant envoi
    const errors = validateDates(form.dateDebut, form.dateFin);
    if (Object.keys(errors).length > 0) {
      setDateErrors(errors);
      return;
    }

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
      closeForm(); loadData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteContrat(id); setDeleteConfirm(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const handleResilier = async (id) => {
    try { await resilierContrat(id); setDetail(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const statutClass = (s) => {
    if (s === "ACTIF") return "badge badge-actif";
    if (s === "RESILIE") return "badge badge-resilie";
    return "badge badge-default";
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  // ────────────────────────────────────────────────────────────
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

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="form-panel-title">
                {editingContrat ? `Modifier contrat #${editingContrat.id}` : "Créer un nouveau contrat"}
              </h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>

              <div className="form-group">
                <label className="form-label">Client *</label>
                <select className="form-control" value={form.clientId}
                  onChange={(e) => updateForm({ clientId: e.target.value })} required>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Offre *</label>
                <select className="form-control" value={form.offreId}
                  onChange={(e) => updateForm({ offreId: e.target.value })} required>
                  <option value="">Sélectionner une offre</option>
                  {offers.map((o) => <option key={o.id} value={o.id}>{o.nomOffre || o.nom || "Sans nom"}</option>)}
                </select>
              </div>

              {/* ── Date début ── */}
              <div className="form-group">
                <label className="form-label">Date début *</label>
                <input
                  className={`form-control ${dateErrors.dateDebut ? "input-error" : ""}`}
                  type="date"
                  value={form.dateDebut}
                  min={today()}                              // ✅ interdit les dates passées dans le picker
                  onChange={(e) => updateForm({ dateDebut: e.target.value })}
                  required
                />
                {dateErrors.dateDebut && (
                  <span className="field-error">{dateErrors.dateDebut}</span>
                )}
              </div>

              {/* ── Date fin ── */}
              <div className="form-group">
                <label className="form-label">Date fin</label>
                <input
                  className={`form-control ${dateErrors.dateFin ? "input-error" : ""}`}
                  type="date"
                  value={form.dateFin}
                  min={form.dateDebut || today()}            // ✅ doit être après dateDebut
                  onChange={(e) => updateForm({ dateFin: e.target.value })}
                />
                {dateErrors.dateFin && (
                  <span className="field-error">{dateErrors.dateFin}</span>
                )}
              </div>

              {/* ── Directory Number ── */}
              <div className="form-group form-group-full">
                <label className="form-label">Directory Number</label>
                <div className="input-with-action">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Sera généré automatiquement si vide"
                    value={form.directoryNumber}
                    onChange={(e) => updateForm({ directoryNumber: e.target.value })}
                  />
                  <button type="button" className="btn-generate"
                    onClick={() => updateForm({ directoryNumber: genererNumero() })}>
                    🔄 Générer
                  </button>
                </div>
                {form.directoryNumber && (
                  <span className="input-hint">📞 {formatNumero(form.directoryNumber)}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={submitting || hasDateErrors}>
                  {submitting ? "Enregistrement..." : editingContrat ? "Mettre à jour" : "Créer le contrat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailContrat && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 className="modal-title">Contrat #{detailContrat.id}</h4>
                <span className={statutClass(detailContrat.statut)}>{detailContrat.statut}</span>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="detail-grid">
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
              <strong>{deleteConfirm.client?.nom} {deleteConfirm.client?.prenom}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="search-bar">
        <input type="text" placeholder="Rechercher client, offre, statut, numéro..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des contrats...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun contrat trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#" field="id"              {...thProps} />
                  <Th label="Client" field="client"          {...thProps} />
                  <Th label="Offre" field="offre"           {...thProps} />
                  <Th label="Date début" field="dateDebut"       {...thProps} />
                  <Th label="Date fin" field="dateFin"         {...thProps} />
                  <Th label="Statut" field="statut"          {...thProps} />
                  <Th label="Numéro" field="directoryNumber" {...thProps} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((c) => (
                  <tr key={c.id}>
                    <td className="id-cell">{c.contractId && `cont_${c.contractId}`}</td>
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
                        <button className="btn-action btn-view" onClick={() => setDetail(c)} title="Voir">👁</button>
                        <button className="btn-action btn-edit" onClick={() => openEdit(c)} title="Modifier">✏️</button>
                        {/* <button className="btn-action btn-delete" onClick={() => setDeleteConfirm(c)} title="Supprimer">🗑️</button> */}
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

function DetailRow({ label, value, mono }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${mono ? " mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export default Contrats;