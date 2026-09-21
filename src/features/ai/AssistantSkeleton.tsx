import { createPortal } from "react-dom";
import "./AssistantSkeleton.css";

export function AssistantSkeleton({ pageMode = false }: { pageMode?: boolean }) {
  const content = (
    <div className={`assistant-skeleton ${pageMode ? "is-page" : "is-floating"}`} role="status" aria-label="Loading Mira" aria-busy="true">
      <div className="assistant-skeleton-content" aria-hidden="true">
        <div className="assistant-skeleton-welcome">
          <span className="skeleton-piece skeleton-avatar" />
          <span className="skeleton-piece skeleton-heading" />
          <span className="skeleton-piece skeleton-description" />
          <div className="skeleton-suggestions">
            <span className="skeleton-piece" /><span className="skeleton-piece" /><span className="skeleton-piece" />
          </div>
        </div>
        <div className="skeleton-composer">
          <span className="skeleton-piece skeleton-placeholder" />
          <div className="skeleton-controls">
            <span className="skeleton-piece skeleton-control" />
            <span className="skeleton-piece skeleton-mode" />
            <span className="skeleton-piece skeleton-control" />
          </div>
        </div>
      </div>
    </div>
  );
  return pageMode ? content : createPortal(content, document.body);
}
