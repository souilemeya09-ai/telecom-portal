import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../../styles/ForgotPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ✅ Récupération correcte du token depuis l'URL query param
  const token = searchParams.get("token");

  const [email, setEmail] = useState(""); // ✅ état email ajouté (manquait avant)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Vérification que le token est présent dans l'URL
  if (!token) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <h2>Lien invalide</h2>
          <p className="error">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <button onClick={() => navigate("/forgot-password")}>
            Demander un nouveau lien
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas !");
      setMessage(null);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", {
        token,   // ✅ token récupéré depuis l'URL
        email,   // ✅ email maintenant défini dans le state
        newPassword: password,
      });

      setMessage("Mot de passe réinitialisé avec succès !");
      setPassword("");
      setConfirmPassword("");
      setEmail("");

      // Redirection vers login après 2 secondes
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.response?.data || "Une erreur est survenue, veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Réinitialiser le mot de passe</h2>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="reset-form">
          {/* ✅ Champ email ajouté */}
          <input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;