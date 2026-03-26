import { useState, useEffect } from "react";
import { editUser, getUsers } from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/AddUser.css"; 

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VENTE");

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        const users = await getUsers();
        const user = users.find(u => u.id === Number(id));
        if (user) {
          setUsername(user.username);
          setEmail(user.email);
          setRole(user.role);
        }
      }
    };
    fetchUser();
  }, [id]);

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await editUser(id, { username, email, password, role }, localStorage.getItem("token"));
      navigate("/users");
    } catch (err) {
      alert("Erreur lors de la modification !");
    }
  };

  return (
    <div className="adduser-container">
      <form onSubmit={handleEditUser} className="adduser-form">

        <h2>Modifier utilisateur</h2>

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
          placeholder="Mot de passe (laisser vide si inchangé)"
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

        <button type="submit">
          Modifier
        </button>

      </form>
    </div>
  );
}

export default EditUser;