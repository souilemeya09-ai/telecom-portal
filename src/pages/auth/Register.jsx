import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/api.js";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("VENTE");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await register(username, email, password, role);
            navigate("/");
        } catch (err) {
            setError("Erreur lors de l'inscription");
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "50px auto" }}>
            <h2>Register</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />

                {/* Dropdown Roles */}
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                >
                    <option value="VENTE">VENTE</option>
                    <option value="EXPLOIT">EXPLOIT</option>
                    <option value="METIER">METIER</option>
                    <option value="DSI">DSI</option>
                </select>

                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: "#f97316",
                        color: "white",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    Register
                </button>

            </form>

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default Register;