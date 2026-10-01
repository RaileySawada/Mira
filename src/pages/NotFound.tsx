import { ArrowRight } from "lucide-react";
import { RouteLink } from "../components/RouteLink";
import "../assets/styles/features/not-found.css";

export function NotFound() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found-art">
        <img src="/404.webp" alt="Mira looking puzzled behind the number 404"
          width={640} height={640} draggable={false} />
      </div>
      <div className="not-found-content">
        <h1 id="not-found-title">A little lost?</h1>
        <p>This page doesn’t exist. Let’s get you back to learning.</p>
        <div className="not-found-actions">
          <RouteLink page="Home" className="button primary">
            Back home <ArrowRight size={16} aria-hidden="true" />
          </RouteLink>
          <RouteLink page="Reviewers" className="button secondary">My reviewers</RouteLink>
        </div>
      </div>
    </section>
  );
}
