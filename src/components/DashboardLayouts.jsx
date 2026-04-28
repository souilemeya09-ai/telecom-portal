import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Sidebar from "./sidebar/Sidebar";
import Footer from "./Footer/Footer";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      <Navbar />

      <div style={{ display: "flex", flex: 1 }}>

        <Sidebar />

        <div style={{ flex: 1 }}>
          <Outlet />
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;