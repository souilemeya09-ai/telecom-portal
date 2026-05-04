import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Sidebar from "./sidebar/Sidebar";
import Footer from "./Footer/Footer";
import "./DashboardLayout.css";

const BREADCRUMB_MAP = {
  "/users": ["DSI", "Utilisateurs"],
  "/roles": ["DSI", "Rôles"],
  "/customers": ["Vente", "Clients"],
  "/contrats": ["Vente", "Contrats"],
  "/offres": ["Vente", "Offres"],
  "/souscriptions": ["Vente", "Souscriptions"],
  "/plans": ["Métier", "Plans tarifaires"],
  "/promotions": ["Métier", "Promotions"],
  "/exploit/promotions": ["Exploit", "Promotions"],
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const breadcrumb = BREADCRUMB_MAP[pathname] ?? [];

  return (
    <div className="dashboard-shell">

      <Navbar />

      <div className="dashboard-body">

        <Sidebar />

        <main className="dashboard-main">
          <Outlet />
        </main>

      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
