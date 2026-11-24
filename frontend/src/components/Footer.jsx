import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container site-footer-inner">
        <Link to="/" className="site-logo site-footer-logo">
          <img src="/favicon.png" alt="" />
          <span>
            Made<span className="site-logo-amp">&amp;</span>Shared
          </span>
        </Link>

        <p className="site-footer-credit">
          Made with ❤️ by Nompilo Shabangu © 2026
        </p>

        <nav className="site-footer-links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/discover">Discover</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/create-recipe">Create recipe</Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
