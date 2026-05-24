import { use, useState } from "react";
import { useNavigate } from "react-router-dom";

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
        padding: "80px 24px 100px", textAlign: "center", position: "relative", overflow: "hidden",
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
    },
    serviceIcon: {
        width: 52, height: 52, borderRadius: "50%",
        background: "#eff6ff", display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 14px", fontSize: 22, color: "#2563eb",
    },
    serviceName: { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 5 },
    serviceDesc: { fontSize: 13, color: "#6b7280" },

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
    footerLogo: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16 },
    footerWifi: { color: "#60a5fa", fontSize: 20 },
    footerCopy: { fontSize: 13, color: "#94a3b8" },
};

// ─── Data ──────────────────────────────────────────────────────────────────
const PLANS = [
    {
        name: "Fibre 50 Mbps", price: "19.99", badge: null,
        features: ["WiFi ultra rapide", "Installation gratuite", "Support 24/7"],
    },
    {
        name: "Fibre 300 Mbps", price: "29.99", badge: { label: "Populaire", color: "blue" },
        features: ["Débit symétrique", "WiFi 6 inclus", "Appels illimités fixes", "Installation VIP"],
        featured: true,
    },
    {
        name: "Fibre 1 Gbps", price: "49.99", badge: { label: "Nouveau", color: "purple" },
        features: ["Débit maximum", "2 Répéteurs WiFi", "TV 4K incluse", "Support prioritaire"],
    },
];

const SERVICES = [
    { icon: "📶", name: "Internet Fibre", desc: "Connexion stable et ultra-rapide" },
    { icon: "📞", name: "Appels illimités", desc: "Vers les fixes et mobiles" },
    { icon: "📺", name: "TV intelligente", desc: "+200 chaînes en qualité 4K" },
    { icon: "🎧", name: "Support technique", desc: "Assistance disponible 24/7" },
    { icon: "📡", name: "Couverture 5G", desc: "Le meilleur réseau mobile" },
    { icon: "💼", name: "Solutions entreprise", desc: "Des offres pour les pros" },
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

// ─── App ───────────────────────────────────────────────────────────────────
export default function TelecomConnect() {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    async function askAI() {
        if (!question.trim() || loading) return;
        setLoading(true);
        setAnswer("");
        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    system:
                        "Tu es un conseiller commercial pour Telecom Connect, un opérateur fibre en France. " +
                        "Réponds de façon concise, aimable et professionnelle en français. " +
                        "Les offres disponibles sont : Fibre 50 Mbps à 19,99€/mois, Fibre 300 Mbps à 29,99€/mois (la plus populaire), Fibre 1 Gbps à 49,99€/mois.",
                    messages: [{ role: "user", content: question }],
                }),
            });
            const data = await res.json();
            const text = data.content?.find((b) => b.type === "text")?.text || "Désolé, je n'ai pas pu obtenir une réponse.";
            setAnswer(text);
        } catch {
            setAnswer("Une erreur s'est produite. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    }

    const navigate = useNavigate();
    const role = localStorage.getItem("role");

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeUp 0.3s ease; }
        .pricing-card:hover { transform: translateY(-4px); }
        .btn-hover:hover { opacity: 0.88; }
      `}</style>

            <div style={S.page}>
                {/* ── NAV ── */}
                <nav style={S.nav}>
                    <div className="nb-logo" onClick={() => navigate("/")}>
                       <img src="/images/logo.jpg" alt="Logo" width={100} />
                    </div>
                    <div style={S.navLinks}>
                        {["Offres", "Services", "Avantages", "Contact"].map((l) => (
                            <a key={l} style={S.navLink}>{l}</a>
                        ))}
                    </div>
                    {role && (
                        <button style={S.navBtn} onClick={() => navigate("/dashboard")} className="btn-hover">Espace Client</button>
                    )}
                </nav>

                {/* ── HERO ── */}
                <section style={S.hero}>
                    <div style={S.heroBadge}>
                        <span style={S.heroBadgeDot} />
                        Nouveau : La 5G est maintenant disponible
                    </div>
                    <h1 style={S.heroTitle}>Connectez‑vous au futur</h1>
                    <p style={S.heroSub}>
                        Connectez-vous au futur avec notre réseau ultra-rapide. Profitez de nos offres sur mesure pour rester toujours connecté, partout.
                    </p>
                    <div style={S.heroActions}>
                        <button style={S.btnPrimary} className="btn-hover">Découvrir les offres</button>
                        <button style={S.btnOutline} className="btn-hover">Contacter un conseiller</button>
                    </div>
                </section>

                {/* ── PRICING ── */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>Nos Offres Fibre</h2>
                    <p style={S.sectionSub}>Choisissez le forfait qui correspond à vos besoins</p>
                    <div style={S.pricingGrid}>
                        {PLANS.map((plan) => (
                            <div key={plan.name} style={S.pricingCard(plan.featured)} className="pricing-card">
                                {plan.badge && (
                                    <div style={S.badge(plan.badge.color)}>{plan.badge.label}</div>
                                )}
                                <div style={S.planName}>{plan.name}</div>
                                <div style={S.planPrice}>
                                    <span style={S.planPriceNum}>{plan.price}</span>
                                    <span style={S.planPriceUnit}>€/mois</span>
                                </div>
                                <ul style={S.featureList}>
                                    {plan.features.map((f) => (
                                        <li key={f} style={S.featureItem}>
                                            <span style={S.checkIcon}>✓</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button style={S.planBtn(plan.featured)} className="btn-hover">
                                    Choisir cette offre
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── AI ASSISTANT ── */}
                <section style={S.aiSection}>
                    <h2 style={{ ...S.sectionTitle, marginBottom: 8 }}>Un conseiller IA disponible 24/7</h2>
                    <p style={{ ...S.sectionSub, marginBottom: 28 }}>
                        Posez vos questions sur nos offres et obtenez une réponse instantanée
                    </p>
                    <div style={S.aiBox}>
                        <input
                            style={S.aiInput}
                            placeholder="Quelle offre me recommandez-vous ?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && askAI()}
                        />
                        <button style={S.aiBtn} className="btn-hover" onClick={askAI} disabled={loading}>
                            {loading ? <Spinner /> : "Demander →"}
                        </button>
                    </div>

                    {answer && (
                        <div style={S.aiResult} className="fade-in">
                            <div style={S.aiTag}>CONSEILLER IA</div>
                            {answer}
                        </div>
                    )}

                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {[
                            "Quelle est la meilleure offre ?",
                            "Y a-t-il la TV incluse ?",
                            "Comment s'inscrire ?",
                            "Couverture 5G dans ma région ?",
                        ].map((s) => (
                            <button
                                key={s}
                                onClick={() => setQuestion(s)}
                                style={{
                                    background: "#fff", border: "1.5px solid #bfdbfe",
                                    color: "#2563eb", fontSize: 12.5, padding: "5px 13px",
                                    borderRadius: 100, cursor: "pointer", fontFamily: "inherit",
                                }}
                                className="btn-hover"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── SERVICES ── */}
                <section style={S.servicesBg}>
                    <h2 style={S.sectionTitle}>Nos Services</h2>
                    <p style={{ ...S.sectionSub, marginBottom: 40 }}>&nbsp;</p>
                    <div style={S.servicesGrid}>
                        {SERVICES.map((sv) => (
                            <div key={sv.name} style={S.serviceCard} className="pricing-card">
                                <div style={S.serviceIcon}>{sv.icon}</div>
                                <div style={S.serviceName}>{sv.name}</div>
                                <div style={S.serviceDesc}>{sv.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer style={S.footer}>
                    <div style={S.footerCopy}>© {new Date().getFullYear()} BILLCOM. Tous droits réservés.</div>
                </footer>
            </div>
        </>
    );
}