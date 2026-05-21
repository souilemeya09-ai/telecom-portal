import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOffre,
  getServices,
  getPlansTarifaires,
} from "../../../api/api";
import "./createOffre.css";

const TYPE_OFFRES = ["MOBILE", "FIXE", "INTERNET", "TV", "BUNDLE"];

const EMPTY_FORM = {
  nomOffre: "",
  typeOffre: "MOBILE",
  planTarifaireId: "",
  serviceIds: [],
};

function CreateOffre() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        getServices({ page: 0, size: 1000 }),
        getPlansTarifaires({ page: 0, size: 1000 }),
      ]);
      setServices(s.content || []);
      setPlans(p.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...f.serviceIds, id],
    }));
    // Clear error for services when toggled
    if (errors.services) {
      setErrors((prev) => ({ ...prev, services: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nomOffre.trim()) {
      newErrors.nomOffre = "Le nom de l'offre est requis";
    }

    if (!form.typeOffre) {
      newErrors.typeOffre = "Le type d'offre est requis";
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
        nomOffre: form.nomOffre.trim(),
        typeOffre: form.typeOffre,
        planTarifaireId: form.planTarifaireId ? Number(form.planTarifaireId) : null,
        serviceIds: form.serviceIds,
      };

      await createOffre(payload);
      navigate("/offres"); // Redirige vers la liste après création
    } catch (err) {
      console.error(err);
      setErrors({ submit: err.response?.data?.message || err.message || "Erreur lors de la création de l'offre" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/offres");
  };

  if (loading) {
    return <div className="loading-state">Chargement des données...</div>;
  }

  return (
    <div className="create-offre-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle offre</h1>
          <p className="page-subtitle">Créer une nouvelle offre avec ses services et plan tarifaire</p>
        </div>
      </div>

      <div className="form-container">
        <form className="offre-form" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="alert alert-error">
              {errors.submit}
            </div>
          )}

          {/* Nom de l'offre */}
          <div className="form-group">
            <label className="form-label">Nom de l'offre *</label>
            <input
              className={`form-control ${errors.nomOffre ? "error" : ""}`}
              value={form.nomOffre}
              onChange={(e) => {
                setForm({ ...form, nomOffre: e.target.value });
                if (errors.nomOffre) setErrors((prev) => ({ ...prev, nomOffre: "" }));
              }}
              placeholder="Ex: Offre Essentielle, Premium Plus..."
              autoFocus
            />
            {errors.nomOffre && <span className="field-error">{errors.nomOffre}</span>}
            <span className="input-hint">Nom unique identifiant l'offre commerciale</span>
          </div>

          {/* Type d'offre */}
          <div className="form-group">
            <label className="form-label">Type d'offre *</label>
            <select
              className={`form-control ${errors.typeOffre ? "error" : ""}`}
              value={form.typeOffre}
              onChange={(e) => {
                setForm({ ...form, typeOffre: e.target.value });
                if (errors.typeOffre) setErrors((prev) => ({ ...prev, typeOffre: "" }));
              }}
            >
              {TYPE_OFFRES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.typeOffre && <span className="field-error">{errors.typeOffre}</span>}
            <span className="input-hint">Catégorie principale de l'offre</span>
          </div>

          {/* Plan tarifaire */}
          <div className="form-group">
            <label className="form-label">Plan tarifaire</label>
            <select
              className="form-control"
              value={form.planTarifaireId}
              onChange={(e) => setForm({ ...form, planTarifaireId: e.target.value })}
            >
              <option value="">Aucun plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} — {p.prixMensuel} TND/mois
                </option>
              ))}
            </select>
            <span className="input-hint">
              Plan tarifaire associé à l'offre (optionnel)
            </span>
          </div>

          {/* Services inclus */}
          <div className="form-group">
            <label className="form-label">Services inclus</label>
            <div className="services-picker">
              {services.length === 0 ? (
                <p className="picker-empty">Aucun service disponible</p>
              ) : (
                services.map((s) => {
                  const selected = form.serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`service-chip ${selected ? "service-chip-active" : ""}`}
                      onClick={() => toggleService(s.id)}
                    >
                      {selected ? "✓ " : ""}{s.nomService}
                      {s.description && (
                        <span className="service-chip-desc">{s.description}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {form.serviceIds.length > 0 && (
              <p className="picker-count">
                {form.serviceIds.length} service{form.serviceIds.length > 1 ? "s" : ""} sélectionné{form.serviceIds.length > 1 ? "s" : ""}
              </p>
            )}
            <span className="input-hint">
              Sélectionnez les services inclus dans cette offre (cliquez pour ajouter/retirer)
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
              {submitting ? "Création en cours..." : "Créer l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOffre;