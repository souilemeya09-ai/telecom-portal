import { useEffect, useState, useMemo } from "react";
import {
  getContrats,
  getPromotions,
  souscrirePromotion,
  getSouscriptionsByContrat,
} from "../../../api/api";
import "./souscriptions.css";

const STATUT_INFO = {
  ACTIVE: { label: "Active", cls: "badge-actif" },
  EXPIRÉE: { label: "Expirée", cls: "badge-resilie" },
  ANNULÉE: { label: "Annulée", cls: "badge-default" },
};

const PROMO_STATUT_INFO = {
  EN_ATTENTE: { label: "En attente", cls: "badge-attente" },
  VALIDEE: { label: "Validée", cls: "badge-validee" },
  REJETEE: { label: "Rejetée", cls: "badge-rejetee" },
  ACTIVE: { label: "Active", cls: "badge-active" },
  SUSPENDUE: { label: "Suspendue", cls: "badge-suspendue" },
};

// ─── Étape 1 : Sélectionner un contrat ──────────────────────
function StepContrat({ contrats, selected, onSelect, loading }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return contrats.filter((c) =>
      `${c.client?.nom} ${c.client?.prenom}`.toLowerCase().includes(t) ||
      (c.directoryNumber ?? "").toString().includes(t) ||
      c.offre?.nom?.toLowerCase().includes(t)
    );
  }, [contrats, search]);

  return (
    <div className="step-content">
      <div className="step-search">
        <input type="text" className="form-control"
          placeholder="Rechercher client, offre, numéro..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-state">Chargement des contrats...</div>
      ) : (
        <div className="contrat-grid">
          {filtered.map((c) => (
            <div key={c.id}
              className={`contrat-card ${selected?.id === c.id ? "contrat-card-selected" : ""}`}
              onClick={() => onSelect(c)}>
              <div className="contrat-card-header">
                <div className="avatar">{c.client?.nom?.[0]?.toUpperCase() ?? "?"}</div>
                <div>
                  <div className="client-name">{c.client?.nom} {c.client?.prenom}</div>
                  <div className="client-email">{c.client?.email}</div>
                </div>
                {selected?.id === c.id && <span className="check-icon">✓</span>}
              </div>
              <div className="contrat-card-body">
                <div className="contrat-info-row">
                  <span className="detail-label">Offre</span>
                  <span className="detail-value">{c.offre?.nom ?? "—"}</span>
                </div>
                <div className="contrat-info-row">
                  <span className="detail-label">Numéro</span>
                  <span className="detail-value mono">{c.directoryNumber || "—"}</span>
                </div>
                <div className="contrat-info-row">
                  <span className="detail-label">Depuis</span>
                  <span className="detail-value">{c.dateDebut}</span>
                </div>
              </div>
              <div className="contrat-card-footer">
                <span className={`badge ${c.statut === "ACTIF" ? "badge-actif" : "badge-resilie"}`}>
                  {c.statut}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state"><p>Aucun contrat trouvé.</p></div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Étape 2 : Sélectionner une promotion ───────────────────
function StepPromotion({ promotions, selected, onSelect, contrat }) {
  const [search, setSearch] = useState("");

  // Calculer ancienneté du contrat en mois
  const moisAnciennete = useMemo(() => {
    if (!contrat?.dateDebut) return 0;
    const debut = new Date(contrat.dateDebut);
    console.log("date début contrat:", debut);
    const now = new Date();
    console.log("date actuelle:", now);
    return (now.getFullYear() - debut.getFullYear()) * 12 +
      (now.getMonth() - debut.getMonth());
  }, [contrat]);

  const today = new Date().toISOString().split("T")[0];

  // Vérif éligibilité côté front (double sécurité)
  const checkEligibility = (promo) => {
    const reasons = [];
    if (promo.statut !== "ACTIVE")
      reasons.push("La promotion n'est pas active");
    if (promo.dateDebut && today < promo.dateDebut)
      reasons.push("La promotion n'a pas encore commencé");
    if (promo.dateFin && today > promo.dateFin)
      reasons.push("La promotion est expirée");
    if (promo.ancienneteMinimale && moisAnciennete < promo.ancienneteMinimale)
      reasons.push(`Ancienneté insuffisante (${moisAnciennete} / ${promo.ancienneteMinimale} mois requis)`);
    return reasons;
  };

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return promotions.filter((p) =>
      p.nomPromotion?.toLowerCase().includes(t) ||
      p.typeReduction?.toLowerCase().includes(t)
    );
  }, [promotions, search]);

  const formatValeur = (p) =>
    p.typeReduction === "POURCENTAGE"
      ? `${p.valeurReduction}%`
      : `${p.valeurReduction} TND`;

  return (
    <div className="step-content">
      {/* Contrat sélectionné — résumé */}
      <div className="selected-contrat-banner">
        <div className="avatar sm">{contrat?.client?.nom?.[0]?.toUpperCase()}</div>
        <div>
          <span className="client-name">{contrat?.client?.nom} {contrat?.client?.prenom}</span>
          <span className="client-email"> · {contrat?.offre?.nom} · Ancienneté : {moisAnciennete} mois</span>
        </div>
      </div>

      <div className="step-search">
        <input type="text" className="form-control"
          placeholder="Rechercher une promotion..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="promo-grid">
        {filtered.map((p) => {
          const reasons = checkEligibility(p);
          const eligible = reasons.length === 0;
          const isSelected = selected?.id === p.id;
          const si = PROMO_STATUT_INFO[p.statut] ?? { label: p.statut, cls: "badge-default" };

          return (
            <div key={p.id}
              className={`promo-card
                ${isSelected ? "promo-card-selected" : ""}
                ${!eligible ? "promo-card-disabled" : ""}
              `}
              onClick={() => eligible && onSelect(isSelected ? null : p)}>

              <div className="promo-card-header">
                <div>
                  <div className="client-name">{p.nomPromotion}</div>
                  <span className={`badge ${si.cls}`} style={{ marginTop: 4 }}>{si.label}</span>
                </div>
                <div className="promo-valeur-badge">
                  {formatValeur(p)}
                </div>
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

              {/* Raisons non-éligibilité */}
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
  const formatValeur = (p) =>
    p.typeReduction === "POURCENTAGE"
      ? `${p.valeurReduction}%`
      : `${p.valeurReduction} TND`;

  return (
    <div className="step-content">
      <div className="confirmation-grid">
        {/* Client / Contrat */}
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

        {/* Promotion */}
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

      {/* Récapitulatif */}
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

// ─── Composant principal ─────────────────────────────────────
function SouscriptionsPromotion() {
  const [contrats, setContrats] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1=contrat, 2=promo, 3=confirm
  const [selectedContrat, setContrat] = useState(null);
  const [selectedPromo, setPromo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // succès/erreur
  const [histTab, setHistTab] = useState(false);
  const [souscriptions, setSouscriptions] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getContrats(), getPromotions()]);
      // Garder seulement les contrats actifs
      setContrats(c.filter((c) => c.statut === "ACTIF"));
      setPromotions(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Navigation steps ─────────────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));
  const reset = () => {
    setStep(1); setContrat(null); setPromo(null);
    setResult(null); setSubmitting(false);
  };

  // ── Souscription ─────────────────────────────────────────
  const handleSouscrire = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      await souscrirePromotion(selectedContrat.id, selectedPromo.id);
      setResult({ success: true });
    } catch (err) {
      let msg = "Erreur inconnue";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          msg = err.response.data;
        } else if (err.response.data.message) {
          msg = err.response.data.message;
        }
      } else if (err.message) {
        msg = err.message;
      }

      setResult({ success: false, message: msg });
    }
    finally {
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
    setContrat(c);
    loadHistorique(c.id);
  };

  const STEPS = [
    { n: 1, label: "Contrat" },
    { n: 2, label: "Promotion" },
    { n: 3, label: "Validation" },
  ];

  // ────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Souscription aux promotions</h1>
          <p className="page-subtitle">Appliquer une promotion à un contrat client</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn-secondary ${!histTab ? "tab-active" : ""}`}
            onClick={() => { setHistTab(false); reset(); }}>
            ➕ Nouvelle souscription
          </button>
          <button className={`btn-secondary ${histTab ? "tab-active" : ""}`}
            onClick={() => setHistTab(true)}>
            📋 Historique
          </button>
        </div>
      </div>

      {/* ══════════════ HISTORIQUE ══════════════ */}
      {histTab ? (
        <div>
          <div className="form-panel" style={{ marginBottom: "1rem" }}>
            <h3 className="form-panel-title">Sélectionner un contrat pour voir l'historique</h3>
            <div className="contrat-grid">
              {contrats.map((c) => (
                <div key={c.id}
                  className={`contrat-card ${selectedContrat?.id === c.id ? "contrat-card-selected" : ""}`}
                  onClick={() => handleSelectContratHist(c)}>
                  <div className="contrat-card-header">
                    <div className="avatar">{c.client?.nom?.[0]?.toUpperCase() ?? "?"}</div>
                    <div>
                      <div className="client-name">{c.client?.nom} {c.client?.prenom}</div>
                      <div className="client-email">{c.offre?.nom}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedContrat && (
            <div className="table-card">
              <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--border)" }}>
                <strong>Souscriptions de {selectedContrat.client?.nom} {selectedContrat.client?.prenom}</strong>
              </div>
              {loadingHist ? (
                <div className="loading-state">Chargement...</div>
              ) : souscriptions.length === 0 ? (
                <div className="empty-state"><p>Aucune souscription trouvée pour ce contrat.</p></div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Promotion</th>
                        <th>Date souscription</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {souscriptions.map((s) => {
                        const si = STATUT_INFO[s.statut] ?? { label: s.statut, cls: "badge-default" };
                        return (
                          <tr key={s.id}>
                            <td className="id-cell">{s.id}</td>
                            <td>
                              <div className="client-name">
                                {s.promotion?.nomPromotion ?? `Promotion #${s.promotion?.id}`}
                              </div>
                            </td>
                            <td className="date-cell">{s.dateSouscription}</td>
                            <td><span className={`badge ${si.cls}`}>{si.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      ) : (
        /* ══════════════ NOUVELLE SOUSCRIPTION ══════════════ */
        <>
          {/* ── Résultat final ── */}
          {result ? (
            <div className={`result-card ${result.success ? "result-success" : "result-error"}`}>
              <div className="result-icon">{result.success ? "✅" : "❌"}</div>
              <div className="result-content">
                <h3>{result.success ? "Souscription réussie !" : "Échec de la souscription"}</h3>
                <p>
                  {result.success
                    ? `La promotion "${selectedPromo?.nomPromotion}" a été appliquée au contrat de ${selectedContrat?.client?.nom} ${selectedContrat?.client?.prenom}.`
                    : result.message}
                </p>
              </div>
              <button className="btn-primary" onClick={reset}>
                {result.success ? "Nouvelle souscription" : "Réessayer"}
              </button>
            </div>
          ) : (
            <>
              {/* ── Stepper ── */}
              <div className="stepper">
                {STEPS.map((s, i) => (
                  <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                    <div className={`step-item ${step === s.n ? "step-active" : step > s.n ? "step-done" : ""}`}>
                      <div className="step-circle">
                        {step > s.n ? "✓" : s.n}
                      </div>
                      <span className="step-label">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`step-line ${step > s.n ? "step-line-done" : ""}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Contenu step ── */}
              <div className="form-panel" style={{ marginTop: 0 }}>

                {step === 1 && (
                  <StepContrat
                    contrats={contrats}
                    selected={selectedContrat}
                    onSelect={setContrat}
                    loading={loading}
                  />
                )}
                {step === 2 && (
                  <StepPromotion
                    promotions={promotions}
                    selected={selectedPromo}
                    onSelect={setPromo}
                    contrat={selectedContrat}
                  />
                )}
                {step === 3 && (
                  <StepConfirmation
                    contrat={selectedContrat}
                    promotion={selectedPromo}
                  />
                )}

                {/* ── Navigation ── */}
                <div className="step-nav">
                  {step > 1 && (
                    <button className="btn-secondary" onClick={goPrev}>← Retour</button>
                  )}
                  <div style={{ flex: 1 }} />
                  {step < 3 ? (
                    <button
                      className="btn-primary"
                      onClick={goNext}
                      disabled={
                        (step === 1 && !selectedContrat) ||
                        (step === 2 && !selectedPromo)
                      }>
                      Suivant →
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleSouscrire} disabled={submitting}>
                      {submitting ? "Souscription en cours..." : "✅ Confirmer la souscription"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default SouscriptionsPromotion;