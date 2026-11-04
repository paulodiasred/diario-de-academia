import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Fonte no próprio app: funciona sem internet e não avisa terceiros de cada acesso.
import "@fontsource-variable/inter";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
