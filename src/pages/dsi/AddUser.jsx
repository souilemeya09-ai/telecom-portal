import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./addUser.css";
import CreateCustomer from "../Vente/customer/CreateCustomer";

const EMPTY_FORM = {
    username: "",
    email: "",
    password: "",
    role: "USER",
};

const ROLES = [
    { value: "ADMIN", label: "Administrateur" },
    { value: "METIER", label: "Métier" },
    { value: "VENTE", label: "Vente" },
    { value: "DSI", label: "DSI" },
    { value: "USER", label: "Utilisateur standard" },
];

function AddUser() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!form.username.trim()) {
            newErrors.username = "Le nom d'utilisateur est requis";
        }

        if (!form.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = "L'email n'est pas valide";
        }

        if (!form.password) {
            newErrors.password = "Le mot de passe est requis";
        } else if (form.password.length < 6) {
            newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
        }

        if (!form.role) {
            newErrors.role = "Le rôle est requis";
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

        setSubmitting(true);
        try {
            await CreateCustomer({
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password,
                role: form.role,
            });
            navigate("/users");
        } catch (err) {
            console.error(err);
            setErrors({ submit: err.response?.data?.message || err.message || "Erreur lors de la création de l'utilisateur" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/users");
    };

    return (
        <div className="add-user-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Nouvel utilisateur</h1>
                    <p className="page-subtitle">Créer un compte utilisateur pour l'accès à la plateforme</p>
                </div>
            </div>

            <div className="form-container">
                <form className="user-form" onSubmit={handleSubmit}>
                    {errors.submit && (
                        <div className="alert alert-error">
                            {errors.submit}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Nom d'utilisateur *</label>
                        <input
                            className={`form-control ${errors.username ? "error" : ""}`}
                            value={form.username}
                            onChange={setField("username")}
                            placeholder="Ex: jean.dupont, jdupont87..."
                            autoFocus
                        />
                        {errors.username && <span className="field-error">{errors.username}</span>}
                        <span className="input-hint">Nom unique pour l'identification</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? "error" : ""}`}
                            value={form.email}
                            onChange={setField("email")}
                            placeholder="exemple@domaine.com"
                        />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                        <span className="input-hint">Email professionnel valide</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mot de passe *</label>
                        <input
                            type="password"
                            className={`form-control ${errors.password ? "error" : ""}`}
                            value={form.password}
                            onChange={setField("password")}
                            placeholder="Minimum 6 caractères"
                        />
                        {errors.password && <span className="field-error">{errors.password}</span>}
                        <span className="input-hint">Le mot de passe doit contenir au moins 6 caractères</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Rôle *</label>
                        <select
                            className={`form-control ${errors.role ? "error" : ""}`}
                            value={form.role}
                            onChange={setField("role")}
                        >
                            {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        {errors.role && <span className="field-error">{errors.role}</span>}
                        <span className="input-hint">
                            <strong>Métier</strong> : Gestion des offres, services, promotions<br />
                            <strong>Vente</strong> : Gestion des clients et réclamations<br />
                            <strong>DSI</strong> : Gestion des réclamations<br />
                            <strong>Utilisateur standard</strong> : Accès limité
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
                            {submitting ? "Création en cours..." : "Créer l'utilisateur"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddUser;