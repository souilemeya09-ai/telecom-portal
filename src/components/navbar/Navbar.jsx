import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../../assets/billcomm.png";

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
      <div className="nb-logo" onClick={() => navigate("/")}>
        <div className="nb-logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="nb-brand">
          <div className="nb-name">BillComm</div>
          <div className="nb-tag">BSS Platform</div>
        </div>
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
          <div className="nb-status">
            <span className="nb-status-dot" />
            <span className="nb-status-txt">Réseau OK</span>
          </div>

          <div className="nb-notif">
            <button className="nb-notif-btn" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {notificationCount > 0 && (
              <span className="nb-badge">{notificationCount}</span>
            )}
          </div>

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