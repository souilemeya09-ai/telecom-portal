import { useState } from "react";
import { addUser, register } from "../../api/api";
import { useNavigate } from "react-router-dom";
import "../../styles/AddUser.css";

function AddUser() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VENTE");
  const navigate = useNavigate();

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await addUser({ username, email, password, role });
      navigate("/users");
    } catch (err) {
      alert("Erreur lors de l'ajout de l'utilisateur !");
    }
  };

  return (
    <div className="adduser-container">
      <form onSubmit={handleAddUser} className="adduser-form">
        <h2>Ajouter un utilisateur</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="VENTE">VENTE</option>
          <option value="DSI">DSI</option>
          <option value="METIER">METIER</option>
          <option value="EXPLOIT">EXPLOIT</option>
        </select>

        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
}

export default AddUser;