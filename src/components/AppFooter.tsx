import { RouteLink } from "./RouteLink";
import "./AppFooter.css";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-intro">
        <RouteLink page="Home" className="footer-brand" aria-label="Mira home">
          mira<span>.</span>
        </RouteLink>
        <p>
          A little wiser, every day.
          <br />
          Your space to learn, at your own pace.
        </p>
        <span className="footer-local">
          Study offline · Your library stays on this device
        </span>
      </div>
      <nav aria-label="Footer" className="footer-links">
        <div>
          <h2>Explore</h2>
          <RouteLink page="Docs">Documentation</RouteLink>
          <RouteLink page="Guide">Study guide</RouteLink>
          <RouteLink page="Contribute">Contribute</RouteLink>
        </div>
        <div>
          <h2>About Mira</h2>
          <RouteLink page="About">Our story</RouteLink>
          <RouteLink page="Privacy">Privacy</RouteLink>
          <RouteLink page="Terms">Terms & conditions</RouteLink>
        </div>
      </nav>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Mira</span>
        <span>Developed with love for Mira, by Railey.</span>
      </div>
    </footer>
  );
}
