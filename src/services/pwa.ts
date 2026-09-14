export function registerPwa() {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        const notice = document.createElement("p");
        notice.textContent =
          "Offline setup failed. Reconnect and reload to try again.";
        notice.setAttribute("role", "status");
        notice.className =
          "fixed bottom-4 left-4 z-50 rounded-xl bg-orange-100 p-4 text-sm text-orange-900";
        document.body.append(notice);
      });
    });
  }
}
