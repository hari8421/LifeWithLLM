import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is missing. Connect the app to a Convex deployment before starting it."
  );
}

const convex = new ConvexReactClient(convexUrl);
const Router = import.meta.env.MODE === "desktop" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <Router>
        <App />
      </Router>
    </ConvexAuthProvider>
  </StrictMode>
);
