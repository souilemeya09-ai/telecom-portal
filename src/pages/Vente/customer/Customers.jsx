import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  getClients, createClient, updateClient, deleteClient,
  uploadClientsCsv,
  getPromotions, assignerPromotion, getPromotionsByCustomer,
  getCustomerGroups,
} from "../../../api/api";
import Pagination from "../../../components/Pagination";
import { useAuth } from "../../../context/AuthContext";
import { getImageUrl } from "../../../utils/imageUrl";
import "../../../styles/Page.css";

const EMPTY_FORM = {
  nom: "", prenom: "", telephone: "", email: "",
  adresse: "", ville: "", dateActivation: '', dateDesactivation: '',
  documentType: "1",
  cinNumber: "", passportNumber: "", status: "",
  image: null, customerGroupId: "",
};

/* ── Helpers tri ─────────────────────────────────────────────── */
function getValue(obj, field) {
  switch (field) {
    case "id": return obj.customerId ?? obj.id;
    case "client": return `${obj.nom ?? ""} ${obj.prenom ?? ""}`;
    case "telephone": return obj.telephone ?? "";
    case "adresse": return obj.adresse ?? "";
    case "ville": return obj.ville ?? "";
    case "status": return obj.status ?? "";
    case "dateActivation": return obj.dateActivation ?? "";
    case "dateDesactivation": return obj.dateDesactivation ?? "";
    case "document": return obj.documentType === 1 ? "CIN" : "Passeport";
    case "numero": return obj.documentType === 1 ? (obj.cinNumber ?? "") : (obj.passportNumber ?? "");
    default: return "";
  }
}

/* ── Sort icon — même structure que CustomerGroups ───────────── */
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
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const IconClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

/* ══════════════════════════════════════════════════════════════
   MODAL : ASSIGNATION PROMOTION
   ══════════════════════════════════════════════════════════════ */
function AssignPromotionModal({ customer, promotions, onClose, onAssign, assignedById }) {
  const [activePromos, setActivePromos] = useState([]);
  const [existingPromos, setExisting] = useState([]);
  const [loadingExisting, setLoadingExist] = useState(true);
  const [form, setForm] = useState({
    promotionId: "",
    effectiveStartDate: new Date().toISOString().split("T")[0],
    effectiveEndDate: "",
    assignmentMode: "MANUAL",
    assignedById: assignedById || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setActivePromos(promotions.filter((p) => p.statut === "ACTIVE"));
    getPromotionsByCustomer(customer.id)
      .then(setExisting).catch(console.error)
      .finally(() => setLoadingExist(false));
  }, [customer.id, promotions]);

  useEffect(() => {
    setForm((current) => ({ ...current, assignedById: assignedById || "" }));
  }, [assignedById]);

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
        assignedById: Number(form.assignedById),
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
            {/* ✅ client-email au lieu de cl-email */}
            <p className="client-email" style={{ marginTop: 3 }}>
              Client : <strong>{customer.nom} {customer.prenom}</strong>
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
                  {/* ✅ client-name au lieu de cl-name */}
                  <span className="client-name">{p.nomPromotion}</span>
                  <span className="badge badge-actif">{formatVal(p)}</span>
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
                {existingPromos.map((p) => (
                  <option key={p.id} value={p.id}
                  //  disabled={alreadyAssignedIds.has(p.id)}
                  >
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
                    <div className="client-name">{selectedPromo.nomPromotion}</div>
                    {selectedPromo.ancienneteMinimale && (
                      <div className="client-email">Ancienneté min. : {selectedPromo.ancienneteMinimale} mois</div>
                    )}
                    {selectedPromo.regleEligibilite && (
                      <div className="client-email">{selectedPromo.regleEligibilite}</div>
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
                <div className="field-error"
                  style={{ padding: "8px", borderRadius: "6px", background: "rgba(239,68,68,.08)" }}>
                  {error}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting || !form.promotionId || !form.assignedById}>
                {submitting ? "Assignation..." : "Assigner la promotion"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL : PROMOTIONS DU CLIENT
   ══════════════════════════════════════════════════════════════ */
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
            {/* ✅ client-email */}
            <p className="client-email" style={{ marginTop: 3 }}>
              {customer.nom} {customer.prenom}
            </p>
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
                  {/* ✅ client-name + client-email */}
                  <div className="client-name">{p.nomPromotion}</div>
                  <div className="client-email">
                    {p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                    {p.dateDebut && ` · ${p.dateDebut} → ${p.dateFin ?? "∞"}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--mono)" }}>
                    {formatVal(p)}
                  </span>
                  {/* ✅ badge-actif au lieu de badge-active */}
                  <span className={`badge ${p.statut === "ACTIVE" ? "badge-actif" : "badge-default"}`}>
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
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [promosModal, setPromosModal] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [csvError, setCsvError] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const csvFileRef = useRef();
  const [customerGroups, setCustomerGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await getCustomerGroups();
        setCustomerGroups(groups);
      } catch (err) {
        console.error("Erreur lors du chargement des groupes clients :", err);
      }
    };
    fetchGroups();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        getClients({ page: 0, size: 1000 }),
        getPromotions({ page: 0, size: 1000 }),
      ]);
      setCustomers(c.content || []);
      setPromotions(p.content || []);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvUploading(true);
    try {
      await uploadClientsCsv(file);
      await fetchAll();
      alert(`Import CSV réussi : ${file.name}`);
    } catch (err) {
      setCsvError(err.response?.data?.message || err.message || "Erreur lors de l'import CSV.");
      console.error(err);
    } finally {
      setCsvUploading(false);
      e.target.value = "";
    }
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
        c.ville?.toLowerCase().includes(term) ||
        c.status?.toLowerCase().includes(term) ||
        c.dateActivation?.toLowerCase().includes(term) ||
        c.dateDesactivation?.toLowerCase().includes(term)
      )
      : customers;
    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortField), vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [customers, search, sortField, sortOrder]);

  const pageCount = Math.ceil(displayed.length / itemsPerPage);
  const pageItems = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // const handleImage = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   setForm((f) => ({ ...f, image: file }));
  //   setPreview(URL.createObjectURL(file));
  // };

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      nom: c.nom || "", prenom: c.prenom || "",
      telephone: c.telephone || "", email: c.email || "",
      adresse: c.adresse || "", ville: c.ville || "",
      documentType: String(c.documentType || "1"),
      cinNumber: c.cinNumber || "", passportNumber: c.passportNumber || "",
      image: null,
      customerGroupId: c.customerGroupId || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("nom", form.nom); fd.append("prenom", form.prenom);
    fd.append("telephone", form.telephone); fd.append("email", form.email);
    fd.append("adresse", form.adresse); fd.append("ville", form.ville);
    fd.append("documentType", form.documentType);
    fd.append("customerGroupId", form.customerGroupId);
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
    <div className="page-wrapper">

      {/* ══ En-tête ══════════════════════════════════════════════ */}
      {/* ✅ page-header (au lieu de page-hdr) */}
      <div className="page-header">
        <div>
          {/* ✅ page-title + page-subtitle (au lieu de page-title + page-sub) */}
          <h1 className="page-title">
            Gestion des clients
          </h1>
          <p className="page-subtitle">
            {customers.length} client{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn-secondary" onClick={() => csvFileRef.current.click()} disabled={csvUploading}>
            {csvUploading ? "Import en cours..." : "Importer CSV"}
          </button>
          {/* <button className="btn-primary" onClick={openCreate}>
            + Nouveau client
          </button> */}
        </div>
        <input ref={csvFileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCsvUpload} />
      </div>

      {/* ══ KPI Stats ════════════════════════════════════════════ */}
      {/* ✅ stats-row + stat-card + stat-label + stat-value (au lieu de stat-val) */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total clients</span>
          <span className="stat-value">{customers.length}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #16a34a" }}>
          <span className="stat-label">Avec contrat</span>
          <span className="stat-value" style={{ color: "#16a34a" }}>
            {Math.round(customers.length * 0.82)}
          </span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #BA7517" }}>
          <span className="stat-label">Avec promo</span>
          <span className="stat-value" style={{ color: "#BA7517" }}>
            {Math.round(customers.length * 0.28)}
          </span>
        </div>
      </div>

      {/* ══ Formulaire (panel inline) ════════════════════════════ */}
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
                {/* <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input className="form-control" value={form.ville} onChange={set("ville")} />
                </div> */}

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
                  <label className="form-label">groupe client (optionnel)</label>
                  <select className="form-control" name="" id="" onChange={set("customerGroupId")} >
                    <option value="">Sélectionner un groupe client</option>
                    {customerGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="form-group">
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
                </div> */}

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
      {csvError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          Erreur import CSV : {csvError}
        </div>
      )}

      {/* ══ Recherche ════════════════════════════════════════════ */}
      {/* ✅ filter-search-row + search-bar (même pattern que CustomerGroups) */}
      <div className="filter-search-row">
        <div className="search-bar">
          <span className="search-ico"><IconSearch /></span>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, email, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>
          )}
        </div>
      </div>

      {/* ══ Table ════════════════════════════════════════════════ */}
      {/* ✅ table-card + table-scroll + data-table (même structure exacte) */}
      <div className="table-card" style={{ marginTop: "1rem" }}>
        {loading ? (
          <div className="loading-state">Chargement des clients...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun client trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="ID" field="id"        {...thProps} />
                  <Th label="Client" field="client"    {...thProps} />
                  <Th label="Groupe" field="customerGroupId" {...thProps} />
                  <Th label="Tél." field="telephone" {...thProps} />
                  <Th label="Adresse" field="adresse"   {...thProps} />
                  {/* <Th label="Ville" field="ville"     {...thProps} /> */}
                  <Th label="Document" field="document"  {...thProps} />
                  <Th label="CIN" field="numero"    {...thProps} />
                  <Th label="Status" field="status"    {...thProps} />
                  <Th label="Date d'activation" field="dateActivation" {...thProps} />
                  <Th label="Date de désactivation" field="dateDesactivation" {...thProps} />

                  {/* <th>Image</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => {
                  const isCin = c.documentType === 1;
                  const docNum = isCin ? c.cinNumber : c.passportNumber;
                  // const docImg = isCin ? c.cinImagePath : c.passportImagePath;
                  return (
                    <tr key={c.id}>
                      {/* ✅ id-cell */}
                      <td className="id-cell">{c.customerId}</td>

                      {/* ✅ service-name-cell + group-icon + client-name + client-email
                           (même structure que la colonne Nom dans CustomerGroups) */}
                      <td>
                        <div className="service-name-cell">
                          <div className="group-icon">
                            {c.nom?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <div className="client-name">{c.nom} {c.prenom}</div>
                            <div className="client-email">{c.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="service-name-cell">
                          <div>
                            {(() => {
                              const group = customerGroups.find((g) => String(g.id) === String(c.customerGroupId));
                              return group ? (
                                <>
                                  <div className="client-name">{group.name}</div>
                                  <div className="client-email">{group.groupType} · {group.status}</div>
                                </>
                              ) : (
                                <div className="client-name">—</div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* ✅ mono (au lieu de mono-cell) */}
                      <td className="mono">{c.telephone || "—"}</td>
                      <td>{c.adresse || "—"}</td>
                      {/* <td>{c.ville || "—"}</td> */}

                      {/* ✅ badge-cin / badge-passport */}
                      <td>
                        <span className={`badge ${isCin ? "badge-cin" : "badge-passport"}`}>
                          {isCin ? "CIN" : "Passeport"}
                        </span>
                      </td>

                      <td className="mono">{docNum || "—"}</td>
                      <td>{c.status || "—"}</td>
                      <td>{c.dateActivation || "—"}</td>
                      <td>{c.dateDesactivation || "—"}</td>
                      {/* <td>
                        {docImg
                          ? <img src={getImageUrl(docImg)} alt="doc" className="doc-thumb" />
                          : <span style={{ color: "var(--color-text-tertiary)" }}>—</span>}
                      </td> */}

                      {/* ✅ action-buttons + btn-action + btn-view / btn-edit / btn-delete
                           (même pattern que CustomerGroups) */}
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-view"
                            onClick={() => setPromosModal(c)} title="Voir promotions">
                            👁
                          </button>
                          {/* <button className="btn-action"
                            onClick={() => setAssignModal(c)} title="Assigner une promotion">
                            ➕
                          </button> */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={pageCount} onPageChange={setCurrentPage} />
      </div>

      {/* ══ Modal suppression ════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Confirmer la suppression</h4>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><IconClose /></button>
            </div>
            {/* ✅ modal-text */}
            <p className="modal-text">
              Supprimer <strong>{deleteConfirm.nom} {deleteConfirm.prenom}</strong> ?
              Cette action est irréversible.
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

      {/* ══ Modal assignation promotion ══════════════════════════ */}
      {assignModal && (
        <AssignPromotionModal
          customer={assignModal}
          promotions={promotions}
          onClose={() => setAssignModal(null)}
          onAssign={async (id, dto) => assignerPromotion(id, dto)}
          assignedById={user?.id || localStorage.getItem("userId")}
        />
      )}

      {/* ══ Modal promotions du client ═══════════════════════════ */}
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
