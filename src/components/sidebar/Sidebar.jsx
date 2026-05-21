import { Link, useLocation } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import "./Sidebar.css";

const NAV = {
  DSI: [
    {
      section: "Administration",
      items: [
        {
          icon: "👥",
          label: "Utilisateurs & Accès",
          links: [
            { to: "/users", label: "Consulter Utilisateurs" },
            { to: "/users/new", label: "Ajouter Utilisateur" }
          ],
        },
        {
          icon: "📝",
          label: "Reclamations & Rapports",
          links: [
            { to: "/reclamations", label: "Gérer Réclamations" },
          ],
        }
      ],
    },
  ],
  VENTE: [
    {
      section: "Commerce",
      items: [
        {
          icon: "👤",
          label: "Gestion Clients",
          links: [
            { to: "/customers", label: "Consulter Clients" },
            { to: "/create-customer", label: "Ajouter Client" },
          ],
        },
        {
          icon: "👥",
          label: "Gestion Groupes",
          links: [
            { to: "/groups", label: "Consulter Groupes" },
            { to: "/groups/new", label: "Ajouter Groupe" },
          ],
        },
        {
          icon: "📋",
          label: "Gestion Contrats",
          links: [
            { to: "/contrats", label: "Consulter Contrats" },
            { to: "/contrats/new", label: "Ajouter Contrat" },
          ],
        },
        {
          icon: "📦",
          label: "Gestion Offres",
          links: [
            { to: "/offres", label: "Consulter Offres" },
          ],
        },
        {
          icon: "🎁",
          label: "Gestion Promotions",
          links: [
            { to: "/souscriptions", label: "Configuration Promotion" },
            { to: "/promotions", label: "Consulter Promotions" }
          ],
        },

        {
          icon: "📞",
          label: "Gestion Réclamations",
          links: [
            { to: "/reclamations", label: "consulter Réclamations" },
            { to: "/reclamations/new", label: "Créer Réclamation" },
          ],
        },
      ],
    },
  ],
  METIER: [
    {
      section: "Catalogue",
      items: [
        {
          icon: "📦",
          label: "Gestion Offres",
          links: [
            { to: "/offres", label: "Consulter Offres" },
            { to: "/offres/new", label: "Ajouter Offre" },
          ],
        },
        {
          icon: "💰",
          label: "Gestion Plans Tarifaires",
          links: [
            { to: "/plans", label: "Consulter Plans" },
            { to: "/plans/new", label: "Ajouter Plan" },
          ],
        },
        {
          icon: "⚙️",
          label: "Gestion Services",
          links: [
            { to: "/services", label: "Consulter Services" },
            { to: "/services/new", label: "Ajouter Service" },
          ],
        },
        {
        icon: "🎁",
        label: "Gestion Promotions",
        links: [
          { to: "/promotions", label: "Consulter Promotions" },
          { to: "/promotions/new", label: "Ajouter Promotion" },
        ],
        },
        {
          icon: "☎️",
          label: "Directory Numbers",
          links: [
            { to: "/directory-numbers", label: "Consulter Numéros" },
          ],
        },
      ],
    },
  ],
  EXPLOIT: [
    {
      section: "Promotions",
      items: [
        {
          icon: "🔍",
          label: "Examiner Promotions",
          links: [
            { to: "/exploit/promotions", label: "Consulter Promotions" }
          ],
        },
      ],
    }
  ],
};

function AnimatedPanel({ open, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      // Mesure → anime vers la hauteur → passe à auto
      const h = el.scrollHeight;
      el.style.height = h + "px";
      const id = setTimeout(() => {
        el.style.height = "auto";
      }, 230); // durée = transition CSS
      return () => clearTimeout(id);
    } else {
      // Fige la hauteur courante puis anime vers 0
      el.style.height = el.scrollHeight + "px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.height = "0px";
        });
      });
    }
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        overflow: "hidden",
        transition: "height .22s cubic-bezier(.4,0,.2,1)",
        height: open ? "auto" : "0px",
      }}
    >
      {children}
    </div>
  );
}


function NavItem({ item, filter }) {
  const location = useLocation();
  const filteredLinks = filter
    ? item.links.filter((l) => l.label.toLowerCase().includes(filter.toLowerCase()))
    : item.links;
  const hasActive = item.links.some((l) => location.pathname === l.to);
  const [open, setOpen] = useState(hasActive);

  if (filter && filteredLinks.length === 0) return null;

  return (
    <div className="nav-item">
      <button
        type="button"
        className={`nav-item-header${open ? " open" : ""}${hasActive ? " has-active" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dd1-icon">{item.icon}</span>
        <span className="sb-label">{item.label}</span>
        <ChevronIcon className={`arrow-icon${open ? " rotate-90" : ""}`} />
      </button>
      <AnimatedPanel open={open || !!filter}>
        <div className="link-list">
          {filteredLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${location.pathname === to ? " active" : ""}`}
            >
              <span className="link-dot" />
              {label}
            </Link>
          ))}
        </div>
      </AnimatedPanel>
    </div>
  );
}

// ── Chevron SVG ─────────────────────────────────────────────────────────────
function ChevronIcon({ className }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Main Sidebar ────────────────────────────────────────────────────────────
function Sidebar() {
  const role = localStorage.getItem("role") ?? "EXPLOIT";
  const sections = NAV[role] ?? [];
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const handleOverlayClick = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sb-overlay" onClick={handleOverlayClick} />
      )}

      {/* Mobile toggle button — render this in your AppBar */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir menu"
      >
        <i className="pi pi-bars" style={{ fontSize: '1.2rem' }}></i>
      </button>

      <aside
        className={[
          "sidebar",
          collapsed ? "collapsed" : "",
          mobileOpen ? "mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Header */}
        <div className="sb-header">
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <i className="pi pi-th-large"></i>
            </div>
            <div className="sb-logo-text-wrap">
              <div className="sb-logo-text">TeleAdmin</div>
              <div className="sb-logo-sub">Plateforme BSS</div>
            </div>
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Déplier" : "Réduire"}
          >
            <ChevronIcon className={collapsed ? "rotate-180" : ""} />
          </button>
        </div>

        {/* Role badge */}
        <div className="sb-role">
          <div className="role-pill">
            <span className="role-dot" />
            <span className="sb-badge-text">{role}</span>
          </div>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="sb-search">
            <div className="search-wrap">
              <i className="bi bi-search"></i>
              <input
                className="sb-input"
                type="text"
                placeholder="Rechercher…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
        )}


        {/* Navigation */}
        <nav className="sb-nav">
          {sections.map((group) => (
            <div key={group.section} className="nav-section">
              <div className="section-label">{group.section}</div>
              {group.items.map((item) => (
                <NavItem key={item.label} item={item} filter={filter} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="avatar">OP</div>
          <div className="footer-info">
            <div className="footer-name">Opérateur Système</div>
            <div className="footer-status">
              <span className="online-dot" />
              En ligne
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
