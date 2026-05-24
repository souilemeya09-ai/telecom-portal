// SouscriptionsPromotion.jsx (version améliorée)

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
import CustomerPromotionDateManager from "./CustomerPromotionDateManager";

// ─── Constants ───────────────────────────────────────────────
const STATUT_INFO = {
  ACTIVE: { label: "Active", cls: "badge-actif", icon: "✅" },
  EXPIRÉE: { label: "Expirée", cls: "badge-resilie", icon: "⏰" },
  ANNULÉE: { label: "Annulée", cls: "badge-default", icon: "❌" },
};

const PROMO_STATUT_INFO = {
  EN_ATTENTE: { label: "En attente", cls: "badge-attente", icon: "⏳" },
  VALIDEE: { label: "Validée", cls: "badge-validee", icon: "✓" },
  REJETEE: { label: "Rejetée", cls: "badge-rejetee", icon: "✗" },
  ACTIVE: { label: "Active", cls: "badge-active", icon: "🚀" },
  SUSPENDUE: { label: "Suspendue", cls: "badge-suspendue", icon: "⏸" },
};

const TYPE_LABELS = { ENTERPRISE: "Entreprise", FAMILY: "Famille", SME: "PME", OTHER: "Autre" };
const TYPE_COLORS = { ENTERPRISE: "type-enterprise", FAMILY: "type-family", SME: "type-sme", OTHER: "type-other" };
const TYPE_ICONS = { ENTERPRISE: "🏢", FAMILY: "👨‍👩‍👧", SME: "📊", OTHER: "📁" };

const formatValeur = (p) =>
  p?.typeReduction === "POURCENTAGE" ? `${p.valeurReduction}%` : `${p?.valeurReduction} TND`;

// ─── Composant de recherche amélioré ─────────────────────────
function SearchBar({ placeholder, value, onChange, icon = "🔍" }) {
  return (
    <div className="search-bar-enhanced">
      <span className="search-icon">{icon}</span>
      <input
        type="text"
        className="search-input-enhanced"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange("")}>
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Composant de carte de contrat amélioré ──────────────────
function ContratCard({ contrat, isSelected, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`contrat-card-enhanced ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(contrat)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-glow" />
      <div className="contrat-card-header-enhanced">
        <div className="client-avatar-enhanced">
          {contrat.client?.nom?.[0]?.toUpperCase() ?? "?"}
          <div className="avatar-status status-active" />
        </div>
        <div className="client-info-enhanced">
          <div className="client-name-enhanced">
            {contrat.client?.nom} {contrat.client?.prenom}
          </div>
          <div className="client-email-enhanced">{contrat.client?.email}</div>
        </div>
        {isSelected && (
          <div className="selection-badge">
            <span>✓</span>
          </div>
        )}
      </div>

      <div className="contrat-details-enhanced">
        <div className="detail-item">
          <span className="detail-icon">📱</span>
          <span className="detail-label">Offre</span>
          <span className="detail-value">{contrat.offre?.nom ?? "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">🔢</span>
          <span className="detail-label">N°</span>
          <span className="detail-value mono">{contrat.directoryNumber || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">📅</span>
          <span className="detail-label">Depuis</span>
          <span className="detail-value">{contrat.dateDebut}</span>
        </div>
      </div>

      <div className="contrat-footer-enhanced">
        <span className={`status-badge ${contrat.statut === "ACTIF" ? "active" : "inactive"}`}>
          <span className="status-dot" />
          {contrat.statut}
        </span>
        {isHovered && !isSelected && (
          <button className="select-hint-btn">Sélectionner →</button>
        )}
      </div>
    </div>
  );
}

// ─── Étape 1 : Sélectionner un contrat (améliorée) ──────────
function StepContrat({ contrats, selected, onSelect, loading }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid ou list

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return contrats.filter(
      (c) =>
        `${c.client?.nom} ${c.client?.prenom}`.toLowerCase().includes(t) ||
        (c.directoryNumber ?? "").toString().includes(t) ||
        c.offre?.nom?.toLowerCase().includes(t)
    );
  }, [contrats, search]);

  return (
    <div className="step-content-enhanced">
      <div className="step-header-enhanced">
        <div className="step-info">
          <span className="step-number">Étape 1</span>
          <h3>Sélectionner un contrat</h3>
          <p className="step-description">
            Choisissez le contrat client auquel appliquer la promotion
          </p>
        </div>
        <div className="step-actions">
          <SearchBar
            placeholder="Rechercher client, offre ou numéro..."
            value={search}
            onChange={setSearch}
          />
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-enhanced">
          <div className="spinner" />
          <p>Chargement des contrats...</p>
        </div>
      ) : (
        <>
          <div className={`contrats-container ${viewMode}`}>
            {filtered.map((c) => (
              <ContratCard
                key={c.id}
                contrat={c}
                isSelected={selected?.id === c.id}
                onSelect={onSelect}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state-enhanced">
              <div className="empty-icon">🔍</div>
              <h4>Aucun contrat trouvé</h4>
              <p>Essayez d'autres termes de recherche</p>
            </div>
          )}

          <div className="statistics-bar">
            <div className="stat-item">
              <span className="stat-value">{contrats.length}</span>
              <span className="stat-label">Contrats actifs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{filtered.length}</span>
              <span className="stat-label">Résultats</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Étape 2 : Sélectionner une promotion (améliorée) ────────
function StepPromotion({ promotions, selected, onSelect, contrat }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const moisAnciennete = useMemo(() => {
    if (!contrat?.dateDebut) return 0;
    const debut = new Date(contrat.dateDebut);
    const now = new Date();
    return (now.getFullYear() - debut.getFullYear()) * 12 + (now.getMonth() - debut.getMonth());
  }, [contrat]);

  const today = new Date().toISOString().split("T")[0];

  const checkEligibility = (promo) => {
    const reasons = [];
    if (promo.statut !== "ACTIVE") reasons.push("Promotion non active");
    if (promo.dateDebut && today < promo.dateDebut) reasons.push("Pas encore commencée");
    if (promo.dateFin && today > promo.dateFin) reasons.push("Expirée");
    if (promo.ancienneteMinimale && moisAnciennete < promo.ancienneteMinimale)
      reasons.push(`${moisAnciennete}/${promo.ancienneteMinimale} mois requis`);
    return reasons;
  };

  const categories = useMemo(() => {
    const cats = new Map();
    promotions.forEach(p => {
      const type = p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe";
      cats.set(type, (cats.get(type) || 0) + 1);
    });
    return Array.from(cats.entries()).map(([name, count]) => ({ name, count }));
  }, [promotions]);

  const filtered = useMemo(() => {
    let filtered = promotions;

    if (search) {
      const t = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.nomPromotion?.toLowerCase().includes(t) ||
        p.typeReduction?.toLowerCase().includes(t)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p =>
        (p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe") === selectedCategory
      );
    }

    return filtered;
  }, [promotions, search, selectedCategory]);

  return (
    <div className="step-content-enhanced">
      <div className="step-header-enhanced">
        <div className="step-info">
          <span className="step-number">Étape 2</span>
          <h3>Choisir une promotion</h3>
          <p className="step-description">
            Sélectionnez la promotion à appliquer au contrat
          </p>
        </div>
      </div>

      <div className="selected-contrat-card">
        <div className="selected-contrat-icon">📄</div>
        <div className="selected-contrat-info">
          <div className="selected-contrat-title">
            {contrat?.client?.nom} {contrat?.client?.prenom}
          </div>
          {/* <div className="selected-contrat-subtitle">
            {contrat?.offre?.nom} • Ancienneté: {moisAnciennete} mois
          </div> */}
        </div>
        <div className="anciennete-indicator">
          <div className="progress-ring">
            <svg width="40" height="40">
              <circle
                r="16"
                cx="20"
                cy="20"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />
              <circle
                r="16"
                cx="20"
                cy="20"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray={`${(moisAnciennete / 24) * 100} 100`}
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="progress-text">{moisAnciennete}m</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <SearchBar
          placeholder="Rechercher une promotion..."
          value={search}
          onChange={setSearch}
          icon="🎁"
        />
        <div className="category-filters">
          <button
            className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            Toutes ({promotions.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`category-btn ${selectedCategory === cat.name ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      <div className="promos-container">
        {filtered.map((p) => {
          const reasons = checkEligibility(p);
          const eligible = reasons.length === 0;
          const isSelected = selected?.id === p.id;
          const si = PROMO_STATUT_INFO[p.statut] ?? { label: p.statut, cls: "badge-default", icon: "📌" };

          return (
            <div
              key={p.id}
              className={`promo-card-enhanced ${isSelected ? "selected" : ""} ${!eligible ? "disabled" : ""}`}
              onClick={() => eligible && onSelect(isSelected ? null : p)}
            >
              <div className="promo-card-header-enhanced">
                <div className="promo-icon">
                  {p.typeReduction === "POURCENTAGE" ? "🎯" : "💰"}
                </div>
                <div className="promo-info-enhanced">
                  <div className="promo-name">{p.nomPromotion}</div>
                  <div className="promo-meta">
                    <span className={`badge-enhanced ${si.cls}`}>
                      {si.icon} {si.label}
                    </span>
                    <span className="promo-type">
                      {p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                    </span>
                  </div>
                </div>
                <div className="promo-value-enhanced">{formatValeur(p)}</div>
                {isSelected && <div className="selected-check">✓</div>}
              </div>

              <div className="promo-details-enhanced">
                {/* {p.ancienneteMinimale && (
                  <div className="detail-row-enhanced">
                    <span className="detail-label">📅 Ancienneté min.</span>
                    <span className={`detail-value ${moisAnciennete < p.ancienneteMinimale ? "warning" : "success"}`}>
                      {p.ancienneteMinimale} mois
                    </span>
                  </div>
                )} */}
                {p.dateDebut && (
                  <div className="detail-row-enhanced">
                    <span className="detail-label">📆 Période</span>
                    <span className="detail-value">
                      {p.dateDebut} → {p.dateFin || "∞"}
                    </span>
                  </div>
                )}
                {p.description && (
                  <div className="detail-row-enhanced">
                    <span className="detail-label">ℹ️ Description</span>
                    <span className="detail-value description">{p.description}</span>
                  </div>
                )}
              </div>

              {!eligible && (
                <div className="eligibility-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-reasons">
                    {reasons.map((r, i) => (
                      <span key={i} className="reason">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state-enhanced">
          <div className="empty-icon">🎁</div>
          <h4>Aucune promotion trouvée</h4>
          <p>Modifiez vos critères de recherche</p>
        </div>
      )}
    </div>
  );
}

// ─── Étape 3 : Confirmation (améliorée) ──────────────────────
function StepConfirmation({ contrat, promotion, onConfirm, onBack, submitting }) {
  return (
    <div className="step-content-enhanced">
      <div className="step-header-enhanced">
        <div className="step-info">
          <span className="step-number">Étape 3</span>
          <h3>Confirmation</h3>
          <p className="step-description">
            Vérifiez les informations avant validation
          </p>
        </div>
      </div>

      <div className="confirmation-layout">
        <div className="confirmation-card">
          <div className="card-header">
            <span className="card-icon">👤</span>
            <h4>Contrat client</h4>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Client</span>
              <span className="info-value">{contrat?.client?.nom} {contrat?.client?.prenom}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{contrat?.client?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Offre</span>
              <span className="info-value">{contrat?.offre?.nom}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Numéro</span>
              <span className="info-value mono">{contrat?.directoryNumber}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date début</span>
              <span className="info-value">{contrat?.dateDebut}</span>
            </div>
          </div>
        </div>

        <div className="confirmation-card promo-highlight">
          <div className="card-header">
            <span className="card-icon">🎁</span>
            <h4>Promotion sélectionnée</h4>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Nom</span>
              <span className="info-value">{promotion?.nomPromotion}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Réduction</span>
              <span className="info-value promo-value">{formatValeur(promotion)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Type</span>
              <span className="info-value">
                {promotion?.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
              </span>
            </div>
            {/* {promotion?.ancienneteMinimale && (
              <div className="info-row">
                <span className="info-label">Ancienneté requise</span>
                <span className="info-value">{promotion.ancienneteMinimale} mois</span>
              </div>
            )} */}
          </div>
        </div>
      </div>

      <div className="recap-banner">
        <div className="recap-icon">🎉</div>
        <div className="recap-message">
          <strong>{contrat?.client?.nom} {contrat?.client?.prenom}</strong> bénéficiera d'une réduction
          de <strong>{formatValeur(promotion)}</strong> via la promotion <strong>{promotion?.nomPromotion}</strong>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={onBack} disabled={submitting}>
          ← Retour
        </button>
        <button className="btn-primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-small" />
              Traitement...
            </>
          ) : (
            "✓ Confirmer l'application"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Onglet : Assignation Groupes + Clients individuels ────────────────
function TabGroupes({ promotions, loading, contrats }) {
  const [groups, setGroups] = useState([]);
  const [ungroupedCustomers, setUngroupedCustomers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [searchPromo, setSearchPromo] = useState("");
  const [searchGroup, setSearchGroup] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [inheritToMembers, setInheritToMembers] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]);
  const [activeTargetType, setActiveTargetType] = useState("groups"); // "groups" ou "customers"
  const idVendeur = localStorage.getItem("userId");
  const [showDateManager, setShowDateManager] = useState(false);
  const [selectedPromoForDates, setSelectedPromoForDates] = useState(null);
  const [selectedGroupForDates, setSelectedGroupForDates] = useState(null);

  useEffect(() => {
    loadGroupsAndCustomers();
  }, []);

  const loadGroupsAndCustomers = async () => {
    setLoadingGroups(true);
    setLoadingCustomers(true);
    try {
      // Charger les groupes
      const groupsData = await getCustomerGroups();
      setGroups(groupsData);

      // Extraire les IDs des clients qui sont dans des groupes
      const customersInGroups = new Set();
      groupsData.forEach(group => {
        if (group.members && Array.isArray(group.members)) {
          group.members.forEach(member => {
            if (member.customerId) customersInGroups.add(member.customerId);
          });
        }
      });

      // Filtrer les contrats pour ne garder que ceux qui ne sont dans aucun groupe
      const activeContrats = contrats.filter(c => c.statut === "ACTIF");
      const ungrouped = activeContrats.filter(contrat =>
        !customersInGroups.has(contrat.client?.id)
      );
      setUngroupedCustomers(ungrouped);

    } catch (e) {
      console.error("Erreur lors du chargement:", e);
    } finally {
      setLoadingGroups(false);
      setLoadingCustomers(false);
    }
  };

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

  const filteredCustomers = useMemo(() => {
    const t = searchCustomer.toLowerCase();
    return ungroupedCustomers.filter(
      (c) =>
        `${c.client?.nom} ${c.client?.prenom}`.toLowerCase().includes(t) ||
        c.client?.email?.toLowerCase().includes(t) ||
        c.directoryNumber?.toString().includes(t)
    );
  }, [ungroupedCustomers, searchCustomer]);

  const toggleGroup = (id) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCustomer = (id) => {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getTotalSelectedCount = () => {
    if (activeTargetType === "groups") {
      return selectedGroups.size;
    } else {
      return selectedCustomers.size;
    }
  };

  const handleAssign = async () => {
    if (!selectedPromo) return;

    const hasSelection = activeTargetType === "groups"
      ? selectedGroups.size > 0
      : selectedCustomers.size > 0;

    if (!hasSelection) return;

    setSubmitting(true);
    setResults([]);
    const res = [];

    if (activeTargetType === "groups") {
      // Assigner aux groupes
      for (const groupId of selectedGroups) {
        const grp = groups.find((g) => g.id === groupId);
        try {
          await assignerPromotion(selectedPromo.id, {
            assignedById: idVendeur,
            targetType: "CUSTOMER_GROUP",
            targetGroupId: groupId,
            // effectiveStartDate: startDate,
            // effectiveEndDate: endDate || null,
            inheritedToMembers: inheritToMembers,
            assignmentMode: "MANUAL",
          });
          res.push({
            id: groupId,
            name: grp?.name,
            type: "group",
            success: true
          });
        } catch (err) {
          const msg = err.response?.data?.message || err.message || "Erreur inconnue";
          res.push({
            id: groupId,
            name: grp?.name,
            type: "group",
            success: false,
            message: msg
          });
        }
      }
    } else {
      // Assigner aux clients individuels
      for (const contratId of selectedCustomers) {
        const contrat = ungroupedCustomers.find((c) => c.id === contratId);
        try {
          await assignerPromotion(selectedPromo.id, {
            assignedById: idVendeur,
            targetType: "CUSTOMER",
            targetCustomerId: contrat?.client?.id,
            // effectiveStartDate: startDate,
            // effectiveEndDate: endDate || null,
            assignmentMode: "MANUAL",
          });
          res.push({
            id: contratId,
            name: `${contrat?.client?.nom} ${contrat?.client?.prenom}`,
            type: "customer",
            success: true
          });
        } catch (err) {
          const msg = err.response?.data?.message || err.message || "Erreur inconnue";
          res.push({
            id: contratId,
            name: `${contrat?.client?.nom} ${contrat?.client?.prenom}`,
            type: "customer",
            success: false,
            message: msg
          });
        }
      }
    }

    setResults(res);
    setSubmitting(false);

    if (res.every((r) => r.success)) {
      setSelectedGroups(new Set());
      setSelectedCustomers(new Set());
      // Recharger les données pour mettre à jour les listes
      await loadGroupsAndCustomers();
    }
  };

  const resetAll = () => {
    setResults([]);
    setSelectedPromo(null);
    setSelectedGroups(new Set());
    setSelectedCustomers(new Set());
  };

  if (results.length > 0) {
    const allOk = results.every((r) => r.success);
    return (
      <div className={`result-card-enhanced ${allOk ? "success" : "error"}`}>
        <div className="result-icon-enhanced">{allOk ? "✅" : "⚠️"}</div>
        <div className="result-content-enhanced">
          <h3>{allOk ? "Assignation réussie !" : "Résultats partiels"}</h3>
          <div className="result-list">
            {results.map((r) => (
              <div key={r.id} className="result-item">
                <span className={`result-status ${r.success ? "success" : "error"}`}>
                  {r.success ? "✓" : "✗"}
                </span>
                <span className="result-type">{r.type === "group" ? "👥" : "👤"}</span>
                <span className="result-group" style={{color:'#101116'}}>{r.name}</span>
                {!r.success && <span className="result-message" style={{color:'#e42200'}}>— {r.message}</span>}
              </div>
            ))}
          </div>
        </div>
        <button className="btn-primary-enhanced" onClick={resetAll}>
          Nouvelle assignation
        </button>
      </div>
    );
  }

  return (
    <div className="groups-tab-enhanced">

      {/* Sélecteur de type de cible */}
      {/* <div className="target-type-selector">
        <button
          className={`target-type-btn ${activeTargetType === "groups" ? "active" : ""}`}
          onClick={() => setActiveTargetType("groups")}
        >
          <span className="target-icon">👥</span>
          Groupes clients
          <span className="target-count">{groups.length}</span>
        </button>
      </div> */}

      <div className="dual-list-container">
        {/* Liste des promotions */}
        <div className="list-panel">
          <div className="panel-header">
            <h4>🎁 Promotions actives</h4>
            <span className="badge-count">{activePromotions.length}</span>
          </div>
          <SearchBar
            placeholder="Rechercher une promotion..."
            value={searchPromo}
            onChange={setSearchPromo}
            icon="🎁"
          />
          <div className="list-items">
            {loading ? (
              <div className="loading-item">Chargement...</div>
            ) : filteredPromos.length === 0 ? (
              <div className="empty-item">Aucune promotion active</div>
            ) : (
              filteredPromos.map((p) => (
                <div
                  key={p.id}
                  className={`list-item ${selectedPromo?.id === p.id ? "selected" : ""}`}
                  onClick={() => setSelectedPromo(selectedPromo?.id === p.id ? null : p)}
                >
                  <div className="item-content">
                    <div className="item-title">{p.nomPromotion}</div>
                    <div className="item-subtitle">
                      {p.typeReduction === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                    </div>
                  </div>
                  <div className="item-value">{formatValeur(p)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Liste des cibles (groupes ou clients) */}
        <div className="list-panel">
          <div className="panel-header">
            <h4>
              {activeTargetType === "groups" && "👥 Groupes clients"}
            </h4>
            <span className="badge-count">
              {getTotalSelectedCount() > 0
                ? `${getTotalSelectedCount()} sélectionné(s)`
                : activeTargetType === "groups"
                  ? groups.length
                  : ungroupedCustomers.length}
            </span>
          </div>

          <SearchBar
            placeholder={activeTargetType === "groups"
              ? "Rechercher un groupe..."
              : "Rechercher un client..."}
            value={activeTargetType === "groups" ? searchGroup : searchCustomer}
            onChange={activeTargetType === "groups" ? setSearchGroup : setSearchCustomer}
            icon={activeTargetType === "groups" ? "👥" : "👤"}
          />

          {selectedPromo && (
            <div className="selected-promo-indicator">
              <span className="indicator-icon">🎯</span>
              <span style={{color:'#101116'}}>Promotion: <strong>{selectedPromo.nomPromotion}</strong></span>
              <span className="indicator-value">{formatValeur(selectedPromo)}</span>
            </div>
          )}

          <div className="list-items">
            {activeTargetType === "groups" ? (
              // Affichage des groupes
              loadingGroups ? (
                <div className="loading-item">Chargement des groupes...</div>
              ) : filteredGroups.length === 0 ? (
                <div className="empty-item">Aucun groupe trouvé</div>
              ) : (
                filteredGroups.map((g) => {
                  const memberCount = g.memberCount || (g.members?.length || 0);
                  return (
                    <div
                      key={g.id}
                      className={`list-item ${selectedGroups.has(g.id) ? "selected" : ""} ${!selectedPromo ? "disabled" : ""}`}
                      onClick={() => selectedPromo && toggleGroup(g.id)}
                    >
                      <div className="item-avatar">{TYPE_ICONS[g.groupType] || "👥"}</div>
                      <div className="item-content">
                        <div className="item-title">{g.name}</div>
                        <div className="item-subtitle">
                          {g.groupCode} • {memberCount} membre{memberCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="item-badge">{TYPE_LABELS[g.groupType] || g.groupType}</div>
                    </div>
                  );
                })
              )
            ) : (
              // Affichage des clients individuels
              loadingCustomers ? (
                <div className="loading-item">Chargement des clients...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="empty-item">
                  {ungroupedCustomers.length === 0
                    ? "Tous les clients sont déjà dans des groupes"
                    : "Aucun client trouvé"}
                </div>
              ) : (
                filteredCustomers.map((contrat) => (
                  <div
                    key={contrat.id}
                    className={`list-item ${selectedCustomers.has(contrat.id) ? "selected" : ""} ${!selectedPromo ? "disabled" : ""}`}
                    onClick={() => selectedPromo && toggleCustomer(contrat.id)}
                  >
                    <div className="customer-avatar-small">
                      {contrat.client?.nom?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="item-content">
                      <div className="item-title">
                        {contrat.client?.nom} {contrat.client?.prenom}
                      </div>
                      <div className="item-subtitle">
                        {contrat.client?.email} • {contrat.offre?.nom}
                      </div>
                    </div>
                    <div className="item-detail">
                      <span className="detail-number">{contrat.directoryNumber}</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          <div className="panel-footer">
            <div className="footer-hint">
              {!selectedPromo
                ? "← Sélectionnez d'abord une promotion"
                : getTotalSelectedCount() === 0
                  ? `Sélectionnez au moins un ${activeTargetType === "groups" ? "groupe" : "client"}`
                  : `${getTotalSelectedCount()} ${activeTargetType === "groups" ? "groupe(s)" : "client(s)"} sélectionné(s)`}
            </div>
            {/* <div style={{ display: 'flex', gap: '10px' }}>
              {selectedPromo && selectedGroups.size === 1 && activeTargetType === "groups" && (
                <button
                  className="assign-button secondary"
                  onClick={() => {
                    const groupId = Array.from(selectedGroups)[0];
                    const group = groups.find(g => g.id === groupId);
                    setSelectedPromoForDates(selectedPromo);
                    setSelectedGroupForDates({ id: groupId, name: group.name });
                    setShowDateManager(true);
                  }}
                >
                  📅 Gérer les dates
                </button>
              )}
            </div> */}
            <button
              className="assign-button"
              onClick={handleAssign}
              disabled={submitting || !selectedPromo || getTotalSelectedCount() === 0}
            >
              {submitting ? "Assignation..." : "✅ OK"}
            </button>
          </div>
        </div>
      </div>

      {/* <div className="options-panel"> */}
        {/* <div className="option-group">
          <label className="option-label">📅 Date de début</label>
          <input
            type="date"
            className="date-input-enhanced"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="option-group">
          <label className="option-label">📆 Date de fin</label>
          <input
            type="date"
            className="date-input-enhanced"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div> */}
        <div className="option-group checkbox-group">
          <label className="checkbox-label-enhanced">
            <input
              type="checkbox"
              checked={inheritToMembers}
              onChange={(e) => setInheritToMembers(e.target.checked)}
              disabled={activeTargetType === "customers"}
            />
            <span>👥 Hériter aux membres du groupe</span>
          </label>
        </div>
      {/* </div> */}
      {/* {showDateManager && selectedPromoForDates && selectedGroupForDates && (
        <div className="modal-overlay">
          <div className="modal-large">
            <CustomerPromotionDateManager
              promotionId={selectedPromoForDates.id}
              promotionName={selectedPromoForDates.nomPromotion}
              groupId={selectedGroupForDates.id}
              groupName={selectedGroupForDates.name}
              onClose={() => {
                setShowDateManager(false);
                setSelectedPromoForDates(null);
                setSelectedGroupForDates(null);
              }}
            />
          </div>
        </div>
      )} */}
    </div>
  );
}

// ─── Composant principal amélioré ────────────────────────────
function SouscriptionsPromotion() {
  const [contrats, setContrats] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("groupes");
  const [step, setStep] = useState(1);
  const [selectedContrat, setContrat] = useState(null);
  const [selectedPromo, setPromo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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

  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));
  const reset = () => { setStep(1); setContrat(null); setPromo(null); setResult(null); };

  const handleSouscrire = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      await souscrirePromotion(selectedContrat.id, selectedPromo.id);
      setResult({ success: true, message: "Promotion appliquée avec succès !" });
      setTimeout(() => reset(), 2000);
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

  const renderWizard = () => {
    if (result) {
      return (
        <div className={`result-card-enhanced ${result.success ? "success" : "error"}`}>
          <div className="result-icon-enhanced">{result.success ? "✅" : "❌"}</div>
          <div className="result-content-enhanced">
            <h3>{result.success ? "Succès !" : "Erreur"}</h3>
            <p>{result.message}</p>
          </div>
          <button className="btn-primary-enhanced" onClick={reset}>
            Nouvelle souscription
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="wizard-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`wizard-step ${step === s ? "active" : step > s ? "completed" : ""}`}>
              <div className="step-circle">{step > s ? "✓" : s}</div>
              <div className="step-label">
                {s === 1 ? "Contrat" : s === 2 ? "Promotion" : "Validation"}
              </div>
              {s < 3 && <div className={`step-line ${step > s ? "completed" : ""}`} />}
            </div>
          ))}
        </div>

        {/* {step === 1 && (
          <StepContrat
            contrats={contrats}
            selected={selectedContrat}
            onSelect={(c) => { setContrat(c); setTimeout(goNext, 300); }}
            loading={loading}
          />
        )} */}

        {/* {step === 2 && selectedContrat && (
          <StepPromotion
            promotions={promotions}
            selected={selectedPromo}
            onSelect={(p) => { setPromo(p); setTimeout(goNext, 300); }}
            contrat={selectedContrat}
          />
        )}

        {step === 3 && selectedContrat && selectedPromo && (
          <StepConfirmation
            contrat={selectedContrat}
            promotion={selectedPromo}
            onConfirm={handleSouscrire}
            onBack={goPrev}
            submitting={submitting}
          />
        )} */}
      </>
    );
  };

  return (
    <div className="souscriptions-page">
      <div className="page-header-enhanced">
        <div className="header-content">
          <div className="header-icon">🎯</div>
          <div>
            <h1>Configuration des promotions</h1>
            <p>Appliquez une promotion à un contrat ou à un groupe client</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{contrats.length}</span>
            <span className="stat-label">Contrats actifs</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{promotions.filter(p => p.statut === "ACTIVE").length}</span>
            <span className="stat-label">Promotions actives</span>
          </div>
        </div>
      </div>

      {/* <div className="tabs-container">
        <button className={`tab-button ${activeTab === "tableau" ? "active" : ""}`}
          onClick={() => setActiveTab("tableau")}>
          <span className="tab-icon">📊</span>
          Tableau clients
        </button>
        <button
          className={`tab-button ${activeTab === "groupes" ? "active" : ""}`}
          onClick={() => { setActiveTab("groupes"); reset(); }}
        >
          <span className="tab-icon">👥</span>
          Assignation par groupes
        </button>
      </div> */}

      <div className="content-area">
        {activeTab === "groupes" && (
          <TabGroupes
            promotions={promotions}
            loading={loading}
            contrats={contrats}
          />
        )}
        {/* {activeTab === "individuel" && renderWizard()} */}
      </div>
    </div>
  );
}

export default SouscriptionsPromotion;