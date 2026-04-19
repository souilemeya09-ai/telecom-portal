import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getStatsVente,
    getStatsMetier,
    getStatsExploit,
    getStatsDsi,
} from "../../api/api";
import "./Dashboard.css";

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, to, navigate }) {
    return (
        <div
            className={`dash-card dash-card-${color} ${to ? "dash-card-clickable" : ""}`}
            onClick={() => to && navigate(to)}
        >
            <div className="dash-card-icon">{icon}</div>
            <div className="dash-card-body">
                <span className="dash-card-value">{value ?? "—"}</span>
                <span className="dash-card-label">{label}</span>
                {sub && <span className="dash-card-sub">{sub}</span>}
            </div>
        </div>
    );
}

// ── Bar chart simple ─────────────────────────────────────────
function BarChart({ data, keyLabel, keyValue, colors }) {
    const max = Math.max(...data.map((d) => d[keyValue]), 1);
    return (
        <div className="dash-bar-chart">
            {data.map((d, i) => (
                <div key={i} className="dash-bar-row">
                    <span className="dash-bar-label">{d[keyLabel]}</span>
                    <div className="dash-bar-track">
                        <div
                            className="dash-bar-fill"
                            style={{
                                width: `${Math.max((d[keyValue] / max) * 100, 2)}%`,
                                background: colors?.[i] || "var(--accent)",
                            }}
                        />
                    </div>
                    <span className="dash-bar-count">{d[keyValue]}</span>
                </div>
            ))}
        </div>
    );
}

// ── Donut chart ──────────────────────────────────────────────
function DonutChart({ data, keyLabel, keyValue, colors }) {
    const total = data.reduce((s, d) => s + Number(d[keyValue]), 0);
    if (total === 0) return <p className="dash-empty">Aucune donnée</p>;

    let offset = 0;
    const slices = data.map((d, i) => {
        const pct = (Number(d[keyValue]) / total) * 100;
        const slice = { ...d, pct, offset, color: colors?.[i] || "#888" };
        offset += pct;
        return slice;
    });

    const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r;

    return (
        <div className="dash-donut-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120">
                {slices.map((s, i) => (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="18"
                        strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
                        strokeDashoffset={-((s.offset / 100) * circ)}
                        transform="rotate(-90 60 60)"
                    />
                ))}
                <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="500"
                    fill="var(--color-text-primary)">{total}</text>
                <text x="60" y="70" textAnchor="middle" fontSize="9"
                    fill="var(--color-text-secondary)">total</text>
            </svg>
            <div className="dash-donut-legend">
                {slices.map((s, i) => (
                    <div key={i} className="dash-legend-row">
                        <span className="dash-legend-dot" style={{ background: s.color }} />
                        <span className="dash-legend-label">{s[keyLabel]}</span>
                        <span className="dash-legend-val">{s[keyValue]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// VENTE DASHBOARD
// ════════════════════════════════════════════════════════════════
function DashboardVente() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getStatsVente()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!stats) return <div className="empty-state"><p>Erreur de chargement</p></div>;

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <h1 className="dash-title">Tableau de bord — Vente</h1>
                <p className="dash-sub">Vue d'ensemble de votre activité commerciale</p>
            </div>

            <div className="dash-grid-4">
                <StatCard label="Clients" value={stats.totalClients} color="blue" icon="👤" to="/customers" navigate={navigate} />
                <StatCard label="Contrats" value={stats.totalContrats} color="teal" icon="📄" to="/contrats" navigate={navigate} />
                <StatCard label="Contrats actifs" value={stats.contratsActifs} color="green" icon="✅" />
                <StatCard label="Souscriptions" value={stats.totalSouscriptions} color="amber" icon="🎁" to="/souscriptions" navigate={navigate} />
            </div>

            <div className="dash-row-2">
                <div className="dash-panel">
                    <h3 className="dash-panel-title">Répartition des contrats</h3>
                    {stats.repartitionContrats && (
                        <DonutChart
                            data={stats.repartitionContrats}
                            keyLabel="statut"
                            keyValue="count"
                            colors={["#16a34a", "#dc2626", "#d97706"]}
                        />
                    )}
                </div>

                <div className="dash-panel">
                    <h3 className="dash-panel-title">Détail contrats</h3>
                    <div className="dash-detail-list">
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Actifs</span>
                            <span className="dash-detail-val green">{stats.contratsActifs}</span>
                        </div>
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Résiliés</span>
                            <span className="dash-detail-val red">{stats.contratsResilies}</span>
                        </div>
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Suspendus</span>
                            <span className="dash-detail-val amber">{stats.contratsSuspendus}</span>
                        </div>
                        <div className="dash-detail-row dash-detail-total">
                            <span className="dash-detail-label">Total</span>
                            <span className="dash-detail-val">{stats.totalContrats}</span>
                        </div>
                    </div>
                    <div className="dash-quick-actions">
                        <button className="btn-primary" onClick={() => navigate("/customers")}>+ Nouveau client</button>
                        <button className="btn-secondary" onClick={() => navigate("/contrats")}>+ Nouveau contrat</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// METIER DASHBOARD
// ════════════════════════════════════════════════════════════════
function DashboardMetier() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getStatsMetier()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!stats) return <div className="empty-state"><p>Erreur de chargement</p></div>;

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <h1 className="dash-title">Tableau de bord — Métier</h1>
                <p className="dash-sub">Catalogue produits et gestion des promotions</p>
            </div>

            <div className="dash-grid-4">
                <StatCard label="Offres" value={stats.totalOffres} color="blue" icon="📦" to="/offres" navigate={navigate} />
                <StatCard label="Services" value={stats.totalServices} color="teal" icon="⚙️" to="/services" navigate={navigate} />
                <StatCard label="Plans" value={stats.totalPlans} color="amber" icon="💰" to="/plans" navigate={navigate} />
                <StatCard label="Promotions" value={stats.totalPromotions} color="purple" icon="🏷️" to="/promotions" navigate={navigate} />
            </div>

            <div className="dash-row-2">
                <div className="dash-panel">
                    <h3 className="dash-panel-title">Pipeline des promotions</h3>
                    {stats.repartitionPromotions && (
                        <BarChart
                            data={stats.repartitionPromotions}
                            keyLabel="statut"
                            keyValue="count"
                            colors={["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#6b7280"]}
                        />
                    )}
                </div>

                <div className="dash-panel">
                    <h3 className="dash-panel-title">État des promotions</h3>
                    <div className="dash-detail-list">
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">En attente</span>
                            <span className="dash-detail-val amber">{stats.promoEnAttente}</span>
                        </div>
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Validées</span>
                            <span className="dash-detail-val blue">{stats.promoValidee}</span>
                        </div>
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Actives</span>
                            <span className="dash-detail-val green">{stats.promoActive}</span>
                        </div>
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Rejetées</span>
                            <span className="dash-detail-val red">{stats.promoRejetee}</span>
                        </div>
                        <div className="dash-detail-row">
                            <span className="dash-detail-label">Suspendues</span>
                            <span className="dash-detail-val gray">{stats.promoSuspendue}</span>
                        </div>
                    </div>
                    <div className="dash-quick-actions">
                        <button className="btn-primary" onClick={() => navigate("/promotions")}>+ Nouvelle promotion</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// EXPLOIT DASHBOARD
// ════════════════════════════════════════════════════════════════
function DashboardExploit() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getStatsExploit()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!stats) return <div className="empty-state"><p>Erreur de chargement</p></div>;

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <h1 className="dash-title">Tableau de bord — Exploit</h1>
                <p className="dash-sub">Supervision et validation des promotions</p>
            </div>

            <div className="dash-grid-4">
                <StatCard label="En attente" value={stats.promoEnAttente} color="amber" icon="⏳" to="/exploit/promotions/attente" navigate={navigate} />
                <StatCard label="Validées" value={stats.promoValidee} color="blue" icon="✅" to="/exploit/valider" navigate={navigate} />
                <StatCard label="Actives" value={stats.promoActive} color="green" icon="▶️" to="/exploit/activer" navigate={navigate} />
                <StatCard label="Souscriptions" value={stats.totalSouscriptions} color="teal" icon="📋" to="/exploit/souscriptions" navigate={navigate} />
            </div>

            <div className="dash-row-2">
                <div className="dash-panel">
                    <h3 className="dash-panel-title">Pipeline promotions</h3>
                    {stats.pipelinePromotions && (
                        <BarChart
                            data={stats.pipelinePromotions}
                            keyLabel="etape"
                            keyValue="count"
                            colors={stats.pipelinePromotions.map((p) => p.couleur)}
                        />
                    )}
                </div>

                <div className="dash-panel">
                    <h3 className="dash-panel-title">Actions rapides</h3>
                    <div className="dash-action-grid">
                        <button className="dash-action-btn amber" onClick={() => navigate("/exploit/promotions/attente")}>
                            <span>⏳</span>
                            <span>Promotions en attente</span>
                            <span className="dash-action-count">{stats.promoEnAttente}</span>
                        </button>
                        <button className="dash-action-btn blue" onClick={() => navigate("/exploit/valider")}>
                            <span>✅</span>
                            <span>Valider</span>
                        </button>
                        <button className="dash-action-btn red" onClick={() => navigate("/exploit/rejeter")}>
                            <span>❌</span>
                            <span>Rejeter</span>
                        </button>
                        <button className="dash-action-btn green" onClick={() => navigate("/exploit/activer")}>
                            <span>▶️</span>
                            <span>Activer</span>
                            <span className="dash-action-count">{stats.promoValidee}</span>
                        </button>
                        <button className="dash-action-btn gray" onClick={() => navigate("/exploit/suspendre")}>
                            <span>⏸️</span>
                            <span>Suspendre</span>
                        </button>
                        <button className="dash-action-btn teal" onClick={() => navigate("/exploit/historique")}>
                            <span>📊</span>
                            <span>Historique</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="dash-panel dash-panel-full">
                <h3 className="dash-panel-title">Vue d'ensemble</h3>
                <div className="dash-pipeline-steps">
                    {stats.pipelinePromotions?.map((p, i) => (
                        <div key={i} className="dash-pipeline-step">
                            <div className="dash-pipeline-dot" style={{ background: p.couleur }} />
                            <span className="dash-pipeline-label">{p.etape}</span>
                            <span className="dash-pipeline-count" style={{ color: p.couleur }}>{p.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// DSI DASHBOARD
// ════════════════════════════════════════════════════════════════
function DashboardDsi() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getStatsDsi()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!stats) return <div className="empty-state"><p>Erreur de chargement</p></div>;

    const roleColors = {
        VENTE: "#3b82f6",
        METIER: "#10b981",
        EXPLOIT: "#f59e0b",
        DSI: "#8b5cf6",
    };

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <h1 className="dash-title">Tableau de bord — DSI</h1>
                <p className="dash-sub">Vue système globale de la plateforme</p>
            </div>

            <div className="dash-grid-4">
                <StatCard label="Utilisateurs" value={stats.totalUsers} color="blue" icon="👥" to="/users" navigate={navigate} />
                <StatCard label="Actifs" value={stats.usersActifs} color="green" icon="✅"
                    sub={`${stats.usersInactifs} inactifs`} />
                <StatCard label="En attente 1ère connexion" value={stats.enAttenteConnexion} color="amber" icon="⏳" />
                <StatCard label="Clients" value={stats.totalClients} color="teal" icon="👤" />
            </div>

            <div className="dash-grid-2-bottom">
                <StatCard label="Contrats" value={stats.totalContrats} color="purple" icon="📄" />
                <StatCard label="Promotions" value={stats.totalPromotions} icon="🏷️" color="coral" />
            </div>

            <div className="dash-row-2">
                <div className="dash-panel">
                    <h3 className="dash-panel-title">Répartition par rôle</h3>
                    {stats.repartitionRoles?.length > 0 ? (
                        <>
                            <DonutChart
                                data={stats.repartitionRoles}
                                keyLabel="role"
                                keyValue="count"
                                colors={stats.repartitionRoles.map((r) => roleColors[r.role] || "#888")}
                            />
                        </>
                    ) : (
                        <p className="dash-empty">Aucune donnée</p>
                    )}
                </div>

                <div className="dash-panel">
                    <h3 className="dash-panel-title">État des utilisateurs</h3>
                    <BarChart
                        data={[
                            { label: "Actifs", count: stats.usersActifs },
                            { label: "Inactifs", count: stats.usersInactifs },
                            { label: "1ère conn.", count: stats.enAttenteConnexion },
                        ]}
                        keyLabel="label"
                        keyValue="count"
                        colors={["#10b981", "#ef4444", "#f59e0b"]}
                    />
                    <div className="dash-quick-actions" style={{ marginTop: "1rem" }}>
                        <button className="btn-primary" onClick={() => navigate("/users")}>Gérer utilisateurs</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// ROUTER — choisit le bon dashboard selon le rôle
// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
    const role = localStorage.getItem("role");

    switch (role) {
        case "VENTE": return <DashboardVente />;
        case "METIER": return <DashboardMetier />;
        case "EXPLOIT": return <DashboardExploit />;
        case "DSI": return <DashboardDsi />;
        default:
            return (
                <div className="dash-wrapper">
                    <div className="empty-state"><p>Rôle non reconnu : {role}</p></div>
                </div>
            );
    }
}