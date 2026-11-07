import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { captureLeadAttribution } from "./utils/googleSheets";

// Record landing page, referrer and UTM params before any in-app navigation.
captureLeadAttribution();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
