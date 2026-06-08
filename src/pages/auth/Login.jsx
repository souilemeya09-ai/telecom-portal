import { useState } from "react";
import userLogo from "../../assets/userr.png";
import "../../styles/Login.css";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import './login-navbar-footer.css'

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

// ─── Footer ───────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Tableau de bord", to: "/dashboard" },
  { label: "Clients", to: "/clients" },
  { label: "Promotions", to: "/promotions" },
  { label: "Groupes", to: "/customer-groups" },
  { label: "Facturation", to: "/billing" },
  { label: "Paramètres", to: "/settings" },
];

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.985V9h3.104v1.561h.046c.432-.82 1.487-1.685 3.059-1.685 3.27 0 3.873 2.152 3.873 4.952v6.624zM5.337 7.433a1.8 1.8 0 1 1 0-3.601 1.8 1.8 0 0 1 0 3.601zM6.97 20.452H3.7V9h3.27v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "https://twitter.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.884v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
];

const LoginFooter = () => (
  <footer className="login-footer">
    <div className="login-footer__inner">

      {/* Brand */}
      <div className="login-footer__brand">
        <span className="login-footer__logo">
          <img src="/images/logo2.png" alt="Logo" width={130} />
        </span>
        <p className="login-footer__tagline">
          Gestion intelligente de vos promotions &amp; clients.
        </p>
        <div className="login-footer__socials">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="login-footer__social-btn"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav links */}
      <div className="login-footer__nav">
        <h4 className="login-footer__nav-title">Navigation</h4>
        <ul className="login-footer__nav-list">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="login-footer__nav-link">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal */}
      <div className="login-footer__legal-col">
        <h4 className="login-footer__nav-title">Légal</h4>
        <ul className="login-footer__nav-list">
          <li><Link to="/privacy" className="login-footer__nav-link">Politique de confidentialité</Link></li>
          <li><Link to="/terms" className="login-footer__nav-link">Conditions d&apos;utilisation</Link></li>
          <li><Link to="/contact" className="login-footer__nav-link">Contact</Link></li>
        </ul>
      </div>

    </div>

    <div className="login-footer__bottom">
      <span>© {new Date().getFullYear()} Billcome. Tous droits réservés.</span>
    </div>
  </footer>
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