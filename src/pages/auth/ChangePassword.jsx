import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ChangePassword = () => {

    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmNewPassword) {
            setError("La confirmation ne correspond pas au nouveau mot de passe");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    oldPassword,
                    newPassword,
                    confirmNewPassword,
                }),
            });

            const text = await response.text();

            if (!response.ok) {
                throw new Error(text || "Erreur lors du changement de mot de passe");
            }

            setMessage(text);
            setOldPassword("");
            setNewPassword("");
            setConfirmNewPassword("");

            setTimeout(() => {
                navigate("/login")
            }, 1000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h2>Changer le mot de passe</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Ancien mot de passe"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Confirmer le nouveau mot de passe"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Modification en cours..." : "Changer le mot de passe"}
                    </button>
                </form>

                {message && !loading && <p className="message">{message}</p>}
                {error && !loading && <p className="message error">{error}</p>}
            </div>
        </div>
    );
};

export default ChangePassword;