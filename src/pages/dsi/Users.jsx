import { useCallback, useEffect, useState } from "react";
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
  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      setUsers(response || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const response = await getUsers();
        if (isMounted) {
          setUsers(response || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
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
  const activeUsers = users.filter((user) => user.enabled).length;
  const inactiveUsers = users.length - activeUsers;

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} enregistré{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          + Nouvel utilisateur
        </button>
      </div>

      <div className="stats-grid users-stats">
        <div className="stat-card stat-gray">
          <p className="stat-label">Total</p>
          <p className="stat-val">{users.length}</p>
        </div>
        <div className="stat-card stat-green">
          <p className="stat-label">Actifs</p>
          <p className="stat-val">{activeUsers}</p>
        </div>
        <div className="stat-card stat-orange">
          <p className="stat-label">Inactifs</p>
          <p className="stat-val">{inactiveUsers}</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher par nom, email ou rôle..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        {searchTerm && (
          <button
            className="btn-secondary"
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
          >
            Effacer
          </button>
        )}
      </div>

      <div className="table-card">
        {currentUsers.length > 0 ? (
          <div className="table-scroll">
            <table className="data-table users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom et prénom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="mono">{user.id}</td>
                    <td className="users-name">{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="role-badge">{user.role}</span>
                    </td>
                    <td>
                      <span className={user.enabled ? "status-badge status-active" : "status-badge status-inactive"}>
                        {user.enabled ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons users-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => handleEdit(user.id)}
                        >
                          Modifier
                        </button>

                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(user.id)}
                        >
                          Supprimer
                        </button>

                        <button
                          className={user.enabled ? "btn-warning" : "btn-primary"}
                          onClick={() => handleToggle(user.id)}
                        >
                          {user.enabled ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
          <div className="empty-state">
            <p>Aucun utilisateur trouvé.</p>
          </div>
          )}
      </div>

      {totalPages > 1 && (
        <div className="users-pagination">
          <button
            className="btn-secondary users-page-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            &#8249;
          </button>

          <span className="page-info">
            Page {currentPage} / {totalPages}
          </span>

          <button
            className="btn-secondary users-page-btn"
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
