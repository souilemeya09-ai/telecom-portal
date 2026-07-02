import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StructuredAnswer from "../components/StructuredAnswer";
import MarkdownAnswer from "../components/MarkdownAnswer";
import { getPublicOffres, getPublicServices } from "../api/api";
import { LoginFooter } from "../components/Footer/FooterHome";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ─── Inline styles ──────────────────────────────────────────────────────────
const S = {
    // Layout
    page: { fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#111", background: "#fff", margin: 0 },

    // NAV
    nav: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 48px", borderBottom: "1px solid #e8eaf0",
        background: "#fff", position: "sticky", top: 0, zIndex: 100,
    },
    navLogo: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 17, color: "#1e3a8a" },
    navLogoIcon: { color: "#2563eb", fontSize: 22 },
    navLinks: { display: "flex", gap: 32 },
    navLink: { color: "#374151", fontSize: 14, textDecoration: "none", cursor: "pointer" },
    navBtn: {
        background: "#2563eb", color: "#fff", border: "none",
        padding: "9px 20px", borderRadius: 24, fontSize: 14, fontWeight: 600,
        cursor: "pointer",
    },

    // HERO
    hero: {
        background: "linear-gradient(160deg, #eff6ff 0%, #f5f3ff 50%, #ede9fe 100%)",
        padding: "120px 24px 140px", textAlign: "center", position: "relative", overflow: "hidden",
    },
    heroBadge: {
        display: "inline-flex", alignItems: "center", gap: 7,
        background: "#eff6ff", border: "1px solid #bfdbfe",
        color: "#2563eb", padding: "5px 14px", borderRadius: 100,
        fontSize: 13, fontWeight: 500, marginBottom: 40,
    },
    heroBadgeDot: { width: 7, height: 7, borderRadius: "50%", background: "#2563eb" },
    heroTitle: {
        fontFamily: "'Georgia', serif",
        fontSize: "clamp(38px, 6vw, 62px)", fontWeight: 700,
        lineHeight: 1.15, letterSpacing: "-0.02em",
        color: "#0f172a", marginBottom: 16, maxWidth: 700, margin: "0 auto 20px",
    },
    heroSub: {
        fontSize: 17, color: "#6b7280", maxWidth: 480, margin: "0 auto 40px",
        lineHeight: 1.65,
    },
    heroActions: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
    btnPrimary: {
        background: "#2563eb", color: "#fff", border: "none",
        padding: "14px 30px", borderRadius: 100, fontSize: 15, fontWeight: 600,
        cursor: "pointer",
    },
    btnOutline: {
        background: "transparent", color: "#2563eb",
        border: "2px solid #2563eb",
        padding: "13px 30px", borderRadius: 100, fontSize: 15, fontWeight: 600,
        cursor: "pointer",
    },

    // SECTION
    section: { padding: "80px 24px" },
    sectionTitle: {
        fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700,
        color: "#0f172a", textAlign: "center", marginBottom: 8,
    },
    sectionSub: { fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 48 },

    // PRICING
    pricingGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 20, maxWidth: 900, margin: "0 auto",
    },
    pricingCard: (featured) => ({
        background: "#fff", border: featured ? "2px solid #2563eb" : "1.5px solid #e5e7eb",
        borderRadius: 16, padding: "28px 24px",
        position: "relative", transition: "transform 0.18s",
    }),
    badge: (color) => ({
        display: "inline-block",
        background: color === "blue" ? "#2563eb" : "#7c3aed",
        color: "#fff", fontSize: 11, fontWeight: 700,
        padding: "3px 10px", borderRadius: 100, marginBottom: 12,
        letterSpacing: "0.04em",
    }),
    planName: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 },
    planPrice: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 },
    planPriceNum: { fontSize: 42, fontWeight: 800, color: "#0f172a", lineHeight: 1 },
    planPriceUnit: { fontSize: 13, color: "#6b7280" },
    featureList: { listStyle: "none", padding: 0, margin: "0 0 24px" },
    featureItem: {
        display: "flex", alignItems: "center", gap: 9,
        fontSize: 14, color: "#374151", marginBottom: 10,
    },
    checkIcon: { color: "#2563eb", fontSize: 16, flexShrink: 0 },
    planBtn: (featured) => ({
        width: "100%", padding: "11px 0", borderRadius: 10,
        border: featured ? "none" : "1.5px solid #2563eb",
        background: featured ? "#2563eb" : "transparent",
        color: featured ? "#fff" : "#2563eb",
        fontWeight: 600, fontSize: 14, cursor: "pointer",
    }),

    // SERVICES
    servicesBg: { background: "#f9fafb", padding: "80px 24px" },
    servicesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16, maxWidth: 900, margin: "0 auto",
    },
    serviceCard: {
        background: "#fff", border: "1.5px solid #e5e7eb",
        borderRadius: 14, padding: "28px 20px", textAlign: "center",
        cursor: "pointer",
        transition: "transform 0.2s ease",
    },
    serviceIcon: {
        width: 52, height: 52, borderRadius: "50%",
        background: "#eff6ff", display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 14px", fontSize: 22, color: "#2563eb",
    },
    serviceName: { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 5 },
    serviceDesc: { fontSize: 13, color: "#6b7280" },

    // ADVANTAGES SECTION
    advantagesBg: { background: "#fff", padding: "80px 24px" },
    advantagesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 24, maxWidth: 1000, margin: "0 auto",
    },
    advantageCard: {
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
        transition: "transform 0.2s ease",
    },
    advantageIcon: {
        width: 64, height: 64, borderRadius: "50%",
        background: "#eff6ff", display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 20px", fontSize: 28, color: "#2563eb",
    },
    advantageTitle: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 },
    advantageDesc: { fontSize: 14, color: "#6b7280", lineHeight: 1.6 },

    // CONTACT SECTION
    contactBg: { background: "#f0f9ff", padding: "80px 24px" },
    contactContainer: {
        maxWidth: 1000, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 40,
    },
    contactInfo: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "32px",
    },
    contactForm: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "32px",
    },
    contactTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 20 },
    contactDetail: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
        padding: "12px",
        background: "#f9fafb",
        borderRadius: 12,
    },
    contactIcon: { fontSize: 20, color: "#2563eb" },
    contactText: { fontSize: 14, color: "#374151", lineHeight: 1.5 },
    formGroup: { marginBottom: 20 },
    formLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
    formInput: {
        width: "100%",
        padding: "10px 12px",
        border: "1.5px solid #e5e7eb",
        borderRadius: 8,
        fontSize: 14,
        color: '#101116',
        fontFamily: "inherit",
        transition: "border-color 0.2s ease",
        background: '#f9fafb'
    },
    formTextarea: {
        width: "100%",
        padding: "10px 12px",
        border: "1.5px solid #e5e7eb",
        color: '#101116',
        borderRadius: 8,
        fontSize: 14,
        fontFamily: "inherit",
        resize: "vertical",
        minHeight: 100,
        background: '#f9fafb'

    },
    submitBtn: {
        width: "100%",
        padding: "12px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },

    // AI SECTION
    aiSection: { background: "#eff6ff", padding: "64px 24px", textAlign: "center" },
    aiBox: {
        maxWidth: 580, margin: "0 auto",
        background: "#fff", border: "1.5px solid #bfdbfe",
        borderRadius: 16, padding: 4, display: "flex", alignItems: "center",
        boxShadow: "0 4px 24px rgba(37,99,235,0.08)",
    },
    aiInput: {
        flex: 1, border: "none", outline: "none", padding: "13px 16px",
        fontSize: 15, background: "transparent", fontFamily: "inherit",
        color: "#111827",
    },
    aiBtn: {
        background: "#2563eb", color: "#fff", border: "none",
        padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
        minWidth: 120, justifyContent: "center",
    },
    aiResult: {
        maxWidth: 580, margin: "20px auto 0",
        background: "#fff", border: "1.5px solid #bfdbfe",
        borderRadius: 14, padding: "18px 22px",
        textAlign: "left", fontSize: 14, lineHeight: 1.7, color: "#1e3a8a",
    },
    aiTag: { fontSize: 11, fontWeight: 700, color: "#2563eb", marginBottom: 8, letterSpacing: "0.06em" },

    // FOOTER
    footer: {
        background: "#0f172a", color: "#e2e8f0",
        padding: "32px 48px",
        display: "flex", justifyContent: "center", alignItems: "center",
        flexWrap: "wrap", gap: 12,
    },
    footerCopy: { fontSize: 13, color: "#94a3b8" },
};

// ─── Données des avantages ──────────────────────────────────────────────────
const ADVANTAGES = [
    {
        icon: "⚡",
        title: "Fibre ultra-rapide",
        description: "Profitez de débits jusqu'à 1 Gbps pour une expérience Internet sans limite"
    },
    {
        icon: "📺",
        title: "TV 4K incluse",
        description: "Accédez à plus de 200 chaînes et au replay 7 jours, le tout en qualité 4K"
    },
    {
        icon: "📱",
        title: "Mobile 5G",
        description: "La meilleure couverture 5G pour rester connecté partout, tout le temps"
    },
    {
        icon: "🎧",
        title: "Support 24/7",
        description: "Une équipe dédiée à votre écoute, disponible jour et nuit"
    },
    {
        icon: "💰",
        title: "Prix bloqués",
        description: "Nos prix sont garantis sans augmentation pendant 2 ans"
    },
    {
        icon: "🔒",
        title: "Sécurité maximale",
        description: "Protection antivirus et pare-feu inclus pour naviguer en toute sécurité"
    }
];

// ─── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <span style={{
            display: "inline-block", width: 14, height: 14,
            border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
            borderRadius: "50%", animation: "spin 0.6s linear infinite",
        }} />
    );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function TelecomConnect() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");

    const [question, setQuestion] = useState("");
    const [offres, setOffres] = useState([]);
    const [services, setServices] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [history, setHistory] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [confirmQuestion, setConfirmQuestion] = useState(null);

    // États pour le formulaire de contact
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [contactStatus, setContactStatus] = useState(null);

    const answerRef = useRef("");
    const loadingRef = useRef(false);

    // Fonction pour obtenir le nom du plan tarifaire
    const getPlanName = (planTarifaireId) => {
        const plans = {
            1: { name: "Mobile Starter", price: "9.99", features: ["Appels illimités", "20 Go internet", "SMS/MMS illimités"] },
            2: { name: "Fixe Pro", price: "14.99", features: ["Ligne fixe professionnelle", "Appels illimités", "Messagerie vocale"] },
            3: { name: "Internet Fibre Pro", price: "34.99", features: ["Fibre symétrique", "IP fixe", "SLA 99.9%"] },
            4: { name: "TV Premium", price: "19.99", features: ["200+ chaînes", "Replay 7 jours", "Enregistrement cloud"] },
            5: { name: "Bundle", price: "49.99", features: ["Économies jusqu'à 30%", "Support prioritaire", "Facture unique"] }
        };
        return plans[planTarifaireId] || { name: "Plan standard", price: "0", features: [] };
    };

    // Fonction pour obtenir les détails d'un service par son ID
    const getServiceDetails = (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            return {
                icon: getServiceIcon(service.nomService),
                name: service.nomService,
                desc: service.description || getDefaultDescription(service.nomService)
            };
        }
        return null;
    };

    // Fonction pour obtenir une icône basée sur le nom du service
    const getServiceIcon = (serviceName) => {
        const normalizedName = serviceName || "";
        const icons = {
            "Mobile": "📱",
            "Internet": "💻",
            "Fibre": "📶",
            "TV": "📺",
            "Fixe": "📞",
            "Streaming": "🎬",
            "Cloud": "☁️",
            "Sécurité": "🔒",
            "Support": "🎧"
        };
        for (const [key, icon] of Object.entries(icons)) {
            if (normalizedName.includes(key)) return icon;
        }
        return "📡";
    };

    // Fonction pour obtenir une description par défaut
    const getDefaultDescription = (serviceName) => {
        const normalizedName = serviceName || "";
        const descriptions = {
            "Mobile": "Appels et data mobile",
            "Internet": "Connexion haut débit",
            "Fibre": "Internet ultra-rapide",
            "TV": "Divertissement TV",
            "Fixe": "Téléphonie fixe",
            "Streaming": "Contenu à la demande",
            "Cloud": "Stockage en ligne",
            "Sécurité": "Protection des données",
            "Support": "Assistance technique"
        };
        for (const [key, desc] of Object.entries(descriptions)) {
            if (normalizedName.includes(key)) return desc;
        }
        return "Service de qualité";
    };

    const normalizeApiList = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.content)) return response.content;
        if (Array.isArray(response?.data)) return response.data;
        return [];
    };

    // Récupérer les offres et services depuis l'API
    useEffect(() => {
        const fetchData = async () => {
            setCatalogLoading(true);
            setCatalogError("");
            try {
                const [offresResponse, servicesResponse] = await Promise.all([
                    getPublicOffres({ page: 0, size: 1000 }),
                    getPublicServices({ page: 0, size: 1000 }),
                ]);

                setOffres(normalizeApiList(offresResponse));
                setServices(normalizeApiList(servicesResponse));
            } catch (err) {
                console.error("Erreur lors du chargement des données :", err);
                setOffres([]);
                setServices([]);
                setCatalogError("Impossible de charger les offres et services pour le moment.");
            } finally {
                setCatalogLoading(false);
            }
        };
        fetchData();
    }, []);

    // Transformer les services pour l'affichage
    const getDisplayServices = () => {
        if (!services.length) return [];
        return services.map(service => ({
            id: service.id,
            icon: getServiceIcon(service.nomService || service.nom || service.name),
            name: service.nomService || service.nom || service.name || "Service",
            desc: service.description || getDefaultDescription(service.nomService || service.nom || service.name)
        }));
    };

    // Transformer une offre en format compatible avec l'affichage
    const formatOfferForDisplay = (offer) => {
        const plan = getPlanName(offer.planTarifaireId);
        const offerServices = (offer.serviceIds || offer.services?.map((service) => service.id) || [])
            .map(id => getServiceDetails(id))
            .filter(s => s !== null)
            .map(s => s.name);

        let badge = null;
        if (offer.typeOffre === "BUNDLE") {
            badge = { label: "Bundle", color: "purple" };
        } else if (offer.typeOffre === "MOBILE" && offer.id === 9) {
            badge = { label: "Populaire", color: "blue" };
        } else if (offer.typeOffre === "INTERNET" && offer.id === 11) {
            badge = { label: "Recommandé", color: "blue" };
        }

        const featured = offer.typeOffre === "BUNDLE" || offer.id === 11;

        return {
            id: offer.id,
            name: offer.nomOffre,
            type: offer.typeOffre,
            price: plan.price,
            originalPrice: plan.price,
            badge: badge,
            featured: featured,
            features: [
                ...offerServices.slice(0, 3),
                offer.typeOffre === "BUNDLE" ? "Économies jusqu'à 30%" : null,
                offer.planTarifaireId ? "Support inclus" : null
            ].filter(Boolean),
            rawOffer: offer
        };
    };

    // Filtrer et organiser les offres pour l'affichage
    const getDisplayOffers = () => {
        if (!offres.length) return [];
        const priorityOrder = ["BUNDLE", "INTERNET", "MOBILE", "TV", "FIXE"];
        const sorted = [...offres].sort((a, b) => {
            const indexA = priorityOrder.indexOf(a.typeOffre);
            const indexB = priorityOrder.indexOf(b.typeOffre);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        return sorted.slice(0, 3).map(formatOfferForDisplay);
    };

    const displayOffers = getDisplayOffers();
    const displayServices = getDisplayServices();

    // Fonction pour poser une question à l'IA
    const askAI = useCallback(async (customQuestion) => {
        const currentQuestion = (customQuestion ?? question).trim();
        if (!currentQuestion || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: currentQuestion,
                    history: history,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Le serveur a retourné une erreur.");
            }

            const aiAnswer = data?.answer || "Désolé, je n'ai pas pu obtenir une réponse.";

            setAnswer(aiAnswer);
            answerRef.current = aiAnswer;
            setHistory((prev) => [
                ...prev,
                { role: "user", content: currentQuestion },
                { role: "assistant", content: aiAnswer },
            ]);
            setQuestion("");
            setCurrentAnswer(aiAnswer);
            setInputValue("");
        } catch (err) {
            setError(err.message || "Une erreur s'est produite. Veuillez réessayer.");
            setAnswer("");
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [question, history]);

    function handleSuggestionClick(text) {
        setConfirmQuestion(text);
    }

    function confirmAndAskAI() {
        if (confirmQuestion) {
            setQuestion(confirmQuestion);
            setTimeout(() => askAI(confirmQuestion), 0);
            setConfirmQuestion(null);
        }
    }

    function cancelAskAI() {
        setConfirmQuestion(null);
    }

    // Gestionnaire de soumission du formulaire de contact
    const handleContactSubmit = (e) => {
        e.preventDefault();
        // Simulation d'envoi (à remplacer par votre API)
        setContactStatus("Sending...");
        setTimeout(() => {
            setContactStatus("Message envoyé avec succès !");
            setContactForm({ name: "", email: "", subject: "", message: "" });
            setTimeout(() => setContactStatus(null), 3000);
        }, 1500);
    };

    const handleInputChange = (e) => {
        setContactForm({
            ...contactForm,
            [e.target.name]: e.target.value
        });
    };

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
    };

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Inter', 'Segoe UI', sans-serif; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeUp 0.3s ease; }
                .pricing-card:hover, .advantage-card:hover, .service-card:hover { transform: translateY(-4px); transition: transform 0.2s ease; }
                .btn-hover:hover { opacity: 0.88; transition: opacity 0.2s ease; }
                .form-input:focus, .form-textarea:focus { outline: none; border-color: #2563eb; }
            `}</style>

            <div style={S.page}>
                {/* Navigation */}
                <nav style={S.nav}>
                    <div className="nb-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                        <img src="/images/logo.jpg" alt="Logo" width={100} />
                    </div>
                    <div style={S.navLinks}>
                        <a onClick={() => scrollToSection("offres")} style={S.navLink}>Offres</a>
                        <a onClick={() => scrollToSection("services")} style={S.navLink}>Services</a>
                        <a onClick={() => scrollToSection("avantages")} style={S.navLink}>Avantages</a>
                    </div>
                    <button style={S.navBtn} onClick={() => navigate(role ? "/dashboard" : "/login")} className="btn-hover">
                        Espace Client
                    </button>
                </nav>

                {/* Hero Section */}
                <section style={S.hero}>
                    <h1 style={S.heroTitle}>Connectez-vous au futur</h1>
                    <p style={S.heroSub}>
                        Connectez-vous au futur avec notre réseau ultra-rapide. Profitez de nos offres sur mesure pour rester toujours connecté, partout.
                    </p>
                    <div style={S.heroActions}>
                        <button style={S.btnPrimary} className="btn-hover" onClick={() => scrollToSection("offres")}>
                            Découvrir les offres
                        </button>
                        {/* <button style={S.btnOutline} className="btn-hover" onClick={() => scrollToSection("contact")}>
                            Contacter un conseiller
                        </button> */}
                    </div>
                </section>

                {/* Offers Section */}
                <section style={S.section} id="offres">
                    <h2 style={S.sectionTitle}>Nos Offres</h2>
                    <p style={S.sectionSub}>Choisissez l'offre qui correspond à vos besoins</p>
                    {catalogLoading ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <p>Chargement des offres...</p>
                        </div>
                    ) : catalogError ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#b91c1c" }}>
                            <p>{catalogError}</p>
                        </div>
                    ) : displayOffers.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <p>Aucune offre disponible pour le moment.</p>
                        </div>
                    ) : (
                        <div style={S.pricingGrid}>
                            {displayOffers.map((plan) => (
                                <div key={plan.id} style={S.pricingCard(plan.featured)} className="pricing-card">
                                    {plan.badge && (
                                        <div style={S.badge(plan.badge.color)}>{plan.badge.label}</div>
                                    )}
                                    <div style={S.planName}>{plan.name}</div>
                                    <div style={S.planPrice}>
                                        <span style={S.planPriceNum}>{plan.price}</span>
                                        <span style={S.planPriceUnit}>TND/mois</span>
                                    </div>
                                    <ul style={S.featureList}>
                                        {plan.features.map((f, idx) => (
                                            <li key={idx} style={S.featureItem}>
                                                <span style={S.checkIcon}>✓</span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* AI Assistant Section */}
                <section style={S.aiSection}>
                    <h2 style={{ ...S.sectionTitle, marginBottom: 8 }}>Un conseiller IA disponible 24/7</h2>
                    <p style={{ ...S.sectionSub, marginBottom: 28 }}>
                        Posez vos questions sur nos offres et obtenez une réponse instantanée
                    </p>

                    <div style={S.aiBox}>
                        <input
                            style={S.aiInput}
                            placeholder="Quelle offre me recommandez-vous ?"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && askAI(inputValue)}
                        />
                        <button
                            style={{
                                ...S.aiBtn,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                            className="btn-hover"
                            onClick={() => askAI()}
                            disabled={loading}
                        >
                            {loading ? <Spinner /> : "Demander ?"}
                        </button>
                    </div>

                    {error && (
                        <div style={{ ...S.aiResult, color: "#b91c1c", border: "1.5px solid #fecaca" }} className="fade-in">
                            <div style={{ ...S.aiTag, color: "#b91c1c" }}>ERREUR</div>
                            {error}
                        </div>
                    )}

                    {(answer || loading) && (
                        <div style={S.aiResult} className="fade-in">
                            <div style={S.aiTag}>
                                CONSEILLER IA
                                {loading && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(En cours...)</span>}
                            </div>
                            {answer ? <MarkdownAnswer answer={answer} /> : loading && <Spinner />}
                        </div>
                    )}

                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {[
                            "Quelle est la meilleure offre ?",
                            "Y a-t-il la TV incluse ?",
                            "Y a-t-il la WiFi incluse ?",
                            "Couverture 5G dans ma région ?",
                        ].map((s) => (
                            <button
                                key={s}
                                onClick={() => handleSuggestionClick(s)}
                                style={{
                                    background: "#fff",
                                    border: "1.5px solid #bfdbfe",
                                    color: "#2563eb",
                                    fontSize: 12.5,
                                    padding: "5px 13px",
                                    borderRadius: 100,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                                className="btn-hover"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Services Section */}
                <section style={S.servicesBg} id="services">
                    <h2 style={S.sectionTitle}>Nos Services</h2>
                    <p style={{ ...S.sectionSub, marginBottom: 40 }}>
                        Découvrez tous nos services disponibles
                    </p>
                    {catalogLoading ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <p>Chargement des services...</p>
                        </div>
                    ) : catalogError ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#b91c1c" }}>
                            <p>{catalogError}</p>
                        </div>
                    ) : displayServices.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <p>Aucun service disponible pour le moment.</p>
                        </div>
                    ) : (
                        <div style={S.servicesGrid}>
                            {displayServices.map((service) => (
                                <div
                                    key={service.id}
                                    style={S.serviceCard}
                                    className="service-card"
                                    onClick={() => handleSuggestionClick(`Parlez-moi du service ${service.name}`)}
                                >
                                    <div style={S.serviceIcon}>{service.icon}</div>
                                    <div style={S.serviceName}>{service.name}</div>
                                    <div style={S.serviceDesc}>{service.desc}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Advantages Section - NOUVELLE SECTION */}
                <section style={S.advantagesBg} id="avantages">
                    <h2 style={S.sectionTitle}>Pourquoi nous choisir ?</h2>
                    <p style={S.sectionSub}>Des avantages qui font la différence</p>
                    <div style={S.advantagesGrid}>
                        {ADVANTAGES.map((adv, index) => (
                            <div key={index} style={S.advantageCard} className="advantage-card">
                                <div style={S.advantageIcon}>{adv.icon}</div>
                                <div style={S.advantageTitle}>{adv.title}</div>
                                <div style={S.advantageDesc}>{adv.description}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Section - NOUVELLE SECTION */}
                {/* <section style={S.contactBg} id="contact">
                    <h2 style={S.sectionTitle}>Contactez-nous</h2>
                    <p style={S.sectionSub}>Une question ? Un conseiller vous répond dans les plus brefs délais</p>

                    <div style={S.contactContainer}>

                        <div style={S.contactInfo}>
                            <h3 style={S.contactTitle}>Nos coordonnées</h3>
                            <div style={S.contactDetail}>
                                <div style={S.contactIcon}>📍</div>
                                <div style={S.contactText}>
                                    <strong>Adresse</strong><br />
                                    123 Avenue de la République, 75000 Paris
                                </div>
                            </div>
                            <div style={S.contactDetail}>
                                <div style={S.contactIcon}>📞</div>
                                <div style={S.contactText}>
                                    <strong>Téléphone</strong><br />
                                    +33 (0)1 23 45 67 89
                                </div>
                            </div>
                            <div style={S.contactDetail}>
                                <div style={S.contactIcon}>✉️</div>
                                <div style={S.contactText}>
                                    <strong>Email</strong><br />
                                    contact@billcom.com
                                </div>
                            </div>
                            <div style={S.contactDetail}>
                                <div style={S.contactIcon}>⏰</div>
                                <div style={S.contactText}>
                                    <strong>Horaires</strong><br />
                                    Lundi - Vendredi: 9h - 19h<br />
                                    Samedi: 10h - 17h
                                </div>
                            </div>
                        </div>


                        <div style={S.contactForm}>
                            <h3 style={S.contactTitle}>Envoyez-nous un message</h3>
                            <form onSubmit={handleContactSubmit}>
                                <div style={S.formGroup}>
                                    <label style={S.formLabel}>Nom complet *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={contactForm.name}
                                        onChange={handleInputChange}
                                        style={S.formInput}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.formLabel}>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={contactForm.email}
                                        onChange={handleInputChange}
                                        style={S.formInput}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.formLabel}>Sujet *</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={contactForm.subject}
                                        onChange={handleInputChange}
                                        style={S.formInput}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.formLabel}>Message *</label>
                                    <textarea
                                        name="message"
                                        value={contactForm.message}
                                        onChange={handleInputChange}
                                        style={S.formTextarea}
                                        className="form-textarea"
                                        required
                                    />
                                </div>
                                <button type="submit" style={S.submitBtn} className="btn-hover">
                                    {contactStatus === "Sending..." ? "Envoi en cours..." : "Envoyer le message"}
                                </button>
                                {contactStatus && contactStatus !== "Sending..." && (
                                    <div style={{
                                        marginTop: 12,
                                        padding: 8,
                                        borderRadius: 6,
                                        background: contactStatus.includes("succès") ? "#dcfce7" : "#fee2e2",
                                        color: contactStatus.includes("succès") ? "#166534" : "#991b1b",
                                        fontSize: 13,
                                        textAlign: "center"
                                    }}>
                                        {contactStatus}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </section> */}

                {/* Footer */}
                <LoginFooter />

                {/* Modal de confirmation */}
                {confirmQuestion && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }} onClick={cancelAskAI}>
                        <div style={{
                            background: "#fff",
                            borderRadius: 16,
                            padding: "24px",
                            maxWidth: 400,
                            width: "90%",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                            animation: "fadeUp 0.2s ease",
                        }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>
                                Confirmation
                            </h3>
                            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20 }}>
                                Voulez-vous vraiment demander à l'assistant IA :
                            </p>
                            <p style={{
                                fontSize: 15,
                                fontWeight: 500,
                                color: "#2563eb",
                                background: "#eff6ff",
                                padding: "10px 12px",
                                borderRadius: 8,
                                marginBottom: 24,
                                borderLeft: "3px solid #2563eb"
                            }}>
                                "{confirmQuestion}"
                            </p>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button
                                    onClick={cancelAskAI}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        border: "1.5px solid #e5e7eb",
                                        background: "#fff",
                                        color: "#374151",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                    className="btn-hover"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmAndAskAI}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: "#2563eb",
                                        color: "#fff",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                    className="btn-hover"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
