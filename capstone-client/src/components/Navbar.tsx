import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/claims", label: "Claims", end: false },
  { to: "/policies", label: "Policies", end: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">Policy Claims Tracker</div>
      <nav className="navbar-links">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `navbar-link${isActive ? " active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="navbar-user">
        {user && (
          <>
            <span className="navbar-username">{user.name}</span>
            <span className={`badge badge-role-${user.role}`}>{user.role}</span>
          </>
        )}
        <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
