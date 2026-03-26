import { useEffect, useState } from "react";
import { getUsers, deleteUser, toggleUserStatus } from "../../api/api";
import { useNavigate } from "react-router-dom";
import "../../styles/users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Charger les utilisateurs
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Supprimer utilisateur
  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  // Modifier utilisateur
  const handleEdit = (id) => {
    navigate(`/edit-user/${id}`);
  };

  // Ajouter utilisateur
  const handleAdd = () => {
    navigate("/add-user");
  };

  // Activer / Désactiver utilisateur
  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  // Recherche
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="users-container">
      <h2 className="users-title">Liste des utilisateurs</h2>

      {/* Bouton ajouter */}
      <div className="add-button-container">
        <button className="add-button" onClick={handleAdd}>
          Ajouter utilisateur
        </button>
      </div>

      {/* Recherche */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher par nom, email ou rôle..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Tableau */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom et prénom</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>

                {/* Status */}
                <td>
                  <span
                    className={user.actif ? "status-active" : "status-inactive"}
                  >
                    {user.actif ? "Actif" : "Inactif"}
                  </span>
                </td>

                {/* Actions */}
                <td>
                  <div className="action-buttons">
                    <button
                      className="modify-btn"
                      onClick={() => handleEdit(user.id)}
                    >
                      Modifier
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user.id)}
                    >
                      Supprimer
                    </button>

                    <button
                      className={
                        user.actif ? "deactivate-btn" : "activate-btn"
                      }
                      onClick={() => handleToggle(user.id)}
                    >
                      {user.actif ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                Aucun utilisateur trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            &#8249;
          </button>

          <span className="page-info">
            Page {currentPage} / {totalPages}
          </span>

          <button
            className="page-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
};

export default Users;