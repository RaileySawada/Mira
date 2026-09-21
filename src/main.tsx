import { initializeStudyStorage } from "./services/storageRuntime";
import { createRoot } from "react-dom/client";
import "./assets/styles/index.css";
import App from "./app/App.tsx";
import { registerPwa } from "./services/pwa";

void initializeStudyStorage().then(() =>
  createRoot(document.getElementById("root")!).render(<App />),
);
registerPwa();
