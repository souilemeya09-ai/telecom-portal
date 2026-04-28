import { useEffect, useState, useMemo } from "react";
import {
  getCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  getClients,
  ajouterMembreGroupe,
  retirerMembreGroupe,
  getPromotionsByGroup,
  assignerPromotion,
  getPromotions,
} from "../../../api/api";
import "../../../styles/customers.css";

// ── Config ────────────────────────────────────────────────────
const GROUP_TYPES = ["ENTERPRISE", "FAMILY", "SME", "OTHER"];
const GROUP_STATUS = ["ACTIVE", "INACTIVE"];
const MEMBER_ROLES = ["OWNER", "BILLING", "USER", "DECISION_MAKER"];

const TYPE_LABELS = { ENTERPRISE: "Entreprise", FAMILY: "Famille", SME: "PME", OTHER: "Autre" };
const ROLE_LABELS = { OWNER: "Propriétaire", BILLING: "Facturation", USER: "Utilisateur", DECISION_MAKER: "Décideur" };
const TYPE_COLORS = { ENTERPRISE: "type-enterprise", FAMILY: "type-family", SME: "type-sme", OTHER: "type-other" };
const ROLE_COLORS = { OWNER: "role-owner", BILLING: "role-billing", USER: "role-user", DECISION_MAKER: "role-dm" };

const EMPTY_FORM = { name: "", groupType: "FAMILY", status: "ACTIVE" };

// ── Sort helper ───────────────────────────────────────────────
function getValue(obj, field) {
  switch (field) {
    case "id": return obj.id;
    case "groupCode": return obj.groupCode ?? "";
    case "name": return obj.name ?? "";
    case "groupType": return obj.groupType ?? "";
    case "status": return obj.status ?? "";
    case "members": return obj.memberCount ?? (obj.members ?? []).filter(m => m.status === "ACTIVE").length;
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

// ── Avatar initials ───────────────────────────────────────────
function Avatar({ name, size = 36, muted = false }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]?.toUpperCase()).slice(0, 2).join("")
    : "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: muted ? "var(--color-background-tertiary)" : "var(--color-background-info)",
        color: muted ? "var(--color-text-tertiary)" : "var(--color-text-info)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 500,
        fontSize: size * 0.36,
        flexShrink: 0,
        opacity: muted ? 0.6 : 1,
      }}
    >
      {initials}
    </div>
  );
}

// ── Panel membres d'un groupe ─────────────────────────────────
function GroupDetailPanel({ group, clients, onAddMember, onRemoveMember, onClose }) {
  const [addForm, setAddForm] = useState({ customerId: "", memberRole: "USER", primaryMember: false });
  const [submitting, setSubmitting] = useState(false);
  const [promos, setPromos] = useState([]);
  const [tab, setTab] = useState("members");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const activeMembers = (group.members ?? []).filter((m) => m.status === "ACTIVE");
  const inactiveMembers = (group.members ?? []).filter((m) => m.status === "INACTIVE");

  // Clients non encore membres actifs
  const activeMemberIds = new Set(activeMembers.map((m) => m.customerId));
  const availableClients = clients.filter((c) => !activeMemberIds.has(c.id));

  // Filtered available clients for search
  const filteredAvailable = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return availableClients;
    return availableClients.filter(
      (c) =>
        c.nom?.toLowerCase().includes(term) ||
        c.prenom?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.telephone?.includes(term)
    );
  }, [availableClients, search]);

  useEffect(() => {
    if (tab === "promotions") {
      getPromotionsByGroup(group.id).then(setPromos).catch(console.error);
    }
  }, [tab, group.id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.customerId) return;
    setError("");
    setSubmitting(true);
    try {
      await onAddMember(
        group.id,
        Number(addForm.customerId),
        addForm.memberRole,
        addForm.primaryMember
      );
      setAddForm({ customerId: "", memberRole: "USER", primaryMember: false });
      setSearch("");
    } catch (err) {
      console.log(err);
      setError(err.response?.data || err.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick-add: click on a client card directly
  const handleQuickAdd = async (clientId) => {
    setError("");
    setSubmitting(true);
    try {
      await onAddMember(group.id, clientId, "USER", false);
      setSearch("");
    } catch (err) {
      setError(err.response?.data.message || err.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="group-detail-overlay" onClick={onClose}>
      <div className="group-detail-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="group-detail-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 className="modal-title">{group.name}</h3>
              <span className={`badge ${TYPE_COLORS[group.groupType]}`}>
                {TYPE_LABELS[group.groupType] ?? group.groupType}
              </span>
              <span className={`badge ${group.status === "ACTIVE" ? "badge-actif" : "badge-resilie"}`}>
                {group.status}
              </span>
            </div>
            <p className="client-email" style={{ marginTop: 4 }}>
              {group.groupCode} · {activeMembers.length} membre{activeMembers.length !== 1 ? "s" : ""} actif{activeMembers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="group-tabs">
          <button
            className={`group-tab ${tab === "members" ? "group-tab-active" : ""}`}
            onClick={() => setTab("members")}
          >
            👥 Membres ({activeMembers.length})
          </button>
          <button
            className={`group-tab ${tab === "add" ? "group-tab-active" : ""}`}
            onClick={() => setTab("add")}
          >
            ➕ Ajouter ({availableClients.length})
          </button>
          <button
            className={`group-tab ${tab === "promotions" ? "group-tab-active" : ""}`}
            onClick={() => setTab("promotions")}
          >
            🏷️ Promotions
          </button>
          {inactiveMembers.length > 0 && (
            <button
              className={`group-tab ${tab === "history" ? "group-tab-active" : ""}`}
              onClick={() => setTab("history")}
            >
              📋 Historique ({inactiveMembers.length})
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "var(--color-background-danger)",
            color: "red",
            padding: "0.6rem 1rem",
            borderRadius: 6,
            fontSize: 13,
            margin: "0 1.5rem",
          }}>
            ⚠️ {error}
            <button
              onClick={() => setError("")}
              style={{ marginLeft: 8, background: "none"}}
            >✕</button>
          </div>
        )}

        {/* ── Tab: membres actifs ── */}
        {tab === "members" && (
          <div className="group-tab-content">
            {activeMembers.length === 0 ? (
              <div className="empty-state">
                <p>Aucun membre actif dans ce groupe.</p>
                <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setTab("add")}>
                  ➕ Ajouter des membres
                </button>
              </div>
            ) : (
              <div className="members-list">
                {activeMembers.map((m) => (
                  <div key={m.membershipId} className="member-row">
                    <Avatar name={m.customerName} />
                    <div className="member-info">
                      <div className="client-name">
                        {m.customerName}
                        {m.primaryMember && <span className="primary-badge">★ Principal</span>}
                      </div>
                      <div className="client-email">{m.email}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                      <span className={`badge ${ROLE_COLORS[m.memberRole]}`}>
                        {ROLE_LABELS[m.memberRole] ?? m.memberRole}
                      </span>
                      <span className="client-email" style={{ whiteSpace: "nowrap" }}>
                        Depuis {m.joinedAt}
                      </span>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => onRemoveMember(group.id, m.customerId)}
                        title="Retirer du groupe"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Ajouter un membre ── */}
        {tab === "add" && (
          <div className="group-tab-content">
            {/* Form avancé */}
            <form className="add-member-form form-grid" onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Client *</label>
                <select
                  className="form-control"
                  value={addForm.customerId}
                  onChange={(e) => setAddForm({ ...addForm, customerId: e.target.value })}
                  required
                >
                  <option value="">— Sélectionner un client —</option>
                  {availableClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom}{c.email ? ` · ${c.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rôle</label>
                <select
                  className="form-control"
                  value={addForm.memberRole}
                  onChange={(e) => setAddForm({ ...addForm, memberRole: e.target.value })}
                >
                  {MEMBER_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                <label className="primary-check">
                  <input
                    type="checkbox"
                    checked={addForm.primaryMember}
                    onChange={(e) => setAddForm({ ...addForm, primaryMember: e.target.checked })}
                  />
                  <span>Membre principal</span>
                </label>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" className="btn-primary" disabled={submitting || !addForm.customerId}>
                  {submitting ? "Ajout..." : "✓ Ajouter"}
                </button>
              </div>
            </form>

            <div style={{ borderTop: "1px solid var(--color-border-tertiary)", margin: "1rem 0", opacity: 0.5 }} />

            {/* Quick-add: liste filtrée */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="search-bar" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  placeholder="Rechercher un client par nom, email, téléphone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>
                )}
              </div>
            </div>

            {availableClients.length === 0 ? (
              <div className="empty-state"><p>Tous les clients sont déjà membres de ce groupe.</p></div>
            ) : filteredAvailable.length === 0 ? (
              <div className="empty-state"><p>Aucun client ne correspond à la recherche.</p></div>
            ) : (
              <div className="members-list">
                {filteredAvailable.map((c) => (
                  <div key={c.id} className="member-row" style={{ cursor: "default" }}>
                    <Avatar name={`${c.nom} ${c.prenom}`} />
                    <div className="member-info">
                      <div className="client-name">{c.nom} {c.prenom}</div>
                      <div className="client-email">{c.email} {c.telephone ? `· ${c.telephone}` : ""}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      <button
                        className="btn-action btn-edit"
                        title="Ajouter comme USER"
                        disabled={submitting}
                        onClick={() => handleQuickAdd(c.id)}
                      >
                        ➕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: promotions ── */}
        {tab === "promotions" && (
          <div className="group-tab-content">
            {promos.length === 0 ? (
              <div className="empty-state"><p>Aucune promotion applicable à ce groupe.</p></div>
            ) : (
              <div className="promos-list">
                {promos.map((p) => (
                  <div key={p.id} className="promo-list-row">
                    <div>
                      <div className="client-name">{p.nomPromotion}</div>
                      <div className="client-email">
                        {p.typeReduction === "POURCENTAGE"
                          ? `${p.valeurReduction}%`
                          : `${p.valeurReduction} TND`}
                        {p.dateDebut && ` · du ${p.dateDebut} au ${p.dateFin ?? "∞"}`}
                      </div>
                    </div>
                    <span className="badge badge-actif">{p.statut}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: historique ── */}
        {tab === "history" && (
          <div className="group-tab-content">
            <div className="members-list">
              {inactiveMembers.map((m) => (
                <div key={m.membershipId} className="member-row member-row-inactive">
                  <Avatar name={m.customerName} muted />
                  <div className="member-info">
                    <div className="client-name" style={{ color: "var(--text-secondary)" }}>
                      {m.customerName}
                    </div>
                    <div className="client-email">
                      Entré : {m.joinedAt} · Sorti : {m.leftAt ?? "—"}
                    </div>
                  </div>
                  <span className="badge badge-resilie" style={{ marginLeft: "auto" }}>Inactif</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal assigner une promotion ──────────────────────────────
function AssignPromotionModal({ group, promotions, onClose, onAssign }) {
  const [form, setForm] = useState({
    promotionId: "",
    effectiveStartDate: new Date().toISOString().split("T")[0],
    effectiveEndDate: "",
    inheritedToMembers: true,
    assignmentMode: "MANUAL",
  });
  const [submitting, setSubmitting] = useState(false);

  const activePromos = promotions.filter((p) => p.statut === "ACTIVE");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAssign(Number(form.promotionId), {
        targetType: "CUSTOMER_GROUP",
        targetGroupId: group.id,
        effectiveStartDate: form.effectiveStartDate,
        effectiveEndDate: form.effectiveEndDate || null,
        inheritedToMembers: form.inheritedToMembers,
        assignmentMode: form.assignmentMode,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4 className="modal-title">Assigner une promotion</h4>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-text" style={{ marginBottom: "1rem" }}>
          Groupe : <strong>{group.name}</strong> ({group.groupCode})
        </p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group form-group-full">
            <label className="form-label">Promotion active *</label>
            <select
              className="form-control"
              value={form.promotionId}
              onChange={(e) => setForm({ ...form, promotionId: e.target.value })}
              required
            >
              <option value="">— Sélectionner une promotion —</option>
              {activePromos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomPromotion} —{" "}
                  {p.typeReduction === "POURCENTAGE"
                    ? `${p.valeurReduction}%`
                    : `${p.valeurReduction} TND`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date début *</label>
            <input
              className="form-control"
              type="date"
              value={form.effectiveStartDate}
              onChange={(e) => setForm({ ...form, effectiveStartDate: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date fin</label>
            <input
              className="form-control"
              type="date"
              value={form.effectiveEndDate}
              onChange={(e) => setForm({ ...form, effectiveEndDate: e.target.value })}
            />
          </div>
          <div className="form-group form-group-full">
            <label className="primary-check">
              <input
                type="checkbox"
                checked={form.inheritedToMembers}
                onChange={(e) => setForm({ ...form, inheritedToMembers: e.target.checked })}
              />
              <span>Héritage aux membres du groupe</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Assignation..." : "Assigner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
function CustomerGroups() {
  const [groups, setGroups] = useState([]);
  const [clients, setClients] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditing] = useState(null);
  const [detailGroup, setDetail] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [g, c, p] = await Promise.all([
        getCustomerGroups(),
        getClients(),
        getPromotions(),
      ]);
      setGroups(g);
      setClients(c);
      setPromotions(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Sort + search + filter ────────────────────────────────
  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    let list = groups;
    if (filterType !== "ALL") list = list.filter((g) => g.groupType === filterType);
    if (term)
      list = list.filter(
        (g) =>
          g.name?.toLowerCase().includes(term) ||
          g.groupCode?.toLowerCase().includes(term) ||
          g.groupType?.toLowerCase().includes(term)
      );
    return [...list].sort((a, b) => {
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp =
        typeof va === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [groups, search, filterType, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  // Stats
  const stats = useMemo(() => ({
    total: groups.length,
    actifs: groups.filter((g) => g.status === "ACTIVE").length,
    membres: groups.reduce(
      (acc, g) => acc + (g.members ?? []).filter((m) => m.status === "ACTIVE").length,
      0
    ),
    types: GROUP_TYPES.reduce(
      (acc, t) => ({ ...acc, [t]: groups.filter((g) => g.groupType === t).length }),
      {}
    ),
  }), [groups]);

  // ── Formulaire ────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ name: g.name, groupType: g.groupType, status: g.status });
    setShowForm(true);
    setDetail(null);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingGroup) await updateCustomerGroup(editingGroup.id, form);
      else await createCustomerGroup(form);
      closeForm();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Membres ───────────────────────────────────────────────
  const handleAddMember = async (groupId, customerId, memberRole, primaryMember) => {
    const updated = await ajouterMembreGroupe(groupId, customerId, memberRole, primaryMember);
    setDetail(updated);
    loadData();
  };

  const handleRemoveMember = async (groupId, customerId) => {
    if (!window.confirm("Retirer ce membre du groupe ?")) return;
    try {
      const updated = await retirerMembreGroupe(groupId, customerId);
      setDetail(updated);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Assignation promotion ─────────────────────────────────
  const handleAssignPromotion = async (promotionId, dto) => {
    try {
      await assignerPromotion(promotionId, dto);
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message);
    }
  };

  // ── Ouvrir détail (rechargement frais) ───────────────────
  const openDetail = async (g) => {
    try {
      const { getCustomerGroupById } = await import("../../../api/api");
      const fresh = await getCustomerGroupById(g.id);
      setDetail(fresh);
    } catch {
      setDetail(g);
    }
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Groupes clients</h1>
          <p className="page-subtitle">
            {groups.length} groupe{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau groupe</button>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #16a34a" }}>
          <span className="stat-label">Actifs</span>
          <span className="stat-value" style={{ color: "#16a34a" }}>{stats.actifs}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #d97706" }}>
          <span className="stat-label">Entreprises</span>
          <span className="stat-value" style={{ color: "#d97706" }}>
            {stats.types.ENTERPRISE ?? 0}
          </span>
        </div>
      </div>

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="form-panel">
          <h3 className="form-panel-title">
            {editingGroup ? `Modifier — ${editingGroup.name}` : "Créer un groupe client"}
          </h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nom du groupe *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex: Famille Ben Ali, STEG Enterprise..."
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type de groupe *</label>
              <select
                className="form-control"
                value={form.groupType}
                onChange={(e) => setForm({ ...form, groupType: e.target.value })}
              >
                {GROUP_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            {editingGroup && (
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {GROUP_STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting
                  ? "Enregistrement..."
                  : editingGroup ? "Mettre à jour" : "Créer le groupe"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtre type + search ── */}
      <div className="filter-search-row">
        <div className="filter-bar">
          {[
            { value: "ALL", label: "Tous" },
            ...GROUP_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
          ].map((t) => (
            <button
              key={t.value}
              className={`filter-btn ${filterType === t.value ? "filter-btn-active" : ""}`}
              onClick={() => setFilterType(t.value)}
            >
              {t.label}
              <span className="filter-count">
                {t.value === "ALL"
                  ? groups.length
                  : groups.filter((g) => g.groupType === t.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ marginBottom: 0, flex: 1 }}>
          <input
            type="text"
            placeholder="Rechercher par nom, code, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-card" style={{ marginTop: "1rem" }}>
        {loading ? (
          <div className="loading-state">Chargement des groupes...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun groupe trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#" field="id"        {...thProps} />
                  <Th label="Code" field="groupCode" {...thProps} />
                  <Th label="Nom" field="name"      {...thProps} />
                  <Th label="Type" field="groupType" {...thProps} />
                  <Th label="Statut" field="status"    {...thProps} />
                  <Th label="Membres" field="members"   {...thProps} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((g) => {
                  const activeCount = (g.memberCount && g.memberCount > 0) ? g.memberCount : (g.members ?? []).filter((m) => m.status === "ACTIVE").length;
                  return (
                    <tr key={g.id}>
                      <td className="id-cell">{g.id}</td>
                      <td className="mono">{g.groupCode}</td>
                      <td>
                        <div className="service-name-cell">
                          <div className="group-icon">
                            {g.name?.[0]?.toUpperCase() ?? "G"}
                          </div>
                          <span className="client-name">{g.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${TYPE_COLORS[g.groupType]}`}>
                          {TYPE_LABELS[g.groupType] ?? g.groupType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${g.status === "ACTIVE" ? "badge-actif" : "badge-resilie"}`}>
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <span className="services-count-badge">
                          {activeCount} membre{activeCount !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* 👁 Voir membres */}
                          <button
                            className="btn-action btn-view"
                            onClick={() => openDetail(g)}
                            title="Voir membres"
                          >
                            👁
                          </button>

                          {/* ➕ Ajouter membre */}
                          <button
                            className="btn-action"
                            style={{ fontSize: "0.85rem" }}
                            onClick={async () => {
                              await openDetail(g);
                            }}
                            title="Ajouter un membre"
                          >
                            ➕
                          </button>
                          {/* ✏️ Modifier groupe */}
                          <button
                            className="btn-action btn-edit"
                            onClick={() => openEdit(g)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          {/* 🏷️ Assigner promotion */}
                          <button
                            className="btn-action"
                            style={{ fontSize: "0.8rem" }}
                            onClick={() => setAssignModal(g)}
                            title="Assigner promotion"
                          >
                            🏷️
                          </button>
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

      {/* ── Panel détail groupe ── */}
      {detailGroup && (
        <GroupDetailPanel
          group={detailGroup}
          clients={clients}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onClose={() => setDetail(null)}
        />
      )}

      {/* ── Modal assigner promotion ── */}
      {assignModal && (
        <AssignPromotionModal
          group={assignModal}
          promotions={promotions}
          onClose={() => setAssignModal(null)}
          onAssign={handleAssignPromotion}
        />
      )}
    </div>
  );
}

export default CustomerGroups;