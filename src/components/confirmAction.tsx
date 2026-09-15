import { createRoot } from "react-dom/client";
import { Modal } from "./ui";

// Use the app's themed dialog instead of a blocking browser popup.
export function confirmAction(message: string): Promise<boolean> {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const previousFocus = document.activeElement;
  return new Promise(resolve => {
    function finish(accepted: boolean) {
      root.unmount();
      host.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
      resolve(accepted);
    }
    root.render(<Modal title="Please confirm" onClose={() => finish(false)}>
      <p className="text-sm leading-6 text-stone-500">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button autoFocus className="button secondary" onClick={() => finish(false)}>Cancel</button>
        <button className="button primary" onClick={() => finish(true)}>Continue</button>
      </div>
    </Modal>);
  });
}
