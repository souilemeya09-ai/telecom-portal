import { useEffect, useState, useMemo, useRef } from "react";
import { getClients, createClient, updateClient, deleteClient } from "../../../api/api";
import "../../../styles/customers.css";
import { getImageUrl } from "../../../utils/imageUrl";

const EMPTY_FORM = {
  nom: "", prenom: "", telephone: "", email: "",
  adresse: "", ville: "",
  documentType: "1",
  cinNumber: "", passportNumber: "",
  image: null,
};

// ── Sort helper ──────────────────────────────────────────────────
function getValue(obj, field) {
  switch (field) {
    case "id":       return obj.customerId ?? obj.id;
    case "client":   return `${obj.nom ?? ""} ${obj.prenom ?? ""}`;
    case "telephone":return obj.telephone ?? "";
    case "adresse":  return obj.adresse   ?? "";
    case "ville":    return obj.ville     ?? "";
    case "document": return obj.documentType === 1 ? "CIN" : "Passeport";
    case "numero":   return obj.documentType === 1 ? (obj.cinNumber ?? "") : (obj.passportNumber ?? "");
    default:         return "";
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

// ────────────────────────────────────────────────────────────────
const Customers = () => {
  const [customers, setCustomers]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editingCustomer, setEditing]     = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [preview, setPreview]             = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch]               = useState("");
  const [sortField, setSortField]         = useState("id");
  const [sortOrder, setSortOrder]         = useState("asc");
  const fileRef = useRef();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try { setCustomers(await getClients()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Sort + search ─────────────────────────────────────────────
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
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [customers, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  // ── Formulaire ───────────────────────────────────────────────
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
    fd.append("nom", form.nom);
    fd.append("prenom", form.prenom);
    fd.append("telephone", form.telephone);
    fd.append("email", form.email);
    fd.append("adresse", form.adresse);
    fd.append("ville", form.ville);
    fd.append("documentType", form.documentType);
    if (form.documentType === "1" && form.cinNumber)
      fd.append("cinNumber", form.cinNumber);
    if (form.documentType === "2" && form.passportNumber)
      fd.append("passportNumber", form.passportNumber);
    if (form.image)
      fd.append("image", form.image);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = buildFormData();
      if (editingCustomer) await updateClient(editingCustomer.id, fd);
      else                  await createClient(fd);
      closeForm(); fetchCustomers();
    } catch (err) {
      console.error(err); alert("Erreur : " + err.message);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteClient(id); setDeleteConfirm(null); fetchCustomers(); }
    catch (e) { console.error(e); }
  };

  const isCIN    = form.documentType === "1";
  const docLabel = isCIN ? "CIN" : "Passeport";
  const thProps  = { sortField, sortOrder, onSort: handleSort };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            {customers.length} client{customers.length !== 1 ? "s" : ""} enregistré{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau client</button>
      </div>

      {/* ── Formulaire modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCustomer ? `Modifier — ${editingCustomer.nom} ${editingCustomer.prenom}` : "Ajouter un client"}
              </h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
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
                <button type="button" className={`doc-toggle-btn ${isCIN ? "active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, documentType: "1", passportNumber: "", image: null }))}>
                  🪪 CIN
                </button>
                <button type="button" className={`doc-toggle-btn ${!isCIN ? "active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, documentType: "2", cinNumber: "", image: null }))}>
                  📘 Passeport
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
                  : <div className="upload-placeholder">
                      <span className="upload-icon">📎</span>
                      <span>Cliquer pour uploader</span>
                      <span className="upload-hint">JPG, PNG — max 5MB</span>
                    </div>
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
            </form>
          </div>
        </div>
      )}

      {/* ── Modal suppression ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h4 className="modal-title">Confirmer la suppression</h4>
            <p className="modal-text">
              Supprimer <strong>{deleteConfirm.nom} {deleteConfirm.prenom}</strong> ? Cette action est irréversible.
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
        <input type="text" placeholder="Rechercher par nom, prénom, email, ville..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des clients...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun client trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="ID"       field="id"        {...thProps} />
                  <Th label="Client"   field="client"    {...thProps} />
                  <Th label="Tél."     field="telephone" {...thProps} />
                  <Th label="Adresse"  field="adresse"   {...thProps} />
                  <Th label="Ville"    field="ville"     {...thProps} />
                  <Th label="Document" field="document"  {...thProps} />
                  <Th label="Numéro"   field="numero"    {...thProps} />
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((c) => {
                  const isCin  = c.documentType === 1;
                  const docNum = isCin ? c.cinNumber : c.passportNumber;
                  const docImg = isCin ? c.cinImagePath : c.passportImagePath;
                  return (
                    <tr key={c.id}>
                      <td className="id-cell">{c.customerId && `cust_${c.customerId}`}</td>
                      <td>
                        <div className="client-cell">
                          <div className="avatar">{c.nom?.[0]?.toUpperCase() ?? "?"}</div>
                          <div>
                            <div className="client-name">{c.nom} {c.prenom}</div>
                            <div className="client-email">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono">{c.telephone || "—"}</td>
                      <td>{c.adresse || "—"}</td>
                      <td>{c.ville || "—"}</td>
                      <td>
                        <span className={`badge ${isCin ? "badge-cin" : "badge-passport"}`}>
                          {isCin ? "CIN" : "Passeport"}
                        </span>
                      </td>
                      <td className="mono">{docNum || "—"}</td>
                      <td>
                        {docImg
                          ? <img src={getImageUrl(docImg)} alt="doc" className="doc-image" />
                          : "—"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit"   onClick={() => openEdit(c)}         title="Modifier">✏️</button>
                          <button className="btn-delete" onClick={() => setDeleteConfirm(c)} title="Supprimer">🗑️</button>
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
};

export default Customers;