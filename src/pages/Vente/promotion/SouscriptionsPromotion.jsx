import { useEffect, useState, useMemo } from "react";
import {
  getContrats,
  getPromotions,
  souscrirePromotion,
  getSouscriptionsByContrat,
  getCustomerGroups,
  assignerPromotion,
} from "../../../api/api";
import "./souscriptions.css";

// ─── Constants ───────────────────────────────────────────────
const STATUT_INFO = {
  ACTIVE:  { label: "Active",  cls: "badge-actif" },
  EXPIRÉE: { label: "Expirée", cls: "badge-resilie" },
  ANNULÉE: { label: "Annulée", cls: "badge-default" },
};

const PROMO_STATUT_INFO = {
  EN_ATTENTE: { label: "En attente", cls: "badge-attente" },
  VALIDEE:    { label: "Validée",    cls: "badge-validee" },
  REJETEE:    { label: "Rejetée",    cls: "badge-rejetee" },
  ACTIVE:     { label: "Active",     cls: "badge-active" },
  SUSPENDUE:  { label: "Suspendue",  cls: "badge-suspendue" },
};

const TYPE_LABELS  = { ENTERPRISE: "Entreprise", FAMILY: "Famille", SME: "PME", OTHER: "Autre" };
const TYPE_COLORS  = { ENTERPRISE: "type-enterprise", FAMILY: "type-family", SME: "type-sme", OTHER: "type-other" };

const formatValeur = (p) =>
  p?.typeReduction === "POURCENTAGE" ? `${p.valeurReduction}%` : `${p?.valeurReduction} TND`;

// ─── Étape 1 : Sélectionner un contrat ──────────────────────
// function StepContrat({ contrats, selected, onSelect, loading }) {
//   const [search, setSearch] = useState("");

//   const filtered = useMemo(() => {
//     const t = search.toLowerCase();
//     return contrats.filter(
//       (c) =>
//         `${c.client?.nom} ${c.client?.prenom}`.toLowerCase().includes(t) ||
//         (c.directoryNumber ?? "").toString().includes(t) ||
//         c.offre?.nom?.toLowerCase().includes(t)
//     );
//   }, [contrats, search]);

//   return (
//     <div className="step-content">
//       <div className="step-search">
//         <input
//           type="text"
//           className="form-control"
//           placeholder="Rechercher client, offre, numéro..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {loading ? (
//         <div className="loading-state">Chargement des contrats...</div>
//       ) : (
//         <div className="contrat-grid">
//           {filtered.map((c) => (
//             <div
//               key={c.id}
//               className={`contrat-card ${selected?.id === c.id ? "contrat-card-selected" : ""}`}
//               onClick={() => onSelect(c)}
//             >
//               <div className="contrat-card-header">
//                 <div className="avatar">{c.client?.nom?.[0]?.toUpperCase() ?? "?"}</div>
//                 <div>
//                   <div className="client-name">{c.client?.nom} {c.client?.prenom}</div>
//                   <div className="client-email">{c.client?.email}</div>
//                 </div>
//                 {selected?.id === c.id && <span className="check-icon">✓</span>}
//               </div>
//               <div className="contrat-card-body">
//                 <div className="contrat-info-row">
//                   <span className="detail-label">Offre</span>
//                   <span className="detail-value">{c.offre?.nom ?? "—"}</span>
//                 </div>
//                 <div className="contrat-info-row">
//                   <span className="detail-label">Numéro</span>
//                   <span className="detail-value mono">{c.directoryNumber || "—"}</span>
//                 </div>
//                 <div className="contrat-info-row">
//                   <span className="detail-label">Depuis</span>
//                   <span className="detail-value">{c.dateDebut}</span>
//                 </div>
//               </div>
//               <div className="contrat-card-footer">
//                 <span className={`badge ${c.statut === "ACTIF" ? "badge-actif" : "badge-resilie"}`}>
//                   {c.statut}
//                 </span>
//               </div>
//             </div>
//           ))}
//           {filtered.length === 0 && (
//             <div className="empty-state"><p>Aucun contrat trouvé.</p></div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// ─── Étape 2 : Sélectionner une promotion ───────────────────
function StepPromotion({ promotions, selected, onSelect, contrat }) {
  const [search, setSearch] = useState("");

  const moisAnciennete = useMemo(() => {
    if (!contrat?.dateDebut) return 0;
    const debut = new Date(contrat.dateDebut);
    const now = new Date();
    return (now.getFullYear() - debut.getFullYear()) * 12 + (now.getMonth() - debut.getMonth());
  }, [contrat]);

  const today = new Date().toISOString().split("T")[0];

  const checkEligibility = (promo) => {
    const reasons = [];
    if (promo.statut !== "ACTIVE")            reasons.push("La promotion n'est pas active");
    if (promo.dateDebut && today < promo.dateDebut) reasons.push("La promotion n'a pas encore commencé");
    if (promo.dateFin   && today > promo.dateFin)   reasons.push("La promotion est expirée");
    if (promo.ancienneteMinimale && moisAnciennete < promo.ancienneteMinimale)
      reasons.push(`Ancienneté insuffisante (${moisAnciennete} / ${promo.ancienneteMinimale} mois requis)`);
    return reasons;
  };

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return promotions.filter(
      (p) =>
        p.nomPromotion?.toLowerCase().includes(t) ||
        p.typeReduction?.toLowerCase().includes(t)
    );
  }, [promotions, search]);

  return (
    <div className="step-content">
      <div className="selected-contrat-banner">
        <div className="avatar sm">{contrat?.client?.nom?.[0]?.toUpperCase()}</div>
        <div>
          <span className="client-name">{contrat?.client?.nom} {contrat?.client?.prenom}</span>
          <span className="client-email"> · {contrat?.offre?.nom} · Ancienneté : {moisAnciennete} mois</span>
        </div>
      </div>

      <div className="step-search">
        <input
          type="text"
          className="form-control"
          placeholder="Rechercher une promotion..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="promo-grid">
        {filtered.map((p) => {
          const reasons   = checkEligibility(p);
          const eligible  = reasons.length === 0;
          const isSelected = selected?.id === p.id;
          const si = PROMO_STATUT_INFO[p.statut] ?? { label: p.statut, cls: "badge-default" };

          return (
            <div
              key={p.id}
              className={`promo-card ${isSelected ? "promo-card-selected" : ""} ${!eligible ? "promo-card-disabled" : ""}`}
              onClick={() => eligible && onSelect(isSelected ? null : p)}
            >
              <div className="promo-card-header">
                <div>
                  <div className="client-name">{p.nomPromotion}</div>
                  <span className={`badge ${si.cls}`} style={{ marginTop: 4 }}>{si.label}</span>
                </div>
                <div className="promo-valeur-badge">{formatValeur(p)}</div>
                {isSelected && <span className="check-icon">✓</span>}
              </div>

              <div className="promo-card-body">
                <div className="contrat-info-row">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">
                    {p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                  </span>
                </div>
                {p.ancienneteMinimale && (
                  <div className="contrat-info-row">
                    <span className="detail-label">Ancienneté min.</span>
                    <span className={`detail-value ${moisAnciennete < p.ancienneteMinimale ? "text-danger" : "text-success"}`}>
                      {p.ancienneteMinimale} mois
                    </span>
                  </div>
                )}
                {p.dateDebut && (
                  <div className="contrat-info-row">
                    <span className="detail-label">Période</span>
                    <span className="detail-value">{p.dateDebut} → {p.dateFin || "∞"}</span>
                  </div>
                )}
                {p.regleEligibilite && (
                  <div className="contrat-info-row">
                    <span className="detail-label">Règle</span>
                    <span className="detail-value" style={{ fontSize: "0.78rem" }}>{p.regleEligibilite}</span>
                  </div>
                )}
              </div>

              {!eligible && (
                <div className="ineligible-reasons">
                  {reasons.map((r, i) => (
                    <div key={i} className="ineligible-reason">⚠ {r}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state"><p>Aucune promotion trouvée.</p></div>
        )}
      </div>
    </div>
  );
}

// ─── Étape 3 : Confirmation ──────────────────────────────────
function StepConfirmation({ contrat, promotion }) {
  return (
    <div className="step-content">
      <div className="confirmation-grid">
        <div className="detail-section">
          <p className="detail-section-title">Contrat client</p>
          <div className="client-cell" style={{ marginBottom: 10 }}>
            <div className="avatar">{contrat?.client?.nom?.[0]?.toUpperCase()}</div>
            <div>
              <div className="client-name">{contrat?.client?.nom} {contrat?.client?.prenom}</div>
              <div className="client-email">{contrat?.client?.email}</div>
            </div>
          </div>
          <div className="detail-row">
            <span className="detail-label">Offre</span>
            <span className="detail-value">{contrat?.offre?.nom}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Numéro</span>
            <span className="detail-value mono">{contrat?.directoryNumber}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date début</span>
            <span className="detail-value">{contrat?.dateDebut}</span>
          </div>
        </div>

        <div className="detail-section">
          <p className="detail-section-title">Promotion appliquée</p>
          <div className="detail-row">
            <span className="detail-label">Nom</span>
            <span className="detail-value">{promotion?.nomPromotion}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Réduction</span>
            <span className="detail-value promo-valeur-inline">{formatValeur(promotion)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Type</span>
            <span className="detail-value">
              {promotion?.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
            </span>
          </div>
          {promotion?.ancienneteMinimale && (
            <div className="detail-row">
              <span className="detail-label">Ancienneté requise</span>
              <span className="detail-value">{promotion.ancienneteMinimale} mois</span>
            </div>
          )}
        </div>
      </div>

      <div className="confirmation-recap">
        <div className="recap-icon">🎉</div>
        <div className="recap-text">
          <strong>{contrat?.client?.nom} {contrat?.client?.prenom}</strong> va bénéficier
          de <strong>{formatValeur(promotion)}</strong> de réduction
          via la promotion <strong>{promotion?.nomPromotion}</strong>.
        </div>
      </div>
    </div>
  );
}

// ─── Onglet : Assignation Groupes ────────────────────────────
function TabGroupes({ promotions, loading }) {
  const [groups, setGroups]             = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [searchPromo, setSearchPromo]   = useState("");
  const [searchGroup, setSearchGroup]   = useState("");
  const [inheritToMembers, setInheritToMembers] = useState(true);
  const [startDate, setStartDate]       = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [results, setResults]           = useState([]); // {groupId, groupName, success, message}

  const idVendeur = localStorage.getItem("userId");
  useEffect(() => {
    getCustomerGroups()
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, []);

  const activePromotions = useMemo(
    () => promotions.filter((p) => p.statut === "ACTIVE"),
    [promotions]
  );

  const filteredPromos = useMemo(() => {
    const t = searchPromo.toLowerCase();
    return activePromotions.filter(
      (p) =>
        p.nomPromotion?.toLowerCase().includes(t) ||
        p.typeReduction?.toLowerCase().includes(t)
    );
  }, [activePromotions, searchPromo]);

  const filteredGroups = useMemo(() => {
    const t = searchGroup.toLowerCase();
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(t) ||
        g.groupCode?.toLowerCase().includes(t) ||
        TYPE_LABELS[g.groupType]?.toLowerCase().includes(t)
    );
  }, [groups, searchGroup]);

  const toggleGroup = (id) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (!selectedPromo || selectedGroups.size === 0) return;
    setSubmitting(true);
    setResults([]);
    const res = [];
    for (const groupId of selectedGroups) {
      const grp = groups.find((g) => g.id === groupId);
      try {
        await assignerPromotion(selectedPromo.id, {
          assignedById: idVendeur, // TODO: remplacer par l'ID de l'utilisateur connecté
          targetType: "CUSTOMER_GROUP",
          targetGroupId: groupId,
          effectiveStartDate: startDate,
          effectiveEndDate: endDate || null,
          inheritedToMembers: inheritToMembers,
          assignmentMode: "MANUAL",
        });
        res.push({ groupId, groupName: grp?.name, success: true });
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          err.message ||
          "Erreur inconnue";
        res.push({ groupId, groupName: grp?.name, success: false, message: msg });
      }
    }
    setResults(res);
    setSubmitting(false);
    if (res.every((r) => r.success)) {
      setSelectedGroups(new Set());
      setSelectedPromo(null);
    }
  };

  const resetAll = () => {
    setResults([]);
    setSelectedPromo(null);
    setSelectedGroups(new Set());
  };

  // ── Résultat post-assignation ──
  if (results.length > 0) {
    const allOk = results.every((r) => r.success);
    return (
      <div className={`result-card ${allOk ? "result-success" : "result-error"}`}>
        <div className="result-icon">{allOk ? "✅" : "⚠️"}</div>
        <div className="result-content">
          <h3>{allOk ? "Assignation réussie !" : "Résultats partiels"}</h3>
          <ul style={{ marginTop: 8, paddingLeft: 16, fontSize: "0.875rem" }}>
            {results.map((r) => (
              <li key={r.groupId} style={{ marginBottom: 4 }}>
                {r.success ? "✓" : "✗"} <strong>{r.groupName}</strong>
                {!r.success && <span style={{ color: "inherit", opacity: 0.8 }}> — {r.message}</span>}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn-primary" onClick={resetAll}>Nouvelle assignation</button>
      </div>
    );
  }

  return (
    <div className="groups-assign-layout">
      {/* ── Options d'assignation ── */}
      <div className="assign-options-bar">
        <div className="assign-option">
          <label className="form-label">Date début</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="assign-option">
          <label className="form-label">Date fin</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="assign-option assign-option-check">
          <label className="primary-check">
            <input
              type="checkbox"
              checked={inheritToMembers}
              onChange={(e) => setInheritToMembers(e.target.checked)}
            />
            <span>Héritage aux membres</span>
          </label>
        </div>
      </div>

      {/* ── Double liste ── */}
      <div className="groups-assign-grid">

        {/* Promotions */}
        <div className="assign-panel">
          <div className="assign-panel-header">
            <span className="assign-panel-title">Promotions actives</span>
            <span className="assign-panel-count">{activePromotions.length}</span>
          </div>
          <div className="assign-panel-search">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={searchPromo}
              onChange={(e) => setSearchPromo(e.target.value)}
            />
          </div>
          <div className="assign-panel-list">
            {loading ? (
              <div className="loading-state">Chargement...</div>
            ) : filteredPromos.length === 0 ? (
              <div className="empty-state"><p>Aucune promotion active.</p></div>
            ) : (
              filteredPromos.map((p) => {
                const isSelected = selectedPromo?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`assign-item ${isSelected ? "assign-item-selected" : ""}`}
                    onClick={() => setSelectedPromo(isSelected ? null : p)}
                  >
                    <div className="assign-item-main">
                      <div className="assign-item-name">{p.nomPromotion}</div>
                      <div className="assign-item-sub">
                        {p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                        {p.dateDebut && ` · ${p.dateDebut} → ${p.dateFin || "∞"}`}
                      </div>
                    </div>
                    <div className="assign-item-right">
                      <span className="assign-valeur">{formatValeur(p)}</span>
                      {isSelected && <span className="check-icon">✓</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Groupes */}
        <div className="assign-panel">
          <div className="assign-panel-header">
            <span className="assign-panel-title">Groupes clients</span>
            <span className="assign-panel-count">
              {selectedGroups.size > 0 ? `${selectedGroups.size} sél.` : groups.length}
            </span>
          </div>
          <div className="assign-panel-search">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={searchGroup}
              onChange={(e) => setSearchGroup(e.target.value)}
            />
          </div>

          {selectedPromo && (
            <div className="assign-promo-pill">
              Promotion : <strong>{selectedPromo.nomPromotion}</strong> · {formatValeur(selectedPromo)}
            </div>
          )}

          <div className="assign-panel-list">
            {loadingGroups ? (
              <div className="loading-state">Chargement des groupes...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="empty-state"><p>Aucun groupe trouvé.</p></div>
            ) : (
              filteredGroups.map((g) => {
                const isSelected = selectedGroups.has(g.id);
                const memberCount =
                  g.memberCount > 0
                    ? g.memberCount
                    : (g.members ?? []).filter((m) => m.status === "ACTIVE").length;
                return (
                  <div
                    key={g.id}
                    className={`assign-item ${isSelected ? "assign-item-selected" : ""} ${!selectedPromo ? "assign-item-disabled" : ""}`}
                    onClick={() => selectedPromo && toggleGroup(g.id)}
                    title={!selectedPromo ? "Sélectionnez d'abord une promotion" : undefined}
                  >
                    <div className="assign-item-avatar">
                      {g.name?.[0]?.toUpperCase() ?? "G"}
                    </div>
                    <div className="assign-item-main">
                      <div className="assign-item-name">{g.name}</div>
                      <div className="assign-item-sub">
                        {g.groupCode} · {memberCount} membre{memberCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="assign-item-right">
                      <span className={`badge ${TYPE_COLORS[g.groupType]}`}>
                        {TYPE_LABELS[g.groupType] ?? g.groupType}
                      </span>
                      {isSelected && <span className="check-icon">✓</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="assign-footer">
            <span className="assign-footer-hint">
              {!selectedPromo
                ? "← Sélectionnez une promotion"
                : selectedGroups.size === 0
                ? "Sélectionnez au moins un groupe"
                : `${selectedGroups.size} groupe${selectedGroups.size > 1 ? "s" : ""} · ${inheritToMembers ? "héritage activé" : "sans héritage"}`}
            </span>
            <button
              className="btn-primary"
              onClick={handleAssign}
              disabled={submitting || !selectedPromo || selectedGroups.size === 0}
            >
              {submitting ? "Assignation..." : "✅ Assigner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────
function SouscriptionsPromotion() {
  const [contrats, setContrats]         = useState([]);
  const [promotions, setPromotions]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("individuel"); // individuel | groupes | historique
  const [step, setStep]                 = useState(1);
  const [selectedContrat, setContrat]   = useState(null);
  const [selectedPromo, setPromo]       = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [result, setResult]             = useState(null);
  const [souscriptions, setSouscriptions] = useState([]);
  const [loadingHist, setLoadingHist]   = useState(false);
  const [histContrat, setHistContrat]   = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        getContrats({ page: 0, size: 1000 }),
        getPromotions({ page: 0, size: 1000 }),
      ]);
      setContrats((c.content || []).filter((ct) => ct.statut === "ACTIF"));
      setPromotions(p.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation wizard ────────────────────────────────────
  const goNext  = () => setStep((s) => Math.min(s + 1, 3));
  const goPrev  = () => setStep((s) => Math.max(s - 1, 1));
  const reset   = () => { setStep(1); setContrat(null); setPromo(null); setResult(null); };

  const switchTab = (tab) => {
    setActiveTab(tab);
    reset();
    setHistContrat(null);
    setSouscriptions([]);
  };

  // ── Souscription individuelle ────────────────────────────
  const handleSouscrire = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      await souscrirePromotion(selectedContrat.id, selectedPromo.id);
      setResult({ success: true });
    } catch (err) {
      let msg = "Erreur inconnue";
      if (err.response?.data) {
        msg = typeof err.response.data === "string"
          ? err.response.data
          : err.response.data.message ?? msg;
      } else if (err.message) {
        msg = err.message;
      }
      setResult({ success: false, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Historique ───────────────────────────────────────────
  const loadHistorique = async (contratId) => {
    setLoadingHist(true);
    try { setSouscriptions(await getSouscriptionsByContrat(contratId)); }
    catch (e) { console.error(e); }
    finally { setLoadingHist(false); }
  };

  const handleSelectContratHist = (c) => {
    setHistContrat(c);
    loadHistorique(c.id);
  };

  const STEPS = [
    { n: 1, label: "Contrat" },
    { n: 2, label: "Promotion" },
    { n: 3, label: "Validation" },
  ];

  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuration des promotions</h1>
          <p className="page-subtitle">Appliquer une promotion à un contrat ou à un groupe client</p>
        </div>
      </div>

      {/* ══════════════ ONGLET : GROUPES ══════════════ */}
        <TabGroupes promotions={promotions} loading={loading} />

    </div>
  );
}

export default SouscriptionsPromotion;