import { createRoot } from "react-dom/client";
import "./assets/styles/index.css";
import App from "./app/App.tsx";
import { registerPwa } from "./services/pwa";

createRoot(document.getElementById("root")!).render(<App />);
registerPwa();
