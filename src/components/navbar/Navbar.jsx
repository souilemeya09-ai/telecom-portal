// src/components/navbar/Navbar.jsx
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../../assets/billcomm.png";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Exemple de nombre de notifications
  const notificationCount = 3;

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo" onClick={() => navigate("/")}>
        <img src={logo} alt="Billcom Logo" />
      </div>

      {/* Section utilisateur */}
      {token && (
        <div className="navbar-right">
          {/* Bouton notification avec badge */}
          <div className="notification-wrapper">
            <button className="notification-button">🔔</button>
            {notificationCount > 0 && (
              <span className="notification-badge pulse">{notificationCount}</span>
            )}
          </div>

          {/* Bouton logout */}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;