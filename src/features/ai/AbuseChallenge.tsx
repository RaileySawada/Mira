import { useEffect, useRef, useState } from "react";
interface Turnstile {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
export function AbuseChallenge({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!siteKey) return;
    let widget: string | undefined;
    let disposed = false;
    const render = () => {
      if (!disposed && container.current && window.turnstile && !widget)
        widget = window.turnstile.render(container.current, {
          sitekey: siteKey,
          action: "mira-ai",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            setError(true);
          },
        });
    };
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-mira-turnstile]",
    );
    if (!script) {
      script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.miraTurnstile = "true";
      document.head.append(script);
    }
    script.addEventListener("load", render);
    const failed = () => {
      onToken("");
      setError(true);
      script.remove();
    };
    script.addEventListener("error", failed);
    render();
    return () => {
      disposed = true;
      script.removeEventListener("load", render);
      script.removeEventListener("error", failed);
      if (widget) window.turnstile?.remove(widget);
    };
  }, [siteKey, onToken]);
  return (
    <div>
      <div ref={container} />
      {error && (
        <p role="alert" className="text-xs">
          Verification could not load. Check your connection and reopen Mira’s
          assistant. Local studying is still available.
        </p>
      )}
    </div>
  );
}
