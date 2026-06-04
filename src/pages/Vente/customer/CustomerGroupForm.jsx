import { useState } from "react";
import { createCustomerGroup, updateCustomerGroup } from "../../../api/api";
import { useNavigate } from "react-router-dom";

const GROUP_TYPES = ["ENTERPRISE", "FAMILY", "SME", "OTHER"];
const GROUP_STATUS = ["ACTIVE", "INACTIVE"];
const TYPE_LABELS = { ENTERPRISE: "Entreprise", FAMILY: "Famille", SME: "PME", OTHER: "Autre" };

const EMPTY_FORM = { name: "", groupType: "FAMILY", status: "ACTIVE" };

function CustomerGroupForm({ editingGroup = null, onSuccess }) {
  const [form, setForm] = useState(
    editingGroup
      ? { name: editingGroup.name, groupType: editingGroup.groupType, status: editingGroup.status }
      : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isEdit = Boolean(editingGroup);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) await updateCustomerGroup(editingGroup.id, form);
      else await createCustomerGroup(form);
      onSuccess?.();
      navigate("/groups");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? `Modifier — ${editingGroup.name}` : "Nouveau groupe client"}
          </h1>
          <p className="page-subtitle">
            {isEdit
              ? "Mettez à jour les informations du groupe."
              : "Remplissez le formulaire pour créer un nouveau groupe client."}
          </p>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'center', marginTop:'5em'}}>
        <div className="table-card" style={{ minWidth: 860 }}>
          {error && (
            <div style={{
              background: "var(--color-background-danger)",
              color: "red",
              padding: "0.6rem 1rem",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: "1rem",
            }}>
              ⚠️ {error}
              <button onClick={() => setError("")} style={{ marginLeft: 8 }}>✕</button>
            </div>
          )}

          <form className="form-grid" style={{ padding: '1.25rem 28px' }} onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nom du groupe *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="ex: Famille Ben Ali, STEG Enterprise…"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type de groupe *</label>
              <select
                className="form-control"
                value={form.groupType}
                onChange={handleChange("groupType")}
              >
                {GROUP_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={handleChange("status")}
                >
                  {GROUP_STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le groupe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerGroupForm;