import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Users from "./pages/dsi/Users";
import AddUser from "./pages/dsi/AddUser";
import EditUser from "./pages/dsi/EditUser";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Footer from "./components/Footer/Footer";
import DashboardLayout from "./components/DashboardLayouts";
import ProtectedRoute from "./middelware/ProtectedRoute";
import Contrats from "./pages/Vente/contrats/contrats";
import ServiceList from "./pages/metier/service/ServiceList";
import CreateService from "./pages/metier/service/CreateService";
import Customers from "./pages/Vente/customer/Customers";
import Offres from "./pages/metier/offre/Offres";
import CreateOffre from "./pages/metier/offre/CreateOffre";
import Reclamations from "./pages/Vente/reclamation/Reclamations";
import Promotions from "./pages/metier/promotion/Promotions";
import PlansTarifaires from "./pages/metier/planTarifaire/PlanTarifaire";
import SouscriptionsPromotion from "./pages/Vente/promotion/SouscriptionsPromotion";
import ExploitPromotion from "./pages/exploit/ExploitPromotion";
import Dashboard from "./components/dashboard/Dashboard";
import CustomerGroups from "./pages/Vente/customer/CustomerGroups";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* mot de passe oublié */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Routes protégées */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route path="/" element={<Dashboard />} />

          {/* Users */}
          <Route path="users" element={<Users />} />
          <Route path="add-user" element={<AddUser />} />
          <Route path="edit-user/:id" element={<EditUser />} />


          {/* Contracts */}
          <Route path="/contrats" element={<Contrats />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/AddService" element={<CreateService />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/groups" element={<CustomerGroups />} />
          <Route path="/offres" element={<Offres />} />
          <Route path="/create-offre" element={<CreateOffre />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/souscriptions" element={<SouscriptionsPromotion />} />
          <Route path="/reclamations" element={<Reclamations />} />
          <Route path="/plans" element={<PlansTarifaires />} />

          <Route path="/exploit/promotions" element={<ExploitPromotion />} />
          <Route path="/exploit/promotions/attente" element={<ExploitPromotion />} />
          <Route path="/exploit/valider" element={<ExploitPromotion />} />
          <Route path="/exploit/rejeter" element={<ExploitPromotion />} />
          <Route path="/exploit/activer" element={<ExploitPromotion />} />
          <Route path="/exploit/suspendre" element={<ExploitPromotion />} />
          <Route path="/exploit/souscriptions" element={<ExploitPromotion />} />
          <Route path="/exploit/historique" element={<ExploitPromotion />} />
          <Route path="/exploit/offres" element={<ExploitPromotion />} />
        </Route>

        {/* Redirection */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>

      {/* Footer global */}
      <Footer />
    </BrowserRouter>
  );
}

export default App;