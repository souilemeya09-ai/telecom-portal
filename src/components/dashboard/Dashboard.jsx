import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
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
    if (!data || !data.length) return <p className="dash-empty">Aucune donnée</p>;

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

// ── Offres : services associés ────────────────────────────────
function ServicesByOfferChart({ data, colors, activeOffer, onSelect }) {
    if (!data || !data.length) return <p className="dash-empty">Aucune donnée</p>;

    const sortedData = [...data].sort((a, b) => Number(b.nbServices) - Number(a.nbServices));
    const max = Math.max(...sortedData.map((d) => Number(d.nbServices)), 1);

    return (
        <div className="dash-offer-service-chart">
            {sortedData.map((offer, i) => {
                const label = offer.offre || "Sans nom";
                const count = Number(offer.nbServices) || 0;
                const isActive = activeOffer === label;
                const isDimmed = activeOffer && !isActive;

                return (
                    <button
                        key={`${label}-${i}`}
                        className={`dash-offer-service-row ${isActive ? "active" : ""}`}
                        style={{ opacity: isDimmed ? 0.45 : 1 }}
                        onClick={() => onSelect(isActive ? null : label)}
                    >
                        <span className="dash-offer-service-label">{label}</span>
                        <span className="dash-offer-service-track">
                            <span
                                className="dash-offer-service-fill"
                                style={{
                                    width: `${Math.max((count / max) * 100, count > 0 ? 5 : 0)}%`,
                                    background: colors?.[i % colors.length] || "var(--accent)",
                                }}
                            />
                        </span>
                        <span className="dash-offer-service-count">{count}</span>
                    </button>
                );
            })}
        </div>
    );
}

function OfferCatalogWidget({ data, activeOffer, onSelect }) {
    if (!data || !data.length) return <p className="dash-empty">Aucune donnée</p>;

    const selectedOffer = data.find((offer) => offer.offre === activeOffer) || data[0];
    const services = selectedOffer.services || [];

    return (
        <div className="dash-catalog-widget">

            <div className="dash-catalog-detail">
                <div className="dash-catalog-detail-head">
                    <div>
                        <span className="dash-catalog-kicker">Offre sélectionnée</span>
                        <h4 className="dash-catalog-title">{selectedOffer.offre || "Sans nom"}</h4>
                    </div>
                    <span className="dash-badge dash-badge-blue">{selectedOffer.typeOffre || "N/A"}</span>
                </div>

                <div className="dash-catalog-meta-grid">
                    <div>
                        <span className="dash-catalog-meta-label">Plan tarifaire</span>
                        <span className="dash-catalog-meta-value">{selectedOffer.planTarifaire || "Sans plan"}</span>
                    </div>
                    <div>
                        <span className="dash-catalog-meta-label">Services liés</span>
                        <span className="dash-catalog-meta-value">{selectedOffer.nbServices ?? services.length}</span>
                    </div>
                </div>

                <div className="dash-catalog-services">
                    {services.length === 0 ? (
                        <p className="dash-empty">Aucun service associé</p>
                    ) : (
                        services.map((service, i) => (
                            <span key={service.id ?? `${service.nom}-${i}`} className="dash-tag">
                                {service.nom || "Service sans nom"}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Donut chart cliquable ────────────────────────────────────
function DonutChart({ data, keyLabel, keyValue, colors, onFilter, activeFilter }) {
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
    const activeSlice = activeFilter
        ? slices.find(s => s[keyLabel] === activeFilter)
        : null;

    return (
        <div className="dash-donut-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: "visible" }}>
                {slices.map((s, i) => {
                    const isActive = activeFilter === s[keyLabel];
                    const isDimmed = activeFilter && !isActive;
                    const rr = isActive ? 43 : 40;
                    const circ2 = 2 * Math.PI * rr;
                    return (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={rr}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={isActive ? 20 : 18}
                            strokeOpacity={isDimmed ? 0.25 : 1}
                            strokeDasharray={`${(s.pct / 100) * circ2} ${circ2}`}
                            strokeDashoffset={-((s.offset / 100) * circ2)}
                            transform="rotate(-90 60 60)"
                            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                            onClick={() => onFilter && onFilter(isActive ? null : s[keyLabel])}
                        />
                    );
                })}
                {activeSlice ? (
                    <>
                        <text x="60" y="53" textAnchor="middle" fontSize="15" fontWeight="500"
                            fill={activeSlice.color}>{activeSlice[keyValue]}</text>
                        <text x="60" y="66" textAnchor="middle" fontSize="8"
                            fill="var(--color-text-secondary)"
                            style={{ maxWidth: 50 }}>{activeSlice[keyLabel]}</text>
                    </>
                ) : (
                    <>
                        <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="500"
                            fill="var(--color-text-primary)">{total}</text>
                        <text x="60" y="70" textAnchor="middle" fontSize="9"
                            fill="var(--color-text-secondary)">total</text>
                    </>
                )}
            </svg>
            <div className="dash-donut-legend">
                {slices.map((s, i) => {
                    const isActive = activeFilter === s[keyLabel];
                    const isDimmed = activeFilter && !isActive;
                    return (
                        <div
                            key={i}
                            className="dash-legend-row"
                            style={{
                                cursor: "pointer",
                                opacity: isDimmed ? 0.35 : 1,
                                transition: "opacity 0.2s",
                                fontWeight: isActive ? 500 : 400,
                            }}
                            onClick={() => onFilter && onFilter(isActive ? null : s[keyLabel])}
                        >
                            <span className="dash-legend-dot" style={{
                                background: s.color,
                                transform: isActive ? "scale(1.3)" : "scale(1)",
                                transition: "transform 0.2s",
                            }} />
                            <span className="dash-legend-label">{s[keyLabel]}</span>
                            <span className="dash-legend-val">{s[keyValue]}</span>
                        </div>
                    );
                })}
                {activeFilter && (
                    <button
                        className="dash-filter-reset"
                        onClick={() => onFilter(null)}
                    >
                        ✕ Réinitialiser
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Line chart interactif ────────────────────────────────────
function LineChart({ data, keyX, keyY, activeFilter, onFilter }) {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);

    if (!data || !data.length) return <p className="dash-empty">Aucune donnée</p>;

    const vals = data.map(d => Number(d[keyY]));
    const maxV = Math.max(...vals, 1);
    const W = 600, H = 80, padX = 12, padY = 8;

    const points = data.map((d, i) => ({
        x: padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2),
        y: H - padY - (Number(d[keyY]) / maxV) * (H - padY * 2),
        label: String(d[keyX]).slice(5),
        fullLabel: String(d[keyX]),
        value: Number(d[keyY]),
        raw: d,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `M ${points[0].x} ${H} ${points.map(p => `L ${p.x} ${p.y}`).join(" ")} L ${points[points.length - 1].x} ${H} Z`;

    const handleMouseMove = useCallback((e) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scaleX = W / rect.width;
        const mx = (e.clientX - rect.left) * scaleX;
        let closest = points[0], minDist = Infinity;
        points.forEach(p => {
            const d = Math.abs(p.x - mx);
            if (d < minDist) { minDist = d; closest = p; }
        });
        setTooltip({ x: closest.x, y: closest.y, label: closest.fullLabel, value: closest.value });
    }, [points]);

    return (
        <div style={{ position: "relative" }}>
            {activeFilter && (
                <div className="dash-line-filter-badge">
                    <span style={{ color: "#185FA5", fontWeight: 500 }}>{activeFilter}</span>
                    <button className="dash-filter-reset" onClick={() => onFilter && onFilter(null)}>✕</button>
                </div>
            )}
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H + 18}`}
                style={{ width: "100%", height: 110, overflow: "visible", cursor: "crosshair" }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
            >
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#185FA5" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#185FA5" stopOpacity="0.01" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#lineGrad)" />
                <path d={linePath} fill="none" stroke="#185FA5" strokeWidth="2" />

                {points.map((p, i) => {
                    const isActive = activeFilter === p.fullLabel;
                    const isDimmed = activeFilter && !isActive;
                    const isHovered = tooltip && tooltip.label === p.fullLabel;
                    return (
                        <g key={i}
                            style={{ cursor: "pointer" }}
                            onClick={() => onFilter && onFilter(isActive ? null : p.fullLabel)}
                        >
                            <circle
                                cx={p.x} cy={p.y}
                                r={isActive || isHovered ? 6 : 3}
                                fill={isActive ? "#185FA5" : "#fff"}
                                stroke="#185FA5"
                                strokeWidth={isActive ? 0 : 2}
                                opacity={isDimmed ? 0.25 : 1}
                                style={{ transition: "all 0.15s ease" }}
                            />
                            <text
                                x={p.x} y={H + 14}
                                textAnchor="middle" fontSize="8"
                                fill={isActive ? "#185FA5" : "var(--color-text-secondary)"}
                                fontWeight={isActive ? 500 : 400}
                                opacity={isDimmed ? 0.3 : 1}
                            >{p.label}</text>
                            {/* zone de hit invisible plus large */}
                            <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                        </g>
                    );
                })}

                {/* Ligne verticale tooltip */}
                {tooltip && (
                    <line
                        x1={tooltip.x} y1={padY}
                        x2={tooltip.x} y2={H}
                        stroke="#185FA5" strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.4"
                    />
                )}
            </svg>

            {/* Tooltip flottant */}
            {tooltip && (
                <div
                    className="dash-line-tooltip"
                    style={{
                        left: `${(tooltip.x / W) * 100}%`,
                        top: `${(tooltip.y / (H + 18)) * 100}%`,
                    }}
                >
                    <span className="dash-tooltip-date">{tooltip.label}</span>
                    <span className="dash-tooltip-val">{tooltip.value}</span>
                </div>
            )}
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
                <StatCard label="Clients" value={stats.totalClients} color="blue" icon="👤" navigate={navigate} />
                <StatCard label="Contrats" value={stats.totalContrats} color="teal" icon="📄" navigate={navigate} />
                <StatCard label="Contrats actifs" value={stats.contratsActifs} color="green" icon="✅" />
                <StatCard label="Souscriptions" value={stats.totalSouscriptions} color="amber" icon="🎁" navigate={navigate} />
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

const AssignationsPanel = forwardRef(({ data }, ref) => {
    const [openIds, setOpenIds] = useState(new Set());

    const toggle = (id) => setOpenIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const collapseAll = () => {
        setOpenIds(new Set());
    };

    const expandAll = () => {
        const allIds = new Set(data.map(promo => promo.promotionId));
        setOpenIds(allIds);
    };

    // Exposer les méthodes au parent via ref
    useImperativeHandle(ref, () => ({
        collapseAll,
        expandAll,
        isAllOpen: () => openIds.size === data.length,  // ← ajouté

    }));

    // Fonction pour tout déplier/replier
    const toggleAll = () => {
        if (openIds.size === data.length) {
            collapseAll();
        } else {
            expandAll();
        }
    };

    const totalAssignments = data.reduce((s, d) => s + d.assignmentCount, 0);
    const totalGroups = [...new Set(data.flatMap(d => d.assignedGroups.map(g => g.id)))].length;
    const promosWithGroups = data.filter(d => d.assignedGroupCount > 0).length;

    const isAllOpen = openIds.size === data.length;
    const isAllClosed = openIds.size === 0;

    return (
        <>
            {/* Bouton Toggle unique */}
            <div className="dash-assign-actions">
                <button
                    className="dash-assign-action-btn"
                    onClick={toggleAll}
                >
                    {isAllOpen ? (
                        <>
                            <span>📁</span>
                            Tout replier
                            <span className="dash-action-count">{openIds.size}</span>
                        </>
                    ) : (
                        <>
                            <span>📂</span>
                            Tout déplier
                            {!isAllClosed && <span className="dash-action-count">{data.length - openIds.size}</span>}
                        </>
                    )}
                </button>
            </div>
            <div className="dash-grid-4" style={{ marginBottom: 16 }}>
                <div className="dash-pbi-card dash-pbi-blue">
                    <span className="dash-pbi-value">{data.length}</span>
                    <span className="dash-pbi-label">Promotions</span>
                </div>
                <div className="dash-pbi-card dash-pbi-teal">
                    <span className="dash-pbi-value">{totalAssignments}</span>
                    <span className="dash-pbi-label">Assignations totales</span>
                </div>
                <div className="dash-pbi-card dash-pbi-amber">
                    <span className="dash-pbi-value">{totalGroups}</span>
                    <span className="dash-pbi-label">Groupes distincts</span>
                </div>
                <div className="dash-pbi-card dash-pbi-purple">
                    <span className="dash-pbi-value">{promosWithGroups}</span>
                    <span className="dash-pbi-label">Promos avec groupes</span>
                </div>
            </div>

            <div className="dash-assign-list">
                {data.map((promo) => {
                    const isOpen = openIds.has(promo.promotionId);
                    return (
                        <div key={promo.promotionId} className="dash-assign-row">
                            <div
                                className="dash-assign-header"
                                onClick={() => toggle(promo.promotionId)}
                            >
                                <span className={`dash-assign-chevron ${isOpen ? "open" : ""}`}>▶</span>
                                <span className="dash-assign-name">{promo.promotion}</span>
                                <span className="dash-badge dash-badge-blue">
                                    {promo.assignmentCount} assign.
                                </span>
                                <span className="dash-badge dash-badge-teal">
                                    {promo.assignedGroupCount} groupe{promo.assignedGroupCount !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {isOpen && (
                                <div className="dash-assign-groups">
                                    {promo.assignedGroups.length === 0 ? (
                                        <p className="dash-empty">Aucun groupe assigné</p>
                                    ) : (
                                        promo.assignedGroups.map((g) => (
                                            <div key={g.id} className="dash-group-item">
                                                <span className="dash-group-name">{g.name}</span>
                                                <div className="dash-group-tags">
                                                    {g.groupCode && <span className="dash-tag">{g.groupCode}</span>}
                                                    {g.groupType && <span className="dash-tag">{g.groupType}</span>}
                                                    {g.status && (
                                                        <span className={`dash-tag dash-tag-status ${g.status === "ACTIVE" ? "green" : "gray"}`}>
                                                            {g.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
});

// ════════════════════════════════════════════════════════════════
// DSI DASHBOARD
// ════════════════════════════════════════════════════════════════
function DashboardDsi() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [panelCollapsed, setPanelCollapsed] = useState(true);
    const [selectedOffer, setSelectedOffer] = useState(null);

    // filtres actifs par donut + courbe
    const [filterContrat, setFilterContrat] = useState(null);
    const [filterReclam, setFilterReclam] = useState(null);
    const [filterPromo, setFilterPromo] = useState(null);
    const [filterPeriode, setFilterPeriode] = useState(null);

    const assignationsPanelRef = useRef();

    useEffect(() => {
        getStatsDsi()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);



    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!stats) return <div className="empty-state"><p>Erreur de chargement</p></div>;

    const COLORS_CONTRATS = ["#185FA5", "#0F6E56", "#854F0B", "#534AB7"];
    const COLORS_RECLAM = ["#185FA5", "#854F0B", "#1D9E75", "#A32D2D"];
    const COLORS_PROMOS = ["#EF9F27", "#378ADD", "#1D9E75", "#E24B4A", "#888780"];
    const COLORS_OFFRES = ["#185FA5", "#0F6E56", "#854F0B", "#534AB7", "#A32D2D", "#1D9E75"];
    const servicesParOffre = stats.servicesParOffre || [];
    const activeOffer = selectedOffer && servicesParOffre.some((offer) => offer.offre === selectedOffer)
        ? selectedOffer
        : null;

    // données bar chart filtrées selon les filtres actifs
    const filteredBarData = (() => {
        let d = stats.promotionsParNombre || [];
        if (filterPromo) {
            // filtre par statut : on garde uniquement les promos dont le statut correspond
            // ici promotionsParNombre est une liste de promos individuelles, on filtre par nom si filterPeriode
        }
        if (filterPeriode) {
            // on cherche les promos actives sur cette période dans promotionsParPeriode
            const periodeEntry = (stats.promotionsParPeriode || []).find(p => p.periode === filterPeriode);
            // on affiche juste l'info de la période sélectionnée
            if (periodeEntry) {
                return [{ promotion: filterPeriode, count: periodeEntry.count }];
            }
        }
        return d;
    })();

    const filteredLineData = (() => {
        const d = stats.promotionsParPeriode || [];
        return d;
    })();

    const hasAnyFilter = filterContrat || filterReclam || filterPromo || filterPeriode;

    return (
        <div className="dash-wrapper">
            <div className="dash-header">
                <h1 className="dash-title">Tableau de bord — RESPONSABLE</h1>
                <p className="dash-sub">Vue système globale de la plateforme</p>
                {hasAnyFilter && (
                    <button
                        className="dash-clear-all-filters"
                        onClick={() => {
                            setFilterContrat(null);
                            setFilterReclam(null);
                            setFilterPromo(null);
                            setFilterPeriode(null);
                        }}
                    >
                        ✕ Effacer tous les filtres
                    </button>
                )}
            </div>

            {/* ── KPIs Power BI style ── */}
            <div className="dash-panel dash-pbi-grid">
                <div className="dash-pbi-card dash-pbi-blue">
                    <span className="dash-pbi-value">{stats.totalClients ?? "—"}</span>
                    <span className="dash-pbi-label">Clients</span>
                </div>
                <div className="dash-pbi-card dash-pbi-teal">
                    <span className="dash-pbi-value">{stats.totalContrats ?? "—"}</span>
                    <span className="dash-pbi-label">Contrats</span>
                </div>
                <div className="dash-pbi-card dash-pbi-amber">
                    <span className="dash-pbi-value">{stats.totalReclamations ?? "—"}</span>
                    <span className="dash-pbi-label">Réclamations</span>
                </div>
                <div className="dash-pbi-card dash-pbi-purple">
                    <span className="dash-pbi-value">{stats.totalPromotions ?? "—"}</span>
                    <span className="dash-pbi-label">Promotions</span>
                </div>
            </div>

            {/* ── Assignations par promotion ── */}
            <div className="dash-panel dash-panel-full">
                <div className="dash-panel-header-with-button">
                    <h3 className="dash-panel-title">Assignations par promotion</h3>
                    <button
                        className="dash-collapse-all-btn"
                        onClick={() => setPanelCollapsed(prev => !prev)}
                    >
                        <span className={`dash-assign-chevron ${panelCollapsed ? "" : "open"}`}>▶</span>
                    </button>
                </div>

                {!panelCollapsed && (
                    <AssignationsPanel
                        ref={assignationsPanelRef}
                        data={stats.assignmentsParPromotion || []}
                    />
                )}
            </div>


            {/* ── Donuts row ── */}
            <div className="dash-row-3">
                <div className={`dash-panel ${filterContrat ? "dash-panel-filtered" : ""}`}>
                    <h3 className="dash-panel-title">
                        Contracts
                        {filterContrat && <span className="dash-panel-filter-badge">{filterContrat}</span>}
                    </h3>
                    <DonutChart
                        data={stats.repartitionContrats || []}
                        keyLabel="contractType"
                        keyValue="count"
                        colors={COLORS_CONTRATS}
                        activeFilter={filterContrat}
                        onFilter={setFilterContrat}
                    />
                </div>

                <div className={`dash-panel ${filterReclam ? "dash-panel-filtered" : ""}`}>
                    <h3 className="dash-panel-title">
                        Réclamations par statut
                        {filterReclam && <span className="dash-panel-filter-badge">{filterReclam}</span>}
                    </h3>
                    <DonutChart
                        data={stats.repartitionReclamations || []}
                        keyLabel="statut"
                        keyValue="count"
                        colors={COLORS_RECLAM}
                        activeFilter={filterReclam}
                        onFilter={setFilterReclam}
                    />
                </div>

                <div className={`dash-panel ${filterPromo ? "dash-panel-filtered" : ""}`}>
                    <h3 className="dash-panel-title">
                        Répartition des promotions
                        {filterPromo && <span className="dash-panel-filter-badge">{filterPromo}</span>}
                    </h3>
                    <DonutChart
                        data={stats.repartitionPromotions || []}
                        keyLabel="statut"
                        keyValue="count"
                        colors={COLORS_PROMOS}
                        activeFilter={filterPromo}
                        onFilter={setFilterPromo}
                    />
                </div>
            </div>

            {/* ── Catalogue : offres, services et plans ── */}
            <div className="dash-row-3">
                <div className="dash-panel">
                    <h3 className="dash-panel-title">Répartition par type d'offre</h3>
                    <DonutChart
                        data={stats.repartitionTypeOffre || []}
                        keyLabel="type"
                        keyValue="count"
                        colors={COLORS_OFFRES}
                    />
                </div>

                <div className="dash-panel">
                    <h3 className="dash-panel-title">Offres par plan tarifaire</h3>
                    <BarChart
                        data={stats.offresParPlan || []}
                        keyLabel="plan"
                        keyValue="count"
                        colors={["#0F6E56", "#185FA5", "#854F0B", "#534AB7", "#A32D2D"]}
                    />
                </div>

                <div className={`dash-panel ${activeOffer ? "dash-panel-filtered" : ""}`}>
                    <h3 className="dash-panel-title">
                        Services par offre
                        {activeOffer && <span className="dash-panel-filter-badge">{activeOffer}</span>}
                    </h3>
                    <ServicesByOfferChart
                        data={servicesParOffre}
                        colors={COLORS_OFFRES}
                        activeOffer={activeOffer}
                        onSelect={setSelectedOffer}
                    />
                </div>
            </div>

            <div className="dash-panel dash-panel-full">
                <h3 className="dash-panel-title">Catalogue interactif</h3>
                <OfferCatalogWidget
                    data={servicesParOffre}
                    activeOffer={activeOffer}
                    onSelect={setSelectedOffer}
                />
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// ROUTER
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
