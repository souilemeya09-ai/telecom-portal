import { useEffect, useState, useMemo } from "react";
import {
  getContrats,
  getPromotions,
  getCustomerGroups,
  assignerPromotion,
  getPromotionsByGroup,
} from "../../../api/api";
import "./souscriptions.css";

// ─── Constants ───────────────────────────────────────────────

const TYPE_LABELS = { ENTERPRISE: "Entreprise", FAMILY: "Famille", SME: "PME", OTHER: "Autre" };
const TYPE_ICONS = { ENTERPRISE: "🏢", FAMILY: "👨‍👩‍👧", SME: "📊", OTHER: "📁" };

const formatValeur = (p) =>
  p?.typeReduction === "POURCENTAGE" ? `${p.valeurReduction}%` : `${p?.valeurReduction} TND`;

const groupHasPromo = (groupId, promoId, promotionsApplyGroup) => {
  return promotionsApplyGroup.some(
    (pa) => pa.groupId === groupId && pa.promotionId === promoId
  );
};

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
  const [assignedGroupIds, setAssignedGroupIds] = useState(new Set());
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]);
  const [activeTargetType, setActiveTargetType] = useState("groups"); // "groups" ou "customers"
  const idVendeur = localStorage.getItem("userId");

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
                <span className="result-group" style={{ color: '#101116' }}>{r.name}</span>
                {!r.success && <span className="result-message" style={{ color: '#e42200' }}>— {r.message}</span>}
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
                  onClick={async () => {
                    const newPromo = selectedPromo?.id === p.id ? null : p;
                    setSelectedPromo(newPromo);
                    setSelectedGroups(new Set());
                    setAssignedGroupIds(new Set());

                    if (newPromo) {
                      setLoadingAssigned(true);
                      try {
                        // Vérifier chaque groupe en parallèle
                        const checks = await Promise.all(
                          groups.map(async (g) => {
                            try {
                              const result = await getPromotionsByGroup(g.id);
                              const promos = result?.content || result || [];
                              const hasPromo = Array.isArray(promos) && promos.some(
                                (pa) => pa.id === newPromo.id || pa.promotionId === newPromo.id
                              );
                              return hasPromo ? g.id : null;
                            } catch {
                              return null;
                            }
                          })
                        );
                        setAssignedGroupIds(new Set(checks.filter(Boolean)));
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoadingAssigned(false);
                      }
                    }
                  }}
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
              <span style={{ color: '#101116' }}>Promotion: <strong>{selectedPromo.nomPromotion}</strong></span>
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
                  const alreadyAssigned = assignedGroupIds.has(g.id);

                  return (
                    <div
                      key={g.id}
                      className={`list-item 
                      ${selectedGroups.has(g.id) ? "selected" : ""} 
                      ${!selectedPromo || alreadyAssigned || loadingAssigned ? "disabled" : ""}`}
                      onClick={() => selectedPromo && !alreadyAssigned && !loadingAssigned && toggleGroup(g.id)}
                      title={alreadyAssigned ? "Promotion déjà assignée à ce groupe" : ""}
                    >
                      <div className="item-avatar">{TYPE_ICONS[g.groupType] || "👥"}</div>
                      <div className="item-content">
                        <div className="item-title">{g.name}</div>
                        <div className="item-subtitle">
                          {g.groupCode} • {memberCount} membre{memberCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="item-badge">{TYPE_LABELS[g.groupType] || g.groupType}</div>
                        {loadingAssigned && !alreadyAssigned && (
                          <span style={{ fontSize: "0.7rem", color: "#999" }}>...</span>
                        )}
                        {alreadyAssigned && (
                          <div className="item-badge" style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: "0.7rem" }}>
                            ✓ Déjà assigné
                          </div>
                        )}
                      </div>
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
    </div>
  );
}

// ─── Composant principal amélioré ────────────────────────────
function SouscriptionsPromotion() {
  const [contrats, setContrats] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [promotionsApplyGroup, setPromotionsApplyGroup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("groupes");
  const [step, setStep] = useState(1);
  const [selectedContrat, setContrat] = useState(null);
  const [selectedPromo, setPromo] = useState(null);
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

      <div className="content-area">
        {activeTab === "groupes" && (
          <TabGroupes
            promotions={promotions}
            loading={loading}
            contrats={contrats}
          />
        )}
      </div>
    </div>
  );
}

export default SouscriptionsPromotion;