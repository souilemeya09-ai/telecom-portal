import { useEffect, useState, useMemo, useRef } from "react";
import {
  getClients, createClient, updateClient, deleteClient,
  getPromotions, assignerPromotion, getPromotionsByCustomer,
} from "../../../api/api";
import { getImageUrl } from "../../../utils/imageUrl";
import "../../../styles/Page.css";

const EMPTY_FORM = {
  nom: "", prenom: "", telephone: "", email: "",
  adresse: "", ville: "",
  documentType: "1",
  cinNumber: "", passportNumber: "",
  image: null,
};

/* ── Helpers tri ─────────────────────────────────────────────── */
function getValue(obj, field) {
  switch (field) {
    case "id": return obj.customerId ?? obj.id;
    case "client": return `${obj.nom ?? ""} ${obj.prenom ?? ""}`;
    case "telephone": return obj.telephone ?? "";
    case "adresse": return obj.adresse ?? "";
    case "ville": return obj.ville ?? "";
    case "document": return obj.documentType === 1 ? "CIN" : "Passeport";
    case "numero": return obj.documentType === 1 ? (obj.cinNumber ?? "") : (obj.passportNumber ?? "");
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

/* ── Icônes SVG ──────────────────────────────────────────────── */
const IconTag = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
const IconPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const IconFilter = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const IconClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

/* ── Modal assignation promotion ─────────────────────────────── */
function AssignPromotionModal({ customer, promotions, onClose, onAssign }) {
  const [activePromos, setActivePromos] = useState([]);
  const [existingPromos, setExisting] = useState([]);
  const [loadingExisting, setLoadingExist] = useState(true);
  const [form, setForm] = useState({
    promotionId: "",
    effectiveStartDate: new Date().toISOString().split("T")[0],
    effectiveEndDate: "",
    assignmentMode: "MANUAL",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setActivePromos(promotions.filter((p) => p.statut === "ACTIVE"));
    getPromotionsByCustomer(customer.id)
      .then(setExisting).catch(console.error)
      .finally(() => setLoadingExist(false));
  }, [customer.id, promotions]);

  const alreadyAssignedIds = new Set(existingPromos.map((p) => p.id));
  const formatVal = (p) => p?.typeReduction === "POURCENTAGE"
    ? `${p.valeurReduction}%` : `${p.valeurReduction} TND`;
  const selectedPromo = activePromos.find((p) => p.id === Number(form.promotionId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.promotionId) return;
    setSubmitting(true); setError(null);
    try {
      await onAssign(Number(form.promotionId), {
        targetType: "CUSTOMER",
        targetCustomerId: customer.id,
        effectiveStartDate: form.effectiveStartDate,
        effectiveEndDate: form.effectiveEndDate || null,
        inheritedToMembers: false,
        assignmentMode: form.assignmentMode,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h4 className="modal-title">Assigner une promotion</h4>
            <p className="cl-email" style={{ marginTop: 3 }}>
              Client : <strong style={{ color: "var(--text)" }}>{customer.nom} {customer.prenom}</strong>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><IconClose /></button>
        </div>

        {!loadingExisting && existingPromos.length > 0 && (
          <div className="assign-existing">
            <div className="detail-section-title">
              Promotions déjà assignées ({existingPromos.length})
            </div>
            <div className="assign-existing-list">
              {existingPromos.map((p) => (
                <div key={p.id} className="assign-existing-row">
                  <span className="cl-name">{p.nomPromotion}</span>
                  <span className="badge badge-active">{formatVal(p)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label className="form-label">Promotion active *</label>
              <select className="form-control" value={form.promotionId}
                onChange={(e) => setForm({ ...form, promotionId: e.target.value })} required>
                <option value="">Sélectionner une promotion</option>
                {activePromos.map((p) => (
                  <option key={p.id} value={p.id} disabled={alreadyAssignedIds.has(p.id)}>
                    {alreadyAssignedIds.has(p.id) ? "✓ " : ""}{p.nomPromotion} — {formatVal(p)}
                    {alreadyAssignedIds.has(p.id) ? " (déjà assignée)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedPromo && (
              <div className="form-group form-group-full">
                <div className="promo-preview">
                  <div className="promo-preview-val">{formatVal(selectedPromo)}</div>
                  <div>
                    <div className="cl-name">{selectedPromo.nomPromotion}</div>
                    {selectedPromo.ancienneteMinimale && (
                      <div className="cl-email">Ancienneté min. : {selectedPromo.ancienneteMinimale} mois</div>
                    )}
                    {selectedPromo.regleEligibilite && (
                      <div className="cl-email">{selectedPromo.regleEligibilite}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Date début *</label>
              <input className="form-control" type="date" value={form.effectiveStartDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, effectiveStartDate: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Date fin</label>
              <input className="form-control" type="date" value={form.effectiveEndDate}
                min={form.effectiveStartDate}
                onChange={(e) => setForm({ ...form, effectiveEndDate: e.target.value })} />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Mode d'assignation</label>
              <select className="form-control" value={form.assignmentMode}
                onChange={(e) => setForm({ ...form, assignmentMode: e.target.value })}>
                <option value="MANUAL">Manuel (vendeur)</option>
                <option value="AUTOMATIC">Automatique</option>
              </select>
            </div>

            {error && (
              <div className="form-group form-group-full">
                <div className="field-error" style={{ padding: "8px", borderRadius: "6px", background: "rgba(239,68,68,.08)" }}>
                  {error}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting || !form.promotionId}>
                {submitting ? "Assignation..." : "Assigner la promotion"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal promotions du client ──────────────────────────────── */
function ClientPromosModal({ customer, onClose }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPromotionsByCustomer(customer.id)
      .then(setPromos).catch(console.error)
      .finally(() => setLoading(false));
  }, [customer.id]);

  const formatVal = (p) => p?.typeReduction === "POURCENTAGE"
    ? `${p.valeurReduction}%` : `${p.valeurReduction} TND`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h4 className="modal-title">Promotions applicables</h4>
            <p className="cl-email" style={{ marginTop: 3 }}>{customer.nom} {customer.prenom}</p>
          </div>
          <button className="modal-close" onClick={onClose}><IconClose /></button>
        </div>

        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : promos.length === 0 ? (
          <div className="empty-state"><p>Aucune promotion assignée à ce client.</p></div>
        ) : (
          <div style={{ padding: "14px 20px" }}>
            {promos.map((p) => (
              <div key={p.id} className="promo-list-row">
                <div>
                  <div className="cl-name">{p.nomPromotion}</div>
                  <div className="cl-email">
                    {p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                    {p.dateDebut && ` · ${p.dateDebut} → ${p.dateFin ?? "∞"}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "var(--accent)", fontFamily: "var(--mono)" }}>
                    {formatVal(p)}
                  </span>
                  <span className={`badge ${p.statut === "ACTIVE" ? "badge-active" : "badge-default"}`}>
                    {p.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [promosModal, setPromosModal] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getClients(), getPromotions()]);
      setCustomers(c); setPromotions(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = term
      ? customers.filter((c) =>
        c.nom?.toLowerCase().includes(term) ||
        c.prenom?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.telephone?.toLowerCase().includes(term) ||
        c.adresse?.toLowerCase().includes(term) ||
        c.ville?.toLowerCase().includes(term)
      )
      : customers;
    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortField), vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [customers, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setPreview(null); setShowForm(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      nom: c.nom || "", prenom: c.prenom || "",
      telephone: c.telephone || "", email: c.email || "",
      adresse: c.adresse || "", ville: c.ville || "",
      documentType: String(c.documentType || "1"),
      cinNumber: c.cinNumber || "", passportNumber: c.passportNumber || "",
      image: null,
    });
    const img = c.documentType === 1 ? c.cinImagePath : c.passportImagePath;
    setPreview(img ? getImageUrl(img) : null);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setPreview(null); };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("nom", form.nom); fd.append("prenom", form.prenom);
    fd.append("telephone", form.telephone); fd.append("email", form.email);
    fd.append("adresse", form.adresse); fd.append("ville", form.ville);
    fd.append("documentType", form.documentType);
    if (form.documentType === "1" && form.cinNumber) fd.append("cinNumber", form.cinNumber);
    if (form.documentType === "2" && form.passportNumber) fd.append("passportNumber", form.passportNumber);
    if (form.image) fd.append("image", form.image);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = buildFormData();
      if (editingCustomer) await updateClient(editingCustomer.id, fd);
      else await createClient(fd);
      closeForm(); fetchAll();
    } catch (err) { console.error(err); alert("Erreur : " + err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteClient(id); setDeleteConfirm(null); fetchAll(); }
    catch (e) { console.error(e); }
  };

  const isCIN = form.documentType === "1";
  const docLabel = isCIN ? "CIN" : "Passeport";
  const thProps = { sortField, sortOrder, onSort: handleSort };

  return (

    // <div className="dashboard-main">
      <div className="page-wrapper">

        {/* ── En-tête ── */}
        <div className="page-hdr">
          <div>
            <div className="page-title">
              Gestion des clients
              <span className="page-count">
                {customers.length} client{customers.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="page-sub">Consultez, gérez et assignez des promotions à vos clients</div>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau client
          </button>
        </div>

        {/* ── KPI Stats ── */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total clients</div>
            <div className="stat-val">{customers.length}</div>
            <div className="stat-trend up">↑ +18 ce mois</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avec contrat</div>
            <div className="stat-val">{Math.round(customers.length * 0.82)}</div>
            <div className="stat-trend up">82%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avec promo</div>
            <div className="stat-val">{Math.round(customers.length * 0.28)}</div>
            <div className="stat-trend up">28%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Nouveaux (mois)</div>
            <div className="stat-val">18</div>
            <div className="stat-trend warn">En cours</div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-ico"><IconSearch /></span>
            <input
              className="search-input"
              placeholder="Rechercher par nom, prénom, email, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn">
            <IconFilter /> Filtrer
          </button>
          {search && (
            <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="table-wrap">
          <div className="table-card">
            {loading ? (
              <div className="loading-state">Chargement des clients...</div>
            ) : displayed.length === 0 ? (
              <div className="empty-state"><p>Aucun client trouvé.</p></div>
            ) : (
              <div className="tbl-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <Th label="ID" field="id"        {...thProps} />
                      <Th label="Client" field="client"    {...thProps} />
                      <Th label="Tél." field="telephone" {...thProps} />
                      <Th label="Adresse" field="adresse"   {...thProps} />
                      <Th label="Ville" field="ville"     {...thProps} />
                      <Th label="Document" field="document"  {...thProps} />
                      <Th label="Numéro" field="numero"    {...thProps} />
                      <th>Image</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((c) => {
                      const isCin = c.documentType === 1;
                      const docNum = isCin ? c.cinNumber : c.passportNumber;
                      const docImg = isCin ? c.cinImagePath : c.passportImagePath;
                      return (
                        <tr key={c.id}>
                          <td className="id-cell">{c.customerId}</td>
                          <td>
                            <div className="client-cell">
                              <div className="avatar">
                                {c.nom?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <div className="cl-name">{c.nom} {c.prenom}</div>
                                <div className="cl-email">{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="mono-cell">{c.telephone || "—"}</td>
                          <td>{c.adresse || "—"}</td>
                          <td>{c.ville || "—"}</td>
                          <td>
                            <span className={`badge ${isCin ? "badge-cin" : "badge-passport"}`}>
                              {isCin ? "CIN" : "Passeport"}
                            </span>
                          </td>
                          <td className="mono-cell">{docNum || "—"}</td>
                          <td>
                            {docImg
                              ? <img src={getImageUrl(docImg)} alt="doc" className="doc-thumb" />
                              : <span style={{ color: "var(--muted)" }}>—</span>}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-action promo"
                                onClick={() => setPromosModal(c)} title="Voir promotions">
                                <IconTag />
                              </button>
                              <button className="btn-action assign"
                                onClick={() => setAssignModal(c)} title="Assigner une promotion">
                                <IconPlus />
                              </button>
                              <button className="btn-action edit"
                                onClick={() => openEdit(c)} title="Modifier">
                                <IconEdit />
                              </button>
                              <button className="btn-action del"
                                onClick={() => setDeleteConfirm(c)} title="Supprimer">
                                <IconTrash />
                              </button>
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

        {/* ── Modal formulaire ── */}
        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {editingCustomer
                      ? `Modifier — ${editingCustomer.nom} ${editingCustomer.prenom}`
                      : "Ajouter un client"}
                  </h3>
                  <div className="cl-email" style={{ marginTop: 3 }}>
                    {editingCustomer ? "Modifiez les informations du client" : "Remplissez les informations du nouveau client"}
                  </div>
                </div>
                <button className="modal-close" onClick={closeForm}><IconClose /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nom *</label>
                    <input className="form-control" value={form.nom} onChange={set("nom")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prénom *</label>
                    <input className="form-control" value={form.prenom} onChange={set("prenom")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Téléphone *</label>
                    <input className="form-control" type="text" value={form.telephone} maxLength={8}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value.replace(/\D/g, "") })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-control" type="email" value={form.email} onChange={set("email")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adresse</label>
                    <input className="form-control" value={form.adresse} onChange={set("adresse")} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ville</label>
                    <input className="form-control" value={form.ville} onChange={set("ville")} />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Type de document *</label>
                    <div className="doc-type-toggle">
                      <button type="button"
                        className={`doc-toggle-btn ${isCIN ? "active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, documentType: "1", passportNumber: "", image: null }))}>
                        CIN
                      </button>
                      <button type="button"
                        className={`doc-toggle-btn ${!isCIN ? "active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, documentType: "2", cinNumber: "", image: null }))}>
                        Passeport
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Numéro {docLabel} *</label>
                    {isCIN ? (
                      <input className="form-control" type="text" value={form.cinNumber}
                        maxLength={8} onChange={set("cinNumber")} required />
                    ) : (
                      <input className="form-control" value={form.passportNumber}
                        onChange={set("passportNumber")} placeholder="Ex: AB1234567" required />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Image {docLabel}</label>
                    <div className="upload-zone" onClick={() => fileRef.current.click()}>
                      {preview
                        ? <img src={preview} alt="preview" className="upload-preview" />
                        : <>
                          <span className="upload-icon">📎</span>
                          <span>Cliquer pour uploader</span>
                          <span className="upload-hint">JPG, PNG — max 5MB</span>
                        </>
                      }
                      <input ref={fileRef} type="file" accept="image/*"
                        style={{ display: "none" }} onChange={handleImage} />
                    </div>
                    {preview && (
                      <button type="button" className="upload-clear"
                        onClick={() => { setPreview(null); setForm((f) => ({ ...f, image: null })); fileRef.current.value = ""; }}>
                        ✕ Retirer l'image
                      </button>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? "Enregistrement..." : editingCustomer ? "Mettre à jour" : "Ajouter le client"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal suppression ── */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4 className="modal-title">Confirmer la suppression</h4>
                <button className="modal-close" onClick={() => setDeleteConfirm(null)}><IconClose /></button>
              </div>
              <p className="modal-text">
                Supprimer <strong style={{ color: "var(--text)" }}>
                  {deleteConfirm.nom} {deleteConfirm.prenom}
                </strong> ? Cette action est irréversible.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className="btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal assignation promotion ── */}
        {assignModal && (
          <AssignPromotionModal
            customer={assignModal}
            promotions={promotions}
            onClose={() => setAssignModal(null)}
            onAssign={async (id, dto) => assignerPromotion(id, dto)}
          />
        )}

        {/* ── Modal promotions du client ── */}
        {promosModal && (
          <ClientPromosModal
            customer={promosModal}
            onClose={() => setPromosModal(null)}
          />
        )}
      </div>

  );
};

export default Customers;