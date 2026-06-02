import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ breadcrumb = [], notificationCount = 3 }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") ?? "USER";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const initials = role.slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <div className="nb-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <img src="/images/logo1.png" alt="Logo" width={130} />
      </div>

      {breadcrumb.length > 0 && (
        <>
          <div className="nb-divider" />
          <nav className="nb-breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <span key={i}>
                {i > 0 && <span className="nb-sep">›</span>}
                <span className={i === breadcrumb.length - 1 ? "nb-crumb-active" : ""}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </>
      )}

      <div className="nb-spacer" />

      {token && (
        <>
          <div className="nb-user">
            <div className="nb-avatar">{initials}</div>
            <div className="nb-uinfo">
              <div className="nb-uname">Opérateur</div>
              <div className="nb-urole">{role}</div>
            </div>
          </div>

          <button className="nb-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </>
      )}
    </nav>
  );
};

export default Navbar;