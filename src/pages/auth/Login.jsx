import { useState } from "react";
import userLogo from "../../assets/userr.png";
import "../../styles/Login.css";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    // Vérifier si c'est une réponse HTTP avec un statut
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      
      // Message personnalisé selon le statut
      if (status === 400) {
        if (data && data.message) {
          return data.message;
        }
        return "Requête invalide. Vérifiez vos informations.";
      }
      
      if (status === 401) {
        return "Non autorisé. Vérifiez vos identifiants.";
      }
      
      if (status === 403) {
        return "Accès interdit. Contactez l'administrateur.";
      }
      
      if (status === 404) {
        return "Utilisateur non trouvé.";
      }
      
      // Message générique du backend
      if (data && data.message) {
        return data.message;
      }
    }
    
    // Erreur réseau
    if (err.message && err.message.includes("Network Error")) {
      return "Erreur de connexion au serveur. Vérifiez votre connexion internet.";
    }
    
    // Message par défaut
    return "Email ou mot de passe incorrect";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page-wrapper">
      <div className="login-content">
        <div className="login-card">
          <div className="login-logo">
            <img src={userLogo} alt="User" />
          </div>
          <h2>Connexion</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe:</label>
              <input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className={loading ? "loading" : ""}>
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}
          
          <div className="forgot-password">
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;