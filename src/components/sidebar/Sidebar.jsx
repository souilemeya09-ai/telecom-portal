import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const role = localStorage.getItem("role");

  return (
    <div className="sidebar">


      {/* Menu DSI */}
      {role === "DSI" && (
        <>

          <Link to="/users" className="sidebar-link">
            Gérer Utilisateurs
          </Link>
          <Link to="/roles" className="sidebar-link">
            Gérer Roles
          </Link>
        </>
      )}

      {/* Menu Vente */}
      {role === "VENTE" && (
        <>
          <Link to="/customers" className="sidebar-link">
            Gérer Clients
          </Link>
          <Link to="/contrats" className="sidebar-link">
            Gérer Contrats
          </Link>

          <Link to="/offres" className="sidebar-link">
            Consulter Offres
          </Link>
          <Link to="/promotion" className="sidebar-link">
            Souscrire Promotion
          </Link>
          <Link to="/reclamations" className="sidebar-link">
            Gérer Réclamations
          </Link> 
        </>
      )}

      {/* Menu Métier */}
      {role === "METIER" && (
        <>
          <Link to="/plan-tarifaire" className="sidebar-link">
            Configurer Plan Tarifaire
          </Link>
          <Link to="/offres" className="sidebar-link">
            Gérer Offres
          </Link>
          <Link to="/promotions" className="sidebar-link">
            Créer Promotion
          </Link>
          <Link to="/services" className="sidebar-link">
            Configurer Service
          </Link>
        </>
      )}

      {/* Menu Exploit */}
      {role === "EXPLOIT" && (
        <>
          <Link to="/valider-promotion" className="sidebar-link">
            Valider Promotion
          </Link>
          <Link to="/examiner" className="sidebar-link">
            Examiner
          </Link>
        </>
      )}
    </div>
  );
}

export default Sidebar;