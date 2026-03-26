import { Outlet } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Sidebar from "./sidebar/Sidebar";
import Footer from "./Footer/Footer";

const DashboardLayout = () => {
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