import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  getContrats, createContrat, updateContrat,
  deleteContrat, resilierContrat, getClients, getOffres,
  uploadContratsCsv,
  getCustomerGroups, getCustomerGroupById, getDirectoryNumbers,
} from "../../../api/api";
import Pagination from "../../../components/Pagination";
import "./contrat.css"

const EMPTY_FORM = {
  clientId: "", customerGroupId: "", offreId: "", directoryNumber: "",
};

// ── Sort helpers ─────────────────────────────────────────────
function getValue(obj, field) {
  switch (field) {
    case "id": return obj.id;
    case "client": return obj.client ? `${obj.client.nom} ${obj.client.prenom}` : "";
    case "offre": return obj.offre?.nom ?? "";
    case "dateActivation": return obj.dateActivation ?? "";
    case "dateDesactivation": return obj.dateDesactivation ?? "";
    case "statut": return obj.statut ?? "";
    case "directoryNumber": return obj.directoryNumber ?? "";
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

// ────────────────────────────────────────────────────────────
function Contrats() {
  const [contrats, setContrats] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [offers, setOffers] = useState([]);
  const [directoryNumbers, setDirectoryNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContrat, setEditing] = useState(null);
  const [detailContrat, setDetail] = useState(null);
  const [detailGroup, setDetailGroup] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateErrors, setDateErrors] = useState({});
  const [holderError, setHolderError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");
  const [csvError, setCsvError] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const csvFileRef = useRef();

  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [offreSearch, setOffreSearch] = useState("");
  const [offreDropdownOpen, setOffreDropdownOpen] = useState(false);
  const clientDropdownRef = useRef();
  const offreDropdownRef = useRef();

  // ── Directory Number combobox ─────────────────────────────
  const [dnSearch, setDnSearch] = useState("");
  const [dnDropdownOpen, setDnDropdownOpen] = useState(false);
  const dnDropdownRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, cl, cg, o, dn] = await Promise.all([
        getContrats({ page: 0, size: 1000 }),
        getClients({ page: 0, size: 1000 }),
        getCustomerGroups(),
        getOffres({ page: 0, size: 1000 }),
        getDirectoryNumbers({ status: "LIBRE", page: 0, size: 1000 })
      ]);

      setContrats(c.content || []);
      setClients(cl.content || []);
      setGroups(Array.isArray(cg) ? cg : cg.content || []);
      setOffers(o.content || []);
      setDirectoryNumbers(dn.content || []);

    } catch (err) {
      console.error(err);
    }
    finally { setLoading(false); }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvUploading(true);
    try {
      await uploadContratsCsv(file);
      await loadData();
      alert(`Import CSV réussi : ${file.name}`);
    } catch (err) {
      setCsvError(err.response?.data?.message || err.message || "Erreur lors de l'import CSV.");
      console.error(err);
    } finally {
      setCsvUploading(false);
      e.target.value = "";
    }
  };

  // ── Sort + search ─────────────────────────────────────────
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      `${c.nom} ${c.prenom}`.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) || c.cin?.toLowerCase().includes(term) ||
      String(c.id).includes(term)
    );
  }, [clients, clientSearch]);

  const filteredOffres = useMemo(() => {
    const term = offreSearch.trim().toLowerCase();
    if (!term) return offers;
    return offers.filter((o) =>
      (o.nomOffre || o.nom || "").toLowerCase().includes(term)
    );
  }, [offers, offreSearch]);

  const getContractValue = useCallback((obj, field) => {
    if (field === "customerGroupId") {
      const group = obj.customerGroup || groups.find((g) => String(g.id) === String(obj.customerGroupId));
      return group?.name ?? "";
    }
    return getValue(obj, field);
  }, [groups]);

  const displayed = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = term
      ? contrats.filter((c) =>
        `${c.client?.nom} ${c.client?.prenom}`.toLowerCase().includes(term) ||
        c.customerGroup?.name?.toLowerCase().includes(term) ||
        c.offre?.nom?.toLowerCase().includes(term) ||
        c.statut?.toLowerCase().includes(term) ||
        String(c.directoryNumber ?? "").toLowerCase().includes(term)
      )
      : contrats;

    return [...filtered].sort((a, b) => {
      const va = getContractValue(a, sortField);
      const vb = getContractValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [contrats, getContractValue, sortField, sortOrder, search]);

  const pageCount = Math.ceil(displayed.length / itemsPerPage);
  const pageItems = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  function formatNumero(num) {
    const s = String(num);
    if (s.length === 11 && s.startsWith("216"))
      return `+${s.slice(0, 3)} ${s.slice(3, 5)} ${s.slice(5, 8)} ${s.slice(8, 11)}`;
    return s;
  }

  const availableDirectoryNumbers = useMemo(() => {
    const currentNumber = editingContrat?.directoryNumber ? String(editingContrat.directoryNumber) : "";
    return directoryNumbers
      .filter((dn) => String(dn.numero) !== currentNumber)
      .sort((a, b) => Number(a.numero) - Number(b.numero));
  }, [directoryNumbers, editingContrat]);

  // ── Filtered Directory Numbers for combobox ───────────────
  const filteredDirectoryNumbers = useMemo(() => {
    const all = editingContrat?.directoryNumber
      ? [
          { id: "current", numero: editingContrat.directoryNumber, _current: true },
          ...availableDirectoryNumbers,
        ]
      : availableDirectoryNumbers;
    const term = dnSearch.trim().replace(/\s/g, "");
    if (!term) return all;
    return all.filter((dn) =>
      String(dn.numero).includes(term) ||
      formatNumero(dn.numero).replace(/\s/g, "").includes(term)
    );
  }, [availableDirectoryNumbers, editingContrat, dnSearch]);

  // ── Mise à jour form avec validation dates en temps réel ──
  const updateForm = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    setSubmitError("");
    if (patch.clientId !== undefined || patch.customerGroupId !== undefined) {
      setHolderError("");
    }
  };

  // ── Formulaire ────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDateErrors({});
    setHolderError("");
    setSubmitError("");
    setClientSearch("");
    setDnSearch("");
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      clientId: c.clientId || c.client?.id || "",
      customerGroupId: c.customerGroupId || c.customerGroup?.id || "",
      offreId: c.offreId || c.offre?.id || "",
      directoryNumber: c.directoryNumber || "",
    });
    setDateErrors({});
    setHolderError("");
    setSubmitError("");
    setClientSearch("");
    setDnSearch("");
    setShowForm(true);
    setDetail(null);
  };

  const closeForm = () => {
    setShowForm(false); setEditing(null);
    setForm(EMPTY_FORM); setDateErrors({}); setHolderError(""); setSubmitError("");
    setClientSearch(""); setDnSearch("");
  };

  const hasDateErrors = Object.keys(dateErrors).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasClient = Boolean(form.clientId);
    const hasGroup = Boolean(form.customerGroupId);

    if (!hasClient && !hasGroup) {
      setHolderError("Sélectionnez un client ou un groupe customer.");
      return;
    }

    if (hasClient && hasGroup) {
      setHolderError("Sélectionnez soit un client soit un groupe customer, pas les deux.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        offreId: Number(form.offreId),
        // dateDebut: form.dateDebut,
        // dateFin: form.dateFin || null,
      };
      if (hasClient) payload.clientId = Number(form.clientId);
      if (hasGroup) payload.customerGroupId = Number(form.customerGroupId);

      const requestedDirectoryNumber = form.directoryNumber ? String(form.directoryNumber).trim() : "";
      if (editingContrat) {
        const currentDirectoryNumber = editingContrat.directoryNumber
          ? String(editingContrat.directoryNumber)
          : "";
        if (requestedDirectoryNumber && requestedDirectoryNumber !== currentDirectoryNumber) {
          payload.directoryNumber = requestedDirectoryNumber;
        }
      } else if (requestedDirectoryNumber) {
        payload.directoryNumber = requestedDirectoryNumber;
      }

      if (editingContrat) await updateContrat(editingContrat.id, payload);
      else await createContrat(payload);
      closeForm(); loadData();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.response?.data || err.message || "Erreur lors de l'enregistrement.");
    }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteContrat(id); setDeleteConfirm(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const handleResilier = async (id) => {
    try { await resilierContrat(id); setDetail(null); setDetailGroup(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const openDetail = async (c) => {
    setDetail(c);
    if (c.customerGroupId) {
      try {
        const group = await getCustomerGroupById(c.customerGroupId);
        setDetailGroup(group);
      } catch (err) {
        console.error("Erreur chargement groupe:", err);
        setDetailGroup(null);
      }
    } else {
      setDetailGroup(null);
    }
  };

  const statutClass = (s) => {
    if (s === "ACTIF") return "badge badge-actif";
    if (s === "RESILIE") return "badge badge-resilie";
    return "badge badge-default";
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contrats</h1>
          <p className="page-subtitle">
            {contrats.length} contrat{contrats.length !== 1 ? "s" : ""} enregistré{contrats.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn-secondary" onClick={() => csvFileRef.current.click()} disabled={csvUploading}>
            {csvUploading ? "Import en cours..." : "Importer CSV"}
          </button>
          {/* <button className="btn-primary" onClick={openCreate}>+ Nouveau contrat</button> */}
        </div>
        <input ref={csvFileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCsvUpload} />
      </div>

      {csvError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          Erreur import CSV : {csvError}
        </div>
      )}

      {/* ── Formulaire panel ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="form-panel-title">
                {editingContrat ? `Modifier contrat #${editingContrat.id}` : "Créer un nouveau contrat"}
              </h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
              {submitError && (
                <div className="alert alert-error form-group-full">
                  {submitError}
                </div>
              )}

              {/* ── Client combobox ── */}
              <div className="form-group" ref={clientDropdownRef} style={{ position: "relative" }}>
                <label className="form-label">Client</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder={form.customerGroupId ? "Désactivé — groupe sélectionné" : "Rechercher un client..."}
                  disabled={Boolean(form.customerGroupId)}
                  value={
                    form.clientId
                      ? (() => {
                          const c = clients.find((c) => String(c.id) === String(form.clientId));
                          return c ? `${c.nom} ${c.prenom}` : clientSearch;
                        })()
                      : clientSearch
                  }
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    updateForm({ clientId: "" });
                    setClientDropdownOpen(true);
                  }}
                  onFocus={() => !form.customerGroupId && setClientDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setClientDropdownOpen(false), 150);
                    if (!form.clientId) setClientSearch("");
                  }}
                  autoComplete="off"
                />
                {clientDropdownOpen && filteredClients.length > 0 && (
                  <ul className="combobox-dropdown">
                    {filteredClients.slice(0, 8).map((c) => (
                      <li
                        key={c.id}
                        className={`combobox-option ${String(form.clientId) === String(c.id) ? "combobox-option-selected" : ""}`}
                        onMouseDown={() => {
                          updateForm({ clientId: c.id, customerGroupId: "" });
                          setClientSearch("");
                          setClientDropdownOpen(false);
                        }}
                      >
                        <span className="combobox-avatar">{c.nom?.[0]?.toUpperCase()}</span>
                        <span>
                          <span className="combobox-main">{c.nom} {c.prenom}</span>
                          <span className="combobox-sub">{c.email}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── Customer group ── */}
              <div className="form-group">
                <label className="form-label">Customer group</label>
                <select
                  className="form-control"
                  value={form.customerGroupId}
                  disabled={Boolean(form.clientId)}
                  onChange={(e) => {
                    updateForm({ customerGroupId: e.target.value, clientId: "" });
                    if (e.target.value) setClientSearch("");
                  }}
                >
                  <option value="">
                    {form.clientId ? "Désactivé — client sélectionné" : "Sélectionner un groupe customer"}
                  </option>
                  {groups.map((cg) => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
                </select>
                {holderError && (
                  <span className="field-error">{holderError}</span>
                )}
              </div>

              {/* ── Offre combobox ── */}
              <div className="form-group" ref={offreDropdownRef} style={{ position: "relative" }}>
                <label className="form-label">Offre *</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Rechercher une offre..."
                  value={
                    form.offreId
                      ? (() => {
                          const o = offers.find((o) => String(o.id) === String(form.offreId));
                          return o ? (o.nomOffre || o.nom || "Sans nom") : offreSearch;
                        })()
                      : offreSearch
                  }
                  onChange={(e) => {
                    setOffreSearch(e.target.value);
                    updateForm({ offreId: "" });
                    setOffreDropdownOpen(true);
                  }}
                  onFocus={() => setOffreDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setOffreDropdownOpen(false), 150);
                    if (!form.offreId) setOffreSearch("");
                  }}
                  required
                  autoComplete="off"
                />
                {offreDropdownOpen && filteredOffres.length > 0 && (
                  <ul className="combobox-dropdown">
                    {filteredOffres.slice(0, 8).map((o) => (
                      <li
                        key={o.id}
                        className={`combobox-option ${String(form.offreId) === String(o.id) ? "combobox-option-selected" : ""}`}
                        onMouseDown={() => {
                          updateForm({ offreId: o.id });
                          setOffreSearch("");
                          setOffreDropdownOpen(false);
                        }}
                      >
                        <span className="combobox-main">{o.nomOffre || o.nom || "Sans nom"}</span>
                        {o.prixMensuel && <span className="combobox-sub">{o.prixMensuel} TND/mois</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>



              {/* ── Directory Number combobox ── */}
              <div className="form-group form-group-full" ref={dnDropdownRef} style={{ position: "relative" }}>
                <label className="form-label">Directory Number</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder={
                    editingContrat
                      ? `Actuel : ${formatNumero(editingContrat.directoryNumber || "")} — rechercher pour changer`
                      : "Rechercher un numéro LIBRE..."
                  }
                  value={
                    form.directoryNumber
                      ? formatNumero(form.directoryNumber)
                      : dnSearch
                  }
                  onChange={(e) => {
                    setDnSearch(e.target.value);
                    updateForm({ directoryNumber: "" });
                    setDnDropdownOpen(true);
                  }}
                  onFocus={() => setDnDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDnDropdownOpen(false), 150)}
                  autoComplete="off"
                />
                {dnDropdownOpen && (
                  <ul className="combobox-dropdown" style={{height:'100%', paddingBottom:'20px'}}>
                    {/* Option "aucun" pour création */}
                    {!editingContrat && (
                      <li
                        className={`combobox-option ${!form.directoryNumber ? "combobox-option-selected" : ""}`}
                        onMouseDown={() => {
                          updateForm({ directoryNumber: "" });
                          setDnSearch("");
                          setDnDropdownOpen(false);
                        }}
                      >
                        <span className="combobox-main">Affectation automatique</span>
                      </li>
                    )}
                    {filteredDirectoryNumbers.slice(0, 10).map((dn) => (
                      <li
                        key={dn.id}
                        className={`combobox-option ${String(form.directoryNumber) === String(dn.numero) ? "combobox-option-selected" : ""}`}
                        onMouseDown={() => {
                          updateForm({ directoryNumber: dn.numero });
                          setDnSearch("");
                          setDnDropdownOpen(false);
                        }}
                      >
                        {dn._current && (
                          <span className="combobox-sub" style={{ marginRight: 6 }}>actuel ·</span>
                        )}
                        <span className="combobox-main">{formatNumero(dn.numero)}</span>
                      </li>
                    ))}
                    {filteredDirectoryNumbers.length === 0 && (
                      <li className="combobox-option" style={{ pointerEvents: "none", opacity: 0.5 }}>
                        <span className="combobox-main">Aucun résultat</span>
                      </li>
                    )}
                  </ul>
                )}
                {form.directoryNumber && (
                  <span className="input-hint">📞 {formatNumero(form.directoryNumber)}</span>
                )}
                {!form.directoryNumber && editingContrat && (
                  <span className="input-hint">
                    Le numéro actif du contrat reste inchangé.
                  </span>
                )}
                {availableDirectoryNumbers.length === 0 && !editingContrat && (
                  <span className="input-hint">
                    Aucun numéro LIBRE disponible dans le stock importé.
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={submitting || hasDateErrors}>
                  {submitting ? "Enregistrement..." : editingContrat ? "Mettre à jour" : "Créer le contrat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Détail ── */}
      {detailContrat && (
        <div className="modal-overlay" onClick={() => { setDetail(null); setDetailGroup(null); }}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 className="modal-title">Contrat #{detailContrat.id}</h4>
                <span className={statutClass(detailContrat.statut)}>{detailContrat.statut}</span>
              </div>
              <button className="modal-close" onClick={() => { setDetail(null); setDetailGroup(null); }}>✕</button>
            </div>
            <div className="detail-grid">
              {detailContrat.customerGroupId ? (
                <div className="detail-section">
                  <p className="detail-section-title">Groupe Customer</p>
                  {detailGroup ? (
                    <>
                      <div className="client-cell" style={{ marginBottom: 8 }}>
                        <div className="avatar">{detailGroup.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="client-name">{detailGroup.name}</div>
                          <div className="client-email">{detailGroup.groupType} · {detailGroup.status}</div>
                        </div>
                      </div>
                      <DetailRow label="Code" value={detailGroup.groupCode} mono />
                      <DetailRow label="Membres" value={`${detailGroup.memberCount || 0} membre${detailGroup.memberCount !== 1 ? "s" : ""}`} />
                      {detailGroup.members && detailGroup.members.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontWeight: 500, marginBottom: 4 }}>Liste des membres :</p>
                          <ul style={{ listStyle: "none", padding: 0 }}>
                            {detailGroup.members.map((member) => (
                              <li key={member.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <div className="avatar" style={{ width: 24, height: 24, fontSize: 12 }}>{member.nom?.[0]?.toUpperCase()}</div>
                                <span>{member.nom} {member.prenom}</span>
                                <span className="client-email">({member.email})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : <p className="detail-empty">Chargement du groupe...</p>}
                </div>
              ) : (
                <div className="detail-section">
                  <p className="detail-section-title">Client</p>
                  {detailContrat.client ? (
                    <>
                      <div className="client-cell" style={{ marginBottom: 8 }}>
                        <div className="avatar">{detailContrat.client.nom?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="client-name">{detailContrat.client.nom} {detailContrat.client.prenom}</div>
                          <div className="client-email">{detailContrat.client.email}</div>
                        </div>
                      </div>
                      <DetailRow label="Téléphone" value={detailContrat.client.telephone} />
                    </>
                  ) : <p className="detail-empty">—</p>}
                </div>
              )}
              <div className="detail-section">
                <p className="detail-section-title">Offre</p>
                {detailContrat.offre ? (
                  <>
                    <DetailRow label="Nom" value={detailContrat.offre.nom} />
                    <DetailRow label="Description" value={detailContrat.offre.description} />
                    <DetailRow label="Prix" value={detailContrat.offre.prixMensuel ? `${detailContrat.offre.prixMensuel} TND/mois` : "—"} />
                  </>
                ) : <p className="detail-empty">—</p>}
              </div>
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Informations contrat</p>
                <div className="detail-row-grid">
                  <DetailRow label="Date d'activation" value={detailContrat.dateActivation} />
                  <DetailRow label="Date de désactivation" value={detailContrat.dateDesactivation || "—"} />
                  <DetailRow label="Directory Number" value={detailContrat.directoryNumber || "—"} mono />
                  <DetailRow label="Statut" value={detailContrat.statut} />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {detailContrat.statut !== "RESILIE" && (
                <button className="btn-warning"
                  onClick={() => { if (window.confirm("Résilier ce contrat ?")) handleResilier(detailContrat.id); }}>
                  Résilier
                </button>
              )}
              <button className="btn-secondary" onClick={() => { setDetail(null); setDetailGroup(null); }}>Fermer</button>
              <button className="btn-primary" onClick={() => openEdit(detailContrat)}>✏️ Modifier</button>
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
              Supprimer le contrat <strong>#{deleteConfirm.id}</strong> de&nbsp;
              <strong>{deleteConfirm.client?.nom} {deleteConfirm.client?.prenom}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="search-bar">
        <input type="text" placeholder="Rechercher client, offre, statut, numéro..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des contrats...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun contrat trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#" field="id"              {...thProps} />
                  <Th label="Client" field="client"          {...thProps} />
                  <Th label="Groupe customer" field="customerGroupId"    {...thProps} />
                  <Th label="Offre" field="offre"           {...thProps} />
                  <Th label="Date d'activation" field="dateActivation"       {...thProps} />
                  <Th label="Date de désactivation" field="dateDesactivation"         {...thProps} />
                  <Th label="Statut" field="statut"          {...thProps} />
                  <Th label="Numéro" field="directoryNumber" {...thProps} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id}>
                    <td className="id-cell">{c.contractId && `cont_${c.contractId}`}</td>
                    <td>
                      <div className="client-cell">
                        <div className="avatar">{c.client?.nom?.[0]?.toUpperCase() ?? "?"}</div>
                        <div>
                          <div className="client-name">{c.client ? `${c.client.nom} ${c.client.prenom}` : "—"}</div>
                          <div className="client-email">{c.client?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const group = c.customerGroup || groups.find((g) => String(g.id) === String(c.customerGroupId));
                        return group ? (
                          <div className="group-cell">
                            <div className="client-name">{group.name}</div>
                            <div className="client-email">{group.groupType} · {group.status}</div>
                          </div>
                        ) : "—";
                      })()}
                    </td>
                    <td className="offre-cell">{c.offre?.nom ?? "—"}</td>
                    <td>{c.dateActivation}</td>
                    <td>{c.dateDesactivation || "—"}</td>
                    <td><span className={statutClass(c.statut)}>{c.statut}</span></td>
                    <td className="mono">{c.directoryNumber || "—"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view" onClick={() => openDetail(c)} title="Voir">👁</button>
                        <button className="btn-action btn-edit" onClick={() => openEdit(c)} title="Modifier">✏️</button>
                        {/* <button className="btn-action btn-delete" onClick={() => setDeleteConfirm(c)} title="Supprimer">🗑️</button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={pageCount} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${mono ? " mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export default Contrats;