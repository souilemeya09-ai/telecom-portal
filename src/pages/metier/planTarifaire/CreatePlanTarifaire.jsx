import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPlanTarifaire } from "../../../api/api";
import "./createPlanTarifaire.css";

const EMPTY_FORM = {
  nom: "",
  prixMensuel: "",
  description: "",
};

function CreatePlanTarifaire() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nom.trim()) {
      newErrors.nom = "Le nom du plan est requis";
    }
    
    if (!form.prixMensuel) {
      newErrors.prixMensuel = "Le prix mensuel est requis";
    } else if (isNaN(form.prixMensuel) || Number(form.prixMensuel) < 0) {
      newErrors.prixMensuel = "Le prix doit être un nombre positif";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        prixMensuel: Number(form.prixMensuel),
        description: form.description?.trim() || null,
      };
      
      await createPlanTarifaire(payload);
      navigate("/plans");
    } catch (err) {
      console.error(err);
      setErrors({ submit: err.response?.data?.message || err.message || "Erreur lors de la création du plan" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/plans-tarifaires");
  };

  return (
    <div className="create-plan-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouveau plan tarifaire</h1>
          <p className="page-subtitle">Créer un nouveau plan tarifaire pour les offres</p>
        </div>
      </div>

      <div className="form-container">
        <form className="plan-form" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="alert alert-error">
              {errors.submit}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nom du plan *</label>
            <input
              className={`form-control ${errors.nom ? "error" : ""}`}
              value={form.nom}
              onChange={setField("nom")}
              placeholder="Ex: Plan Standard, Premium, Basic..."
              autoFocus
            />
            {errors.nom && <span className="field-error">{errors.nom}</span>}
            <span className="input-hint">Nom unique identifiant le plan tarifaire</span>
          </div>

          <div className="form-group">
            <label className="form-label">Prix mensuel (TND) *</label>
            <div className="input-with-prefix">
              {/* <span className="input-prefix">TND</span> */}
              <input
                type="number"
                min="0"
                step="0.01"
                className={`form-control ${errors.prixMensuel ? "error" : ""}`}
                value={form.prixMensuel}
                onChange={setField("prixMensuel")}
                placeholder="0.00"
              />
            </div>
            {errors.prixMensuel && <span className="field-error">{errors.prixMensuel}</span>}
            <span className="input-hint">Prix mensuel en TND (taxes incluses)</span>
          </div>

          <div className="form-group">
            <label className="form-label optional-label">Description</label>
            <textarea
              className="form-control"
              rows={5}
              value={form.description}
              onChange={setField("description")}
              placeholder="Décrivez les avantages, caractéristiques et conditions du plan..."
              style={{ resize: "vertical" }}
            />
            <span className="input-hint">
              Description détaillée du plan (optionnelle mais recommandée)
            </span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? "Création en cours..." : "Créer le plan tarifaire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePlanTarifaire;