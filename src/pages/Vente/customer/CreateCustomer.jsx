import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createClient, getCustomerGroups } from "../../../api/api";
import "./createCustomer.css";

const EMPTY_FORM = {
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    ville: "",
    documentType: "1",
    cinNumber: "",
    passportNumber: "",
    image: null,
    customerGroupId: "",
};

function CreateCustomer({ onSuccess, onCancel, asModal = false }) {
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_FORM);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [customerGroups, setCustomerGroups] = useState([]);
    const fileInputRef = useRef();

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const groups = await getCustomerGroups();
                setCustomerGroups(Array.isArray(groups) ? groups : groups.content || []);
            } catch (err) {
                console.error("Erreur lors du chargement des groupes clients :", err);
            }
        };
        fetchGroups();
    }, []);

    const isCIN = form.documentType === "1";

    const updateForm = (patch) => {
        setForm(prev => ({ ...prev, ...patch }));
        setSubmitError("");
        setSuccessMessage("");
        // Clear specific field errors when user types
        if (patch.nom !== undefined) setErrors(prev => ({ ...prev, nom: "" }));
        if (patch.prenom !== undefined) setErrors(prev => ({ ...prev, prenom: "" }));
        if (patch.email !== undefined) setErrors(prev => ({ ...prev, email: "" }));
        if (patch.telephone !== undefined) setErrors(prev => ({ ...prev, telephone: "" }));
        if (patch.cinNumber !== undefined) setErrors(prev => ({ ...prev, cinNumber: "" }));
        if (patch.passportNumber !== undefined) setErrors(prev => ({ ...prev, passportNumber: "" }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setSubmitError("L'image ne doit pas dépasser 5 MB");
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setSubmitError("Format d'image non supporté. Utilisez JPG, PNG ou WEBP");
            return;
        }

        updateForm({ image: file });
        setPreview(URL.createObjectURL(file));
        setSubmitError("");
    };

    const clearImage = () => {
        setPreview(null);
        updateForm({ image: null });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const validate = () => {
        const newErrors = {};

        // Required fields validation
        if (!form.nom?.trim()) newErrors.nom = "Nom requis";
        if (!form.prenom?.trim()) newErrors.prenom = "Prénom requis";

        if (!form.email?.trim()) newErrors.email = "Email requis";
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email invalide";

        if (!form.telephone?.trim()) newErrors.telephone = "Téléphone requis";
        else if (form.telephone.length < 8) newErrors.telephone = "8 chiffres minimum";
        else if (form.telephone.length > 8) newErrors.telephone = "8 chiffres maximum";

        // Document validation
        if (isCIN) {
            if (!form.cinNumber?.trim()) newErrors.cinNumber = "Numéro CIN requis";
            else if (form.cinNumber.length !== 8) newErrors.cinNumber = "Le CIN doit contenir exactement 8 chiffres";
        } else {
            if (!form.passportNumber?.trim()) newErrors.passportNumber = "Numéro passeport requis";
            else if (form.passportNumber.length < 6) newErrors.passportNumber = "Numéro passeport trop court";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError("");
        setSuccessMessage("");

        try {
            const fd = new FormData();
            fd.append("nom", form.nom.trim());
            fd.append("prenom", form.prenom.trim());
            fd.append("telephone", form.telephone);
            fd.append("email", form.email.trim().toLowerCase());
            if (form.adresse?.trim()) fd.append("adresse", form.adresse.trim());
            if (form.ville?.trim()) fd.append("ville", form.ville.trim());
            if (form.customerGroupId) fd.append("customerGroupId", form.customerGroupId);
            fd.append("documentType", form.documentType);
            if (isCIN && form.cinNumber) fd.append("cinNumber", form.cinNumber);
            if (!isCIN && form.passportNumber) fd.append("passportNumber", form.passportNumber);
            if (form.image) fd.append("image", form.image);

            const result = await createClient(fd);

            // Success message
            setSuccessMessage(`Client ${form.nom} ${form.prenom} créé avec succès !`);

            // Handle modal mode
            if (asModal && onSuccess) {
                onSuccess(result);
            }
            // Handle standalone mode with redirect
            else if (!asModal) {
                // Show success message then redirect after 1.5 seconds
                setTimeout(() => {
                    navigate("/customers");
                }, 1500);
            }

            // Reset form after success (optional)
            setTimeout(() => {
                if (!asModal) {
                    handleReset();
                }
            }, 2000);

        } catch (err) {
            console.error("Erreur création client:", err);

            // Handle different error types
            if (err.response) {
                const status = err.response.status;
                const message = err.response.data?.message || err.response.data;

                if (status === 409) {
                    setSubmitError("Un client avec cet email ou ce numéro de téléphone existe déjà.");
                } else if (status === 400) {
                    if (typeof message === 'object') {
                        // Handle validation errors from backend
                        const backendErrors = {};
                        Object.keys(message).forEach(key => {
                            if (key === 'email') backendErrors.email = message[key];
                            else if (key === 'telephone') backendErrors.telephone = message[key];
                            else if (key === 'cinNumber') backendErrors.cinNumber = message[key];
                            else if (key === 'passportNumber') backendErrors.passportNumber = message[key];
                            else setSubmitError(message[key]);
                        });
                        setErrors(prev => ({ ...prev, ...backendErrors }));
                    } else {
                        setSubmitError(message || "Données invalides. Vérifiez les champs.");
                    }
                } else if (status === 401 || status === 403) {
                    setSubmitError("Vous n'êtes pas autorisé à effectuer cette action.");
                } else {
                    setSubmitError(message || "Une erreur est survenue lors de la création du client.");
                }
            } else if (err.request) {
                setSubmitError("Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setSubmitError(err.message || "Une erreur inattendue s'est produite.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setPreview(null);
        setErrors({});
        setSubmitError("");
        setSuccessMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCancel = () => {
        if (asModal && onCancel) {
            onCancel();
        } else {
            navigate("/customers");
        }
    };

    const inner = (
        <div className="create-customer-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        {asModal ? "Nouveau client" : "Créer un client"}
                    </h1>
                    <p className="page-subtitle">
                        Remplissez les informations ci-dessous
                    </p>
                </div>
                {onCancel && asModal && (
                    <button className="close-modal-btn" onClick={onCancel} type="button">
                        ✕
                    </button>
                )}
            </div>

            <div className="form-container">
                <form className="customer-form" onSubmit={handleSubmit}>
                    {/* Success Message */}
                    {successMessage && (
                        <div className="alert alert-success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {submitError && (
                        <div className="alert alert-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {submitError}
                        </div>
                    )}

                    {/* Identité */}
                    <div className="form-section">
                        <h3 className="section-title">Identité</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Nom <span className="required">*</span>
                                </label>
                                <input
                                    className={`form-control ${errors.nom ? "error" : ""}`}
                                    value={form.nom}
                                    onChange={(e) => updateForm({ nom: e.target.value })}
                                    placeholder="Ex : Mansouri"
                                    disabled={submitting}
                                />
                                {errors.nom && <span className="field-error">{errors.nom}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Prénom <span className="required">*</span>
                                </label>
                                <input
                                    className={`form-control ${errors.prenom ? "error" : ""}`}
                                    value={form.prenom}
                                    onChange={(e) => updateForm({ prenom: e.target.value })}
                                    placeholder="Ex : Karim"
                                    disabled={submitting}
                                />
                                {errors.prenom && <span className="field-error">{errors.prenom}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="form-section">
                        <h3 className="section-title">Contact</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Téléphone <span className="required">*</span>
                                </label>
                                <input
                                    className={`form-control ${errors.telephone ? "error" : ""}`}
                                    value={form.telephone}
                                    onChange={(e) => updateForm({ telephone: e.target.value.replace(/\D/g, "") })}
                                    maxLength={8}
                                    placeholder="12345678"
                                    inputMode="numeric"
                                    disabled={submitting}
                                />
                                {errors.telephone && <span className="field-error">{errors.telephone}</span>}
                                <span className="input-hint">8 chiffres</span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Email <span className="required">*</span>
                                </label>
                                <input
                                    className={`form-control ${errors.email ? "error" : ""}`}
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => updateForm({ email: e.target.value })}
                                    placeholder="client@exemple.com"
                                    disabled={submitting}
                                />
                                {errors.email && <span className="field-error">{errors.email}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="form-section">
                        <h3 className="section-title">Adresse</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Adresse</label>
                                <input
                                    className="form-control"
                                    value={form.adresse}
                                    onChange={(e) => updateForm({ adresse: e.target.value })}
                                    placeholder="Rue, numéro..."
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ville</label>
                                <input
                                    className="form-control"
                                    value={form.ville}
                                    onChange={(e) => updateForm({ ville: e.target.value })}
                                    placeholder="Ex : Kairouan"
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Document d'identité */}
                    <div className="form-section">
                        <h3 className="section-title">Document d'identité</h3>
                        <div className="toggle-group">
                            <button
                                type="button"
                                className={`toggle-btn ${isCIN ? "toggle-active" : ""}`}
                                onClick={() => updateForm({ documentType: "1", passportNumber: "" })}
                                disabled={submitting}
                            >
                                🪪 CIN
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${!isCIN ? "toggle-active" : ""}`}
                                onClick={() => updateForm({ documentType: "2", cinNumber: "" })}
                                disabled={submitting}
                            >
                                📘 Passeport
                            </button>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Numéro {isCIN ? "CIN" : "Passeport"} <span className="required">*</span>
                                </label>
                                {isCIN ? (
                                    <input
                                        className={`form-control ${errors.cinNumber ? "error" : ""}`}
                                        value={form.cinNumber}
                                        onChange={(e) => updateForm({ cinNumber: e.target.value.replace(/\D/g, "") })}
                                        maxLength={8}
                                        placeholder="12345678"
                                        inputMode="numeric"
                                        disabled={submitting}
                                    />
                                ) : (
                                    <input
                                        className={`form-control ${errors.passportNumber ? "error" : ""}`}
                                        value={form.passportNumber}
                                        onChange={(e) => updateForm({ passportNumber: e.target.value.toUpperCase() })}
                                        placeholder="AB1234567"
                                        disabled={submitting}
                                    />
                                )}
                                {(isCIN ? errors.cinNumber : errors.passportNumber) && (
                                    <span className="field-error">
                                        {isCIN ? errors.cinNumber : errors.passportNumber}
                                    </span>
                                )}
                                {isCIN && <span className="input-hint">8 chiffres</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Groupe client (optionnel)</label>
                                <select
                                    className="form-control"
                                    value={form.customerGroupId}
                                    onChange={(e) => updateForm({ customerGroupId: e.target.value })}
                                    disabled={submitting}
                                >
                                    <option value="">Sélectionner un groupe client</option>
                                    {customerGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Upload image */}
                        {/* <div className="form-group">
                            <label className="form-label">Image {isCIN ? "CIN" : "Passeport"} (optionnel)</label>
                            <div
                                className={`upload-zone ${preview ? "has-image" : ""}`}
                                onClick={() => !submitting && fileInputRef.current?.click()}
                                style={{ cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
                            >
                                {preview ? (
                                    <img src={preview} alt="Aperçu" className="preview-image" />
                                ) : (
                                    <div className="upload-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <span>Cliquer pour importer</span>
                                        <small>JPG, PNG — max 5 MB</small>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    style={{ display: "none" }}
                                    onChange={handleImageChange}
                                    disabled={submitting}
                                />
                            </div>
                            {preview && (
                                <button type="button" className="clear-upload-btn" onClick={clearImage} disabled={submitting}>
                                    ✕ Retirer l'image
                                </button>
                            )}
                        </div> */}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCancel} disabled={submitting}>
                            Annuler
                        </button>
                        <button type="button" className="btn-secondary" onClick={handleReset} disabled={submitting}>
                            Réinitialiser
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Création en cours...
                                </>
                            ) : (
                                "Créer le client"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (asModal) {
        return (
            <div className="modal-overlay" onClick={!submitting ? onCancel : undefined}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    {inner}
                </div>
            </div>
        );
    }

    return <div className="create-customer-page">{inner}</div>;
}

export default CreateCustomer;