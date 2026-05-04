import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import "./Sidebar.css";

const NAV = {
  DSI: [
    {
      section: "Administration",
      items: [
        {
          icon: "👥", label: "Utilisateurs & Accès",
          children: [
            { 
              label: "Gestion des comptes", 
              links: [
                { to: "/users", label: "Consulter Utilisateurs" }, 
                { to: "/users/new", label: "Créer Utilisateur" },
                { to: "/users/edit", label: "Modifier Utilisateur" }
              ] 
            },
            { 
              label: "Droits & Rôles", 
              links: [
                { to: "/roles", label: "Consulter Rôles" }, 
                { to: "/roles/perms", label: "Gérer Permissions" }
              ] 
            },
          ],
        },
      ],
    },
  ],
  VENTE: [
    {
      section: "Commerce",
      items: [
        {
          icon: "👤", label: "Gestion Clients",
          children: [
            { 
              label: "Consulter Clients", 
              links: [
                { to: "/customers", label: "Liste clients" }, 
                { to: "/groups", label: "Groupes clients" }
              ] 
            },
            { 
              label: "Ajouter Client", 
              links: [
                { to: "/create-customer", label: "Créer client" }
              ] 
            },
          ],
        },
        {
          icon: "📋", label: "Gestion Contrats",
          children: [
            { 
              label: "Consulter Contrats", 
              links: [
                { to: "/contrats", label: "Liste contrats" }
              ] 
            },
            { 
              label: "Créer Contrat", 
              links: [
                { to: "/contrats/new", label: "Nouveau contrat" }
              ] 
            },
          ],
        },
        {
          icon: "📦", label: "Gestion Offres",
          children: [
            { 
              label: "Consulter Offres", 
              links: [
                { to: "/offres", label: "Liste offres" }
              ] 
            },
            { 
              label: "Créer Offre", 
              links: [
                { to: "/offres/new", label: "Nouvelle offre" },
                { to: "/offres/edit", label: "Modifier offre" }
              ] 
            },
          ],
        },
        {
          icon: "🎁", label: "Promotions & SAV",
          children: [
            { 
              label: "Promotions", 
              links: [
                { to: "/souscriptions", label: "Souscrire Promotion" },
                { to: "/promotions", label: "Gérer Promotions" }
              ] 
            },
            { 
              label: "Service Après-Vente", 
              links: [
                { to: "/reclamations", label: "Gérer Réclamations" }
              ] 
            },
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
          icon: "💰", label: "Offres & Plans",
          children: [
            { 
              label: "Plans Tarifaires", 
              links: [
                { to: "/plans", label: "Consulter Plans" }, 
                { to: "/plans/new", label: "Créer Plan" },
                { to: "/plans/edit", label: "Modifier Plan" }
              ] 
            },
            { 
              label: "Gestion Offres", 
              links: [
                { to: "/offres", label: "Consulter Offres" }, 
                { to: "/offres/new", label: "Créer Offre" }
              ] 
            },
          ],
        },
        {
          icon: "⚙️", label: "Services & Promotions",
          children: [
            { 
              label: "Configurer Services", 
              links: [
                { to: "/services", label: "Services" }
              ] 
            },
            { 
              label: "Gérer Promotions", 
              links: [
                { to: "/promotions", label: "Promotions" },
                { to: "/promotions/new", label: "Créer Promotion" }
              ] 
            },
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
          icon: "🔍", label: "Examiner Promotions",
          children: [
            { 
              label: "Consultation", 
              links: [
                { to: "/exploit/promotions", label: "Examiner Promotions" }, 
                { to: "/exploit/promotions/attente", label: "En attente" }
              ] 
            },
            { 
              label: "Prendre Décision", 
              links: [
                { to: "/exploit/valider", label: "Valider" }, 
                { to: "/exploit/rejeter", label: "Rejeter" }
              ] 
            },
          ],
        },
        {
          icon: "⚡", label: "Cycle de Vie",
          children: [
            { 
              label: "Activation", 
              links: [
                { to: "/exploit/activer", label: "Activer Promotions" }, 
                { to: "/exploit/suspendre", label: "Suspendre" }
              ] 
            },
            { 
              label: "Suivi", 
              links: [
                { to: "/exploit/historique", label: "Suivre État" }
              ] 
            },
          ],
        },
      ],
    },
    {
      section: "Catalogue",
      items: [
        {
          icon: "📦", label: "Offres & Souscriptions",
          children: [
            { 
              label: "Consulter Offres", 
              links: [
                { to: "/exploit/offres", label: "Offres disponibles" }
              ] 
            },
            { 
              label: "Consulter Souscriptions", 
              links: [
                { to: "/exploit/souscriptions", label: "Souscriptions" }
              ] 
            },
          ],
        },
      ],
    },
  ],
};

// ── Animated panel (height 0 ↔ auto) ───────────────────────────────────────
function AnimatedPanel({ open, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(open ? "auto" : "0px");

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

// ── Level-2 group dropdown ──────────────────────────────────────────────────
function SubDropdown({ group, filter }) {
  const location = useLocation();
  const hasActive = group.links.some((l) => location.pathname === l.to);
  const filteredLinks = filter
    ? group.links.filter((l) => l.label.toLowerCase().includes(filter.toLowerCase()))
    : group.links;
  const [open, setOpen] = useState(hasActive);

  if (filter && filteredLinks.length === 0) return null;

  return (
    <div className="dd2-block">
      <button
        className={`dd2-btn${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dd2-label">
          {group.label}
          <span className="dd2-count">{filteredLinks.length}</span>
        </span>
        <ChevronIcon className="dd2-arrow" />
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

// ── Level-1 section dropdown ────────────────────────────────────────────────
function Dropdown({ item, filter }) {
  const location = useLocation();
  const hasActive = item.children
    .flatMap((g) => g.links)
    .some((l) => location.pathname === l.to);
  const [open, setOpen] = useState(hasActive);

  const filteredChildren = item.children
    .map((g) => ({
      ...g,
      links: filter
        ? g.links.filter((l) => l.label.toLowerCase().includes(filter.toLowerCase()))
        : g.links,
    }))
    .filter((g) => !filter || g.links.length > 0);

  if (filter && filteredChildren.length === 0) return null;

  return (
    <div className="dd1-wrap">
      <button
        className={`dd1-btn${open ? " open" : ""}${hasActive ? " has-active" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dd1-icon">{item.icon}</span>
        <span className="sb-label">{item.label}</span>
        <ChevronIcon className="arrow-icon" />
      </button>
      <AnimatedPanel open={open || !!filter}>
        <div style={{ padding: "4px 0" }}>
          {filteredChildren.map((g) => (
            <SubDropdown key={g.label} group={g} filter={filter} />
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
function Sidebar({ onNavigate }) {
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
                <Dropdown key={item.label} item={item} filter={filter} />
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