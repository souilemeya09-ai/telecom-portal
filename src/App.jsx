import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import 'primereact/resources/themes/bootstrap4-dark-blue/theme.css';
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Users from "./pages/dsi/Users";
import AddUser from "./pages/dsi/AddUser";
import EditUser from "./pages/dsi/EditUser";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

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
import CreateCustomer from "./pages/Vente/customer/CreateCustomer";
import CustomerGroupForm from "./pages/Vente/customer/CustomerGroupForm";
import DirectoryNumbers from "./pages/metier/directoryNumber/DirectoryNumbers";
import TelecomConnect from "./pages/TelecomConnect";
import CreateReclamation from "./pages/Vente/reclamation/CreateReclamation";
import CreateContrat from "./pages/Vente/contrats/CreateContrat";
import CreatePlanTarifaire from "./pages/metier/planTarifaire/CreatePlanTarifaire";
import CreatePromotion from "./pages/metier/promotion/CreatePromotion";
import CustomerPromotionDateManager from "./pages/Vente/promotion/CustomerPromotionDateManager";
import NavigationLoader from "./components/navigation/NavigationLoader";

function App() {
  return (
    <BrowserRouter>
      <NavigationLoader>
        <Routes>

          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* mot de passe oublié */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Routes protégées */}
          <Route path="/" element={<TelecomConnect />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route path="/dashboard" element={<Dashboard />} />

            {/* Users */}
            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<AddUser />} />
            <Route path="users/edit/:id" element={<EditUser />} />


            {/* Contracts */}
            <Route path="/contrats" element={<Contrats />} />
            <Route path="/contrats/new" element={<CreateContrat />} />
            <Route path="/services" element={<ServiceList />} />
            <Route path="/services/new" element={<CreateService />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/create-customer" element={<CreateCustomer />} />
            <Route path="/groups" element={<CustomerGroups />} />
            <Route path="/groups/new" element={<CustomerGroupForm />} />
            <Route path="/offres" element={<Offres />} />
            <Route path="/offres/new" element={<CreateOffre />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/promotions/new" element={<CreatePromotion />} />
            <Route path="/souscriptions" element={<SouscriptionsPromotion />} />
            <Route path="/souscriptions/clients" element={<CustomerPromotionDateManager />} />
            <Route path="/reclamations" element={<Reclamations />} />
            <Route path="/reclamations/new" element={<CreateReclamation />} />
            <Route path="/plans" element={<PlansTarifaires />} />
            <Route path="/plans/new" element={<CreatePlanTarifaire />} />
            <Route path="/directory-numbers" element={<DirectoryNumbers />} />

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
      </NavigationLoader>
    </BrowserRouter>
  );
}

export default App;
