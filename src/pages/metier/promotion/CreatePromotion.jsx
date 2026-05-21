import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPromotion } from "../../../api/api";
import "./createPromotion.css";

const TYPE_REDUCTION = [
    { value: "POURCENTAGE", label: "Pourcentage (%)" },
    { value: "MONTANT_FIXE", label: "Montant fixe (TND)" },
];

const EMPTY_FORM = {
    nomPromotion: "",
    typeReduction: "POURCENTAGE",
    valeurReduction: "",
    dateDebut: "",
    dateFin: "",
    regleEligibilite: "",
    ancienneteMinimale: "",
};

function CreatePromotion() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    // Extraire l'ID du user connecté depuis le JWT
    const currentUserId = useMemo(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.id || payload.userId || payload.sub || null;
        } catch { 
            return null; 
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!form.nomPromotion.trim()) {
            newErrors.nomPromotion = "Le nom de la promotion est requis";
        }

        if (!form.typeReduction) {
            newErrors.typeReduction = "Le type de réduction est requis";
        }

        if (!form.valeurReduction) {
            newErrors.valeurReduction = "La valeur de réduction est requise";
        } else if (isNaN(form.valeurReduction) || Number(form.valeurReduction) <= 0) {
            newErrors.valeurReduction = "La valeur doit être un nombre positif";
        }

        if (!form.dateDebut) {
            newErrors.dateDebut = "La date de début est requise";
        }

        if (form.dateDebut && form.dateFin && form.dateFin <= form.dateDebut) {
            newErrors.dateFin = "La date de fin doit être postérieure à la date de début";
        }

        if (form.ancienneteMinimale && (isNaN(form.ancienneteMinimale) || Number(form.ancienneteMinimale) < 0)) {
            newErrors.ancienneteMinimale = "L'ancienneté minimale doit être un nombre positif";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const setField = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!currentUserId) {
            setErrors({ submit: "Utilisateur non authentifié" });
            return;
        }

        setSubmitting(true);
        try {
            await createPromotion({
                createurId: currentUserId,
                nomPromotion: form.nomPromotion.trim(),
                typeReduction: form.typeReduction,
                valeurReduction: Number(form.valeurReduction),
                dateDebut: form.dateDebut,
                dateFin: form.dateFin || null,
                regleEligibilite: form.regleEligibilite?.trim() || null,
                ancienneteMinimale: form.ancienneteMinimale ? Number(form.ancienneteMinimale) : null,
            });
            navigate("/promotions");
        } catch (err) {
            console.error(err);
            setErrors({ submit: err.response?.data?.message || err.message || "Erreur lors de la création de la promotion" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/promotions");
    };

    return (
        <div className="create-promotion-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Nouvelle promotion</h1>
                    <p className="page-subtitle">Créer une nouvelle campagne promotionnelle</p>
                </div>
            </div>

            <div className="form-container">
                <form className="promotion-form" onSubmit={handleSubmit}>
                    {errors.submit && (
                        <div className="alert alert-error">
                            {errors.submit}
                        </div>
                    )}

                    {/* Nom de la promotion */}
                    <div className="form-group">
                        <label className="form-label">Nom de la promotion *</label>
                        <input
                            className={`form-control ${errors.nomPromotion ? "error" : ""}`}
                            value={form.nomPromotion}
                            onChange={setField("nomPromotion")}
                            placeholder="Ex: Promo Ramadan 2026, Black Friday, Soldes d'été..."
                            autoFocus
                        />
                        {errors.nomPromotion && <span className="field-error">{errors.nomPromotion}</span>}
                        <span className="input-hint">Nom unique identifiant la promotion</span>
                    </div>

                    {/* Type de réduction */}
                    <div className="form-group">
                        <label className="form-label">Type de réduction *</label>
                        <select
                            className={`form-control ${errors.typeReduction ? "error" : ""}`}
                            value={form.typeReduction}
                            onChange={setField("typeReduction")}
                        >
                            {TYPE_REDUCTION.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {errors.typeReduction && <span className="field-error">{errors.typeReduction}</span>}
                    </div>

                    {/* Valeur de réduction */}
                    <div className="form-group">
                        <label className="form-label">
                            Valeur de réduction *
                        </label>
                        <div className="input-with-prefix">
                            {/* <span className="input-prefix">
                                {form.typeReduction === "POURCENTAGE" ? "%" : "TND"}
                            </span> */}
                            <input
                                type="number"
                                min="0"
                                step={form.typeReduction === "POURCENTAGE" ? "1" : "0.01"}
                                className={`form-control ${errors.valeurReduction ? "error" : ""}`}
                                value={form.valeurReduction}
                                onChange={setField("valeurReduction")}
                                placeholder={form.typeReduction === "POURCENTAGE" ? "Ex: 20" : "Ex: 50.00"}
                            />
                        </div>
                        {errors.valeurReduction && <span className="field-error">{errors.valeurReduction}</span>}
                        <span className="input-hint">
                            {form.typeReduction === "POURCENTAGE" 
                                ? "Pourcentage de réduction appliqué" 
                                : "Montant fixe déduit du prix"}
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
                            {submitting ? "Création en cours..." : "Créer la promotion"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePromotion;