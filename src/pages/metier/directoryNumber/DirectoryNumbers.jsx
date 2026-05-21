import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getDirectoryNumbers,
  uploadDirectoryNumbersCsv,
} from "../../../api/api";
import Pagination from "../../../components/Pagination";
import "../../../styles/offres.css";

const STATUS_OPTIONS = ["TOUS", "LIBRE", "ACTIF", "DESACTIVE"];

function getValue(obj, field) {
  switch (field) {
    case "id": return obj.id;
    case "numero": return Number(obj.numero) || 0;
    case "status": return obj.status ?? "";
    case "contractId": return obj.contractId ?? "";
    case "client": return obj.clientNom || obj.customerGroupName || "";
    case "dateActivation": return obj.dateActivation ?? "";
    case "dateDesactivation": return obj.dateDesactivation ?? "";
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

function formatNumero(num) {
  const s = String(num ?? "");
  if (s.length === 11 && s.startsWith("216")) {
    return `+${s.slice(0, 3)} ${s.slice(3, 5)} ${s.slice(5, 8)} ${s.slice(8, 11)}`;
  }
  return s || "—";
}

function statusClass(status) {
  if (status === "LIBRE") return "badge badge-default";
  if (status === "ACTIF") return "badge badge-actif";
  if (status === "DESACTIVE") return "badge badge-resilie";
  return "badge badge-default";
}

function holderLabel(number) {
  if (number.clientNom || number.clientPrenom) {
    return `${number.clientNom ?? ""} ${number.clientPrenom ?? ""}`.trim();
  }
  if (number.customerGroupName) return number.customerGroupName;
  return number.status === "LIBRE" ? "Disponible" : "Non renseigné";
}

function contractLabel(number) {
  if (number.contractId) return `cont_${number.contractId}`;
  return number.status === "LIBRE" ? "Non affecté" : "—";
}

function activationLabel(number) {
  if (number.dateActivation) return number.dateActivation;
  return number.status === "LIBRE" ? "—" : "—";
}

function desactivationLabel(number) {
  if (number.dateDesactivation) return number.dateDesactivation;
  return number.status === "DESACTIVE" ? "Non renseignée" : "—";
}

function DirectoryNumbers() {
  const [directoryNumbers, setDirectoryNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvError, setCsvError] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailNumber, setDetailNumber] = useState(null);
  const csvFileRef = useRef();
  const itemsPerPage = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 0, size: 1000 };
      if (statusFilter !== "TOUS") params.status = statusFilter;
      const response = await getDirectoryNumbers(params);
      setDirectoryNumbers(response.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvUploading(true);
    try {
      await uploadDirectoryNumbersCsv(file);
      await loadData();
      alert(`Import CSV réussi : ${file.name}`);
    } catch (err) {
      setCsvError(err.response?.data?.message || err.response?.data || err.message || "Erreur lors de l'import CSV.");
      console.error(err);
    } finally {
      setCsvUploading(false);
      e.target.value = "";
    }
  };

  const stats = useMemo(() => ({
    total: directoryNumbers.length,
    libres: directoryNumbers.filter((dn) => dn.status === "LIBRE").length,
    actifs: directoryNumbers.filter((dn) => dn.status === "ACTIF").length,
    desactives: directoryNumbers.filter((dn) => dn.status === "DESACTIVE").length,
  }), [directoryNumbers]);

  const displayed = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? directoryNumbers.filter((dn) =>
        String(dn.numero ?? "").includes(term) ||
        dn.status?.toLowerCase().includes(term) ||
        dn.contractId?.toLowerCase().includes(term) ||
        holderLabel(dn).toLowerCase().includes(term)
      )
      : directoryNumbers;

    return [...filtered].sort((a, b) => {
      const va = getValue(a, sortField);
      const vb = getValue(b, sortField);
      const cmp = typeof va === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "fr", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [directoryNumbers, search, sortField, sortOrder]);

  const pageCount = Math.ceil(displayed.length / itemsPerPage);
  const pageItems = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortOrder, statusFilter]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  const thProps = { sortField, sortOrder, onSort: handleSort };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Directory Numbers</h1>
          <p className="page-subtitle">
            {stats.total} numéro{stats.total !== 1 ? "s" : ""} affiché{stats.total !== 1 ? "s" : ""}
            {" · "}{stats.libres} libre{stats.libres !== 1 ? "s" : ""}
            {" · "}{stats.actifs} actif{stats.actifs !== 1 ? "s" : ""}
            {" · "}{stats.desactives} désactivé{stats.desactives !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn-secondary" onClick={() => csvFileRef.current.click()} disabled={csvUploading}>
            {csvUploading ? "Import en cours..." : "Importer CSV"}
          </button>
        </div>
        <input ref={csvFileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCsvUpload} />
      </div>

      {csvError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          Erreur import CSV : {csvError}
        </div>
      )}

      {detailNumber && (
        <div className="modal-overlay" onClick={() => setDetailNumber(null)}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 className="modal-title">{formatNumero(detailNumber.numero)}</h4>
                <span className={statusClass(detailNumber.status)}>{detailNumber.status}</span>
              </div>
              <button className="modal-close" onClick={() => setDetailNumber(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-section detail-section-full">
                <p className="detail-section-title">Informations numéro</p>
                <div className="detail-row-grid">
                  <DetailRow label="ID" value={detailNumber.id} mono />
                  <DetailRow label="Numéro" value={formatNumero(detailNumber.numero)} mono />
                  <DetailRow label="Statut" value={detailNumber.status} />
                  <DetailRow label="Contrat" value={contractLabel(detailNumber)} mono />
                  <DetailRow label="Titulaire" value={holderLabel(detailNumber)} />
                  <DetailRow label="Date activation" value={activationLabel(detailNumber)} />
                  <DetailRow label="Date désactivation" value={desactivationLabel(detailNumber)} />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDetailNumber(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher numéro, statut, contrat, titulaire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status === "TOUS" ? "Tous les statuts" : status}</option>
          ))}
        </select>
        {search && <button className="btn-secondary" onClick={() => setSearch("")}>Effacer</button>}
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Chargement des numéros...</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state"><p>Aucun numéro trouvé.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <Th label="#" field="id" {...thProps} />
                  <Th label="Numéro" field="numero" {...thProps} />
                  <Th label="Statut" field="status" {...thProps} />
                  <Th label="Contrat" field="contractId" {...thProps} />
                  <Th label="Titulaire" field="client" {...thProps} />
                  <Th label="Activation" field="dateActivation" {...thProps} />
                  <Th label="Désactivation" field="dateDesactivation" {...thProps} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((dn) => (
                  <tr key={dn.id}>
                    <td className="id-cell">{dn.id}</td>
                    <td className="mono">{formatNumero(dn.numero)}</td>
                    <td><span className={statusClass(dn.status)}>{dn.status}</span></td>
                    <td className="mono">{contractLabel(dn)}</td>
                    <td>{holderLabel(dn)}</td>
                    <td>{activationLabel(dn)}</td>
                    <td>{desactivationLabel(dn)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view" onClick={() => setDetailNumber(dn)} title="Voir">👁</button>
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

export default DirectoryNumbers;
