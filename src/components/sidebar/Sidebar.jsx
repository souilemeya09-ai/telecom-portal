import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const NAV = {
  DSI: [
    { to: "/users",  label: "👥 Gérer Utilisateurs" },
    { to: "/roles",  label: "🔐 Gérer Rôles"        },
  ],

  VENTE: [
    { to: "/customers",         label: "👤 Gérer Clients"       },
    { to: "/contrats",          label: "📄 Gérer Contrats"       },
    { to: "/offres",            label: "📦 Consulter Offres"     },
    { to: "/souscriptions",     label: "🎁 Souscrire Promotion"  },
    { to: "/reclamations",      label: "📢 Gérer Réclamations"   },
  ],

  METIER: [
    { to: "/plans",       label: "💰 Plans Tarifaires"    },
    { to: "/offres",      label: "📦 Gérer Offres"        },
    { to: "/services",    label: "⚙️ Configurer Services" },
    { to: "/promotions",  label: "🏷️ Gérer Promotions"   },
  ],

  EXPLOIT: [
    // Examiner les promotions
    { to: "/exploit/promotions",          label: "🔍 Examiner Promotions"      },
    { to: "/exploit/promotions/attente",  label: "⏳ Promotions en attente"    },
    // Valider / Rejeter
    { to: "/exploit/valider",             label: "✅ Valider une Promotion"    },
    { to: "/exploit/rejeter",             label: "❌ Rejeter une Promotion"    },
    // Activer / Suspendre
    { to: "/exploit/activer",             label: "▶️ Activer Promotions"      },
    { to: "/exploit/suspendre",           label: "⏸️ Suspendre Promotions"    },
    // Souscriptions & offres
    { to: "/exploit/souscriptions",       label: "📋 Consulter Souscriptions" },
    { to: "/exploit/historique",          label: "📊 Suivre état Promotions"  },
    { to: "/exploit/offres",              label: "📦 Consulter Offres"        },
  ],
};

function Sidebar() {
  const role     = localStorage.getItem("role");
  const location = useLocation();
  const links    = NAV[role] ?? [];

  return (
    <div className="sidebar">

      <div className="sidebar-role-badge">{role}</div>

      <nav className="sidebar-nav">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link ${location.pathname === to ? "sidebar-link-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;