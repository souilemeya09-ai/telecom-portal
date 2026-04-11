import { useEffect, useState, useMemo } from "react";
import {
  getOffres,
  createOffre,
  updateOffre,
  deleteOffre,
  getServices,
  getPlansTarifaires,
  retirerServiceOffre,
} from "../../../api/api";
import "../../../styles/offres.css";

const TYPE_OFFRES = ["MOBILE", "FIXE", "INTERNET", "TV", "BUNDLE"];

const EMPTY_FORM = {
  nomOffre: "",
  typeOffre: "MOBILE",
  planTarifaireId: "",
  serviceIds: [],
};

function getValue(obj, field) {
  switch (field) {
    case "id": return obj.id;
    case "nomOffre": return obj.nomOffre ?? "";
    case "typeOffre": return obj.typeOffre ?? "";
    default: return "";
  }
}

function SortIcon({ field, sortField, sortOrder }) {
  if (sortField !== field) return <span className="sort-icon sort-idle">⇅</span>;
  return <span className="sort-icon sort-active">{sortOrder === "asc" ? "↑" : "↓"}</span>;
}

function Th({ label, field, sortField, sortOrder, onSort }) {
  return (
    <th className="sortable-th" onClick={() => onSort(field)}>
      <span className="th-inner">
        {label}
        <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
      </span>
    </th>
  );
}

function Offres() {
  const [offres, setOffres] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOffre, setEditing] = useState(null);
  const [detailOffre, setDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, s, p] = await Promise.all([getOffres(), getServices(), getPlansTarifaires()]);
      setOffres(o); setServices(s); setPlans(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Sort + search + filter ────────────────────────────────
  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    let list = offres;

    if (filterType !== "ALL")
      list = list.filter((o) => o.typeOffre === filterType);

    if (term)
      list = list.filter((o) =>
        o.nomOffre?.toLowerCase().includes(term) ||
        o.typeOffre?.toLowerCase().includes(term)
      );

    return [...list].sort((a, b) => {
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [offres, filterType, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  // ── Toggle service dans le form ───────────────────────────
  const toggleService = (id) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...f.serviceIds, id],
    }));
  };

  // ── Formulaire ────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true); setDetail(null);
  };
  const openEdit = (o) => {
    setEditing(o);
    setForm({
      nomOffre: o.nomOffre || "",
      typeOffre: o.typeOffre || "MOBILE",
      planTarifaireId: o.planTarifaireId || "",
      serviceIds: o.serviceIds || [],
    });
    setShowForm(true); setDetail(null);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = {
        nomOffre: form.nomOffre,
        typeOffre: form.typeOffre,
        planTarifaireId: form.planTarifaireId ? Number(form.planTarifaireId) : null,
        serviceIds: form.serviceIds,
      };
      if (editingOffre) await updateOffre(editingOffre.id, payload);
      else await createOffre(payload);
      closeForm(); loadData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteOffre(id); setDeleteConfirm(null); setDetail(null); loadData(); }
    catch (e) { console.error(e); }
  };

  // ── Retirer un service depuis le détail ───────────────────
  const handleRetirerService = async (offreId, serviceId) => {
    try { await retirerServiceOffre(offreId, serviceId); loadData(); setDetail(null); }
    catch (e) { console.error(e); }
  };

  const typeClass = (t) => {
    const map = {
      MOBILE: "type-mobile",
      FIXE: "type-fixe",
      INTERNET: "type-internet",
      TV: "type-tv",
      BUNDLE: "type-bundle",
    };
    return `offre-type-badge ${map[t] || "type-default"}`;
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  // Résoudre les noms des services depuis les IDs
  const resolveServices = (ids) =>
    (ids || []).map((id) => services.find((s) => s.id === id)).filter(Boolean);

  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Offres</h1>
          <p className="page-subtitle">
            {offres.length} offre{offres.length !== 1 ? "s" : ""} disponible{offres.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouvelle offre</button>
      </div>

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="form-panel">
          <h3 className="form-panel-title">
            {editingOffre ? `Modifier — ${editingOffre.nomOffre}` : "Créer une offre"}
          </h3>
          <form className="form-grid" onSubmit={handleSubmit}>

            {/* Nom */}
            <div className="form-group">
              <label className="form-label">Nom de l'offre *</label>
              <input className="form-control" value={form.nomOffre}
                onChange={(e) => setForm({ ...form, nomOffre: e.target.value })}
                placeholder="ex: Offre Essentielle" required />
            </div>

            {/* Type */}
            <div className="form-group">
              <label className="form-label">Type d'offre *</label>
              <select className="form-control" value={form.typeOffre}
                onChange={(e) => setForm({ ...form, typeOffre: e.target.value })}>
                {TYPE_OFFRES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Plan tarifaire */}
            <div className="form-group form-group-full">
              <label className="form-label">Plan tarifaire</label>
              <select className="form-control" value={form.planTarifaireId}
                onChange={(e) => setForm({ ...form, planTarifaireId: e.target.value })}>
                <option value="">Aucun plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} — {p.prixMensuel} TND/mois
                  </option>
                ))}
              </select>
            </div>

            {/* Services (multi-select visuel) */}
            <div className="form-group form-group-full">
              <label className="form-label">Services inclus</label>
              <div className="services-picker">
                {services.length === 0 ? (
                  <p className="picker-empty">Aucun service disponible</p>
                ) : (
                  services.map((s) => {
                    const selected = form.serviceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`service-chip ${selected ? "service-chip-active" : ""}`}
                        onClick={() => toggleService(s.id)}
                      >
                        {selected ? "✓ " : ""}{s.nomService}
                      </button>
                    );
                  })
                )}
              </div>
              {form.serviceIds.length > 0 && (
                <p className="picker-count">{form.serviceIds.length} service{form.serviceIds.length > 1 ? "s" : ""} sélectionné{form.serviceIds.length > 1 ? "s" : ""}</p>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Enregistrement..." : editingOffre ? "Mettre à jour" : "Créer l'offre"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailOffre && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 className="modal-title">{detailOffre.nomOffre}</h4>
                <span className={typeClass(detailOffre.typeOffre)}>{detailOffre.typeOffre}</span>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="detail-grid">
              {/* Plan tarifaire */}
              <div className="detail-section">
                <p className="detail-section-title">Plan tarifaire</p>
                {detailOffre.planTarifaireId ? (
                  (() => {
                    const plan = plans.find((p) => p.id === detailOffre.planTarifaireId);
                    return plan ? (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Nom</span>
                          <span className="detail-value">{plan.nom}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Prix</span>
                          <span className="detail-value prix-value">{plan.prixMensuel} TND/mois</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Description</span>
                          <span className="detail-value" style={{ fontSize: "0.82rem" }}>{plan.description}</span>
                        </div>
                      </>
                    ) : <p className="detail-empty">—</p>;
                  })()
                ) : <p className="detail-empty">Aucun plan associé</p>}
              </div>

              {/* Services */}
              <div className="detail-section">
                <p className="detail-section-title">
                  Services inclus ({(detailOffre.serviceIds || []).length})
                </p>
                {(detailOffre.serviceIds || []).length === 0 ? (
                  <p className="detail-empty">Aucun service</p>
                ) : (
                  <div className="detail-services-list">
                    {resolveServices(detailOffre.serviceIds).map((s) => (
                      <div key={s.id} className="detail-service-row">
                        <div>
                          <div className="client-name">{s.nomService}</div>
                          {s.description && (
                            <div className="client-email">{s.description}</div>
                          )}
                        </div>
                        <button className="btn-remove-service"
                          onClick={() => handleRetirerService(detailOffre.id, s.id)}
                          title="Retirer ce service">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-danger" onClick={() => setDeleteConfirm(detailOffre)}>Supprimer</button>
              <button className="btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
              <button className="btn-primary" onClick={() => openEdit(detailOffre)}>✏️ Modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Suppression ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h4 className="modal-title">Confirmer la suppression</h4>
            <p className="modal-text">
              Supprimer l'offre <strong>{deleteConfirm.nomOffre}</strong> ? Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtres + search ── */}
      <div className="filter-search-row">
        <div className="filter-bar">
          {[{ value: "ALL", label: "Toutes" }, ...TYPE_OFFRES.map((t) => ({ value: t, label: t }))].map((t) => (
            <button key={t.value}
              className={`filter-btn ${filterType === t.value ? "filter-btn-active" : ""}`}
              onClick={() => setFilterType(t.value)}>
              {t.label}
              <span className="filter-count">
                {t.value === "ALL" ? offres.length : offres.filter((o) => o.typeOffre === t.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ marginBottom: 0, flex: 1 }}>
          <input type="text" placeholder="Rechercher par nom, type..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-card" style={{ marginTop: "1rem" }}>
        {loading ? (
          <div className="loading-state">Chargement des offres...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucune offre trouvée.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#" field="id"        {...thProps} />
                  <Th label="Nom" field="nomOffre"  {...thProps} />
                  <Th label="Type" field="typeOffre" {...thProps} />
                  <th>Plan tarifaire</th>
                  <th>Services</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((o) => {
                  const plan = plans.find((p) => p.id === o.planTarifaireId);
                  const nbServices = (o.serviceIds || []).length;
                  return (
                    <tr key={o.id}>
                      <td className="id-cell">{o.id}</td>
                      <td>
                        <div className="service-name-cell">
                          <div className="service-icon">{o.nomOffre?.[0]?.toUpperCase() ?? "O"}</div>
                          <span className="client-name">{o.nomOffre}</span>
                        </div>
                      </td>
                      <td><span className={typeClass(o.typeOffre)}>{o.typeOffre}</span></td>
                      <td>
                        {plan ? (
                          <div>
                            <div className="client-name">{plan.nom}</div>
                            <div className="client-email">{plan.prixMensuel} TND/mois</div>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span className="services-count-badge">{nbServices} service{nbServices !== 1 ? "s" : ""}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-view" onClick={() => setDetail(o)} title="Voir">👁</button>
                          <button className="btn-action btn-edit" onClick={() => openEdit(o)} title="Modifier">✏️</button>
                          <button className="btn-action btn-delete" onClick={() => setDeleteConfirm(o)} title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Offres;