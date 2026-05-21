import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createReclamation,
  getClients,
  getCustomerGroups,
} from "../../../api/api";
import "./createReclamation.css";

const EMPTY_FORM = {
  clientId: "",
  groupId: "",
  description: "",
  commentaireVendeur: "",
};

function CreateReclamation() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clientSearch, setClientSearch] = useState("");
  const [clientSearchMode, setClientSearchMode] = useState("client");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, g] = await Promise.all([getClients(), getCustomerGroups()]);
      setClients(c.content || []);
      setGroups(g);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...(clientSearchMode === "client"
          ? { clientId: Number(form.clientId) }
          : { groupId: Number(form.groupId) }),
        description: form.description,
        commentaireVendeur: form.commentaireVendeur || null,
      };
      
      await createReclamation(payload);
      navigate("/reclamations"); // Redirige vers la liste après création
    } catch (e) { 
      console.error(e); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleCancel = () => {
    navigate("/reclamations");
  };

  if (loading) {
    return <div className="loading-state">Chargement...</div>;
  }

  return (
    <div className="create-reclamation-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle réclamation</h1>
          <p className="page-subtitle">Créer une nouvelle réclamation client</p>
        </div>
      </div>

      <div className="form-container">
        <form className="reclamation-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Client / Groupe *</label>

            <div className="search-mode-toggle">
              <button
                type="button"
                className={`toggle-btn ${clientSearchMode === "client" ? "toggle-active" : ""}`}
                onClick={() => { 
                  setClientSearchMode("client"); 
                  setClientSearch(""); 
                  setForm({ ...form, clientId: "", groupId: "" }); 
                }}
              >
                👤 Par client
              </button>
              <button
                type="button"
                className={`toggle-btn ${clientSearchMode === "groupe" ? "toggle-active" : ""}`}
                onClick={() => { 
                  setClientSearchMode("groupe"); 
                  setClientSearch(""); 
                  setForm({ ...form, clientId: "", groupId: "" }); 
                }}
              >
                👥 Par groupe
              </button>
            </div>

            <input
              type="text"
              className="form-control"
              placeholder={clientSearchMode === "client"
                ? "🔎 Nom, prénom, email ou CIN..."
                : "🔎 Nom du groupe..."}
              value={clientSearch}
              onChange={(e) => { 
                setClientSearch(e.target.value); 
                setForm({ ...form, clientId: "", groupId: "" }); 
              }}
              style={{ marginBottom: 6 }}
            />

            <div className="client-list">
              {clientSearchMode === "client"
                ? clients
                    .filter((c) => {
                      const q = clientSearch.toLowerCase().trim();
                      return !q || [c.nom, c.prenom, c.email, c.cin].some((v) => v?.toLowerCase().includes(q));
                    })
                    .map((c) => (
                      <label key={c.id} className={`client-item ${form.clientId === c.id ? "active" : ""}`}>
                        <input
                          type="radio"
                          name="client"
                          value={c.id}
                          checked={form.clientId === c.id}
                          onChange={() => setForm({ ...form, clientId: c.id, groupId: "" })}
                        />
                        <div className="client-info">
                          <div className="client-name">{c.nom} {c.prenom}</div>
                          <div className="client-meta">{c.email || c.cin || "—"}</div>
                        </div>
                      </label>
                    ))
                : groups
                    .filter((g) => {
                      const q = clientSearch.toLowerCase().trim();
                      return !q || g.name?.toLowerCase().includes(q);
                    })
                    .map((g) => (
                      <label key={g.id} className={`client-item ${form.groupId === g.id ? "active" : ""}`}>
                        <input
                          type="radio"
                          name="groupe"
                          value={g.id}
                          checked={form.groupId === g.id}
                          onChange={() => setForm({ ...form, groupId: g.id, clientId: "" })}
                        />
                        <div className="client-info">
                          <div className="client-name">👥 {g.name}</div>
                          <div className="client-meta">{g.memberCount || 0} clients</div>
                        </div>
                      </label>
                    ))
              }
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Décrivez la réclamation du client..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Commentaire vendeur</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Notes internes, actions prises (optionnel)..."
              value={form.commentaireVendeur}
              onChange={(e) => setForm({ ...form, commentaireVendeur: e.target.value })}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || (!form.clientId && !form.groupId)}
            >
              {submitting ? "Création en cours..." : "Créer la réclamation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateReclamation;