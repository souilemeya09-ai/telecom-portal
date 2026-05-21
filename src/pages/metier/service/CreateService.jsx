import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createService } from "../../../api/api";
import "./createService.css";

const EMPTY_FORM = {
  nomService: "",
  description: "",
};

function CreateService() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!form.nomService.trim()) {
      newErrors.nomService = "Le nom du service est requis";
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
        nomService: form.nomService.trim(),
        description: form.description?.trim() || null,
      };

      await createService(payload);
      navigate("/services"); // Redirige vers la liste après création
    } catch (err) {
      console.error(err);
      setErrors({ submit: err.response?.data?.message || err.message || "Erreur lors de la création du service" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/services");
  };

  return (
    <div className="create-service-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouveau service</h1>
          <p className="page-subtitle">Créer un nouveau service pour les offres</p>
        </div>
      </div>

      <div className="form-container">
        <form className="service-form" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="alert alert-error">
              {errors.submit}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nom du service *</label>
            <input
              className={`form-control ${errors.nomService ? "error" : ""}`}
              value={form.nomService}
              onChange={(e) => {
                setForm({ ...form, nomService: e.target.value });
                if (errors.nomService) setErrors((prev) => ({ ...prev, nomService: "" }));
              }}
              placeholder="Ex: Appels illimités, Data 20Go, SMS illimités..."
              autoFocus
            />
            {errors.nomService && <span className="field-error">{errors.nomService}</span>}
            <span className="input-hint">Nom unique identifiant le service</span>
          </div>

          <div className="form-group">
            <label className="form-label optional-label">Description</label>
            <textarea
              className="form-control"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez le service, ses caractéristiques et avantages..."
              style={{ resize: "vertical" }}
            />
            <span className="input-hint">
              Description détaillée du service (optionnelle mais recommandée)
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
              {submitting ? "Création en cours..." : "Créer le service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateService;