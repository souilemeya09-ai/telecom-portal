import { useEffect, useState, useRef } from "react";
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

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try { setCustomers(await getClients()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setPreview(null); setShowForm(true);
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
    });
    const img = c.documentType === 1 ? c.cinImagePath : c.passportImagePath;
    setPreview(img ? getImageUrl(img) : null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setPreview(null);
  };

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
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = buildFormData();
      if (editingCustomer) await updateClient(editingCustomer.id, fd);
      else await createClient(fd);
      closeForm();
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Erreur : " + err.message);
    } finally {
      setSubmitting(false);
    }
  };
const handleSort = (field) => {
  if (sortField === field) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortOrder("asc");
  }
};
  const handleDelete = async (id) => {
    try { await deleteClient(id); setDeleteConfirm(null); fetchCustomers(); }
    catch (e) { console.error(e); }
  };

  const isCIN = form.documentType === "1";
  const docLabel = isCIN ? "CIN" : "Passeport";

  // ── Filtrage des clients selon searchTerm ──
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nom?.toLowerCase().includes(term) ||
      c.prenom?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telephone?.toLowerCase().includes(term) ||
      c.adresse?.toLowerCase().includes(term) ||
      c.ville?.toLowerCase().includes(term)
    );
  });

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

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="form-panel">
          <h3 className="form-panel-title">
            {editingCustomer
              ? `Modifier — ${editingCustomer.nom} ${editingCustomer.prenom}`
              : "Ajouter un client"}
          </h3>

          <form className="form-grid" onSubmit={handleSubmit}>
            {/* Identité */}
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
              <input className="form-control" value={form.telephone} onChange={set("telephone")} required />
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

            {/* Type document — toggle buttons */}
            <div className="form-group form-group-full">
              <label className="form-label">Type de document *</label>
              <div className="doc-type-toggle">
                <button
                  type="button"
                  className={`doc-toggle-btn ${isCIN ? "active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, documentType: "1", passportNumber: "", image: null }))}
                >🪪 CIN</button>
                <button
                  type="button"
                  className={`doc-toggle-btn ${!isCIN ? "active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, documentType: "2", cinNumber: "", image: null }))}
                >📘 Passeport</button>
              </div>
            </div>

            {/* Numéro document */}
            <div className="form-group">
              <label className="form-label">Numéro {docLabel} *</label>
              {isCIN ? (
                <input className="form-control" value={form.cinNumber}
                  onChange={set("cinNumber")} placeholder="Ex: 12345678" required />
              ) : (
                <input className="form-control" value={form.passportNumber}
                  onChange={set("passportNumber")} placeholder="Ex: AB1234567" required />
              )}
            </div>

            {/* Upload image */}
            <div className="form-group">
              <label className="form-label">Image {docLabel}</label>
              <div className="upload-zone" onClick={() => fileRef.current.click()}>
                {preview ? (
                  <img src={preview} alt="preview" className="upload-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📎</span>
                    <span>Cliquer pour uploader</span>
                    <span className="upload-hint">JPG, PNG — max 5MB</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImage}
                />
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
      )}

      {/* ── Modal suppression ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
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

      {/* ── Recherche / filtre ── */}
    <div className="search-bar">
  <input
    type="text"
    placeholder="Rechercher par nom, prénom, email..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <button className="btn-secondary" onClick={() => setSearchTerm("")}>
    Supprimer
  </button>
</div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des clients...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state"><p>Aucun client trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Client</th><th>Téléphone</th>
                  <th>Adresse</th><th>Ville</th><th>Document</th>
                  <th>Numéro</th><th>Image</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => {
                  const isCin = c.documentType === 1;
                  const docNum = isCin ? c.cinNumber : c.passportNumber;
                  const docImg = isCin ? c.cinImagePath : c.passportImagePath;
                  return (
                    <tr key={c.id}>
                      <td className="id-cell">{c.customerId}</td>
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
                          <button className="btn-edit" onClick={() => openEdit(c)} title="Modifier">✏️</button>
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