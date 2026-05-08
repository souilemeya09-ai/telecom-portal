import { useState, useRef, useEffect } from "react";
import { createClient, getCustomerGroups } from "../../../api/api";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
const EMPTY_FORM = {
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    ville: "",
    documentType: "1",   // "1" = CIN  |  "2" = Passeport
    cinNumber: "",
    passportNumber: "",
    image: null,
    customerGroupId: null,
};

/* ══════════════════════════════════════════
   ICONS
══════════════════════════════════════════ */
const IconUser = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconPhone = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" /></svg>;
const IconMail = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const IconMapPin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconCard = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
const IconUpload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
const IconClose = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconArrow = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;

/* ══════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════ */
function SectionTitle({ icon, label, step }) {
    return (
        <div style={s.sectionTitle}>
            <div style={s.stepBadge}>{step}</div>
            <span style={s.stepIcon}>{icon}</span>
            <span style={s.stepLabel}>{label}</span>
        </div>
    );
}

/* ══════════════════════════════════════════
   FIELD
══════════════════════════════════════════ */
function Field({ label, required, icon, error, children }) {
    return (
        <div style={s.fieldWrap}>
            <label style={s.label}>
                {label}{required && <span style={s.required}> *</span>}
            </label>
            <div style={{ position: "relative" }}>
                {icon && <span style={s.fieldIcon}>{icon}</span>}
                {children}
            </div>
            {error && <span style={s.fieldError}>{error}</span>}
        </div>
    );
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
/**
 * CreateCustomer
 *
 * Props :
 *   onSuccess(newCustomer) — appelé après création réussie
 *   onCancel()             — appelé si l'utilisateur annule
 *   asModal (bool)         — rendu en modale flottante (défaut: false = page pleine)
 */
const CreateCustomer = ({ onSuccess, onCancel, asModal = false }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [preview, setPreview] = useState(null);
    const [submitting, setSub] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const fileRef = useRef();
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

    const isCIN = form.documentType === "1";

    /* ── Helpers ── */
    const set = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const setNum = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target.value.replace(/\D/g, "") }));

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm((f) => ({ ...f, image: file }));
        setPreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setPreview(null);
        setForm((f) => ({ ...f, image: null }));
        if (fileRef.current) fileRef.current.value = "";
    };

    /* ── Validation ── */
    const validate = () => {
        const e = {};
        if (!form.nom.trim()) e.nom = "Nom requis";
        if (!form.prenom.trim()) e.prenom = "Prénom requis";
        if (!form.email.trim()) e.email = "Email requis";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email invalide";
        if (!form.telephone.trim()) e.telephone = "Téléphone requis";
        else if (form.telephone.length < 8) e.telephone = "8 chiffres minimum";
        if (isCIN && !form.cinNumber.trim()) e.cinNumber = "Numéro CIN requis";
        if (!isCIN && !form.passportNumber.trim()) e.passportNumber = "Numéro passeport requis";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSub(true);
        try {
            const fd = new FormData();
            fd.append("nom", form.nom);
            fd.append("prenom", form.prenom);
            fd.append("telephone", form.telephone);
            fd.append("email", form.email);
            fd.append("adresse", form.adresse);
            fd.append("ville", form.ville);
            fd.append("customerGroupId", form.customerGroupId);
            fd.append("documentType", form.documentType);
            if (isCIN) fd.append("cinNumber", form.cinNumber);
            else fd.append("passportNumber", form.passportNumber);
            if (form.image) fd.append("image", form.image);

            const result = await createClient(fd);
            setSuccess(true);
            setTimeout(() => onSuccess?.(result), 1200);
        } catch (err) {
            setErrors({ _api: err.response?.data?.message || err.message });
        } finally {
            setSub(false);
        }
    };

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setPreview(null);
        setErrors({});
        setSuccess(false);
        if (fileRef.current) fileRef.current.value = "";
    };

    /* ── Success screen ── */
    if (success) {
        return (
            <div style={asModal ? s.modalOverlay : {}}>
                <div style={{ ...s.card, ...(asModal ? s.modalBox : {}), ...s.successCard }}>
                    <div style={s.successIcon}><IconCheck /></div>
                    <div style={s.successTitle}>Client créé avec succès !</div>
                    <div style={s.successSub}>
                        {form.nom} {form.prenom} a été ajouté à la base clients.
                    </div>
                </div>
            </div>
        );
    }

    /* ── Form ── */
    const inner = (
        <div style={{ ...s.card, ...(asModal ? s.modalBox : {}) }}>

            {/* Header */}
            <div style={s.header}>
                <div>
                    <div style={s.headerTitle}>
                        {asModal ? "Nouveau client" : "Créer un client"}
                    </div>
                    <div style={s.headerSub}>Remplissez les informations ci-dessous</div>
                </div>
                {onCancel && (
                    <button style={s.closeBtn} onClick={onCancel} type="button">
                        <IconClose />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div style={s.body}>

                    {/* ── Bloc 1 : Identité ── */}
                    <SectionTitle step="1" icon={<IconUser />} label="Identité" />
                    <div style={s.grid2}>
                        <Field label="Nom" required error={errors.nom} icon={<IconUser />}>
                            <input
                                style={{ ...s.input, ...(errors.nom ? s.inputError : {}) }}
                                value={form.nom}
                                onChange={set("nom")}
                                placeholder="Ex : Mansouri"
                            />
                        </Field>
                        <Field label="Prénom" required error={errors.prenom}>
                            <input
                                style={{ ...s.input, ...(errors.prenom ? s.inputError : {}) }}
                                value={form.prenom}
                                onChange={set("prenom")}
                                placeholder="Ex : Karim"
                            />
                        </Field>
                    </div>

                    {/* ── Bloc 2 : Contact ── */}
                    <SectionTitle step="2" icon={<IconPhone />} label="Contact" />
                    <div style={s.grid2}>
                        <Field label="Téléphone" required error={errors.telephone} icon={<IconPhone />}>
                            <input
                                style={{ ...s.input, ...s.inputPadded, ...(errors.telephone ? s.inputError : {}) }}
                                value={form.telephone}
                                onChange={setNum("telephone")}
                                maxLength={8}
                                placeholder="12345678"
                                inputMode="numeric"
                            />
                        </Field>
                        <Field label="Email" required error={errors.email} icon={<IconMail />}>
                            <input
                                style={{ ...s.input, ...s.inputPadded, ...(errors.email ? s.inputError : {}) }}
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                placeholder="client@exemple.com"
                            />
                        </Field>
                    </div>

                    {/* ── Bloc 3 : Adresse ── */}
                    <SectionTitle step="3" icon={<IconMapPin />} label="Adresse" />
                    <div style={s.grid2}>
                        <Field label="Adresse" icon={<IconMapPin />}>
                            <input
                                style={{ ...s.input, ...s.inputPadded }}
                                value={form.adresse}
                                onChange={set("adresse")}
                                placeholder="Rue, numéro..."
                            />
                        </Field>
                        <Field label="Ville">
                            <input
                                style={s.input}
                                value={form.ville}
                                onChange={set("ville")}
                                placeholder="Ex : Sfax"
                            />
                        </Field>
                    </div>

                    {/* ── Bloc 4 : Document ── */}
                    <SectionTitle step="4" icon={<IconCard />} label="Document d'identité" />

                    {/* Toggle CIN / Passeport */}
                    <div style={s.toggleWrap}>
                        <button
                            type="button"
                            style={{ ...s.toggleBtn, ...(isCIN ? s.toggleActive : {}) }}
                            onClick={() => setForm((f) => ({ ...f, documentType: "1", passportNumber: "", image: null }))}
                        >
                            🪪 CIN
                        </button>
                        <button
                            type="button"
                            style={{ ...s.toggleBtn, ...(!isCIN ? s.toggleActive : {}) }}
                            onClick={() => setForm((f) => ({ ...f, documentType: "2", cinNumber: "", image: null }))}
                        >
                            📘 Passeport
                        </button>
                    </div>

                    <div style={s.grid2}>
                        <Field
                            label={`Numéro ${isCIN ? "CIN" : "Passeport"}`}
                            required
                            error={isCIN ? errors.cinNumber : errors.passportNumber}
                            icon={<IconCard />}
                        >
                            {isCIN ? (
                                <input
                                    style={{
                                        ...s.input, ...s.inputPadded, ...s.mono,
                                        ...(errors.cinNumber ? s.inputError : {}),
                                    }}
                                    value={form.cinNumber}
                                    onChange={setNum("cinNumber")}
                                    maxLength={8}
                                    placeholder="12345678"
                                    inputMode="numeric"
                                />
                            ) : (
                                <input
                                    style={{
                                        ...s.input, ...s.inputPadded, ...s.mono,
                                        ...(errors.passportNumber ? s.inputError : {}),
                                    }}
                                    value={form.passportNumber}
                                    onChange={set("passportNumber")}
                                    placeholder="AB1234567"
                                />
                            )}
                        </Field>

                        {/* Upload */}
                        {/* <Field label={`Image ${isCIN ? "CIN" : "Passeport"}`}>
                            <div
                                style={{ ...s.uploadZone, ...(preview ? s.uploadZoneHasImage : {}) }}
                                onClick={() => fileRef.current.click()}
                            >
                                {preview ? (
                                    <img src={preview} alt="preview" style={s.previewImg} />
                                ) : (
                                    <div style={s.uploadPlaceholder}>
                                        <IconUpload />
                                        <span style={{ fontSize: 12, marginTop: 4 }}>Cliquer pour importer</span>
                                        <span style={{ fontSize: 11, color: "#9aa0b4" }}>JPG, PNG — max 5 MB</span>
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
                                <button type="button" style={s.clearBtn} onClick={clearImage}>
                                    ✕ Retirer
                                </button>
                            )}
                        </Field> */}

                        <Field
                            label={`groupe client (optionnel)`}
                            icon={<IconCard />}
                        >
                            <select className="form-control" name="" id="" onChange={set("customerGroupId")} >
                                <option value="">Sélectionner un groupe client</option>
                                {customerGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {/* API error */}
                    {errors._api && (
                        <div style={s.apiError}>{errors._api}</div>
                    )}
                </div>

                {/* Footer */}
                <div style={s.footer}>
                    {onCancel && (
                        <button type="button" style={s.btnSecondary} onClick={onCancel}>
                            Annuler
                        </button>
                    )}
                    <button type="button" style={s.btnGhost} onClick={handleReset}>
                        Réinitialiser
                    </button>
                    <button type="submit" style={{ ...s.btnPrimary, ...(submitting ? s.btnDisabled : {}) }} disabled={submitting}>
                        {submitting ? (
                            <span style={s.spinnerWrap}>
                                <span style={s.spinner} />
                                Enregistrement...
                            </span>
                        ) : (
                            <>Créer le client <IconArrow /></>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    if (asModal) {
        return (
            <div style={s.modalOverlay} onClick={onCancel}>
                <div onClick={(e) => e.stopPropagation()}>{inner}</div>
            </div>
        );
    }

    return <div style={s.pageWrap}>{inner}</div>;
};

/* ══════════════════════════════════════════
   STYLES (inline — aucune dépendance CSS)
══════════════════════════════════════════ */
const s = {
    /* Layout */
    pageWrap: {
        fontFamily: "'DM Sans', sans-serif",
        background: "#f4f5f9",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2.5rem 1rem",
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },

    /* Card */
    card: {
        background: "#fff",
        borderRadius: 14,
        border: "0.5px solid #e6e9f0",
        boxShadow: "0 4px 24px rgba(0,0,0,.09)",
        width: "100%",
        maxWidth: 680,
        overflow: "hidden",
    },
    modalBox: {
        maxHeight: "90vh",
        overflowY: "auto",
    },

    /* Header */
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 1.75rem",
        borderBottom: "0.5px solid #e6e9f0",
        background: "#141824",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: "#ffffff",
        letterSpacing: "-0.01em",
    },
    headerSub: {
        fontSize: 12,
        color: "#8a92a3",
        marginTop: 2,
    },
    closeBtn: {
        background: "none",
        border: "none",
        color: "#8a92a3",
        cursor: "pointer",
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        transition: "background .15s",
    },

    /* Body */
    body: {
        padding: "1.5rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
    },

    /* Section title */
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 2,
        marginTop: 6,
    },
    stepBadge: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#BA7517",
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    stepIcon: {
        color: "#BA7517",
        display: "flex",
        alignItems: "center",
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: 600,
        color: "#556076",
        textTransform: "uppercase",
        letterSpacing: ".07em",
    },

    /* Grid */
    grid2: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.875rem 1.25rem",
    },

    /* Field */
    fieldWrap: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
    },
    label: {
        fontSize: 11,
        fontWeight: 500,
        color: "#556076",
        textTransform: "uppercase",
        letterSpacing: ".05em",
    },
    required: {
        color: "#A32D2D",
    },
    fieldIcon: {
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        color: "#9aa0b4",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
    },
    fieldError: {
        fontSize: 11,
        color: "#A32D2D",
        marginTop: 2,
    },

    /* Input */
    input: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: "#0d1120",
        background: "#f8f9fc",
        border: "0.5px solid #cdd2e0",
        borderRadius: 6,
        padding: "9px 12px",
        outline: "none",
        width: "100%",
        transition: "border-color .15s, box-shadow .15s",
    },
    inputPadded: {
        paddingLeft: 34,
    },
    inputError: {
        borderColor: "#A32D2D",
        background: "#FCEBEB",
    },
    mono: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
    },

    /* Toggle */
    toggleWrap: {
        display: "flex",
        gap: 8,
        marginBottom: 2,
    },
    toggleBtn: {
        flex: 1,
        padding: "8px 14px",
        borderRadius: 6,
        border: "0.5px solid #cdd2e0",
        background: "#f8f9fc",
        color: "#556076",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all .15s",
    },
    toggleActive: {
        borderColor: "#BA7517",
        background: "#FAEEDA",
        color: "#BA7517",
    },

    /* Upload */
    uploadZone: {
        border: "1.5px dashed #cdd2e0",
        borderRadius: 8,
        minHeight: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: "#f8f9fc",
        overflow: "hidden",
        transition: "border-color .15s, background .15s",
    },
    uploadZoneHasImage: {
        border: "1px solid #cdd2e0",
    },
    uploadPlaceholder: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        color: "#9aa0b4",
        padding: "0.75rem",
    },
    previewImg: {
        width: "100%",
        height: 90,
        objectFit: "cover",
    },
    clearBtn: {
        background: "none",
        border: "none",
        color: "#A32D2D",
        fontSize: 11,
        cursor: "pointer",
        marginTop: 4,
        fontFamily: "'DM Sans', sans-serif",
        padding: 0,
    },

    /* API error */
    apiError: {
        background: "#FCEBEB",
        border: "0.5px solid #f5c6c6",
        borderRadius: 6,
        padding: "10px 14px",
        fontSize: 13,
        color: "#A32D2D",
    },

    /* Footer */
    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        padding: "1rem 1.75rem",
        borderTop: "0.5px solid #e6e9f0",
        background: "#f8f9fc",
    },
    btnPrimary: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 20px",
        background: "#BA7517",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
    },
    btnDisabled: {
        opacity: 0.6,
        cursor: "not-allowed",
    },
    btnSecondary: {
        padding: "9px 16px",
        background: "#fff",
        color: "#556076",
        border: "0.5px solid #cdd2e0",
        borderRadius: 6,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
    },
    btnGhost: {
        padding: "9px 16px",
        background: "transparent",
        color: "#9aa0b4",
        border: "0.5px solid #e6e9f0",
        borderRadius: 6,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        cursor: "pointer",
    },

    /* Spinner */
    spinnerWrap: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
    },
    spinner: {
        display: "inline-block",
        width: 12,
        height: 12,
        border: "2px solid rgba(255,255,255,.35)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
    },

    /* Success */
    successCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem 2rem",
        gap: "0.75rem",
        textAlign: "center",
    },
    successIcon: {
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "#EAF3DE",
        color: "#3B6D11",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    successTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: "#0d1120",
    },
    successSub: {
        fontSize: 13,
        color: "#556076",
    },
};

/* Keyframes pour le spinner (injectées une seule fois) */
if (typeof document !== "undefined" && !document.getElementById("cc-spin")) {
    const style = document.createElement("style");
    style.id = "cc-spin";
    style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
}

export default CreateCustomer;