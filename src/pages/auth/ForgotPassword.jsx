import { useState } from "react";
import axios from "axios";
import "../../styles/ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // <-- nouvel état

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);    // active le loading
    setMessage("");      // réinitialise le message

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/forgot-password",
        { email }
      );

      setMessage(response.data);
    } catch (error) {
      console.error(error);
      setMessage("Erreur : impossible d'envoyer la demande");
    } finally {
      setLoading(false); // désactive le loading
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Mot de passe oublié</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Entrer votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer"}
          </button>
        </form>

        {message && !loading && (
          <p className="message">{message}</p> // n'affiche le message que quand loading=false
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;