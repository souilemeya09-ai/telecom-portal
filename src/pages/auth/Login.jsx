import { useState } from "react";
import userLogo from "../../assets/userr.png";
import "../../styles/Login.css";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import './login-navbar-footer.css'
import { LoginFooter } from "../../components/Footer/FooterHome";

// ─── Navbar ───────────────────────────────────────────────────────────────────
const LoginNavbar = () => (
  <nav className="login-navbar">
    <div className="login-navbar__inner">
      <Link to="/" className="login-navbar__logo">
        <img src="/images/logo2.png" alt="Logo" width={130} />
      </Link>
    </div>
  </nav>
);

// ─── Login page ────────────────────────────────────────────────────────────────
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    if (err.response) {
      const { status, data } = err.response;
      if (status === 400) return data?.message ?? "Requête invalide. Vérifiez vos informations.";
      if (status === 401) return "Non autorisé. Vérifiez vos identifiants.";
      if (status === 403) return "Accès interdit. Contactez l'administrateur.";
      if (status === 404) return "Utilisateur non trouvé.";
      if (data?.message) return data.message;
    }
    if (err.message?.includes("Network Error"))
      return "Erreur de connexion au serveur. Vérifiez votre connexion internet.";
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <LoginNavbar />

      <main className="login-page-wrapper">
        <div className="login-content">
          <div className="login-card">
            <div className="login-logo">
              <img src={userLogo} alt="User" />
            </div>
            <h2>Connexion</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email :</label>
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
                <label htmlFor="password">Mot de passe :</label>
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

              <button
                type="submit"
                disabled={loading}
                className={loading ? "loading" : ""}
              >
                {loading ? "Connexion en cours…" : "Se connecter"}
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
      </main>

      <LoginFooter />
    </div>
  );
};

export default Login;