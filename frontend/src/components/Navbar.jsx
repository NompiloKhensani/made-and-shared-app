// Desktop links sit in the bar. On small screens they move into the hamburger.
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaUser } from "react-icons/fa6";
import "./Navbar.css";

function Navbar() {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (navRef.current && !navRef.current.contains(event.target)) {
        setNavOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const closeMenus = () => {
    setNavOpen(false);
    setMenuOpen(false);
  };

  const handleCreateClick = (event) => {
    closeMenus();
    if (!isLoggedIn) {
      event.preventDefault();
      navigate("/login", { state: { from: "/create-recipe" } });
    }
  };

  const handleLogout = () => {
    logout();
    closeMenus();
    navigate("/");
  };

  const themeButton = (
    <button
      type="button"
      className="navbar-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );

  const createLink = (
    <Link
      to="/create-recipe"
      className="navbar-create-button"
      onClick={handleCreateClick}
    >
      Create recipe
    </Link>
  );

  const accountMenu = loading ? null : isLoggedIn ? (
    <div className="navbar-menu" ref={menuRef}>
      <button
        type="button"
        className="navbar-profile-link"
        aria-label="Account menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {user?.profilePhoto ? (
          <img src={user.profilePhoto} alt="" />
        ) : (
          <FaUser className="navbar-profile-icon" aria-hidden="true" />
        )}
      </button>

      {menuOpen && (
        <div className="navbar-dropdown">
          <p className="navbar-dropdown-name">{user?.username}</p>
          <Link to="/my-kitchen" onClick={closeMenus}>
            My Kitchen
          </Link>
          <Link to={`/profiles/${user?.username}`} onClick={closeMenus}>
            Public profile
          </Link>
          <Link to="/settings" onClick={closeMenus}>
            Account settings
          </Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link to="/login" className="navbar-login-link">
      Log in
    </Link>
  );

  const navLinks = (
    <>
      <NavLink to="/" end onClick={closeMenus}>
        Home
      </NavLink>
      <NavLink to="/discover" onClick={closeMenus}>
        Discover
      </NavLink>
      <NavLink to="/my-kitchen" onClick={closeMenus}>
        My Kitchen
      </NavLink>
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="site-logo" onClick={closeMenus}>
          <img src="/favicon.png" alt="" />
          <span>
            Made<span className="site-logo-amp">&amp;</span>Shared
          </span>
        </Link>

        <nav className="navbar-links navbar-links-desktop">{navLinks}</nav>

        <div className="navbar-actions navbar-actions-desktop">
          {themeButton}
          {createLink}
          {accountMenu}
        </div>

        <div className="navbar-mobile" ref={navRef}>
          <button
            type="button"
            className={`navbar-toggle${navOpen ? " is-open" : ""}`}
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            aria-controls="navbar-mobile-menu"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          {navOpen && (
            <div id="navbar-mobile-menu" className="navbar-mobile-dropdown">
              <nav className="navbar-links navbar-links-mobile">{navLinks}</nav>

              <Link
                to="/create-recipe"
                className="navbar-mobile-item"
                onClick={handleCreateClick}
              >
                Create recipe
              </Link>

              {loading ? null : isLoggedIn ? (
                <>
                  <p className="navbar-dropdown-name">{user?.username}</p>
                  <Link
                    to={`/profiles/${user?.username}`}
                    className="navbar-mobile-item"
                    onClick={closeMenus}
                  >
                    Public profile
                  </Link>
                  <Link
                    to="/settings"
                    className="navbar-mobile-item"
                    onClick={closeMenus}
                  >
                    Account settings
                  </Link>
                  <button
                    type="button"
                    className="navbar-mobile-item"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="navbar-mobile-item"
                  onClick={closeMenus}
                >
                  Log in
                </Link>
              )}

              <button
                type="button"
                className="navbar-mobile-item"
                onClick={() => {
                  toggleTheme();
                  closeMenus();
                }}
              >
                {isDark ? "Light mode" : "Dark mode"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
