import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  createContrat,
  getClients,
  getOffres,
  getCustomerGroups,
  getDirectoryNumbers,
} from "../../../api/api";
import "./createContrat.css";

const EMPTY_FORM = {
  clientId: "",
  customerGroupId: "",
  offreId: "",
  directoryNumber: "",
};


function formatNumero(num) {
  const s = String(num);
  if (s.length === 11 && s.startsWith("216"))
    return `+${s.slice(0, 3)} ${s.slice(3, 5)} ${s.slice(5, 8)} ${s.slice(8, 11)}`;
  return s;
}

function CreateContrat() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [offers, setOffers] = useState([]);
  const [directoryNumbers, setDirectoryNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateErrors, setDateErrors] = useState({});
  const [holderError, setHolderError] = useState("");
  const [submitError, setSubmitError] = useState("");
  
  // Dropdown states
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [offreSearch, setOffreSearch] = useState("");
  const [offreDropdownOpen, setOffreDropdownOpen] = useState(false);
  const [dnSearch, setDnSearch] = useState("");
  const [dnDropdownOpen, setDnDropdownOpen] = useState(false);
  
  const clientDropdownRef = useRef();
  const offreDropdownRef = useRef();
  const dnDropdownRef = useRef();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cl, o, cg, dn] = await Promise.all([
        getClients({ page: 0, size: 1000 }),
        getOffres({ page: 0, size: 1000 }),
        getCustomerGroups(),
        getDirectoryNumbers({ status: "LIBRE", page: 0, size: 1000 })
      ]);

      setClients(cl.content || []);
      setOffers(o.content || []);
      setGroups(Array.isArray(cg) ? cg : cg.content || []);
      setDirectoryNumbers(dn.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered data for dropdowns
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      `${c.nom} ${c.prenom}`.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.cin?.toLowerCase().includes(term) ||
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

  const availableDirectoryNumbers = useMemo(() => {
    return directoryNumbers.sort((a, b) => Number(a.numero) - Number(b.numero));
  }, [directoryNumbers]);

  const filteredDirectoryNumbers = useMemo(() => {
    const term = dnSearch.trim().replace(/\s/g, "");
    if (!term) return availableDirectoryNumbers;
    return availableDirectoryNumbers.filter((dn) =>
      String(dn.numero).includes(term) ||
      formatNumero(dn.numero).replace(/\s/g, "").includes(term)
    );
  }, [availableDirectoryNumbers, dnSearch]);

  const updateForm = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    setSubmitError("");
    if (patch.clientId !== undefined || patch.customerGroupId !== undefined) {
      setHolderError("");
    }
  };

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
        offreId: Number(form.offreId)
      };
      
      if (hasClient) payload.clientId = Number(form.clientId);
      if (hasGroup) payload.customerGroupId = Number(form.customerGroupId);

      if (form.directoryNumber) {
        payload.directoryNumber = String(form.directoryNumber).trim();
      }

      await createContrat(payload);
      navigate("/contrats"); // Redirige vers la liste après création
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.response?.data || err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/contrats");
  };

  const hasDateErrors = Object.keys(dateErrors).length > 0;

  if (loading) {
    return <div className="loading-state">Chargement...</div>;
  }

  return (
    <div className="create-contrat-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouveau contrat</h1>
          <p className="page-subtitle">Créer un nouveau contrat client</p>
        </div>
      </div>

      <div className="form-container">
        <form className="contrat-form" onSubmit={handleSubmit}>
          {submitError && (
            <div className="alert alert-error">
              {submitError}
            </div>
          )}

          {/* Client combobox */}
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

          {/* Customer group */}
          {/* <div className="form-group">
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
              {groups.map((cg) => (
                <option key={cg.id} value={cg.id}>{cg.name}</option>
              ))}
            </select>
            {holderError && (
              <span className="field-error">{holderError}</span>
            )}
          </div> */}

          {/* Offre combobox */}
          <div className="form-group" ref={offreDropdownRef} style={{ position: "relative" }}>
            <label className="form-label">Offre </label>
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

          {/* Directory Number combobox */}
          <div className="form-group" ref={dnDropdownRef} style={{ position: "relative" }}>
            <label className="form-label">Numéro de ligne du contrat</label>
            <input
              className="form-control"
              type="text"
              placeholder="Rechercher un numéro LIBRE..."
              value={form.directoryNumber ? formatNumero(form.directoryNumber) : dnSearch}
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
              <ul className="combobox-dropdown">
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
            {availableDirectoryNumbers.length === 0 && (
              <span className="input-hint">
                Aucun numéro LIBRE disponible dans le stock importé.
              </span>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || hasDateErrors || !form.offreId}
            >
              {submitting ? "Création en cours..." : "Créer le contrat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContrat;